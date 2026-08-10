package com.flashbook.dto.booking;

import com.flashbook.entity.Booking;
import com.flashbook.entity.BookingStatus;
import com.flashbook.entity.Seat;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingResponse {

    private Long id;
    private Long userId;
    private String userEmail;
    private Long eventId;
    private String eventName;
    private List<Long> seatIds;
    private List<String> seatLabels;
    private List<BookingSeatDto> seats;
    private BigDecimal totalPrice;
    private String idempotencyKey;
    private BookingStatus status;
    private Instant createdAt;
    private Instant expiresAt;
    private Instant checkedInAt;
    private String promoCode;

    public static BookingResponse fromEntity(Booking booking, long holdTtlSeconds) {
        List<Long> seatIds = booking.getSeats() != null
                ? booking.getSeats().stream().map(Seat::getId).toList()
                : List.of();

        List<String> seatLabels = booking.getSeats() != null
                ? booking.getSeats().stream().map(Seat::getSeatLabel).toList()
                : List.of();

        List<BookingSeatDto> seatDtos = booking.getSeats() != null
                ? booking.getSeats().stream().map(BookingSeatDto::fromEntity).toList()
                : List.of();

        BigDecimal totalPrice = booking.getTotalPrice() != null
                ? booking.getTotalPrice()
                : (booking.getSeats() != null
                        ? booking.getSeats().stream().map(Seat::getPrice).reduce(BigDecimal.ZERO, BigDecimal::add)
                        : BigDecimal.ZERO);

        return BookingResponse.builder()
            .id(booking.getId())
            .userId(booking.getUser().getId())
            .userEmail(booking.getUser().getEmail())
            .eventId(booking.getEvent().getId())
            .eventName(booking.getEvent().getName())
            .seatIds(seatIds)
            .seatLabels(seatLabels)
            .seats(seatDtos)
            .totalPrice(totalPrice)
            .idempotencyKey(booking.getIdempotencyKey())
            .status(booking.getStatus())
            .createdAt(booking.getCreatedAt())
            .expiresAt(booking.getCreatedAt() != null ? booking.getCreatedAt().plusSeconds(holdTtlSeconds) : null)
            .checkedInAt(booking.getCheckedInAt())
            .promoCode(booking.getPromoCode() != null ? booking.getPromoCode().getCode() : null)
            .build();
    }
}
