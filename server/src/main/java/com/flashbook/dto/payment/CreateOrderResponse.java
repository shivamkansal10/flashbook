package com.flashbook.dto.payment;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateOrderResponse {

    private String razorpayOrderId;
    private Long amount; // in paise
    private String currency;
    private String keyId;
}
