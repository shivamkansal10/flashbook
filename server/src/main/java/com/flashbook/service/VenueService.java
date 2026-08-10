package com.flashbook.service;

import com.flashbook.dto.venue.VenueRequest;
import com.flashbook.dto.venue.VenueResponse;
import com.flashbook.entity.Venue;
import com.flashbook.repository.VenueRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class VenueService {

    private final VenueRepository venueRepository;

    @Transactional
    public VenueResponse createVenue(VenueRequest request) {
        log.info("Creating venue: {} in city: {}", request.getName(), request.getCity());
        Venue venue = Venue.builder()
                .name(request.getName())
                .city(request.getCity())
                .address(request.getAddress())
                .totalCapacity(request.getTotalCapacity())
                .build();
        Venue savedVenue = venueRepository.save(venue);
        log.info("Successfully created venue: {} with ID: {}", savedVenue.getName(), savedVenue.getId());
        return VenueResponse.fromEntity(savedVenue);
    }

    public List<VenueResponse> listVenues() {
        return venueRepository.findAll().stream()
                .map(VenueResponse::fromEntity)
                .toList();
    }
}
