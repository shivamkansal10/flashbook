package com.flashbook.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.listener.KeyExpirationEventMessageListener;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class RedisKeyExpirationListener extends KeyExpirationEventMessageListener {

    private final com.flashbook.repository.BookingRepository bookingRepository;
    private final org.springframework.data.redis.core.StringRedisTemplate redisTemplate;

    public RedisKeyExpirationListener(
            RedisMessageListenerContainer listenerContainer,
            com.flashbook.repository.BookingRepository bookingRepository,
            org.springframework.data.redis.core.StringRedisTemplate redisTemplate
    ) {
        super(listenerContainer);
        this.bookingRepository = bookingRepository;
        this.redisTemplate = redisTemplate;
    }

    @Override
    public void onMessage(Message message, byte[] pattern) {
        String expiredKey = message.toString();

        if (expiredKey != null && expiredKey.startsWith("hold:seat:")) {
            log.info("Hold key expired naturally via TTL: {}", expiredKey);
            try {
                String[] parts = expiredKey.split(":");
                if (parts.length == 4) {
                    Long eventId = Long.parseLong(parts[2]);
                    Long seatId = Long.parseLong(parts[3]);

                    // Check if corresponding booking (if any) hasn't already been reconciled
                    boolean hasBooking = bookingRepository.existsBySeats_Id(seatId);
                    boolean hasHeldBooking = !bookingRepository.findBySeats_IdAndStatus(seatId, com.flashbook.entity.BookingStatus.HELD).isEmpty();

                    if (!hasBooking || hasHeldBooking) {
                        String markerKey = "marker:restored:%d:%d".formatted(eventId, seatId);
                        Boolean isFirst = redisTemplate.opsForValue().setIfAbsent(markerKey, "true", java.time.Duration.ofMinutes(10));
                        if (Boolean.TRUE.equals(isFirst)) {
                            String counterKey = "inventory:event:%d".formatted(eventId);
                            redisTemplate.opsForValue().increment(counterKey);
                            log.info("Restored inventory for eventId: {}, seatId: {} via expiration listener", eventId, seatId);
                        } else {
                            log.info("Inventory for eventId: {}, seatId: {} was already restored previously", eventId, seatId);
                        }
                    } else {
                        log.info("Skipping inventory recovery for seatId: {} because its booking was already reconciled", seatId);
                    }
                }
            } catch (Exception e) {
                log.error("Failed to restore inventory on hold expiration for key: {}", expiredKey, e);
            }
        }
    }
}
