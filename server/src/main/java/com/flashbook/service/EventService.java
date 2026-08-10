package com.flashbook.service;

import com.flashbook.dto.event.*;
import com.flashbook.dto.organizer.SalesOverviewResponse;
import com.flashbook.entity.*;
import com.flashbook.exception.EventNotFoundException;
import com.flashbook.exception.UnauthorizedAccessException;
import com.flashbook.exception.VenueNotFoundException;
import com.flashbook.repository.BookingRepository;
import com.flashbook.repository.EventRepository;
import com.flashbook.repository.SeatRepository;
import com.flashbook.repository.UserRepository;
import com.flashbook.repository.VenueRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EventService {

    private final EventRepository eventRepository;
    private final SeatRepository seatRepository;
    private final VenueRepository venueRepository;
    private final UserRepository userRepository;
    private final SeatLockService seatLockService;
    private final BookingRepository bookingRepository;
    private final org.springframework.data.redis.core.StringRedisTemplate redisTemplate;

    @Transactional
    public EventResponse createEvent(EventRequest request, String organizerEmail) {
        log.info("Creating event '{}' for organizer '{}'", request.getName(), organizerEmail);

        User organizer = userRepository.findByEmail(organizerEmail)
                .orElseThrow(() -> new UnauthorizedAccessException("Organizer user not found: " + organizerEmail));

        if (organizer.getRole() != Role.ORGANIZER && organizer.getRole() != Role.ADMIN) {
            throw new UnauthorizedAccessException("User is not authorized to create events");
        }

        Venue venue = venueRepository.findById(request.getVenueId())
                .orElseThrow(() -> new VenueNotFoundException("Venue not found with id: " + request.getVenueId()));

        Event event = Event.builder()
                .name(request.getName())
                .description(request.getDescription())
                .venue(venue)
                .startTime(request.getStartTime())
                .status(EventStatus.DRAFT)
                .organizer(organizer)
                .imageUrl(request.getImageUrl())
                .category(request.getCategory())
                .build();

        Event savedEvent = eventRepository.save(event);
        log.info("Event '{}' created with id: {}", savedEvent.getName(), savedEvent.getId());
        return EventResponse.fromEntity(savedEvent, null);
    }

    @Transactional
    public List<SeatResponse> addSeatsToEvent(Long eventId, List<SeatRequest> seatRequests, String organizerEmail) {
        log.info("Adding {} seats to eventId: {} by organizer: '{}'", seatRequests.size(), eventId, organizerEmail);

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EventNotFoundException("Event not found with id: " + eventId));

        validateOrganizerOwnership(event, organizerEmail);

        List<Seat> seats = seatRequests.stream()
                .map(req -> Seat.builder()
                        .event(event)
                        .seatLabel(req.getSeatLabel())
                        .price(req.getPrice())
                        .status(SeatStatus.AVAILABLE)
                        .build())
                .toList();

        List<Seat> savedSeats = seatRepository.saveAll(seats);
        log.info("Successfully added {} seats to eventId: {}", savedSeats.size(), eventId);

        return savedSeats.stream()
                .map(SeatResponse::fromEntity)
                .toList();
    }

    @Transactional
    public EventResponse publishEvent(Long eventId, String organizerEmail) {
        log.info("Publishing eventId: {} by organizer: '{}'", eventId, organizerEmail);

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EventNotFoundException("Event not found with id: " + eventId));

        validateOrganizerOwnership(event, organizerEmail);

        List<Seat> seats = seatRepository.findByEventId(eventId);
        long totalSeatCount = seats.size();

        event.setStatus(EventStatus.PUBLISHED);
        Event publishedEvent = eventRepository.save(event);

        // CRITICAL: Must initialize Redis inventory counter for the event upon publishing
        seatLockService.initializeEventInventory(eventId, totalSeatCount);
        log.info("EventId: {} published successfully. Redis inventory initialized to {}", eventId, totalSeatCount);

        BigDecimal priceFrom = seatRepository.findMinPriceByEventId(eventId);
        long total = seatRepository.countByEventId(eventId);
        long available = seatRepository.countByEventIdAndStatus(eventId, SeatStatus.AVAILABLE);
        return EventResponse.fromEntity(publishedEvent, priceFrom, available, total);
    }

    public EventResponse getEventById(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EventNotFoundException("Event not found with id: " + eventId));

        BigDecimal priceFrom = seatRepository.findMinPriceByEventId(eventId);
        long total = seatRepository.countByEventId(eventId);
        long available = seatRepository.countByEventIdAndStatus(eventId, SeatStatus.AVAILABLE);
        return EventResponse.fromEntity(event, priceFrom, available, total);
    }

    public Page<EventResponse> listEvents(EventFilterParams params) {
        Pageable pageable = PageRequest.of(
                params.getPage() != null ? params.getPage() : 0,
                params.getSize() != null ? params.getSize() : 10,
                Sort.by("startTime").ascending()
        );

        Specification<Event> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Public listing shows PUBLISHED and SOLD_OUT events (SOLD_OUT still needs to be
            // visible so EventCard can render the "Sold Out" badge and waitlist entry point)
            predicates.add(root.get("status").in(EventStatus.PUBLISHED, EventStatus.SOLD_OUT));

            if (params.getCity() != null && !params.getCity().isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("venue").get("city")), params.getCity().trim().toLowerCase()));
            }

            if (params.getCategory() != null && !params.getCategory().isBlank()) {
                String catPattern = "%" + params.getCategory().trim().toLowerCase() + "%";
                Predicate nameMatch = cb.like(cb.lower(root.get("name")), catPattern);
                Predicate descMatch = cb.like(cb.lower(root.get("description")), catPattern);
                predicates.add(cb.or(nameMatch, descMatch));
            }

            if (params.getStartDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("startTime"), params.getStartDate()));
            }

            if (params.getEndDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("startTime"), params.getEndDate()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Event> eventPage = eventRepository.findAll(spec, pageable);

        return eventPage.map(event -> {
            BigDecimal priceFrom = seatRepository.findMinPriceByEventId(event.getId());
            long total = seatRepository.countByEventId(event.getId());
            long available = seatRepository.countByEventIdAndStatus(event.getId(), SeatStatus.AVAILABLE);
            return EventResponse.fromEntity(event, priceFrom, available, total);
        });
    }

    public EventSeatsResponse getEventSeats(Long eventId) {
        if (!eventRepository.existsById(eventId)) {
            throw new EventNotFoundException("Event not found with id: " + eventId);
        }

        List<Seat> seats = seatRepository.findByEventId(eventId);
        List<SeatResponse> seatResponses = new java.util.ArrayList<>();
        for (Seat seat : seats) {
            seatResponses.add(SeatResponse.fromEntity(seat));
        }

        if (!seatResponses.isEmpty()) {
            List<String> holdKeys = seatResponses.stream()
                    .map(s -> "hold:seat:%d:%d".formatted(eventId, s.getId()))
                    .toList();
            List<String> holdOwners = redisTemplate.opsForValue().multiGet(holdKeys);
            if (holdOwners != null) {
                for (int i = 0; i < seatResponses.size(); i++) {
                    SeatResponse response = seatResponses.get(i);
                    if (response.getStatus() == SeatStatus.AVAILABLE && holdOwners.get(i) != null) {
                        response.setStatus(SeatStatus.HELD);
                    }
                }
            }
        }

        return EventSeatsResponse.builder()
                .eventId(eventId)
                .seats(seatResponses)
                .build();
    }

    public SalesOverviewResponse getSalesOverview(Long eventId, String organizerEmail) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EventNotFoundException("Event not found with id: " + eventId));

        validateOrganizerOwnership(event, organizerEmail);

        List<Seat> seats = seatRepository.findByEventId(eventId);
        int totalSeats = seats.size();
        int soldSeats = (int) seats.stream().filter(s -> s.getStatus() == SeatStatus.SOLD).count();
        int availableSeats = (int) seats.stream().filter(s -> s.getStatus() == SeatStatus.AVAILABLE).count();
        int heldSeats = (int) seats.stream().filter(s -> s.getStatus() == SeatStatus.HELD).count();

        // I4: Sum actual post-discount booking prices (CONFIRMED bookings) rather than raw seat prices.
        // booking.totalPrice reflects any promo code discount applied before payment, making it
        // the single source of truth for what the customer actually paid.
        BigDecimal totalRevenue = bookingRepository
                .findByEvent_IdAndStatus(eventId, BookingStatus.CONFIRMED)
                .stream()
                .map(b -> b.getTotalPrice() != null ? b.getTotalPrice() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return SalesOverviewResponse.builder()
                .eventId(eventId)
                .eventName(event.getName())
                .totalSeats(totalSeats)
                .soldSeats(soldSeats)
                .availableSeats(availableSeats)
                .heldSeats(heldSeats)
                .totalRevenue(totalRevenue)
                .build();
    }

    private void validateOrganizerOwnership(Event event, String organizerEmail) {
        if (!event.getOrganizer().getEmail().equalsIgnoreCase(organizerEmail)) {
            log.warn("User '{}' attempted unauthorized action on eventId: {}", organizerEmail, event.getId());
            throw new UnauthorizedAccessException("Only the event organizer can perform this operation");
        }
    }

    public Page<EventResponse> listOrganizerEvents(String email, int page, int size) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedAccessException("User not found: " + email));

        Pageable pageable = PageRequest.of(page, size, Sort.by("startTime").ascending());
        Page<Event> eventPage;

        if (user.getRole() == Role.ADMIN) {
            eventPage = eventRepository.findAll(pageable);
        } else {
            eventPage = eventRepository.findByOrganizerId(user.getId(), pageable);
        }

        return eventPage.map(event -> {
            BigDecimal priceFrom = seatRepository.findMinPriceByEventId(event.getId());
            long total = seatRepository.countByEventId(event.getId());
            long available = seatRepository.countByEventIdAndStatus(event.getId(), SeatStatus.AVAILABLE);
            return EventResponse.fromEntity(event, priceFrom, available, total);
        });
    }

    @Transactional
    public EventResponse updateEvent(Long eventId, EventRequest request, String email) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EventNotFoundException("Event not found with id: " + eventId));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedAccessException("User not found: " + email));

        if (user.getRole() != Role.ADMIN && !event.getOrganizer().getId().equals(user.getId())) {
            throw new UnauthorizedAccessException("Only the event organizer or an admin can update this event");
        }

        if (event.getStatus() != EventStatus.DRAFT) {
            throw new com.flashbook.exception.InvalidEventStateException("Cannot update event details because the event is already " + event.getStatus());
        }

        Venue venue = venueRepository.findById(request.getVenueId())
                .orElseThrow(() -> new VenueNotFoundException("Venue not found with id: " + request.getVenueId()));

        event.setName(request.getName());
        event.setDescription(request.getDescription());
        event.setStartTime(request.getStartTime());
        event.setVenue(venue);
        event.setImageUrl(request.getImageUrl());
        event.setCategory(request.getCategory());

        Event updatedEvent = eventRepository.save(event);
        BigDecimal priceFrom = seatRepository.findMinPriceByEventId(eventId);
        long total = seatRepository.countByEventId(eventId);
        long available = seatRepository.countByEventIdAndStatus(eventId, SeatStatus.AVAILABLE);
        return EventResponse.fromEntity(updatedEvent, priceFrom, available, total);
    }
}
