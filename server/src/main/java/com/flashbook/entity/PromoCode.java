package com.flashbook.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "promo_codes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromoCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(name = "discount_percent")
    private Integer discountPercent;

    @Column(name = "discount_amount")
    private Integer discountAmount; // flat amount in paise

    @Column(name = "event_id")
    private Long eventId; // nullable

    @Column(nullable = false)
    private boolean active;

    @Column(name = "expires_at")
    private Instant expiresAt; // nullable
}
