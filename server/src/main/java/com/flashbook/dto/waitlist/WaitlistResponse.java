package com.flashbook.dto.waitlist;

import com.flashbook.entity.WaitlistStatus;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WaitlistResponse {

    private Long eventId;
    private Long userId;
    private Integer position;
    private Integer estimatedWaitMinutes;
    private WaitlistStatus status;
}
