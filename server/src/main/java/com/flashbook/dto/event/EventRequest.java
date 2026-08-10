package com.flashbook.dto.event;

import com.flashbook.entity.EventCategory;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventRequest {

    @NotBlank(message = "Event name is required")
    private String name;

    @NotBlank(message = "Event description is required")
    private String description;

    @NotNull(message = "Venue ID is required")
    private Long venueId;

    @NotNull(message = "Start time is required")
    @Future(message = "Start time must be in the future")
    private Instant startTime;

    private String imageUrl;
    private EventCategory category;
}
