package com.flashbook.dto.payment;

import com.flashbook.entity.PaymentStatus;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentResponse {

    private Long bookingId;
    private PaymentStatus status;
    private String message;
}
