package com.flashbook.dto.organizer;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalesOverviewResponse {

    private Long eventId;
    private String eventName;
    private Integer totalSeats;
    private Integer soldSeats;
    private Integer availableSeats;
    private Integer heldSeats;
    private BigDecimal totalRevenue;
}
