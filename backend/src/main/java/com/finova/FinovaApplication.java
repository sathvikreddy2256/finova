package com.finova;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Finova — Your financial life, intelligently automated.
 * Main Spring Boot application entry point.
 */
@SpringBootApplication
public class FinovaApplication {
    public static void main(String[] args) {
        SpringApplication.run(FinovaApplication.class, args);
        System.out.println("\n======================================");
        System.out.println("  Finova Backend started on :8080  ");
        System.out.println("======================================\n");
    }
}
