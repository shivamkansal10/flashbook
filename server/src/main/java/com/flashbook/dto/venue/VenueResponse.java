package com.flashbook.dto.venue;

import com.flashbook.entity.Venue;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VenueResponse {

    private Long id;
    private String name;
    private String city;
    private String address;
    private Integer totalCapacity;

    public static VenueResponse fromEntity(Venue venue) {
        if (venue == null) return null;
        return VenueResponse.builder()
                .id(venue.getId())
                .name(venue.getName())
                .city(venue.getCity())
                .address(venue.getAddress())
                .totalCapacity(venue.getTotalCapacity())
                .build();
    }
}
