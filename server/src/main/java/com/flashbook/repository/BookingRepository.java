package com.flashbook.repository;

import com.flashbook.entity.Booking;
import com.flashbook.entity.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    Optional<Booking> findByIdempotencyKey(String idempotencyKey);
    List<Booking> findByUserId(Long userId);
    List<Booking> findByStatusAndCreatedAtBefore(BookingStatus status, Instant dateTime);
    List<Booking> findBySeats_IdAndStatus(Long seatId, BookingStatus status);
    boolean existsBySeats_Id(Long seatId);
    List<Booking> findByEvent_IdAndStatus(Long eventId, BookingStatus status);
}
