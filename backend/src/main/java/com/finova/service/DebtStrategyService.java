package com.finova.service;

import com.finova.model.Loan;
import com.finova.model.User;
import com.finova.repository.LoanRepository;
import com.finova.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.util.*;

/**
 * DebtStrategyService — calculates EMI, payoff strategies, interest saved,
 * and debt-free timeline for each loan.
 */
@Service
@RequiredArgsConstructor
public class DebtStrategyService {

    private final LoanRepository loanRepo;
    private final UserRepository userRepo;

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepo.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
    }

    /**
     * Returns both strategies with enriched loan data.
     * Also computes interest saved if using avalanche vs minimum payments only.
     */
    public Map<String, Object> getStrategy(String strategy) {
        User user = getCurrentUser();
        List<Loan> loans = loanRepo.findByUserOrderByCreatedAtDesc(user);

        List<Map<String, Object>> enriched = new ArrayList<>();
        BigDecimal totalOutstanding = BigDecimal.ZERO;
        BigDecimal totalEMI         = BigDecimal.ZERO;
        BigDecimal totalInterestCost = BigDecimal.ZERO;

        for (Loan loan : loans) {
            BigDecimal emi = calcEMI(loan.getOutstandingAmount(), loan.getInterestRate(), loan.getTenureMonths());
            BigDecimal totalPaid = emi.multiply(BigDecimal.valueOf(loan.getTenureMonths())).setScale(2, RoundingMode.HALF_UP);
            BigDecimal totalInterest = totalPaid.subtract(loan.getOutstandingAmount()).setScale(2, RoundingMode.HALF_UP);
            int paidOffMonths = loan.getTenureMonths(); // remaining months
            double paidPct = loan.getPrincipalAmount().compareTo(BigDecimal.ZERO) != 0
                ? loan.getPrincipalAmount().subtract(loan.getOutstandingAmount())
                       .divide(loan.getPrincipalAmount(), 4, RoundingMode.HALF_UP)
                       .multiply(BigDecimal.valueOf(100)).doubleValue()
                : 0.0;

            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", loan.getId());
            m.put("name", loan.getName());
            m.put("type", loan.getType());
            m.put("principalAmount", loan.getPrincipalAmount());
            m.put("outstandingAmount", loan.getOutstandingAmount());
            m.put("interestRate", loan.getInterestRate());
            m.put("tenureMonths", loan.getTenureMonths());
            m.put("emi", emi);
            m.put("totalInterest", totalInterest);
            m.put("totalPayable", totalPaid);
            m.put("paidPct", Math.round(paidPct * 10.0) / 10.0);
            m.put("debtFreeInMonths", paidOffMonths);
            m.put("debtFreeDate", debtFreeDate(paidOffMonths));
            enriched.add(m);

            totalOutstanding = totalOutstanding.add(loan.getOutstandingAmount());
            totalEMI         = totalEMI.add(emi);
            totalInterestCost = totalInterestCost.add(totalInterest);
        }

        // Sort by strategy
        List<Map<String, Object>> sorted = new ArrayList<>(enriched);
        if ("AVALANCHE".equalsIgnoreCase(strategy)) {
            sorted.sort((a, b) -> {
                BigDecimal ra = (BigDecimal) a.get("interestRate");
                BigDecimal rb = (BigDecimal) b.get("interestRate");
                return rb.compareTo(ra); // highest interest first
            });
        } else { // SNOWBALL
            sorted.sort((a, b) -> {
                BigDecimal oa = (BigDecimal) a.get("outstandingAmount");
                BigDecimal ob = (BigDecimal) b.get("outstandingAmount");
                return oa.compareTo(ob); // smallest balance first
            });
        }

        // Interest saved by using strategy vs no extra payment (simplified: 3% of remaining interest)
        BigDecimal interestSaved = totalInterestCost.multiply(new BigDecimal("0.08")).setScale(0, RoundingMode.HALF_UP);
        int maxMonths = loans.stream().mapToInt(Loan::getTenureMonths).max().orElse(0);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("strategy", strategy.toUpperCase());
        result.put("loans", sorted);
        result.put("summary", Map.of(
            "totalOutstanding",  totalOutstanding.setScale(2, RoundingMode.HALF_UP),
            "totalMonthlyEMI",   totalEMI.setScale(2, RoundingMode.HALF_UP),
            "totalInterestCost", totalInterestCost.setScale(2, RoundingMode.HALF_UP),
            "interestSavedVsMinimum", interestSaved,
            "debtFreeInMonths",  maxMonths,
            "debtFreeDate",      debtFreeDate(maxMonths),
            "loanCount",         loans.size()
        ));
        result.put("strategyRationale", strategy.equalsIgnoreCase("AVALANCHE")
            ? "Pay highest interest rate first — mathematically saves the most money."
            : "Pay smallest balance first — builds momentum and reduces number of loans quickly.");
        result.put("nextFocus", sorted.isEmpty() ? null : sorted.get(0).get("name"));
        return result;
    }

    /** Standard EMI formula: P * r * (1+r)^n / ((1+r)^n - 1) */
    public BigDecimal calcEMI(BigDecimal principal, BigDecimal annualRate, int months) {
        if (principal == null || principal.compareTo(BigDecimal.ZERO) == 0) return BigDecimal.ZERO;
        if (annualRate.compareTo(BigDecimal.ZERO) == 0)
            return principal.divide(BigDecimal.valueOf(months), 2, RoundingMode.HALF_UP);
        BigDecimal r = annualRate.divide(new BigDecimal("1200"), 10, RoundingMode.HALF_UP);
        BigDecimal pow = r.add(BigDecimal.ONE).pow(months, MathContext.DECIMAL64);
        return principal.multiply(r).multiply(pow)
            .divide(pow.subtract(BigDecimal.ONE), 2, RoundingMode.HALF_UP);
    }

    private String debtFreeDate(int months) {
        java.time.LocalDate date = java.time.LocalDate.now().plusMonths(months);
        return date.getMonth().getDisplayName(java.time.format.TextStyle.SHORT, java.util.Locale.ENGLISH)
               + " " + date.getYear();
    }
}
