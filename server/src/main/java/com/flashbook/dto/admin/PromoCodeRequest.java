package com.flashbook.dto.admin;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromoCodeRequest {

    @NotBlank(message = "Promo code is required")
    private String code;

    private Integer discountPercent;

    private Integer discountAmount; // flat amount in paise

    private Long eventId; // nullable

    private Boolean active;

    private Instant expiresAt; // nullable
}
