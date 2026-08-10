package com.flashbook.dto.booking;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingSeatDto {
    private Long seatId;
    private String seatLabel;
    private BigDecimal price;

    public static BookingSeatDto fromEntity(com.flashbook.entity.Seat seat) {
        if (seat == null) return null;
        return BookingSeatDto.builder()
                .seatId(seat.getId())
                .seatLabel(seat.getSeatLabel())
                .price(seat.getPrice())
                .build();
    }
}
