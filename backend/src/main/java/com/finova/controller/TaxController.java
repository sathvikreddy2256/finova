package com.finova.controller;

import com.finova.service.TaxService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.Map;

/**
 * TaxController — Indian income tax calculation.
 *
 * GET  /api/tax/profile-income  — returns user's annual income from profile
 * POST /api/tax/calculate       — calculate old + new regime tax
 */
@RestController
@RequestMapping("/api/tax")
@RequiredArgsConstructor
public class TaxController {

    private final TaxService taxService;

    @GetMapping("/profile-income")
    public ResponseEntity<Map<String, Object>> getProfileIncome() {
        BigDecimal annual = taxService.getProfileAnnualIncome();
        return ResponseEntity.ok(Map.of(
            "annualIncome", annual,
            "monthlyIncome", annual.compareTo(BigDecimal.ZERO) != 0
                ? annual.divide(new BigDecimal("12"), 2, java.math.RoundingMode.HALF_UP)
                : BigDecimal.ZERO
        ));
    }

    /**
     * Body: {
     *   "annualIncome": 1200000,
     *   "deduction80C": 150000,
     *   "deduction80D": 25000,
     *   "deductionHL": 0,
     *   "nps": 50000
     * }
     */
    @PostMapping("/calculate")
    public ResponseEntity<Map<String, Object>> calculate(@RequestBody Map<String, Object> body) {
        BigDecimal income   = new BigDecimal(body.getOrDefault("annualIncome", "0").toString());
        BigDecimal d80C     = new BigDecimal(body.getOrDefault("deduction80C", "0").toString());
        BigDecimal d80D     = new BigDecimal(body.getOrDefault("deduction80D", "0").toString());
        BigDecimal dHL      = new BigDecimal(body.getOrDefault("deductionHL", "0").toString());
        BigDecimal nps      = new BigDecimal(body.getOrDefault("nps", "0").toString());
        return ResponseEntity.ok(taxService.calculate(income, d80C, d80D, dHL, nps));
    }
}
