package com.finova.repository;

import com.finova.model.User;
import com.finova.model.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

/**
 * Repository for UserProfile.
 * Used to check if a user has completed onboarding and to fetch their profile data.
 */
@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {

    // Find profile by the linked User object
    Optional<UserProfile> findByUser(User user);

    // Check if a user has a profile at all
    boolean existsByUser(User user);
}
