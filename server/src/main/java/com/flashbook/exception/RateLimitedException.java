package com.flashbook.exception;

public class RateLimitedException extends RuntimeException {
    public RateLimitedException(String message) {
        super(message);
    }
}
