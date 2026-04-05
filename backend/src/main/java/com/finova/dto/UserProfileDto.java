package com.finova.dto;

import lombok.*;
import java.math.BigDecimal;

/**
 * DTO for UserProfile onboarding form.
 * Sent by the frontend when the user completes onboarding.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDto {

    private Long id;

    // Monthly income (e.g., 85000.00)
    private BigDecimal monthlyIncome;

    // "SALARIED" or "FREELANCER"
    private String jobType;

    // Combined fixed monthly expenses: rent + EMIs
    private BigDecimal fixedExpenses;

    // "LOW", "MEDIUM", or "HIGH"
    private String riskLevel;

    // User's financial goals (free text)
    private String goals;

    // User's age
    private Integer age;

    // Number of existing loans
    private Integer existingLoans;

    // Whether the user has completed onboarding
    private Boolean isProfileComplete;
}
