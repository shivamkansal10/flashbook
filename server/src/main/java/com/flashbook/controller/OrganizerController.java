package com.flashbook.controller;

import com.flashbook.dto.booking.BookingResponse;
import com.flashbook.dto.event.EventRequest;
import com.flashbook.dto.event.EventResponse;
import com.flashbook.dto.organizer.SalesOverviewResponse;
import com.flashbook.service.BookingService;
import com.flashbook.service.EventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/organizer")
@RequiredArgsConstructor
public class OrganizerController {

    private final EventService eventService;
    private final BookingService bookingService;

    @GetMapping("/events/{id}/sales")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ResponseEntity<SalesOverviewResponse> getSalesOverview(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        SalesOverviewResponse response = eventService.getSalesOverview(id, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/events")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ResponseEntity<Page<EventResponse>> getOrganizerEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        Page<EventResponse> events = eventService.listOrganizerEvents(userDetails.getUsername(), page, size);
        return ResponseEntity.ok(events);
    }

    @PutMapping("/events/{id}")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ResponseEntity<EventResponse> updateEvent(
            @PathVariable Long id,
            @Valid @RequestBody EventRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        EventResponse response = eventService.updateEvent(id, request, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/bookings/check-in/{ticketCode}")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ResponseEntity<BookingResponse> checkInBooking(
            @PathVariable String ticketCode,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        BookingResponse response = bookingService.checkInBooking(ticketCode, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }
}
