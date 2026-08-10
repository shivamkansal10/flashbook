package com.flashbook.service;

import com.flashbook.dto.booking.BookingResponse;
import com.flashbook.entity.*;
import com.flashbook.exception.InvalidBookingStateException;
import com.flashbook.exception.PromoCodeException;
import java.math.BigDecimal;
import com.flashbook.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock private BookingRepository bookingRepository;
    @Mock private EventRepository eventRepository;
    @Mock private SeatRepository seatRepository;
    @Mock private UserRepository userRepository;
    @Mock private SeatLockService seatLockService;
    @Mock private PromoCodeRepository promoCodeRepository;
    @Mock private WaitlistService waitlistService;

    @InjectMocks
    private BookingService bookingService;

    private User guestUser;
    private User organizerUser;
    private Event event;

    @BeforeEach
    void setUp() {
        guestUser = User.builder()
                .id(1L)
                .email("guest@example.com")
                .password("encoded")
                .fullName("Guest User")
                .role(Role.USER)
                .build();

        organizerUser = User.builder()
                .id(2L)
                .email("org@example.com")
                .password("encoded")
                .fullName("Organizer")
                .role(Role.ORGANIZER)
                .build();

        event = Event.builder()
                .id(10L)
                .name("Test Event")
                .status(EventStatus.PUBLISHED)
                .organizer(organizerUser)
                .startTime(Instant.now())
                .build();
    }

    // ----------------------------------------------------------------
    // Issue 3: applyPromoCode — HELD status guard
    // ----------------------------------------------------------------

    @Test
    void applyPromoCode_OnConfirmedBooking_ThrowsPromoCodeException() {
        Booking booking = Booking.builder()
                .id(5L)
                .user(guestUser)
                .event(event)
                .status(BookingStatus.CONFIRMED)
                .idempotencyKey("some-key")
                .seats(List.of())
                .build();

        when(bookingRepository.findById(5L)).thenReturn(Optional.of(booking));

        PromoCodeException ex = assertThrows(PromoCodeException.class,
                () -> bookingService.applyPromoCode(5L, "SAVE10", "guest@example.com"));

        assertTrue(ex.getMessage().contains("pending payment"),
                "Expected message about pending payment, got: " + ex.getMessage());
        // Should never reach the promo code lookup
        verifyNoInteractions(promoCodeRepository);
    }

    @Test
    void applyPromoCode_OnCancelledBooking_ThrowsPromoCodeException() {
        Booking booking = Booking.builder()
                .id(6L)
                .user(guestUser)
                .event(event)
                .status(BookingStatus.CANCELLED)
                .idempotencyKey("some-key-2")
                .seats(List.of())
                .build();

        when(bookingRepository.findById(6L)).thenReturn(Optional.of(booking));

        PromoCodeException ex = assertThrows(PromoCodeException.class,
                () -> bookingService.applyPromoCode(6L, "SAVE10", "guest@example.com"));

        assertTrue(ex.getMessage().contains("pending payment"),
                "Expected message about pending payment, got: " + ex.getMessage());
        verifyNoInteractions(promoCodeRepository);
    }

    // ----------------------------------------------------------------
    // Issue 5: cancelBooking — checked-in guard
    // ----------------------------------------------------------------

    @Test
    void cancelBooking_AfterCheckedIn_ThrowsInvalidBookingStateException() {
        Booking booking = Booking.builder()
                .id(7L)
                .user(guestUser)
                .event(event)
                .status(BookingStatus.CONFIRMED)
                .idempotencyKey("some-key-3")
                .checkedInAt(Instant.now())
                .seats(List.of())
                .build();

        when(bookingRepository.findById(7L)).thenReturn(Optional.of(booking));

        InvalidBookingStateException ex = assertThrows(InvalidBookingStateException.class,
                () -> bookingService.cancelBooking(7L, "guest@example.com"));

        assertTrue(ex.getMessage().toLowerCase().contains("checked in"),
                "Expected message about already checked in, got: " + ex.getMessage());
        verify(bookingRepository, never()).save(any());
    }

    // ----------------------------------------------------------------
    // Issue 2: checkInBooking — idempotencyKey (ticket code) lookup
    // ----------------------------------------------------------------

    @Test
    void checkInBooking_ByTicketCode_Success() {
        String ticketCode = "test-uuid-idempotency-key";
        Booking booking = Booking.builder()
                .id(8L)
                .user(guestUser)
                .event(event)
                .status(BookingStatus.CONFIRMED)
                .idempotencyKey(ticketCode)
                .seats(List.of())
                .build();

        when(bookingRepository.findByIdempotencyKey(ticketCode)).thenReturn(Optional.of(booking));
        when(userRepository.findByEmail("org@example.com")).thenReturn(Optional.of(organizerUser));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));

        BookingResponse response = bookingService.checkInBooking(ticketCode, "org@example.com");

        assertNotNull(response);
        // Verify the idempotencyKey lookup was used — NOT findById
        verify(bookingRepository).findByIdempotencyKey(ticketCode);
        verify(bookingRepository, never()).findById(any());
        // Verify checkedInAt was stamped on save
        verify(bookingRepository).save(argThat(b -> b.getCheckedInAt() != null));
    }

    @Test
    void cancelBooking_WithActiveWaitlist_TriggersSynchronousPromotion() {
        Seat seat = Seat.builder()
                .id(101L)
                .seatLabel("Seat 1")
                .price(BigDecimal.TEN)
                .status(SeatStatus.SOLD)
                .build();

        Booking booking = Booking.builder()
                .id(9L)
                .user(guestUser)
                .event(event)
                .status(BookingStatus.CONFIRMED)
                .idempotencyKey("some-key-4")
                .seats(List.of(seat))
                .build();

        when(bookingRepository.findById(9L)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));
        when(waitlistService.promoteNext(event.getId())).thenReturn(Optional.of("2"));

        BookingResponse response = bookingService.cancelBooking(9L, "guest@example.com");

        assertNotNull(response);
        assertEquals(BookingStatus.CANCELLED, response.getStatus());
        assertEquals(SeatStatus.AVAILABLE, seat.getStatus());

        verify(seatLockService).releaseHolds(eq(event.getId()), eq(List.of(101L)));
        verify(waitlistService).promoteNext(event.getId());
    }
}
