package com.flashbook.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilTest {

    private JwtUtil jwtUtil;
    private UserDetails userDetails;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "jwtSecret", "9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e");
        ReflectionTestUtils.setField(jwtUtil, "jwtExpirationMs", 3600000L);

        userDetails = new User("test@example.com", "password", Collections.emptyList());
    }

    @Test
    void validateToken_WithNormalToken_ReturnsTrue() {
        String token = jwtUtil.generateToken("test@example.com", "USER");
        assertTrue(jwtUtil.validateToken(token, userDetails));
    }

    @Test
    void validateToken_WithResetToken_ReturnsFalse() {
        String token = jwtUtil.generateResetToken("test@example.com");
        assertFalse(jwtUtil.validateToken(token, userDetails));
    }

    @Test
    void validateResetToken_WithResetToken_ReturnsTrue() {
        String token = jwtUtil.generateResetToken("test@example.com");
        assertTrue(jwtUtil.validateResetToken(token));
    }

    @Test
    void validateResetToken_WithNormalToken_ReturnsFalse() {
        String token = jwtUtil.generateToken("test@example.com", "USER");
        assertFalse(jwtUtil.validateResetToken(token));
    }
}
