package com.flashbook.dto.event;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventSeatsResponse {

    private Long eventId;
    private List<SeatResponse> seats;
}
