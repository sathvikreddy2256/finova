package com.finova.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;


@Builder
@NoArgsConstructor
@AllArgsConstructor

/**
 * InsurancePlan — plans stored in the DB, seeded once.
 * Used by the recommendation engine to match against user profile.
 */
@Entity
@Table(name = "insurance_plans")
@Data

public class InsurancePlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** LIFE, HEALTH, VEHICLE */
    @Column(nullable = false, length = 20)
    private String type;

    /** Company name */
    @Column(nullable = false, length = 100)
    private String company;

    /** Plan name */
    @Column(nullable = false, length = 150)
    private String name;

    /** Annual premium estimate (base, actual varies by age/sum) */
    @Column(name = "annual_premium", precision = 12, scale = 2)
    private BigDecimal annualPremium;

    /** Coverage amount in INR */
    @Column(name = "coverage_amount", precision = 15, scale = 2)
    private BigDecimal coverageAmount;

    /** Claim settlement ratio % e.g. 98.5 */
    @Column(name = "claim_ratio", precision = 5, scale = 2)
    private BigDecimal claimRatio;

    /** JSON-style comma-separated advantages */
    @Column(length = 500)
    private String benefits;

    /** Comma-separated limitations */
    @Column(length = 500)
    private String limitations;

    /** Minimum age for eligibility */
    @Column(name = "min_age")
    private Integer minAge;

    /** Maximum age for eligibility */
    @Column(name = "max_age")
    private Integer maxAge;

    /** Minimum income for suitability (monthly, INR) */
    @Column(name = "min_income", precision = 12, scale = 2)
    private BigDecimal minIncome;

    /** "BEST_VALUE", "PREMIUM", "BASIC" */
    @Column(length = 20)
    private String tier;
}
