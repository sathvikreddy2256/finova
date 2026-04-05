package com.finova.service;

import com.finova.model.Investment;
import com.finova.model.User;
import com.finova.repository.InvestmentRepository;
import com.finova.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InvestmentService {

    private final InvestmentRepository investmentRepository;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public Investment create(Investment investment) {
        investment.setUser(getCurrentUser());
        return investmentRepository.save(investment);
    }

    public List<Investment> getAll() {
        return investmentRepository.findByUserOrderByCreatedAtDesc(getCurrentUser());
    }

    public void delete(Long id) {
        User user = getCurrentUser();
        Investment inv = investmentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Investment not found"));
        if (!inv.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }
        investmentRepository.delete(inv);
    }
}
