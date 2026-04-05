package com.finova.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Builder
@NoArgsConstructor
@AllArgsConstructor
/**
 * UserProfile entity.
 * Stores onboarding data collected from the user after first login.
 * Controls isProfileComplete flag used to redirect to onboarding.
 */
@Entity
@Table(name = "user_profiles")
@Data

public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // One-to-one link with User
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    // Monthly gross income entered by user
    @Column(name = "monthly_income", precision = 15, scale = 2)
    private BigDecimal monthlyIncome;

    // SALARIED or FREELANCER
    @Column(name = "job_type", length = 20)
    private String jobType;

    // Total fixed monthly expenses (rent + EMIs combined)
    @Column(name = "fixed_expenses", precision = 15, scale = 2)
    private BigDecimal fixedExpenses;

    // LOW, MEDIUM, HIGH
    @Column(name = "risk_level", length = 10)
    private String riskLevel;

    // Free-text financial goals (e.g., "Buy a house, Retire at 50")
    @Column(name = "goals", length = 500)
    private String goals;

    // User age (for retirement + insurance calculations)
    @Column(name = "age")
    private Integer age;

    // Number of existing loans
    @Column(name = "existing_loans")
    private Integer existingLoans;

    // True once the user has submitted the onboarding form
    @Column(name = "is_profile_complete", nullable = false)
    @Builder.Default
    private Boolean isProfileComplete = false;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
