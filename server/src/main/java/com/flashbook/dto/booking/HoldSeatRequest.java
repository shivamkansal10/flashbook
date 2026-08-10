package com.flashbook.dto.booking;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HoldSeatRequest {

    @NotNull(message = "Event ID is required")
    private Long eventId;

    @NotEmpty(message = "At least one seat must be selected")
    private List<Long> seatIds;
}
