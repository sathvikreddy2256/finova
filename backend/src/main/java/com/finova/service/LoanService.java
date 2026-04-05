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
import java.util.List;

@Service
@RequiredArgsConstructor
public class LoanService {

    private final LoanRepository loanRepository;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public Loan create(Loan loan) {
        loan.setUser(getCurrentUser());
        return loanRepository.save(loan);
    }

    public List<Loan> getAll() {
        return loanRepository.findByUserOrderByCreatedAtDesc(getCurrentUser());
    }

    public void delete(Long id) {
        User user = getCurrentUser();
        Loan loan = loanRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Loan not found"));
        if (!loan.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }
        loanRepository.delete(loan);
    }

    /**
     * EMI formula: P * r * (1+r)^n / ((1+r)^n - 1)
     * where r = monthly interest rate, n = tenure in months
     */
    public BigDecimal calculateEMI(BigDecimal principal, BigDecimal annualRate, int tenureMonths) {
        if (annualRate.compareTo(BigDecimal.ZERO) == 0) {
            return principal.divide(BigDecimal.valueOf(tenureMonths), 2, RoundingMode.HALF_UP);
        }
        BigDecimal r = annualRate.divide(BigDecimal.valueOf(1200), 10, RoundingMode.HALF_UP);
        BigDecimal onePlusR = BigDecimal.ONE.add(r);
        BigDecimal onePlusRPowN = onePlusR.pow(tenureMonths, MathContext.DECIMAL64);
        BigDecimal numerator = principal.multiply(r).multiply(onePlusRPowN);
        BigDecimal denominator = onePlusRPowN.subtract(BigDecimal.ONE);
        return numerator.divide(denominator, 2, RoundingMode.HALF_UP);
    }
}
