package com.flashbook.service;

import com.flashbook.dto.booking.BookingResponse;
import com.flashbook.dto.payment.CreateOrderRequest;
import com.flashbook.dto.payment.CreateOrderResponse;
import com.flashbook.dto.payment.PaymentResponse;
import com.flashbook.dto.payment.VerifyPaymentRequest;
import com.flashbook.entity.Booking;
import com.flashbook.entity.BookingStatus;
import com.flashbook.entity.Payment;
import com.flashbook.entity.PaymentStatus;
import com.flashbook.entity.Seat;
import com.flashbook.exception.BookingNotFoundException;
import com.flashbook.exception.PaymentGatewayUnavailableException;
import com.flashbook.exception.PaymentVerificationException;
import com.flashbook.exception.UnauthorizedAccessException;
import com.flashbook.repository.BookingRepository;
import com.flashbook.repository.PaymentRepository;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.Utils;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final BookingService bookingService;

    @Value("${razorpay.key-id:rzp_test_placeholder}")
    private String keyId;

    @Value("${razorpay.key-secret:placeholder_secret}")
    private String keySecret;

    @Value("${razorpay.webhook-secret:placeholder_webhook_secret}")
    private String webhookSecret;

    @Transactional
    @CircuitBreaker(name = "paymentService", fallbackMethod = "createOrderFallback")
    @Retry(name = "paymentService")
    public CreateOrderResponse createOrder(CreateOrderRequest request, String userEmail) {
        log.info("Creating Razorpay order for bookingId: {} by user: '{}'", request.getBookingId(), userEmail);

        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new BookingNotFoundException("Booking not found with id: " + request.getBookingId()));

        if (!booking.getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new UnauthorizedAccessException("User is not authorized to create payment for this booking");
        }

        if (booking.getStatus() != BookingStatus.HELD) {
            throw new PaymentVerificationException("Cannot create payment order for booking with status: " + booking.getStatus());
        }

        BigDecimal totalAmount = booking.getSeats().stream()
                .map(Seat::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long amountInPaise = totalAmount.multiply(BigDecimal.valueOf(100)).longValue();

        // Idempotency: Reuse existing Razorpay order if booking.payment already exists
        Optional<Payment> existingPayment = paymentRepository.findByBookingId(booking.getId());
        if (existingPayment.isPresent()) {
            log.info("Idempotent hit: Reusing existing payment order for bookingId: {}, razorpayOrderId: {}",
                    booking.getId(), existingPayment.get().getRazorpayOrderId());
            return CreateOrderResponse.builder()
                    .razorpayOrderId(existingPayment.get().getRazorpayOrderId())
                    .amount(amountInPaise)
                    .currency("INR")
                    .keyId(keyId)
                    .build();
        }

        String razorpayOrderId;
        try {
            RazorpayClient razorpayClient = new RazorpayClient(keyId, keySecret);
            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", booking.getIdempotencyKey());

            Order order = razorpayClient.orders.create(orderRequest);
            razorpayOrderId = order.get("id");
        } catch (Exception e) {
            log.error("Failed to create Razorpay order via API", e);
            throw new PaymentVerificationException("Failed to create Razorpay order: " + e.getMessage());
        }

        Payment payment = Payment.builder()
                .booking(booking)
                .amount(totalAmount)
                .razorpayOrderId(razorpayOrderId)
                .status(PaymentStatus.CREATED)
                .build();

        paymentRepository.save(payment);
        log.info("Successfully created Razorpay order: {} for bookingId: {}", razorpayOrderId, booking.getId());

        return CreateOrderResponse.builder()
                .razorpayOrderId(razorpayOrderId)
                .amount(amountInPaise)
                .currency("INR")
                .keyId(keyId)
                .build();
    }

    public CreateOrderResponse createOrderFallback(CreateOrderRequest request, String userEmail, Throwable t) {
        log.error("[Circuit-Breaker/Fallback] Payment order creation failed for bookingId: {} — cause: {}",
                request.getBookingId(), t.getMessage());
        throw new PaymentGatewayUnavailableException(
                "Payment gateway is temporarily unavailable. Please try again in a few moments.");
    }

    @Transactional
    public PaymentResponse verifyPayment(VerifyPaymentRequest request, String userEmail) {
        log.info("Verifying Razorpay payment for orderId: {} by user: '{}'", request.getRazorpayOrderId(), userEmail);

        Payment payment = paymentRepository.findByRazorpayOrderId(request.getRazorpayOrderId())
                .orElseThrow(() -> new PaymentVerificationException("Payment record not found for orderId: " + request.getRazorpayOrderId()));

        Booking booking = payment.getBooking();
        if (!booking.getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new UnauthorizedAccessException("User is not authorized to verify this payment");
        }

        boolean isValid = verifySignature(
                request.getRazorpayOrderId(),
                request.getRazorpayPaymentId(),
                request.getRazorpaySignature()
        );

        if (!isValid) {
            log.warn("Possible payment tampering attempt! Signature mismatch for orderId: {}", request.getRazorpayOrderId());
            payment.setStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
            throw new PaymentVerificationException("Payment verification failed: signature mismatch");
        }

        payment.setRazorpayPaymentId(request.getRazorpayPaymentId());
        payment.setStatus(PaymentStatus.SUCCESS);
        paymentRepository.save(payment);

        // Flip booking to CONFIRMED and seats to SOLD
        BookingResponse confirmedBooking = bookingService.confirmBooking(booking.getId(), userEmail);
        log.info("Payment verified and booking confirmed successfully for bookingId: {}", booking.getId());

        return PaymentResponse.builder()
                .bookingId(booking.getId())
                .status(PaymentStatus.SUCCESS)
                .message("Payment verified, booking confirmed")
                .build();
    }

    @Transactional
    public void handleWebhook(String payload, String signatureHeader) {
        log.info("Handling Razorpay webhook callback");

        try {
            boolean isValid = Utils.verifyWebhookSignature(payload, signatureHeader, webhookSecret);
            if (!isValid) {
                log.warn("Invalid Razorpay webhook signature");
                throw new PaymentVerificationException("Invalid webhook signature");
            }

            JSONObject event = new JSONObject(payload);
            String eventName = event.optString("event");
            log.info("Razorpay webhook event received: {}", eventName);

            JSONObject payloadObj = event.optJSONObject("payload");
            if (payloadObj != null && payloadObj.has("payment")) {
                JSONObject paymentEntity = payloadObj.getJSONObject("payment").getJSONObject("entity");
                String orderId = paymentEntity.optString("order_id");

                if (orderId != null && !orderId.isBlank()) {
                    paymentRepository.findByRazorpayOrderId(orderId).ifPresent(payment -> {
                        if ("payment.captured".equals(eventName)) {
                            payment.setStatus(PaymentStatus.SUCCESS);
                            paymentRepository.save(payment);
                            log.info("Updated payment status to SUCCESS via webhook for orderId: {}", orderId);
                        } else if ("payment.failed".equals(eventName)) {
                            payment.setStatus(PaymentStatus.FAILED);
                            paymentRepository.save(payment);
                            log.info("Updated payment status to FAILED via webhook for orderId: {}", orderId);
                        }
                    });
                }
            }
        } catch (Exception e) {
            log.error("Error processing Razorpay webhook", e);
        }
    }

    public boolean verifySignature(String orderId, String paymentId, String signature) {
        try {
            String payload = orderId + "|" + paymentId;
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(keySecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));

            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }

            return MessageDigest.isEqual(
                    hexString.toString().getBytes(StandardCharsets.UTF_8),
                    signature.getBytes(StandardCharsets.UTF_8)
            );
        } catch (Exception e) {
            log.error("Error computing signature verification", e);
            return false;
        }
    }
}
