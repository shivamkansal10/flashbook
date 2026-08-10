package com.flashbook.controller;

import io.github.resilience4j.ratelimiter.RateLimiterRegistry;
import com.flashbook.dto.admin.PromoCodeRequest;
import com.flashbook.entity.PromoCode;
import com.flashbook.repository.PromoCodeRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final RateLimiterRegistry rateLimiterRegistry;
    private final PromoCodeRepository promoCodeRepository;

    @GetMapping("/rate-limit-events")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getRateLimitEvents() {
        Map<String, Object> stats = new HashMap<>();
        rateLimiterRegistry.getAllRateLimiters().forEach(rateLimiter -> {
            Map<String, Object> metrics = new HashMap<>();
            metrics.put("availablePermissions", rateLimiter.getMetrics().getAvailablePermissions());
            metrics.put("numberOfWaitingThreads", rateLimiter.getMetrics().getNumberOfWaitingThreads());
            stats.put(rateLimiter.getName(), metrics);
        });

        return ResponseEntity.ok(Map.of(
                "status", "ACTIVE",
                "rateLimiters", stats
        ));
    }

    @PostMapping("/promo-codes")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PromoCode> createPromoCode(@Valid @RequestBody PromoCodeRequest request) {
        if ((request.getDiscountPercent() == null && request.getDiscountAmount() == null) ||
            (request.getDiscountPercent() != null && request.getDiscountAmount() != null)) {
            throw new IllegalArgumentException("Exactly one of discountPercent or discountAmount must be set");
        }

        PromoCode promoCode = PromoCode.builder()
                .code(request.getCode().trim().toUpperCase())
                .discountPercent(request.getDiscountPercent())
                .discountAmount(request.getDiscountAmount())
                .eventId(request.getEventId())
                .active(request.getActive() != null ? request.getActive() : true)
                .expiresAt(request.getExpiresAt())
                .build();

        PromoCode saved = promoCodeRepository.save(promoCode);
        return ResponseEntity.ok(saved);
    }
}
