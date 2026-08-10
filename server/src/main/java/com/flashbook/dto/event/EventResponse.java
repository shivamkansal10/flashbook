package com.flashbook.dto.event;

import com.flashbook.entity.Event;
import com.flashbook.entity.EventCategory;
import com.flashbook.entity.EventStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventResponse {

    private Long id;
    private String name;
    private String description;
    private VenueResponse venue;
    private Instant startTime;
    private EventStatus status;
    private BigDecimal priceFrom;
    private String imageUrl;
    private EventCategory category;
    private long availableSeats;
    private long totalSeats;

    public static EventResponse fromEntity(Event event, BigDecimal priceFrom, long availableSeats, long totalSeats) {
        if (event == null) return null;
        return EventResponse.builder()
                .id(event.getId())
                .name(event.getName())
                .description(event.getDescription())
                .venue(VenueResponse.fromEntity(event.getVenue()))
                .startTime(event.getStartTime())
                .status(event.getStatus())
                .priceFrom(priceFrom)
                .imageUrl(event.getImageUrl())
                .category(event.getCategory())
                .availableSeats(availableSeats)
                .totalSeats(totalSeats)
                .build();
    }

    public static EventResponse fromEntity(Event event, BigDecimal priceFrom) {
        return fromEntity(event, priceFrom, 0, 0);
    }

    public static EventResponse fromEntity(Event event) {
        return fromEntity(event, null, 0, 0);
    }
}
