package com.finova.controller;

import com.finova.model.Loan;
import com.finova.service.LoanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * Loan / Debt controller.
 * GET    /api/loans            — list all loans
 * POST   /api/loans            — add a loan
 * DELETE /api/loans/{id}       — delete a loan
 * POST   /api/loans/calculate-emi — calculate EMI
 */
@RestController
@RequestMapping("/api/loans")
@RequiredArgsConstructor
public class LoanController {

    private final LoanService loanService;

    @GetMapping
    public ResponseEntity<List<Loan>> getAll() {
        return ResponseEntity.ok(loanService.getAll());
    }

    @PostMapping
    public ResponseEntity<Loan> create(@RequestBody Loan loan) {
        return ResponseEntity.ok(loanService.create(loan));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        loanService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * EMI calculator endpoint.
     * Request body: { "principal": 500000, "annualRate": 10.5, "tenureMonths": 60 }
     */
    @PostMapping("/calculate-emi")
    public ResponseEntity<Map<String, Object>> calculateEMI(@RequestBody Map<String, Object> request) {
        BigDecimal principal = new BigDecimal(request.get("principal").toString());
        BigDecimal rate = new BigDecimal(request.get("annualRate").toString());
        int tenure = Integer.parseInt(request.get("tenureMonths").toString());

        BigDecimal emi = loanService.calculateEMI(principal, rate, tenure);
        BigDecimal totalPayment = emi.multiply(BigDecimal.valueOf(tenure));
        BigDecimal totalInterest = totalPayment.subtract(principal);

        return ResponseEntity.ok(Map.of(
            "emi", emi,
            "totalPayment", totalPayment,
            "totalInterest", totalInterest,
            "principal", principal
        ));
    }
}
