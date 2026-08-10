package com.flashbook.controller;

import com.flashbook.dto.waitlist.WaitlistResponse;
import com.flashbook.exception.UnauthorizedAccessException;
import com.flashbook.service.WaitlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/waitlist")
@RequiredArgsConstructor
public class WaitlistController {

    private final WaitlistService waitlistService;

    @PostMapping("/{eventId}/join")
    public ResponseEntity<WaitlistResponse> joinWaitlist(
            @PathVariable Long eventId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        if (userDetails == null) {
            throw new UnauthorizedAccessException("Authentication required to join the waitlist");
        }
        WaitlistResponse response = waitlistService.joinWaitlist(eventId, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{eventId}/position")
    public ResponseEntity<WaitlistResponse> getPosition(
            @PathVariable Long eventId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        if (userDetails == null) {
            throw new UnauthorizedAccessException("Authentication required to check waitlist position");
        }
        WaitlistResponse response = waitlistService.getPosition(eventId, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{eventId}/leave")
    public ResponseEntity<Map<String, String>> leaveWaitlist(
            @PathVariable Long eventId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        if (userDetails == null) {
            throw new UnauthorizedAccessException("Authentication required to leave the waitlist");
        }
        waitlistService.leaveWaitlist(eventId, userDetails.getUsername());
        return ResponseEntity.ok(Map.of("message", "Left waitlist successfully"));
    }
}
