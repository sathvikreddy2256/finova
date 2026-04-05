package com.finova.controller;

import com.finova.dto.UserProfileDto;
import com.finova.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

/**
 * UserProfile controller.
 * All endpoints require JWT authentication.
 *
 * GET  /api/user/profile           — fetch current user's profile
 * POST /api/user/profile           — save/update onboarding data
 * GET  /api/user/profile/status    — check if onboarding is complete
 */
@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserProfileService profileService;

    /** Get the current user's profile (returns isProfileComplete=false if not done) */
    @GetMapping("/profile")
    public ResponseEntity<UserProfileDto> getProfile() {
        return ResponseEntity.ok(profileService.getProfile());
    }

    /**
     * Save onboarding data.
     * Frontend calls this when user submits the onboarding form.
     */
    @PostMapping("/profile")
    public ResponseEntity<UserProfileDto> saveProfile(@RequestBody UserProfileDto dto) {
        return ResponseEntity.ok(profileService.saveProfile(dto));
    }

    /**
     * Quick check: is this user's profile complete?
     * Returns { "complete": true/false }
     * Used by the frontend to decide if onboarding is needed.
     */
    @GetMapping("/profile/status")
    public ResponseEntity<Map<String, Boolean>> getProfileStatus() {
        boolean complete = profileService.isProfileComplete();
        return ResponseEntity.ok(Map.of("complete", complete));
    }
}
