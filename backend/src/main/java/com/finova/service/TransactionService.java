package com.finova.service;

import com.finova.dto.TransactionDto;
import com.finova.dto.TransactionDto.SummaryDto;
import com.finova.model.Transaction;
import com.finova.model.User;
import com.finova.model.UserProfile;
import com.finova.repository.InvestmentRepository;
import com.finova.repository.TransactionRepository;
import com.finova.repository.UserProfileRepository;
import com.finova.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Transaction service — ALL values come from real database rows. No mock data.
 */
@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final InvestmentRepository investmentRepository;
    private final UserProfileRepository profileRepository;

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public TransactionDto create(TransactionDto dto) {
        User user = getCurrentUser();
        Transaction txn = Transaction.builder()
            .user(user)
            .type(dto.getType().toUpperCase())
            .amount(dto.getAmount())
            .category(dto.getCategory())
            .description(dto.getDescription())
            .date(dto.getDate())
            .build();
        return toDto(transactionRepository.save(txn));
    }

    public List<TransactionDto> getAll() {
        return transactionRepository.findByUserOrderByDateDesc(getCurrentUser())
            .stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<TransactionDto> getRecent() {
        return transactionRepository.findTop10ByUserOrderByDateDesc(getCurrentUser())
            .stream().map(this::toDto).collect(Collectors.toList());
    }

    public void delete(Long id) {
        User user = getCurrentUser();
        Transaction txn = transactionRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Transaction not found"));
        if (!txn.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }
        transactionRepository.delete(txn);
    }

    /**
     * Real summary: sums actual DB rows.
     * Falls back to profile monthly_income if no INCOME transactions exist yet.
     */
    public SummaryDto getSummary() {
        User user = getCurrentUser();
        BigDecimal txnIncome  = transactionRepository.sumCurrentMonthByUserAndType(user, "INCOME");
        BigDecimal txnExpense = transactionRepository.sumCurrentMonthByUserAndType(user, "EXPENSE");
        BigDecimal investments = investmentRepository.sumCurrentValueByUser(user);

        BigDecimal totalIncome = txnIncome;
        if (txnIncome.compareTo(BigDecimal.ZERO) == 0) {
            Optional<UserProfile> profile = profileRepository.findByUser(user);
            if (profile.isPresent() && profile.get().getMonthlyIncome() != null) {
                totalIncome = profile.get().getMonthlyIncome();
            }
        }

        BigDecimal savings = totalIncome.subtract(txnExpense);

        return SummaryDto.builder()
            .totalIncome(totalIncome)
            .totalExpense(txnExpense)
            .savings(savings)
            .investments(investments)
            .build();
    }

    /**
     * Last 6 months grouped by month — for area chart.
     * Returns empty list if user has no transactions.
     */
    public List<Map<String, Object>> getMonthlyChartData() {
        User user = getCurrentUser();
        List<Object[]> rows = transactionRepository.getMonthlyTotalsForChart(user.getId());

        String[] monthNames = {"","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"};
        Map<String, Map<String, Object>> byMonth = new LinkedHashMap<>();

        for (Object[] row : rows) {
            int month = ((Number) row[0]).intValue();
            int year  = ((Number) row[1]).intValue();
            String type = (String) row[2];
            double total = ((Number) row[3]).doubleValue();
            String key = year + "-" + String.format("%02d", month);

            byMonth.computeIfAbsent(key, k -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("month", monthNames[month] + " '" + String.valueOf(year).substring(2));
                m.put("income", 0.0);
                m.put("expense", 0.0);
                return m;
            });
            if ("INCOME".equals(type))  byMonth.get(key).put("income", total);
            else if ("EXPENSE".equals(type)) byMonth.get(key).put("expense", total);
        }
        return new ArrayList<>(byMonth.values());
    }

    /**
     * Average expense per category over last 3 months — consumed by AI service.
     * Returns empty map if no data.
     */
    public Map<String, Double> getAvgExpensePerCategory() {
        User user = getCurrentUser();
        List<Object[]> rows = transactionRepository.getAvgExpensePerCategory(user.getId());
        Map<String, Double> result = new LinkedHashMap<>();
        for (Object[] row : rows) {
            result.put(((String) row[0]).toLowerCase(), ((Number) row[1]).doubleValue());
        }
        return result;
    }

    private TransactionDto toDto(Transaction t) {
        return TransactionDto.builder()
            .id(t.getId())
            .type(t.getType())
            .amount(t.getAmount())
            .category(t.getCategory())
            .description(t.getDescription())
            .date(t.getDate())
            .build();
    }
}
