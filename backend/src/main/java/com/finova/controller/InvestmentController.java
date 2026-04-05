package com.finova.controller;

import com.finova.model.Investment;
import com.finova.service.InvestmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * Investment controller.
 * GET    /api/investments      — list all investments
 * POST   /api/investments      — add investment
 * DELETE /api/investments/{id} — delete investment
 */
@RestController
@RequestMapping("/api/investments")
@RequiredArgsConstructor
public class InvestmentController {

    private final InvestmentService investmentService;

    @GetMapping
    public ResponseEntity<List<Investment>> getAll() {
        return ResponseEntity.ok(investmentService.getAll());
    }

    @PostMapping
    public ResponseEntity<Investment> create(@RequestBody Investment investment) {
        return ResponseEntity.ok(investmentService.create(investment));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        investmentService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
