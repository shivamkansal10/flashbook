package com.flashbook.controller;

import com.flashbook.dto.auth.UpdateProfileRequest;
import com.flashbook.dto.auth.UserDto;
import com.flashbook.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PutMapping("/me")
    public ResponseEntity<UserDto> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserDto updatedUser = userService.updateProfile(userDetails.getUsername(), request);
        return ResponseEntity.ok(updatedUser);
    }
}
