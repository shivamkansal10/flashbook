package com.flashbook.service;

import com.flashbook.dto.waitlist.WaitlistResponse;
import com.flashbook.entity.Event;
import com.flashbook.entity.Seat;
import com.flashbook.entity.SeatStatus;
import com.flashbook.entity.User;
import com.flashbook.entity.WaitlistEntry;
import com.flashbook.entity.WaitlistStatus;
import com.flashbook.exception.EventNotFoundException;
import com.flashbook.exception.SeatUnavailableException;
import com.flashbook.exception.UnauthorizedAccessException;
import com.flashbook.repository.EventRepository;
import com.flashbook.repository.SeatRepository;
import com.flashbook.repository.UserRepository;
import com.flashbook.repository.WaitlistEntryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RScoredSortedSet;
import org.redisson.api.RedissonClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WaitlistService {

    private final RedissonClient redissonClient;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final WaitlistEntryRepository waitlistEntryRepository;
    private final SeatRepository seatRepository;
    private final SeatLockService seatLockService;

    private static final String WAITLIST_KEY_PREFIX = "waitlist:";

    @Transactional
    public WaitlistResponse joinWaitlist(Long eventId, String userEmail) {
        log.info("User '{}' joining waitlist for eventId: {}", userEmail, eventId);

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EventNotFoundException("Event not found with id: " + eventId));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UnauthorizedAccessException("User not found: " + userEmail));

        RScoredSortedSet<String> waitlist = redissonClient.getScoredSortedSet(WAITLIST_KEY_PREFIX + eventId);
        long now = Instant.now().toEpochMilli();
        waitlist.add(now, user.getId().toString());

        Optional<WaitlistEntry> existing = waitlistEntryRepository.findByEventIdAndUserId(eventId, user.getId());
        if (existing.isEmpty()) {
            WaitlistEntry entry = WaitlistEntry.builder()
                    .event(event)
                    .user(user)
                    .status(WaitlistStatus.WAITING)
                    .joinedAt(Instant.now())
                    .build();
            waitlistEntryRepository.save(entry);
        }

        Integer rank = waitlist.rank(user.getId().toString());
        int position = (rank != null) ? rank + 1 : 1;
        int estimatedWaitMinutes = position * 3;

        log.info("User '{}' joined waitlist for eventId: {} at position {}", userEmail, eventId, position);

        return WaitlistResponse.builder()
                .eventId(eventId)
                .userId(user.getId())
                .position(position)
                .estimatedWaitMinutes(estimatedWaitMinutes)
                .status(WaitlistStatus.WAITING)
                .build();
    }

    public WaitlistResponse getPosition(Long eventId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UnauthorizedAccessException("User not found: " + userEmail));

        RScoredSortedSet<String> waitlist = redissonClient.getScoredSortedSet(WAITLIST_KEY_PREFIX + eventId);
        Integer rank = waitlist.rank(user.getId().toString());

        if (rank == null) {
            // Check if the user was promoted in the database
            Optional<WaitlistEntry> entry = waitlistEntryRepository.findByEventIdAndUserId(eventId, user.getId());
            if (entry.isPresent() && entry.get().getStatus() == WaitlistStatus.PROMOTED) {
                return WaitlistResponse.builder()
                        .eventId(eventId)
                        .userId(user.getId())
                        .position(0)
                        .estimatedWaitMinutes(0)
                        .status(WaitlistStatus.PROMOTED)
                        .build();
            }

            return WaitlistResponse.builder()
                    .eventId(eventId)
                    .userId(user.getId())
                    .position(-1)
                    .estimatedWaitMinutes(0)
                    .status(WaitlistStatus.EXPIRED)
                    .build();
        }

        int position = rank + 1;
        return WaitlistResponse.builder()
                .eventId(eventId)
                .userId(user.getId())
                .position(position)
                .estimatedWaitMinutes(position * 3)
                .status(WaitlistStatus.WAITING)
                .build();
    }

    @Transactional
    public Optional<String> promoteNext(Long eventId) {
        RScoredSortedSet<String> waitlist = redissonClient.getScoredSortedSet(WAITLIST_KEY_PREFIX + eventId);
        String nextUserIdStr = waitlist.pollFirst();

        if (nextUserIdStr != null) {
            Long userId = Long.parseLong(nextUserIdStr);
            log.info("Promoted user ID {} from waitlist for eventId: {}", userId, eventId);

            waitlistEntryRepository.findByEventIdAndUserId(eventId, userId).ifPresent(entry -> {
                entry.setStatus(WaitlistStatus.PROMOTED);
                entry.setPromotedAt(Instant.now());
                waitlistEntryRepository.save(entry);
            });

            Optional<Seat> availableSeat = seatRepository.findByEventId(eventId).stream()
                    .filter(seat -> seat.getStatus() == SeatStatus.AVAILABLE)
                    .findFirst();

            if (availableSeat.isPresent()) {
                Long seatId = availableSeat.get().getId();
                try {
                    seatLockService.holdSeat(eventId, seatId, userId);
                    log.info("Successfully granted seat hold on seatId: {} for promoted userId: {} on eventId: {}",
                            seatId, userId, eventId);
                } catch (SeatUnavailableException e) {
                    log.warn("Failed to acquire hold on seatId: {} for promoted userId: {} on eventId: {}: {}",
                            seatId, userId, eventId, e.getMessage());
                }
            } else {
                log.warn("No available seat found for eventId: {} when promoting userId: {}", eventId, userId);
                // TODO: Waitlist promotion failed, seat unavailable notification needed later
            }

            return Optional.of(nextUserIdStr);
        }

        return Optional.empty();
    }

    @Transactional
    public void leaveWaitlist(Long eventId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UnauthorizedAccessException("User not found: " + userEmail));

        RScoredSortedSet<String> waitlist = redissonClient.getScoredSortedSet(WAITLIST_KEY_PREFIX + eventId);
        waitlist.remove(user.getId().toString());

        waitlistEntryRepository.findByEventIdAndUserId(eventId, user.getId()).ifPresent(entry -> {
            entry.setStatus(WaitlistStatus.EXPIRED);
            waitlistEntryRepository.save(entry);
        });

        log.info("User '{}' removed from waitlist for eventId: {}", userEmail, eventId);
    }
}
