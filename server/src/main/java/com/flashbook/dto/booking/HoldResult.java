package com.flashbook.dto.booking;

import java.time.Instant;

public record HoldResult(
    String holdKey,
    Instant expiresAt
) {}
