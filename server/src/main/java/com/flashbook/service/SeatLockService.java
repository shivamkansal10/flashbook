package com.flashbook.service;
import com.flashbook.dto.booking.HoldResult;
import com.flashbook.entity.SeatStatus;
import com.flashbook.exception.SeatUnavailableException;
import com.flashbook.repository.SeatRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class SeatLockService {

    private final RedissonClient redissonClient;
    private final StringRedisTemplate redisTemplate;
    private final SeatRepository seatRepository;

    @Value("${booking.hold-ttl-seconds:300}")
    private long holdTtlSeconds;

    /**
     * Holds a single seat using Redisson distributed lock, Redis inventory counter DECR,
     * and a TTL-based hold key in Redis.
     */
    public HoldResult holdSeat(Long eventId, Long seatId, Long userId) {
        String lockKey = "lock:seat:%d:%d".formatted(eventId, seatId);
        RLock lock = redissonClient.getLock(lockKey);

        boolean acquired = false;
        try {
            acquired = lock.tryLock(2, 30, TimeUnit.SECONDS);
            if (!acquired) {
                log.warn("Could not acquire lock for seatId: {} on eventId: {}", seatId, eventId);
                throw new SeatUnavailableException("Seat is currently being processed by another user");
            }

            String holdKey = "hold:seat:%d:%d".formatted(eventId, seatId);
            if (Boolean.TRUE.equals(redisTemplate.hasKey(holdKey))) {
                log.warn("SeatId: {} on eventId: {} is already held by another user", seatId, eventId);
                throw new SeatUnavailableException("Seat is already held by another user");
            }

            String counterKey = "inventory:event:%d".formatted(eventId);

            // Auto-initialize counter from DB if missing, zero, or stale/negative
            String currentVal = redisTemplate.opsForValue().get(counterKey);
            if (currentVal == null || Long.parseLong(currentVal) <= 0) {
                long availableCount = seatRepository.countByEventIdAndStatus(eventId, SeatStatus.AVAILABLE);
                redisTemplate.opsForValue().set(counterKey, String.valueOf(availableCount));
                log.info("Auto-initialized inventory counter for eventId: {} to {} from DB (was: {})", eventId, availableCount, currentVal);
            }

            Long remaining = redisTemplate.opsForValue().decrement(counterKey);

            if (remaining == null || remaining < 0) {
                redisTemplate.opsForValue().increment(counterKey); // undo decrement
                log.info("SeatId: {} on eventId: {} sold out or unavailable", seatId, eventId);
                throw new SeatUnavailableException("Seat no longer available");
            }

            redisTemplate.delete("marker:restored:%d:%d".formatted(eventId, seatId));
            redisTemplate.opsForValue().set(holdKey, userId.toString(), Duration.ofSeconds(holdTtlSeconds));

            Instant expiresAt = Instant.now().plusSeconds(holdTtlSeconds);
            log.info("SeatId: {} held successfully for userId: {} until {}", seatId, userId, expiresAt);
            return new HoldResult(holdKey, expiresAt);

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new SeatUnavailableException("Could not acquire seat lock due to interruption");
        } finally {
            if (acquired && lock.isHeldByCurrentThread()) {
                lock.unlock();
            }
        }
    }

    /**
     * Holds multiple seats atomically. If any seat fails to be held,
     * all previously acquired holds in this request are rolled back.
     */
    public List<HoldResult> holdSeats(Long eventId, List<Long> seatIds, Long userId) {
        List<HoldResult> holdResults = new ArrayList<>();
        List<Long> successfullyHeldSeatIds = new ArrayList<>();

        try {
            for (Long seatId : seatIds) {
                HoldResult result = holdSeat(eventId, seatId, userId);
                holdResults.add(result);
                successfullyHeldSeatIds.add(seatId);
            }
            return holdResults;
        } catch (Exception e) {
            log.error("Failed to hold all requested seats for eventId: {}. Rolling back successfully held seats: {}",
                    eventId, successfullyHeldSeatIds, e);
            for (Long seatId : successfullyHeldSeatIds) {
                releaseHold(eventId, seatId);
            }
            throw e;
        }
    }

    /**
     * Releases the hold on a seat and restores the inventory counter.
     */
    public void releaseHold(Long eventId, Long seatId) {
        String holdKey = "hold:seat:%d:%d".formatted(eventId, seatId);
        Boolean deleted = redisTemplate.delete(holdKey);
        if (Boolean.TRUE.equals(deleted)) {
            String counterKey = "inventory:event:%d".formatted(eventId);
            redisTemplate.opsForValue().increment(counterKey);
            log.info("Released hold for seatId: {} on eventId: {} and restored inventory", seatId, eventId);
        }
    }

    /**
     * Releases holds on multiple seats.
     */
    public void releaseHolds(Long eventId, List<Long> seatIds) {
        for (Long seatId : seatIds) {
            releaseHold(eventId, seatId);
        }
    }

    /**
     * Removes a hold key without restoring inventory (e.g. when seat is confirmed/sold).
     */
    public void removeHold(Long eventId, Long seatId) {
        String holdKey = "hold:seat:%d:%d".formatted(eventId, seatId);
        redisTemplate.delete(holdKey);
    }

    /**
     * Removes multiple hold keys without restoring inventory.
     */
    public void removeHolds(Long eventId, List<Long> seatIds) {
        for (Long seatId : seatIds) {
            removeHold(eventId, seatId);
        }
    }

    /**
     * Checks if a seat is currently held in Redis.
     */
    public boolean isSeatHeld(Long eventId, Long seatId) {
        String holdKey = "hold:seat:%d:%d".formatted(eventId, seatId);
        return Boolean.TRUE.equals(redisTemplate.hasKey(holdKey));
    }

    /**
     * Gets the user ID of the current hold owner for a seat, if held.
     */
    public String getHoldOwner(Long eventId, Long seatId) {
        String holdKey = "hold:seat:%d:%d".formatted(eventId, seatId);
        return redisTemplate.opsForValue().get(holdKey);
    }

    /**
     * Initializes the inventory counter in Redis for an event.
     */
    public void initializeEventInventory(Long eventId, long totalCapacity) {
        String counterKey = "inventory:event:%d".formatted(eventId);
        redisTemplate.opsForValue().set(counterKey, String.valueOf(totalCapacity));
        log.info("Initialized inventory counter for eventId: {} with capacity: {}", eventId, totalCapacity);
    }
}
