package com.flashbook.controller;

import com.flashbook.dto.booking.BookingResponse;
import com.flashbook.dto.booking.CreateBookingRequest;
import com.flashbook.dto.booking.HoldResult;
import com.flashbook.dto.booking.HoldSeatRequest;
import com.flashbook.dto.booking.ApplyPromoRequest;
import com.flashbook.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.concurrent.CompletionException;

import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import com.flashbook.exception.RateLimitedException;
import com.flashbook.exception.SeatUnavailableException;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping("/hold")
    @RateLimiter(name = "bookingEndpoint", fallbackMethod = "holdSeatsRateLimiterFallback")
    public ResponseEntity<List<HoldResult>> holdSeats(
            @Valid @RequestBody HoldSeatRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        try {
            List<HoldResult> holds = bookingService.holdSeats(request, userDetails.getUsername()).join();
            return ResponseEntity.ok(holds);
        } catch (CompletionException e) {
            if (e.getCause() instanceof RuntimeException runtimeEx) {
                throw runtimeEx;
            }
            throw new SeatUnavailableException("Seat hold processing failed: " + e.getMessage());
        }
    }

    public ResponseEntity<List<HoldResult>> holdSeatsRateLimiterFallback(
            HoldSeatRequest request,
            UserDetails userDetails,
            Throwable t
    ) {
        if (t instanceof io.github.resilience4j.ratelimiter.RequestNotPermitted) {
            String userEmail = userDetails != null ? userDetails.getUsername() : "anonymous";
            java.time.Instant timestamp = java.time.Instant.now();
            log.warn("[FALLBACK TRIGGERED] Timestamp: {}, userEmail: {}, eventId: {}, seatIds: {}",
                    timestamp, userEmail, request != null ? request.getEventId() : "null", request != null ? request.getSeatIds() : "null");
            log.warn("Rate limit exceeded on /api/bookings/hold for user: {}",
                    userEmail);
            throw new RateLimitedException("Too many booking requests. Please wait a moment and try again.");
        }
        if (t instanceof RuntimeException runtimeEx) {
            throw runtimeEx;
        }
        throw new RuntimeException(t);
    }

    @PostMapping
    public ResponseEntity<BookingResponse> createBooking(
            @Valid @RequestBody CreateBookingRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        BookingResponse booking = bookingService.createBooking(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(booking);
    }

    @PostMapping("/{id}/confirm")
    public ResponseEntity<BookingResponse> confirmBooking(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        BookingResponse booking = bookingService.confirmBooking(id, userDetails.getUsername());
        return ResponseEntity.ok(booking);
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<BookingResponse> cancelBooking(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        BookingResponse booking = bookingService.cancelBooking(id, userDetails.getUsername());
        return ResponseEntity.ok(booking);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookingResponse> getBookingById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        BookingResponse booking = bookingService.getBookingById(id, userDetails.getUsername());
        return ResponseEntity.ok(booking);
    }

    @GetMapping("/user")
    public ResponseEntity<List<BookingResponse>> getUserBookings(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        List<BookingResponse> bookings = bookingService.getUserBookings(userDetails.getUsername());
        return ResponseEntity.ok(bookings);
    }

    @PostMapping("/{id}/apply-promo")
    public ResponseEntity<BookingResponse> applyPromo(
            @PathVariable Long id,
            @Valid @RequestBody ApplyPromoRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        BookingResponse booking = bookingService.applyPromoCode(id, request.getCode(), userDetails.getUsername());
        return ResponseEntity.ok(booking);
    }

    @GetMapping("/{id}/ticket")
    public ResponseEntity<byte[]> getTicketPdf(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        byte[] pdfBytes = bookingService.generateTicketPdf(id, userDetails.getUsername());

        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_PDF);
        headers.setContentDisposition(org.springframework.http.ContentDisposition.attachment()
                .filename("ticket-" + id + ".pdf")
                .build());

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }
}
