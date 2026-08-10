package com.flashbook.repository;

import com.flashbook.entity.WaitlistEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WaitlistEntryRepository extends JpaRepository<WaitlistEntry, Long> {
    List<WaitlistEntry> findByEventId(Long eventId);
    Optional<WaitlistEntry> findByEventIdAndUserId(Long eventId, Long userId);
}
