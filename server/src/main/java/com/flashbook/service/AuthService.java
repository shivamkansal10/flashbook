package com.flashbook.service;

import com.flashbook.dto.auth.*;
import com.flashbook.entity.Role;
import com.flashbook.entity.User;
import com.flashbook.exception.InvalidCredentialsException;
import com.flashbook.exception.InvalidTokenException;
import com.flashbook.exception.UserAlreadyExistsException;
import com.flashbook.repository.UserRepository;
import com.flashbook.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("User with email " + request.getEmail() + " already exists");
        }

        Role role = Role.USER; // Always register as USER, ignore client-provided role for security

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .build();

        User savedUser = userRepository.save(user);
        String token = jwtUtil.generateToken(savedUser.getEmail(), savedUser.getRole().name());

        return AuthResponse.builder()
                .jwt(token)
                .user(UserDto.fromEntity(savedUser))
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());

        return AuthResponse.builder()
                .jwt(token)
                .user(UserDto.fromEntity(user))
                .build();
    }

    public MessageResponse forgotPassword(ForgotPasswordRequest request) {
        userRepository.findByEmail(request.getEmail()).ifPresent(user -> {
            String resetToken = jwtUtil.generateResetToken(user.getEmail());
            // -----------------------------------------------------------------------
            // DEV STUB: Email sending is not yet implemented.
            // In production, replace this log statement with an actual email dispatch
            // (e.g., via JavaMailSender / SendGrid) carrying a link of the form:
            //   https://<frontend>/reset-password?token=<resetToken>
            // -----------------------------------------------------------------------
            log.warn("[DEV STUB] Password reset token for {} — copy to reset-password page: {}", user.getEmail(), resetToken);
        });

        return MessageResponse.builder()
                .message("If an account exists with that email, a password reset link has been sent.")
                .build();
    }

    @Transactional
    public MessageResponse resetPassword(ResetPasswordRequest request) {
        if (!jwtUtil.validateResetToken(request.getToken())) {
            throw new InvalidTokenException("Invalid or expired password reset token");
        }

        String email = jwtUtil.extractUsername(request.getToken());
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new InvalidTokenException("User not found for token"));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        return MessageResponse.builder()
                .message("Password has been successfully updated.")
                .build();
    }
}
