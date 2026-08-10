package com.flashbook.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;
import com.flashbook.exception.PaymentGatewayUnavailableException;
import com.flashbook.exception.RateLimitedException;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RateLimitedException.class)
    public ResponseEntity<Map<String, String>> handleRateLimited(RateLimitedException ex) {
        Map<String, String> response = new HashMap<>();
        response.put("error", "TOO_MANY_REQUESTS");
        response.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(response);
    }

    @ExceptionHandler(UserAlreadyExistsException.class)
    public ResponseEntity<Map<String, String>> handleUserAlreadyExists(UserAlreadyExistsException ex) {
        Map<String, String> response = new HashMap<>();
        response.put("error", "USER_ALREADY_EXISTS");
        response.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<Map<String, String>> handleInvalidCredentials(InvalidCredentialsException ex) {
        Map<String, String> response = new HashMap<>();
        response.put("error", "INVALID_CREDENTIALS");
        response.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    @ExceptionHandler(InvalidTokenException.class)
    public ResponseEntity<Map<String, String>> handleInvalidToken(InvalidTokenException ex) {
        Map<String, String> response = new HashMap<>();
        response.put("error", "INVALID_TOKEN");
        response.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(SeatUnavailableException.class)
    public ResponseEntity<Map<String, String>> handleSeatUnavailable(SeatUnavailableException ex) {
        Map<String, String> response = new HashMap<>();
        response.put("error", "SEAT_UNAVAILABLE");
        response.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    @ExceptionHandler(BookingNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleBookingNotFound(BookingNotFoundException ex) {
        Map<String, String> response = new HashMap<>();
        response.put("error", "BOOKING_NOT_FOUND");
        response.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(EventNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleEventNotFound(EventNotFoundException ex) {
        Map<String, String> response = new HashMap<>();
        response.put("error", "EVENT_NOT_FOUND");
        response.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(VenueNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleVenueNotFound(VenueNotFoundException ex) {
        Map<String, String> response = new HashMap<>();
        response.put("error", "VENUE_NOT_FOUND");
        response.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleUserNotFound(UserNotFoundException ex) {
        Map<String, String> response = new HashMap<>();
        response.put("error", "USER_NOT_FOUND");
        response.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(UnauthorizedAccessException.class)
    public ResponseEntity<Map<String, String>> handleUnauthorizedAccess(UnauthorizedAccessException ex) {
        Map<String, String> response = new HashMap<>();
        response.put("error", "UNAUTHORIZED_ACCESS");
        response.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    @ExceptionHandler(PaymentVerificationException.class)
    public ResponseEntity<Map<String, String>> handlePaymentVerification(PaymentVerificationException ex) {
        Map<String, String> response = new HashMap<>();
        response.put("error", "PAYMENT_VERIFICATION_FAILED");
        response.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(PaymentGatewayUnavailableException.class)
    public ResponseEntity<Map<String, String>> handlePaymentGatewayUnavailable(PaymentGatewayUnavailableException ex) {
        Map<String, String> response = new HashMap<>();
        response.put("error", "PAYMENT_GATEWAY_UNAVAILABLE");
        response.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        Map<String, Object> response = new HashMap<>();
        response.put("error", "VALIDATION_FAILED");
        response.put("details", errors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(PromoCodeException.class)
    public ResponseEntity<Map<String, String>> handlePromoCodeException(PromoCodeException ex) {
        Map<String, String> response = new HashMap<>();
        response.put("error", "INVALID_PROMO_CODE");
        response.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(InvalidEventStateException.class)
    public ResponseEntity<Map<String, String>> handleInvalidEventState(InvalidEventStateException ex) {
        Map<String, String> response = new HashMap<>();
        response.put("error", "INVALID_EVENT_STATE");
        response.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    @ExceptionHandler(InvalidBookingStateException.class)
    public ResponseEntity<Map<String, String>> handleInvalidBookingState(InvalidBookingStateException ex) {
        Map<String, String> response = new HashMap<>();
        response.put("error", "INVALID_BOOKING_STATE");
        response.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGenericException(Exception ex) {
        log.error("An unexpected error occurred", ex); // Log full stack trace server-side
        Map<String, String> response = new HashMap<>();
        response.put("error", "INTERNAL_SERVER_ERROR");
        response.put("message", "An unexpected error occurred. Please try again later.");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
