package com.finova.controller;

import com.finova.model.Loan;
import com.finova.service.DebtStrategyService;
import com.finova.service.LoanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * DebtController — loan management + strategy recommendations.
 *
 * GET    /api/debt/strategy?type=AVALANCHE  — enriched loans + strategy
 * GET    /api/loans                          — raw list (existing)
 * POST   /api/loans                          — add loan (existing)
 * DELETE /api/loans/{id}                     — remove loan (existing)
 * POST   /api/loans/calculate-emi            — EMI calculator
 */
@RestController
@RequestMapping("/api/debt")
@RequiredArgsConstructor
public class DebtController {

    private final DebtStrategyService strategyService;
    private final LoanService loanService;

    @GetMapping("/strategy")
    public ResponseEntity<Map<String, Object>> getStrategy(
        @RequestParam(defaultValue = "AVALANCHE") String type
    ) {
        return ResponseEntity.ok(strategyService.getStrategy(type));
    }

    // ── Loan CRUD (delegates to existing LoanService) ──────────────────────

    @GetMapping("/loans")
    public ResponseEntity<List<Loan>> getLoans() {
        return ResponseEntity.ok(loanService.getAll());
    }

    @PostMapping("/loans")
    public ResponseEntity<Loan> addLoan(@RequestBody Loan loan) {
        return ResponseEntity.ok(loanService.create(loan));
    }

    @DeleteMapping("/loans/{id}")
    public ResponseEntity<Void> deleteLoan(@PathVariable Long id) {
        loanService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/loans/calculate-emi")
    public ResponseEntity<Map<String, Object>> calcEMI(@RequestBody Map<String, Object> body) {
        BigDecimal principal = new BigDecimal(body.get("principal").toString());
        BigDecimal rate      = new BigDecimal(body.get("annualRate").toString());
        int tenure           = Integer.parseInt(body.get("tenureMonths").toString());
        BigDecimal emi       = strategyService.calcEMI(principal, rate, tenure);
        BigDecimal total     = emi.multiply(BigDecimal.valueOf(tenure)).setScale(2, java.math.RoundingMode.HALF_UP);
        BigDecimal interest  = total.subtract(principal).setScale(2, java.math.RoundingMode.HALF_UP);
        return ResponseEntity.ok(Map.of("emi", emi, "totalPayable", total, "totalInterest", interest));
    }
}
