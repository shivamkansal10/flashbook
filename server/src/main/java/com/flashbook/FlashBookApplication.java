package com.flashbook;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class FlashBookApplication {

    public static void main(String[] args) {
        SpringApplication.run(FlashBookApplication.class, args);
    }
}
