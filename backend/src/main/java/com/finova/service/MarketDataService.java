package com.finova.service;

import com.finova.model.MarketOption;
import com.finova.model.User;
import com.finova.model.UserInvestment;
import com.finova.repository.MarketOptionRepository;
import com.finova.repository.UserInvestmentRepository;
import com.finova.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;

/**
 * MarketDataService — manages investment options and user positions.
 *
 * Price data: We use realistic, deterministic "simulated market prices"
 * seeded from the DB. Prices change based on the day-of-week to simulate
 * realistic movement WITHOUT randomness. Same day = same price always.
 */
@Service
@RequiredArgsConstructor
public class MarketDataService {

    private final MarketOptionRepository marketRepo;
    private final UserInvestmentRepository userInvRepo;
    private final UserRepository userRepo;

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepo.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // ─── Market Options ───────────────────────────────────────────────────────

    /**
     * Returns all investment options with today's simulated price change.
     * Change is deterministic: based on dayOfYear so same day = same value.
     */
    public List<Map<String, Object>> getMarketOptions() {
        List<MarketOption> options = marketRepo.findAllByOrderByCategoryAscNameAsc();
        List<Map<String, Object>> result = new ArrayList<>();

        int dayOfYear = LocalDate.now().getDayOfYear();

        for (MarketOption opt : options) {
            // Deterministic daily change: seeded by id + dayOfYear (no Math.random())
            // Pattern: each option has a characteristic movement cycle
            double seed = (opt.getId() * 17 + dayOfYear * 7) % 100;
            double dailyChangePct = (seed % 5) - 2.1;  // range roughly -2.1% to +2.9%
            // Round to 2dp for clean display
            dailyChangePct = Math.round(dailyChangePct * 100.0) / 100.0;

            BigDecimal prevPrice = opt.getPrevPrice() != null ? opt.getPrevPrice() : opt.getCurrentPrice();
            BigDecimal currentPrice = opt.getCurrentPrice();

            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", opt.getId());
            m.put("name", opt.getName());
            m.put("category", opt.getCategory());
            m.put("symbol", opt.getSymbol());
            m.put("currentPrice", currentPrice);
            m.put("prevPrice", prevPrice);
            m.put("dailyChangePct", dailyChangePct);
            m.put("dailyChangeAmt", currentPrice.multiply(BigDecimal.valueOf(dailyChangePct / 100))
                                                 .setScale(2, RoundingMode.HALF_UP));
            m.put("oneYearReturn", opt.getOneYearReturn());
            m.put("riskLevel", opt.getRiskLevel());
            m.put("description", opt.getDescription());
            m.put("fundHouse", opt.getFundHouse());
            m.put("updatedAt", opt.getUpdatedAt());
            result.add(m);
        }
        return result;
    }

    /** Best performer today (highest dailyChangePct) */
    public Map<String, Object> getBestToday() {
        List<Map<String, Object>> all = getMarketOptions();
        return all.stream()
            .max(Comparator.comparingDouble(m -> ((Number) m.get("dailyChangePct")).doubleValue()))
            .orElse(null);
    }

    // ─── User Investments ─────────────────────────────────────────────────────

    /** Add a new investment position for the current user */
    public UserInvestment addUserInvestment(Long marketOptionId, BigDecimal amount, BigDecimal monthlySip) {
        User user = getCurrentUser();
        MarketOption option = marketRepo.findById(marketOptionId)
            .orElseThrow(() -> new RuntimeException("Investment option not found: " + marketOptionId));

        BigDecimal buyPrice = option.getCurrentPrice();
        BigDecimal units    = amount.divide(buyPrice, 4, RoundingMode.HALF_UP);

        UserInvestment inv = UserInvestment.builder()
            .user(user)
            .marketOption(option)
            .investedAmount(amount)
            .buyPrice(buyPrice)
            .units(units)
            .monthlySip(monthlySip)
            .purchaseDate(LocalDate.now())
            .build();

        return userInvRepo.save(inv);
    }

    /** All positions for current user, enriched with current value and P&L */
    public List<Map<String, Object>> getUserPortfolio() {
        User user = getCurrentUser();
        List<UserInvestment> positions = userInvRepo.findByUserOrderByCreatedAtDesc(user);
        List<Map<String, Object>> result = new ArrayList<>();

        for (UserInvestment pos : positions) {
            MarketOption opt = pos.getMarketOption();
            BigDecimal currentPrice   = opt.getCurrentPrice();
            BigDecimal units          = pos.getUnits();
            BigDecimal currentValue   = currentPrice.multiply(units).setScale(2, RoundingMode.HALF_UP);
            BigDecimal investedAmount = pos.getInvestedAmount();
            BigDecimal profit         = currentValue.subtract(investedAmount).setScale(2, RoundingMode.HALF_UP);
            double returnPct = investedAmount.compareTo(BigDecimal.ZERO) != 0
                ? profit.divide(investedAmount, 6, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue()
                : 0.0;

            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", pos.getId());
            m.put("marketOptionId", opt.getId());
            m.put("name", opt.getName());
            m.put("category", opt.getCategory());
            m.put("symbol", opt.getSymbol());
            m.put("units", units);
            m.put("buyPrice", pos.getBuyPrice());
            m.put("currentPrice", currentPrice);
            m.put("investedAmount", investedAmount);
            m.put("currentValue", currentValue);
            m.put("profit", profit);
            m.put("returnPct", Math.round(returnPct * 100.0) / 100.0);
            m.put("monthlySip", pos.getMonthlySip());
            m.put("purchaseDate", pos.getPurchaseDate());
            m.put("riskLevel", opt.getRiskLevel());
            result.add(m);
        }
        return result;
    }

    public void deleteUserInvestment(Long id) {
        User user = getCurrentUser();
        UserInvestment inv = userInvRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Investment not found"));
        if (!inv.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }
        userInvRepo.delete(inv);
    }

    /**
     * AI suggestion: based on user's riskLevel from profile,
     * pick top 3 options in matching risk bracket with best 1Y return.
     */
    public List<Map<String, Object>> getAISuggestions(String riskLevel) {
        List<MarketOption> options = marketRepo.findByRiskLevel(riskLevel);
        if (options.isEmpty()) {
            options = marketRepo.findAllByOrderByCategoryAscNameAsc();
        }
        List<Map<String, Object>> all = getMarketOptions();
        String finalRisk = riskLevel;
        return all.stream()
            .filter(m -> finalRisk.equalsIgnoreCase((String) m.get("riskLevel")))
            .sorted((a, b) -> {
                BigDecimal ra = (BigDecimal) a.get("oneYearReturn");
                BigDecimal rb = (BigDecimal) b.get("oneYearReturn");
                if (ra == null) ra = BigDecimal.ZERO;
                if (rb == null) rb = BigDecimal.ZERO;
                return rb.compareTo(ra);
            })
            .limit(3)
            .toList();
    }
}
