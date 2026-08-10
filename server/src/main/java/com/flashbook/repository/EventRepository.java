package com.flashbook.repository;

import com.flashbook.entity.Event;
import com.flashbook.entity.EventStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long>, JpaSpecificationExecutor<Event> {
    Page<Event> findByStatus(EventStatus status, Pageable pageable);
    List<Event> findByOrganizerId(Long organizerId);
    Page<Event> findByOrganizerId(Long organizerId, Pageable pageable);
}
