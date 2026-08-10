package com.flashbook.service;

import com.flashbook.dto.auth.*;
import com.flashbook.entity.Role;
import com.flashbook.entity.User;
import com.flashbook.exception.InvalidCredentialsException;
import com.flashbook.exception.UserAlreadyExistsException;
import com.flashbook.repository.UserRepository;
import com.flashbook.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @InjectMocks
    private AuthService authService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(1L)
                .email("test@example.com")
                .password("encoded_pass")
                .fullName("Test User")
                .role(Role.USER)
                .build();
    }

    @Test
    void register_Successful() {
        RegisterRequest req = RegisterRequest.builder()
                .fullName("Test User")
                .email("test@example.com")
                .password("password123")
                .build();

        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encoded_pass");
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);
        when(jwtUtil.generateToken("test@example.com", "USER")).thenReturn("mocked_jwt");

        AuthResponse resp = authService.register(req);

        assertNotNull(resp);
        assertEquals("mocked_jwt", resp.getJwt());
        assertEquals("test@example.com", resp.getUser().getEmail());
        assertEquals(Role.USER, resp.getUser().getRole());
    }

    @Test
    void register_IgnoresRole_AlwaysUSER() {
        RegisterRequest req = RegisterRequest.builder()
                .fullName("Test User")
                .email("test@example.com")
                .password("password123")
                .role(Role.ADMIN) // Attempt privilege escalation
                .build();

        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encoded_pass");
        
        org.mockito.ArgumentCaptor<User> userCaptor = org.mockito.ArgumentCaptor.forClass(User.class);
        when(userRepository.save(userCaptor.capture())).thenReturn(sampleUser);
        when(jwtUtil.generateToken("test@example.com", "USER")).thenReturn("mocked_jwt");

        AuthResponse resp = authService.register(req);

        assertNotNull(resp);
        assertEquals(Role.USER, userCaptor.getValue().getRole()); // Asserts saved role is strictly USER
        assertEquals(Role.USER, resp.getUser().getRole());
    }

    @Test
    void register_UserAlreadyExists_ThrowsException() {
        RegisterRequest req = RegisterRequest.builder()
                .email("test@example.com")
                .password("password123")
                .fullName("Test User")
                .build();

        when(userRepository.existsByEmail("test@example.com")).thenReturn(true);

        assertThrows(UserAlreadyExistsException.class, () -> authService.register(req));
    }

    @Test
    void login_Successful() {
        LoginRequest req = LoginRequest.builder()
                .email("test@example.com")
                .password("password123")
                .build();

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("password123", "encoded_pass")).thenReturn(true);
        when(jwtUtil.generateToken("test@example.com", "USER")).thenReturn("mocked_jwt");

        AuthResponse resp = authService.login(req);

        assertNotNull(resp);
        assertEquals("mocked_jwt", resp.getJwt());
    }

    @Test
    void login_InvalidPassword_ThrowsException() {
        LoginRequest req = LoginRequest.builder()
                .email("test@example.com")
                .password("wrongpass")
                .build();

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("wrongpass", "encoded_pass")).thenReturn(false);

        assertThrows(InvalidCredentialsException.class, () -> authService.login(req));
    }

    @Test
    void forgotPassword_GeneratesResetToken() {
        ForgotPasswordRequest req = ForgotPasswordRequest.builder()
                .email("test@example.com")
                .build();

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(sampleUser));
        when(jwtUtil.generateResetToken("test@example.com")).thenReturn("reset_token_xyz");

        MessageResponse resp = authService.forgotPassword(req);

        assertNotNull(resp);
        assertTrue(resp.getMessage().contains("If an account exists"));
        verify(jwtUtil).generateResetToken("test@example.com");
    }

    @Test
    void resetPassword_Successful() {
        ResetPasswordRequest req = ResetPasswordRequest.builder()
                .token("valid_token")
                .newPassword("new_password123")
                .build();

        when(jwtUtil.validateResetToken("valid_token")).thenReturn(true);
        when(jwtUtil.extractUsername("valid_token")).thenReturn("test@example.com");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.encode("new_password123")).thenReturn("new_encoded_pass");

        MessageResponse resp = authService.resetPassword(req);

        assertNotNull(resp);
        assertEquals("Password has been successfully updated.", resp.getMessage());
        verify(userRepository).save(sampleUser);
    }
}
