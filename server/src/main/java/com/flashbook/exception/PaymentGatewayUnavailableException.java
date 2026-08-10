package com.flashbook.exception;

/**
 * Thrown when the Razorpay payment gateway is temporarily unreachable
 * (circuit-breaker open, retry exhausted, or network error).
 * Mapped to HTTP 503 Service Unavailable by GlobalExceptionHandler.
 */
public class PaymentGatewayUnavailableException extends RuntimeException {
    public PaymentGatewayUnavailableException(String message) {
        super(message);
    }
}
