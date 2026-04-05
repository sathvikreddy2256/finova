package com.finova.repository;

import com.finova.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

/**
 * Spring Data JPA repository for User entity.
 * Provides CRUD operations + custom finders automatically.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Find user by username (used during login)
    Optional<User> findByUsername(String username);

    // Check if username is already taken (used during registration)
    boolean existsByUsername(String username);

    // Check if email is already registered
    boolean existsByEmail(String email);
}
