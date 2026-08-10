package com.flashbook.controller;

import com.flashbook.dto.payment.CreateOrderRequest;
import com.flashbook.dto.payment.CreateOrderResponse;
import com.flashbook.dto.payment.PaymentResponse;
import com.flashbook.dto.payment.VerifyPaymentRequest;
import com.flashbook.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/create-order")
    public ResponseEntity<CreateOrderResponse> createOrder(
            @Valid @RequestBody CreateOrderRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        CreateOrderResponse response = paymentService.createOrder(request, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify")
    public ResponseEntity<PaymentResponse> verifyPayment(
            @Valid @RequestBody VerifyPaymentRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        PaymentResponse response = paymentService.verifyPayment(request, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/webhook")
    public ResponseEntity<Map<String, String>> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("X-Razorpay-Signature") String signature
    ) {
        paymentService.handleWebhook(payload, signature);
        return ResponseEntity.ok(Map.of("status", "success"));
    }
}
