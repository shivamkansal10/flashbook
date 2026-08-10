package com.flashbook.controller;

import com.flashbook.dto.event.*;
import com.flashbook.service.EventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    @PostMapping("/api/organizer/events")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ResponseEntity<EventResponse> createEvent(
            @Valid @RequestBody EventRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        EventResponse response = eventService.createEvent(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/api/organizer/events/{id}/seats")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ResponseEntity<List<SeatResponse>> addSeatsToEvent(
            @PathVariable Long id,
            @Valid @RequestBody List<SeatRequest> seatRequests,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        List<SeatResponse> response = eventService.addSeatsToEvent(id, seatRequests, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/api/organizer/events/{id}/publish")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ResponseEntity<EventResponse> publishEvent(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        EventResponse response = eventService.publishEvent(id, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/events")
    public ResponseEntity<Page<EventResponse>> listEvents(@ModelAttribute EventFilterParams params) {
        Page<EventResponse> events = eventService.listEvents(params);
        return ResponseEntity.ok(events);
    }

    @GetMapping("/api/events/{id}")
    public ResponseEntity<EventResponse> getEventById(@PathVariable Long id) {
        EventResponse event = eventService.getEventById(id);
        return ResponseEntity.ok(event);
    }

    @GetMapping("/api/events/{id}/seats")
    public ResponseEntity<EventSeatsResponse> getEventSeats(@PathVariable Long id) {
        EventSeatsResponse seatsResponse = eventService.getEventSeats(id);
        return ResponseEntity.ok(seatsResponse);
    }
}
