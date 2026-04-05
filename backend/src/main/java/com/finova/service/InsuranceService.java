package com.finova.service;

import com.finova.model.InsurancePlan;
import com.finova.model.User;
import com.finova.model.UserProfile;
import com.finova.repository.InsurancePlanRepository;
import com.finova.repository.UserProfileRepository;
import com.finova.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

/**
 * InsuranceService — recommends plans based on user's profile.
 * Logic: coverage_needed = monthly_income * 12 * 20 (for life)
 *        plans are matched by age range and income
 */
@Service
@RequiredArgsConstructor
public class InsuranceService {

    private final InsurancePlanRepository planRepo;
    private final UserRepository userRepo;
    private final UserProfileRepository profileRepo;

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepo.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
    }

    /** All plans in DB (admin / browse view) */
    public List<InsurancePlan> getAllPlans() {
        return planRepo.findAll();
    }

    /**
     * Personalised recommendations based on user's profile.
     * Returns top 3 plans per type (LIFE, HEALTH, VEHICLE).
     */
    public Map<String, Object> getRecommendations() {
        User user = getCurrentUser();
        Optional<UserProfile> profileOpt = profileRepo.findByUser(user);

        // Defaults when profile not complete
        int age = 30;
        BigDecimal monthlyIncome = new BigDecimal("50000");

        if (profileOpt.isPresent()) {
            UserProfile p = profileOpt.get();
            if (p.getAge() != null) age = p.getAge();
            if (p.getMonthlyIncome() != null) monthlyIncome = p.getMonthlyIncome();
        }

        BigDecimal annualIncome   = monthlyIncome.multiply(new BigDecimal("12"));
        BigDecimal coverageNeeded = annualIncome.multiply(new BigDecimal("20")); // standard multiplier

        // Fetch suitable plans per type
        List<InsurancePlan> life    = planRepo.findSuitablePlans("LIFE",    age, monthlyIncome);
        List<InsurancePlan> health  = planRepo.findSuitablePlans("HEALTH",  age, monthlyIncome);
        List<InsurancePlan> vehicle = planRepo.findSuitablePlans("VEHICLE", age, monthlyIncome);

        // Premium adjustment for age (older = higher premium)
        double ageMultiplier = 1.0 + Math.max(0, (age - 30)) * 0.025;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("profile", Map.of("age", age, "monthlyIncome", monthlyIncome, "annualIncome", annualIncome));
        result.put("coverageNeeded", coverageNeeded);
        result.put("ageMultiplier", Math.round(ageMultiplier * 100.0) / 100.0);
        result.put("life",    enrichPlans(life.stream().limit(3).toList(), ageMultiplier));
        result.put("health",  enrichPlans(health.stream().limit(3).toList(), ageMultiplier));
        result.put("vehicle", enrichPlans(vehicle.stream().limit(2).toList(), 1.0));
        result.put("bestPlan", findBestPlan(life, health, ageMultiplier));
        return result;
    }

    private List<Map<String, Object>> enrichPlans(List<InsurancePlan> plans, double ageMultiplier) {
        List<Map<String, Object>> result = new ArrayList<>();
        boolean first = true;
        for (InsurancePlan p : plans) {
            BigDecimal adjustedPremium = p.getAnnualPremium()
                .multiply(BigDecimal.valueOf(ageMultiplier))
                .setScale(0, RoundingMode.HALF_UP);
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", p.getId());
            m.put("type", p.getType());
            m.put("company", p.getCompany());
            m.put("name", p.getName());
            m.put("annualPremium", adjustedPremium);
            m.put("monthlyPremium", adjustedPremium.divide(new BigDecimal("12"), 0, RoundingMode.HALF_UP));
            m.put("coverageAmount", p.getCoverageAmount());
            m.put("claimRatio", p.getClaimRatio());
            m.put("benefits", p.getBenefits() != null ? Arrays.asList(p.getBenefits().split("\\|")) : List.of());
            m.put("limitations", p.getLimitations() != null ? Arrays.asList(p.getLimitations().split("\\|")) : List.of());
            m.put("tier", p.getTier());
            m.put("recommended", first); // first in list = top recommended
            first = false;
            result.add(m);
        }
        return result;
    }

    private Map<String, Object> findBestPlan(List<InsurancePlan> life, List<InsurancePlan> health, double ageMultiplier) {
        // Best = highest claim ratio overall
        InsurancePlan best = null;
        for (InsurancePlan p : life) {
            if (best == null || p.getClaimRatio().compareTo(best.getClaimRatio()) > 0) best = p;
        }
        for (InsurancePlan p : health) {
            if (best == null || p.getClaimRatio().compareTo(best.getClaimRatio()) > 0) best = p;
        }
        if (best == null) return Map.of();
        return Map.of(
            "name", best.getName(),
            "company", best.getCompany(),
            "type", best.getType(),
            "claimRatio", best.getClaimRatio(),
            "reason", "Highest claim settlement ratio — most likely to pay when you need it."
        );
    }
}
