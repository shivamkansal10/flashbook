package com.flashbook.dto.event;

import lombok.*;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventFilterParams {

    private String category;
    private String city;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private Instant startDate;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private Instant endDate;

    @Builder.Default
    private Integer page = 0;

    @Builder.Default
    private Integer size = 10;
}
