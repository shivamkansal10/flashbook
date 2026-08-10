package com.flashbook.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Validates Razorpay configuration at startup and emits a clear WARNING
 * if the placeholder values are still in use — so misconfiguration is
 * immediately obvious in the logs rather than failing silently on the
 * first payment request.
 */
@Slf4j
@Component
public class RazorpayConfigValidator {

    @Value("${razorpay.key-id:rzp_test_placeholder}")
    private String keyId;

    @Value("${razorpay.key-secret:placeholder_secret}")
    private String keySecret;

    @Value("${razorpay.webhook-secret:placeholder_webhook_secret}")
    private String webhookSecret;

    @EventListener(ApplicationReadyEvent.class)
    public void validateOnStartup() {
        boolean keyIdPlaceholder    = "rzp_test_placeholder".equals(keyId);
        boolean keySecretPlaceholder = "placeholder_secret".equals(keySecret);
        boolean webhookPlaceholder  = "placeholder_webhook_secret".equals(webhookSecret);

        if (keyIdPlaceholder || keySecretPlaceholder || webhookPlaceholder) {
            log.warn("=============================================================");
            log.warn("  ⚠  RAZORPAY MISCONFIGURATION DETECTED");
            log.warn("=============================================================");
            if (keyIdPlaceholder)
                log.warn("  razorpay.key-id     → still using PLACEHOLDER value");
            if (keySecretPlaceholder)
                log.warn("  razorpay.key-secret → still using PLACEHOLDER value");
            if (webhookPlaceholder)
                log.warn("  razorpay.webhook-secret → still using PLACEHOLDER value");
            log.warn("  Set RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET / RAZORPAY_WEBHOOK_SECRET");
            log.warn("  as environment variables (or in server/.env) before starting.");
            log.warn("  Payment creation will FAIL until real keys are provided.");
            log.warn("=============================================================");
        } else {
            log.info("=============================================================");
            log.info("  ✅  Razorpay configured with REAL keys (key-id: {}...)",
                    keyId.substring(0, Math.min(keyId.length(), 20)));
            log.info("=============================================================");
        }
    }
}
