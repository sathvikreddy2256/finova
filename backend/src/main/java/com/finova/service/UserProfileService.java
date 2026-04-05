package com.finova.service;

import com.finova.dto.UserProfileDto;
import com.finova.model.User;
import com.finova.model.UserProfile;
import com.finova.repository.UserProfileRepository;
import com.finova.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Service for UserProfile onboarding.
 * Handles saving profile data and checking if onboarding is complete.
 */
@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final UserProfileRepository profileRepository;
    private final UserRepository userRepository;

    /** Get currently authenticated user */
    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
    }

    /**
     * Save or update the user's onboarding profile.
     * Sets isProfileComplete = true once submitted.
     */
    public UserProfileDto saveProfile(UserProfileDto dto) {
        User user = getCurrentUser();

        // Fetch existing or create new profile
        UserProfile profile = profileRepository.findByUser(user)
            .orElse(UserProfile.builder().user(user).build());

        // Copy fields from DTO
        profile.setMonthlyIncome(dto.getMonthlyIncome());
        profile.setJobType(dto.getJobType());
        profile.setFixedExpenses(dto.getFixedExpenses());
        profile.setRiskLevel(dto.getRiskLevel());
        profile.setGoals(dto.getGoals());
        profile.setAge(dto.getAge());
        profile.setExistingLoans(dto.getExistingLoans());
        profile.setIsProfileComplete(true);   // Mark as done
        profile.setUpdatedAt(LocalDateTime.now());

        UserProfile saved = profileRepository.save(profile);
        return toDto(saved);
    }

    /**
     * Get the current user's profile.
     * Returns a DTO with isProfileComplete = false if no profile exists yet.
     */
    public UserProfileDto getProfile() {
        User user = getCurrentUser();
        Optional<UserProfile> profile = profileRepository.findByUser(user);

        if (profile.isEmpty()) {
            // No profile yet — return empty DTO signalling onboarding is needed
            return UserProfileDto.builder()
                .isProfileComplete(false)
                .build();
        }
        return toDto(profile.get());
    }

    /**
     * Check if the current user has completed onboarding.
     * Used by the login flow to decide where to redirect.
     */
    public boolean isProfileComplete() {
        User user = getCurrentUser();
        return profileRepository.findByUser(user)
            .map(UserProfile::getIsProfileComplete)
            .orElse(false);
    }

    /** Convert entity → DTO */
    private UserProfileDto toDto(UserProfile p) {
        return UserProfileDto.builder()
            .id(p.getId())
            .monthlyIncome(p.getMonthlyIncome())
            .jobType(p.getJobType())
            .fixedExpenses(p.getFixedExpenses())
            .riskLevel(p.getRiskLevel())
            .goals(p.getGoals())
            .age(p.getAge())
            .existingLoans(p.getExistingLoans())
            .isProfileComplete(p.getIsProfileComplete())
            .build();
    }
}
