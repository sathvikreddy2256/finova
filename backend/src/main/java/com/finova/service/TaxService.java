package com.finova.service;

import com.finova.model.User;
import com.finova.model.UserProfile;
import com.finova.repository.UserProfileRepository;
import com.finova.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * TaxService — Indian income tax calculation (FY 2024-25).
 * Reads actual income from UserProfile (no hardcoded values).
 */
@Service
@RequiredArgsConstructor
public class TaxService {

    private final UserRepository userRepo;
    private final UserProfileRepository profileRepo;

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepo.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
    }

    /**
     * Calculate tax for both regimes given an annual income and deductions.
     *
     * @param annualIncome  Gross annual income in INR
     * @param deduction80C  Section 80C investments (max ₹1,50,000)
     * @param deduction80D  Section 80D health insurance premium
     * @param deductionHL   Section 24B home loan interest (max ₹2,00,000)
     * @param nps           Section 80CCD(1B) NPS (max ₹50,000)
     */
    public Map<String, Object> calculate(
        BigDecimal annualIncome,
        BigDecimal deduction80C,
        BigDecimal deduction80D,
        BigDecimal deductionHL,
        BigDecimal nps
    ) {
        // ── Old Regime ───────────────────────────────────────────────────────
        BigDecimal cap80C = deduction80C.min(new BigDecimal("150000"));
        BigDecimal totalDeductions = cap80C
            .add(deduction80D)
            .add(deductionHL.min(new BigDecimal("200000")))
            .add(nps.min(new BigDecimal("50000")))
            .add(new BigDecimal("50000")); // Standard deduction old regime

        BigDecimal taxableOld = annualIncome.subtract(totalDeductions).max(BigDecimal.ZERO);
        BigDecimal rawOldTax  = computeOldRegimeTax(taxableOld);
        BigDecimal oldTax     = rawOldTax.multiply(new BigDecimal("1.04")).setScale(0, RoundingMode.HALF_UP); // 4% cess

        // ── New Regime ───────────────────────────────────────────────────────
        BigDecimal stdNew     = new BigDecimal("75000"); // Standard deduction new regime FY24-25
        BigDecimal taxableNew = annualIncome.subtract(stdNew).max(BigDecimal.ZERO);
        BigDecimal rawNewTax  = computeNewRegimeTax(taxableNew);
        BigDecimal newTax     = rawNewTax.multiply(new BigDecimal("1.04")).setScale(0, RoundingMode.HALF_UP);

        // ── Recommendation ───────────────────────────────────────────────────
        String recommended = oldTax.compareTo(newTax) <= 0 ? "OLD" : "NEW";
        BigDecimal savings = oldTax.subtract(newTax).abs();

        // ── How much more to invest in 80C to save more tax ──────────────────
        BigDecimal remaining80C = new BigDecimal("150000").subtract(cap80C).max(BigDecimal.ZERO);
        BigDecimal taxSavingFromMore80C = remaining80C.multiply(taxRateForIncome(taxableOld))
                                                      .multiply(new BigDecimal("1.04"))
                                                      .setScale(0, RoundingMode.HALF_UP);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("annualIncome", annualIncome);
        result.put("oldRegime", Map.of(
            "taxableIncome", taxableOld,
            "tax", oldTax,
            "totalDeductions", totalDeductions,
            "breakdown", Map.of(
                "upto250k", "Nil",
                "250k-500k", "5%",
                "500k-10L", "20%",
                "above10L", "30%"
            )
        ));
        result.put("newRegime", Map.of(
            "taxableIncome", taxableNew,
            "tax", newTax,
            "standardDeduction", stdNew,
            "breakdown", Map.of(
                "upto300k", "Nil",
                "300k-700k", "5%",
                "700k-10L", "10%",
                "10L-12L", "15%",
                "12L-15L", "20%",
                "above15L", "30%"
            )
        ));
        result.put("recommended", recommended);
        result.put("taxSaved", savings);
        result.put("remaining80CInvestment", remaining80C);
        result.put("potentialSavingFrom80C", taxSavingFromMore80C);
        result.put("monthlyTaxOld", oldTax.divide(new BigDecimal("12"), 0, RoundingMode.HALF_UP));
        result.put("monthlyTaxNew", newTax.divide(new BigDecimal("12"), 0, RoundingMode.HALF_UP));
        return result;
    }

    /** Convenience method: pre-fill from user's profile income */
    public BigDecimal getProfileAnnualIncome() {
        User user = getCurrentUser();
        return profileRepo.findByUser(user)
            .map(p -> p.getMonthlyIncome() != null
                ? p.getMonthlyIncome().multiply(new BigDecimal("12"))
                : BigDecimal.ZERO)
            .orElse(BigDecimal.ZERO);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private BigDecimal computeOldRegimeTax(BigDecimal income) {
        if (income.compareTo(new BigDecimal("250000")) <= 0) return BigDecimal.ZERO;
        if (income.compareTo(new BigDecimal("500000")) <= 0)
            return income.subtract(new BigDecimal("250000")).multiply(new BigDecimal("0.05"));
        if (income.compareTo(new BigDecimal("1000000")) <= 0)
            return new BigDecimal("12500")
                .add(income.subtract(new BigDecimal("500000")).multiply(new BigDecimal("0.20")));
        return new BigDecimal("112500")
            .add(income.subtract(new BigDecimal("1000000")).multiply(new BigDecimal("0.30")));
    }

    private BigDecimal computeNewRegimeTax(BigDecimal income) {
        if (income.compareTo(new BigDecimal("300000")) <= 0) return BigDecimal.ZERO;
        if (income.compareTo(new BigDecimal("700000")) <= 0)
            return income.subtract(new BigDecimal("300000")).multiply(new BigDecimal("0.05"));
        if (income.compareTo(new BigDecimal("1000000")) <= 0)
            return new BigDecimal("20000")
                .add(income.subtract(new BigDecimal("700000")).multiply(new BigDecimal("0.10")));
        if (income.compareTo(new BigDecimal("1200000")) <= 0)
            return new BigDecimal("50000")
                .add(income.subtract(new BigDecimal("1000000")).multiply(new BigDecimal("0.15")));
        if (income.compareTo(new BigDecimal("1500000")) <= 0)
            return new BigDecimal("80000")
                .add(income.subtract(new BigDecimal("1200000")).multiply(new BigDecimal("0.20")));
        return new BigDecimal("140000")
            .add(income.subtract(new BigDecimal("1500000")).multiply(new BigDecimal("0.30")));
    }

    /** Marginal tax rate for 80C savings suggestion */
    private BigDecimal taxRateForIncome(BigDecimal income) {
        if (income.compareTo(new BigDecimal("250000")) <= 0) return BigDecimal.ZERO;
        if (income.compareTo(new BigDecimal("500000")) <= 0) return new BigDecimal("0.05");
        if (income.compareTo(new BigDecimal("1000000")) <= 0) return new BigDecimal("0.20");
        return new BigDecimal("0.30");
    }
}
