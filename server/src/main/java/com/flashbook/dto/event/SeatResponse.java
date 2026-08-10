package com.flashbook.dto.event;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.flashbook.entity.Seat;
import com.flashbook.entity.SeatStatus;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SeatResponse {

    private Long id;

    @JsonProperty("label")
    private String seatLabel;

    private BigDecimal price;
    private SeatStatus status;

    public static SeatResponse fromEntity(Seat seat) {
        if (seat == null) return null;
        return SeatResponse.builder()
                .id(seat.getId())
                .seatLabel(seat.getSeatLabel())
                .price(seat.getPrice())
                .status(seat.getStatus())
                .build();
    }
}
