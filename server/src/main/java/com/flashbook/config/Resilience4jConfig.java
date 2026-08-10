package com.flashbook.config;

import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Configuration
public class Resilience4jConfig {

    @Bean
    public CommandLineRunner verifyResilience4jConfig(CircuitBreakerRegistry circuitBreakerRegistry) {
        return args -> {
            try {
                CircuitBreaker cb = circuitBreakerRegistry.circuitBreaker("paymentService");
                float failureRateThreshold = cb.getCircuitBreakerConfig().getFailureRateThreshold();
                int slidingWindowSize = cb.getCircuitBreakerConfig().getSlidingWindowSize();
                log.info("Resilience4j 'paymentService' CircuitBreaker verified: failureRateThreshold={}%, slidingWindowSize={}",
                        failureRateThreshold, slidingWindowSize);
            } catch (Exception e) {
                log.warn("Could not verify Resilience4j 'paymentService' CircuitBreaker configuration on startup", e);
            }
        };
    }
}
