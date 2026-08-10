
        package com.flashbook.repository;

import com.flashbook.entity.Seat;
import com.flashbook.entity.SeatStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface SeatRepository extends JpaRepository<Seat, Long> {

    List<Seat> findByEventId(Long eventId);

    List<Seat> findByIdInAndEventId(List<Long> ids, Long eventId);

    long countByEventIdAndStatus(Long eventId, SeatStatus status);
    long countByEventId(Long eventId);

    @Query("SELECT MIN(s.price) FROM Seat s WHERE s.event.id = :eventId")
    BigDecimal findMinPriceByEventId(@Param("eventId") Long eventId);
}



