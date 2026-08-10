package com.flashbook.service;

import com.flashbook.dto.booking.BookingResponse;
import com.flashbook.dto.booking.CreateBookingRequest;
import com.flashbook.dto.booking.HoldResult;
import com.flashbook.dto.booking.HoldSeatRequest;
import com.flashbook.entity.*;
import com.flashbook.exception.BookingNotFoundException;
import com.flashbook.exception.SeatUnavailableException;
import com.flashbook.exception.PromoCodeException;
import com.flashbook.exception.InvalidBookingStateException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import com.flashbook.repository.BookingRepository;
import com.flashbook.repository.EventRepository;
import com.flashbook.repository.SeatRepository;
import com.flashbook.repository.UserRepository;
import com.flashbook.repository.PromoCodeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import io.github.resilience4j.bulkhead.annotation.Bulkhead;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final EventRepository eventRepository;
    private final SeatRepository seatRepository;
    private final UserRepository userRepository;
    private final SeatLockService seatLockService;
    private final PromoCodeRepository promoCodeRepository;
    private final WaitlistService waitlistService;

    @org.springframework.beans.factory.annotation.Value("${booking.hold-ttl-seconds:300}")
    private long holdTtlSeconds;

    @Bulkhead(name = "bookingService", type = Bulkhead.Type.SEMAPHORE, fallbackMethod = "holdSeatsBulkheadFallback")
    public CompletableFuture<List<HoldResult>> holdSeats(HoldSeatRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new com.flashbook.exception.UserNotFoundException("User not found with email: " + userEmail));

        return CompletableFuture.completedFuture(
                seatLockService.holdSeats(request.getEventId(), request.getSeatIds(), user.getId())
        );
    }

    public CompletableFuture<List<HoldResult>> holdSeatsBulkheadFallback(HoldSeatRequest request, String userEmail, Throwable t) {
        log.warn("ThreadPool Bulkhead capacity reached for user: {} on eventId: {}: {}", userEmail, request.getEventId(), t.getMessage());
        CompletableFuture<List<HoldResult>> future = new CompletableFuture<>();
        future.completeExceptionally(new SeatUnavailableException("Booking system is currently at maximum capacity, please try again shortly"));
        return future;
    }

    @Transactional
    public BookingResponse createBooking(CreateBookingRequest request, String userEmail) {
        Optional<Booking> existingBooking = bookingRepository.findByIdempotencyKey(request.getIdempotencyKey());
        if (existingBooking.isPresent()) {
            log.info("Idempotency key hit for key: {}. Returning existing booking ID: {}",
                    request.getIdempotencyKey(), existingBooking.get().getId());
            return BookingResponse.fromEntity(existingBooking.get(), holdTtlSeconds);
        }

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new com.flashbook.exception.UserNotFoundException("User not found with email: " + userEmail));

        Event event = eventRepository.findById(request.getEventId())
                .orElseThrow(() -> new com.flashbook.exception.EventNotFoundException("Event not found with ID: " + request.getEventId()));

        List<Seat> seats = seatRepository.findByIdInAndEventId(request.getSeatIds(), request.getEventId());
        if (seats.size() != request.getSeatIds().size()) {
            throw new SeatUnavailableException("One or more requested seats do not exist for this event");
        }

        for (Seat seat : seats) {
            String ownerId = seatLockService.getHoldOwner(event.getId(), seat.getId());
            if (ownerId == null || !ownerId.equals(user.getId().toString())) {
                throw new SeatUnavailableException("Seat " + seat.getSeatLabel() + " is not currently held by user");
            }
        }

        for (Seat seat : seats) {
            seat.setStatus(SeatStatus.HELD);
        }
        seatRepository.saveAll(seats);

        BigDecimal totalPrice = seats.stream().map(Seat::getPrice).reduce(BigDecimal.ZERO, BigDecimal::add);

        Booking booking = Booking.builder()
                .user(user)
                .event(event)
                .seats(seats)
                .idempotencyKey(request.getIdempotencyKey())
                .status(BookingStatus.HELD)
                .totalPrice(totalPrice)
                .build();

        Booking savedBooking = bookingRepository.save(booking);
        log.info("Created booking ID: {} with HELD status for user ID: {}", savedBooking.getId(), user.getId());

        return BookingResponse.fromEntity(savedBooking, holdTtlSeconds);
    }

    @Transactional
    public BookingResponse confirmBooking(Long bookingId, String userEmail) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BookingNotFoundException("Booking not found with ID: " + bookingId));

        if (!booking.getUser().getEmail().equals(userEmail)) {
            throw new com.flashbook.exception.UnauthorizedAccessException("Unauthorized to confirm this booking");
        }

        if (booking.getStatus() != BookingStatus.HELD) {
            throw new com.flashbook.exception.InvalidBookingStateException("Booking cannot be confirmed from current status: " + booking.getStatus());
        }

        booking.setStatus(BookingStatus.CONFIRMED);
        if (booking.getSeats() != null) {
            for (Seat seat : booking.getSeats()) {
                seat.setStatus(SeatStatus.SOLD);
            }
            seatRepository.saveAll(booking.getSeats());

            List<Long> seatIds = booking.getSeats().stream().map(Seat::getId).toList();
            seatLockService.removeHolds(booking.getEvent().getId(), seatIds);

            // Sold-out check: check if the event has 0 available seats remaining
            long availableSeats = seatRepository.countByEventIdAndStatus(booking.getEvent().getId(), SeatStatus.AVAILABLE);
            if (availableSeats == 0) {
                Event event = booking.getEvent();
                event.setStatus(EventStatus.SOLD_OUT);
                eventRepository.save(event);
                log.info("Event ID: {} is now SOLD_OUT!", event.getId());
            }
        }

        Booking updatedBooking = bookingRepository.save(booking);
        log.info("Confirmed booking ID: {}", bookingId);

        return BookingResponse.fromEntity(updatedBooking, holdTtlSeconds);
    }

    @Transactional
    public BookingResponse cancelBooking(Long bookingId, String userEmail) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BookingNotFoundException("Booking not found with ID: " + bookingId));

        if (!booking.getUser().getEmail().equals(userEmail)) {
            throw new com.flashbook.exception.UnauthorizedAccessException("Unauthorized to cancel this booking");
        }

        // I5: Guard — cannot cancel a booking that has already been scanned at the gate.
        if (booking.getCheckedInAt() != null) {
            throw new InvalidBookingStateException("Cannot cancel a booking that has already been checked in");
        }

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            return BookingResponse.fromEntity(booking, holdTtlSeconds);
        }

        // TODO (Known Limitation): Cancelling a CONFIRMED booking does NOT trigger a Razorpay refund
        // and does NOT update the corresponding Payment record status to REFUNDED.
        // This must be implemented before production use for paid bookings.
        // Tracked as a known limitation in the project README.

        if (booking.getSeats() != null && !booking.getSeats().isEmpty()) {
            List<Long> seatIds = booking.getSeats().stream().map(Seat::getId).toList();
            seatLockService.releaseHolds(booking.getEvent().getId(), seatIds);

            for (Seat seat : booking.getSeats()) {
                seat.setStatus(SeatStatus.AVAILABLE);
            }
            seatRepository.saveAll(booking.getSeats());

            // Trigger waitlist promotion now that seats are back in AVAILABLE state.
            // Wrapped in try/catch: a promotion failure must never cause the cancellation to fail.
            Long eventId = booking.getEvent().getId();
            try {
                waitlistService.promoteNext(eventId).ifPresent(userIdStr ->
                        log.info("Promoted user ID {} from waitlist following cancellation of bookingId: {}",
                                userIdStr, booking.getId())
                );
            } catch (Exception ex) {
                log.warn("Waitlist promotion failed for eventId: {} after cancellation of bookingId: {} — "
                        + "cancellation still succeeds. Reason: {}", eventId, booking.getId(), ex.getMessage());
            }
        }

        booking.setStatus(BookingStatus.CANCELLED);
        Booking updatedBooking = bookingRepository.save(booking);
        log.info("Cancelled booking ID: {}", bookingId);

        return BookingResponse.fromEntity(updatedBooking, holdTtlSeconds);
    }

    @Transactional(readOnly = true)
    public BookingResponse getBookingById(Long bookingId, String userEmail) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BookingNotFoundException("Booking not found with ID: " + bookingId));

        if (!booking.getUser().getEmail().equals(userEmail)) {
            throw new com.flashbook.exception.UnauthorizedAccessException("Unauthorized access to booking ID: " + bookingId);
        }

        return BookingResponse.fromEntity(booking, holdTtlSeconds);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getUserBookings(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new com.flashbook.exception.UserNotFoundException("User not found with email: " + userEmail));

        List<Booking> bookings = bookingRepository.findByUserId(user.getId());
        return bookings.stream()
                .map(b -> BookingResponse.fromEntity(b, holdTtlSeconds))
                .toList();
    }

    @Transactional
    public BookingResponse applyPromoCode(Long bookingId, String code, String userEmail) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BookingNotFoundException("Booking not found with ID: " + bookingId));

        if (!booking.getUser().getEmail().equals(userEmail)) {
            throw new com.flashbook.exception.UnauthorizedAccessException("Unauthorized to apply promo code to this booking");
        }

        // I3: Promo codes may only be applied while the booking is in HELD (pre-payment) state.
        if (booking.getStatus() != BookingStatus.HELD) {
            throw new PromoCodeException("Promo codes can only be applied to bookings pending payment");
        }

        if (booking.getPromoCode() != null) {
            throw new PromoCodeException("Promo code already applied to this booking");
        }

        PromoCode promo = promoCodeRepository.findByCode(code.trim().toUpperCase())
                .orElseThrow(() -> new PromoCodeException("Invalid or expired promo code"));

        if (!promo.isActive() || 
                (promo.getExpiresAt() != null && promo.getExpiresAt().isBefore(java.time.Instant.now())) ||
                (promo.getEventId() != null && !promo.getEventId().equals(booking.getEvent().getId()))) {
            throw new PromoCodeException("Invalid or expired promo code");
        }

        BigDecimal originalPrice = booking.getSeats() != null
                ? booking.getSeats().stream().map(Seat::getPrice).reduce(BigDecimal.ZERO, BigDecimal::add)
                : BigDecimal.ZERO;

        BigDecimal discountedPrice = originalPrice;
        if (promo.getDiscountPercent() != null) {
            BigDecimal discount = originalPrice.multiply(BigDecimal.valueOf(promo.getDiscountPercent()))
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            discountedPrice = originalPrice.subtract(discount);
        } else if (promo.getDiscountAmount() != null) {
            BigDecimal discount = BigDecimal.valueOf(promo.getDiscountAmount())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            discountedPrice = originalPrice.subtract(discount);
        }

        if (discountedPrice.compareTo(BigDecimal.ZERO) < 0) {
            discountedPrice = BigDecimal.ZERO;
        }

        booking.setTotalPrice(discountedPrice);
        booking.setPromoCode(promo);

        Booking updatedBooking = bookingRepository.save(booking);
        return BookingResponse.fromEntity(updatedBooking, holdTtlSeconds);
    }

    @Transactional(readOnly = true)
    public byte[] generateTicketPdf(Long bookingId, String userEmail) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BookingNotFoundException("Booking not found with ID: " + bookingId));

        if (!booking.getUser().getEmail().equals(userEmail)) {
            throw new com.flashbook.exception.UnauthorizedAccessException("Unauthorized access to booking ID: " + bookingId);
        }

        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new InvalidBookingStateException("Ticket can only be generated for CONFIRMED bookings");
        }

        try {
            byte[] qrCodeBytes = com.flashbook.util.QrCodeGenerator.generateQrCodeImage(booking.getIdempotencyKey(), 150, 150);
            return com.flashbook.util.TicketPdfGenerator.generateTicket(booking, qrCodeBytes);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate ticket PDF", e);
        }
    }

    @Transactional
    public BookingResponse checkInBooking(String ticketCode, String organizerEmail) {
        // I2: Look up by idempotencyKey (UUID) — this is what the QR code encodes.
        Booking booking = bookingRepository.findByIdempotencyKey(ticketCode)
                .orElseThrow(() -> new BookingNotFoundException("Booking not found for ticket code: " + ticketCode));

        User user = userRepository.findByEmail(organizerEmail)
                .orElseThrow(() -> new com.flashbook.exception.UserNotFoundException("User not found: " + organizerEmail));

        boolean isAdmin = user.getRole() == Role.ADMIN;
        boolean isOrganizer = booking.getEvent().getOrganizer().getEmail().equalsIgnoreCase(organizerEmail);
        if (!isAdmin && !isOrganizer) {
            throw new com.flashbook.exception.UnauthorizedAccessException("You are not authorized to check in guests for this event");
        }

        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new com.flashbook.exception.InvalidBookingStateException("Only CONFIRMED bookings can be checked in");
        }

        if (booking.getCheckedInAt() != null) {
            throw new com.flashbook.exception.InvalidBookingStateException("This ticket has already been checked in");
        }

        booking.setCheckedInAt(Instant.now());
        Booking saved = bookingRepository.save(booking);
        log.info("Successfully checked in booking ID: {} (ticket code: {})", saved.getId(), ticketCode);

        return BookingResponse.fromEntity(saved, holdTtlSeconds);
    }
}
