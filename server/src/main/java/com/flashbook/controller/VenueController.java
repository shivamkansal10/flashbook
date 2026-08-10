package com.flashbook.controller;

import com.flashbook.dto.venue.VenueRequest;
import com.flashbook.dto.venue.VenueResponse;
import com.flashbook.service.VenueService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class VenueController {

    private final VenueService venueService;

    @PostMapping("/api/organizer/venues")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ResponseEntity<VenueResponse> createVenue(@Valid @RequestBody VenueRequest request) {
        VenueResponse response = venueService.createVenue(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/api/venues")
    public ResponseEntity<List<VenueResponse>> getVenues() {
        List<VenueResponse> response = venueService.listVenues();
        return ResponseEntity.ok(response);
    }
}
