package com.finova.controller;

import com.finova.service.MarketDataService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * MarketController — investment market data & user portfolio.
 *
 * GET  /api/investments/market          — all market options with daily change
 * GET  /api/investments/market/best     — best performer today
 * GET  /api/investments/portfolio       — user's holdings with P&L
 * POST /api/investments/portfolio       — add a new position
 * DELETE /api/investments/portfolio/{id} — remove a position
 * GET  /api/investments/suggest         — AI suggestions based on risk profile
 */
@RestController
@RequestMapping("/api/investments")
@RequiredArgsConstructor
public class MarketController {

    private final MarketDataService marketService;

    @GetMapping("/market")
    public ResponseEntity<List<Map<String, Object>>> getMarket() {
        return ResponseEntity.ok(marketService.getMarketOptions());
    }

    @GetMapping("/market/best")
    public ResponseEntity<Map<String, Object>> getBest() {
        Map<String, Object> best = marketService.getBestToday();
        return best != null ? ResponseEntity.ok(best) : ResponseEntity.noContent().build();
    }

    @GetMapping("/portfolio")
    public ResponseEntity<List<Map<String, Object>>> getPortfolio() {
        return ResponseEntity.ok(marketService.getUserPortfolio());
    }

    /**
     * Body: { "marketOptionId": 1, "amount": 10000, "monthlySip": 1000 }
     */
    @PostMapping("/portfolio")
    public ResponseEntity<?> addPosition(@RequestBody Map<String, Object> body) {
        Long optionId   = Long.parseLong(body.get("marketOptionId").toString());
        BigDecimal amt  = new BigDecimal(body.get("amount").toString());
        BigDecimal sip  = body.containsKey("monthlySip") && body.get("monthlySip") != null
            ? new BigDecimal(body.get("monthlySip").toString()) : null;
        return ResponseEntity.ok(marketService.addUserInvestment(optionId, amt, sip));
    }

    @DeleteMapping("/portfolio/{id}")
    public ResponseEntity<Void> deletePosition(@PathVariable Long id) {
        marketService.deleteUserInvestment(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Query param: ?risk=MEDIUM (LOW / MEDIUM / HIGH)
     */
    @GetMapping("/suggest")
    public ResponseEntity<List<Map<String, Object>>> suggest(
        @RequestParam(defaultValue = "MEDIUM") String risk
    ) {
        return ResponseEntity.ok(marketService.getAISuggestions(risk.toUpperCase()));
    }
}
