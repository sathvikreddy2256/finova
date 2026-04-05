package com.finova.controller;

import com.finova.dto.TransactionDto;
import com.finova.dto.TransactionDto.SummaryDto;
import com.finova.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

/**
 * Transaction controller.
 * All endpoints require a valid JWT token.
 *
 * GET    /api/transactions            — list all transactions
 * POST   /api/transactions            — add a transaction
 * DELETE /api/transactions/{id}       — delete a transaction
 * GET    /api/transactions/summary    — dashboard summary (real data only)
 * GET    /api/transactions/recent     — last 10 transactions
 * GET    /api/transactions/chart      — last 6 months grouped by month for chart
 * GET    /api/transactions/avg-by-cat — average expense per category (used by AI)
 */
@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @GetMapping
    public ResponseEntity<List<TransactionDto>> getAll() {
        return ResponseEntity.ok(transactionService.getAll());
    }

    @PostMapping
    public ResponseEntity<TransactionDto> create(@RequestBody TransactionDto dto) {
        return ResponseEntity.ok(transactionService.create(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        transactionService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/summary")
    public ResponseEntity<SummaryDto> getSummary() {
        return ResponseEntity.ok(transactionService.getSummary());
    }

    @GetMapping("/recent")
    public ResponseEntity<List<TransactionDto>> getRecent() {
        return ResponseEntity.ok(transactionService.getRecent());
    }

    /** Returns last 6 months of income/expense data for the area chart */
    @GetMapping("/chart")
    public ResponseEntity<List<Map<String, Object>>> getChartData() {
        return ResponseEntity.ok(transactionService.getMonthlyChartData());
    }

    /** Returns average expense per category over last 3 months (for AI service) */
    @GetMapping("/avg-by-cat")
    public ResponseEntity<Map<String, Double>> getAvgByCategory() {
        return ResponseEntity.ok(transactionService.getAvgExpensePerCategory());
    }
}
