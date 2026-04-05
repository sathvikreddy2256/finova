package com.finova.controller;

import com.finova.service.InsuranceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

/**
 * InsuranceController — smart insurance recommendations.
 *
 * GET /api/insurance/recommendations  — personalised plan suggestions
 * GET /api/insurance/plans            — all plans (browse)
 */
@RestController
@RequestMapping("/api/insurance")
@RequiredArgsConstructor
public class InsuranceController {

    private final InsuranceService insuranceService;

    @GetMapping("/recommendations")
    public ResponseEntity<Map<String, Object>> getRecommendations() {
        return ResponseEntity.ok(insuranceService.getRecommendations());
    }

    @GetMapping("/plans")
    public ResponseEntity<?> getAllPlans() {
        return ResponseEntity.ok(insuranceService.getAllPlans());
    }
}
