package com.flashbook.service;

import com.flashbook.entity.Booking;
import com.flashbook.entity.BookingStatus;
import com.flashbook.entity.SeatStatus;
import com.flashbook.repository.BookingRepository;
import com.flashbook.repository.SeatRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

import org.springframework.data.redis.core.StringRedisTemplate;

@Slf4j
@Component
@RequiredArgsConstructor
public class BookingReconciliationJob {

    private final BookingRepository bookingRepository;
    private final SeatRepository seatRepository;
    private final WaitlistService waitlistService;
    private final StringRedisTemplate redisTemplate;

    @Value("${booking.hold-ttl-seconds:300}")
    private long holdTtlSeconds;

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void reconcileExpiredHolds() {
        Instant cutoff = Instant.now().minusSeconds(holdTtlSeconds);
        List<Booking> staleHolds = bookingRepository.findByStatusAndCreatedAtBefore(BookingStatus.HELD, cutoff);

        if (staleHolds.isEmpty()) {
            return;
        }

        log.info("Found {} stale HELD bookings older than {} seconds to reconcile", staleHolds.size(), holdTtlSeconds);

        for (Booking booking : staleHolds) {
            booking.setStatus(BookingStatus.EXPIRED);
            booking.getSeats().forEach(seat -> {
                seat.setStatus(SeatStatus.AVAILABLE);
                String markerKey = "marker:restored:%d:%d".formatted(booking.getEvent().getId(), seat.getId());
                Boolean isFirst = redisTemplate.opsForValue().setIfAbsent(markerKey, "true", java.time.Duration.ofMinutes(10));
                if (Boolean.TRUE.equals(isFirst)) {
                    String counterKey = "inventory:event:%d".formatted(booking.getEvent().getId());
                    redisTemplate.opsForValue().increment(counterKey);
                    log.info("Restored inventory for eventId: {}, seatId: {} via reconciliation job", booking.getEvent().getId(), seat.getId());
                } else {
                    log.info("Inventory for eventId: {}, seatId: {} was already restored previously", booking.getEvent().getId(), seat.getId());
                }
            });
            seatRepository.saveAll(booking.getSeats());
            bookingRepository.save(booking);

            log.info("Reconciled stale bookingId: {} for eventId: {}. Status set to EXPIRED, seats released, and Redis inventory restored.",
                    booking.getId(), booking.getEvent().getId());

            waitlistService.promoteNext(booking.getEvent().getId()).ifPresent(userIdStr ->
                    log.info("Promoted user ID {} from waitlist following expired bookingId: {}", userIdStr, booking.getId())
            );
        }
    }
}
