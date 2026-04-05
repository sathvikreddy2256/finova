package com.finova.service;

import com.finova.dto.AuthDto.*;
import com.finova.model.User;
import com.finova.model.UserProfile;
import com.finova.repository.UserProfileRepository;
import com.finova.repository.UserRepository;
import com.finova.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.Optional;

/**
 * Auth service — register, login.
 * Login response now includes profileComplete flag so the frontend
 * can redirect new users to onboarding instead of dashboard.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final UserProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already taken: " + request.getUsername());
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered: " + request.getEmail());
        }

        User user = User.builder()
            .username(request.getUsername())
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword()))
            .role("USER")
            .build();

        userRepository.save(user);

        return AuthResponse.builder()
            .message("Registration successful. Please login.")
            .username(user.getUsername())
            .profileComplete(false)
            .build();
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        User user = userRepository.findByUsername(request.getUsername())
            .orElseThrow(() -> new RuntimeException("User not found"));

        UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
            .username(user.getUsername())
            .password(user.getPassword())
            .roles(user.getRole())
            .build();

        String token = jwtService.generateToken(userDetails);

        // Check if user has completed onboarding
        boolean profileComplete = profileRepository.findByUser(user)
            .map(UserProfile::getIsProfileComplete)
            .orElse(false);

        return AuthResponse.builder()
            .token(token)
            .username(user.getUsername())
            .email(user.getEmail())
            .message("Login successful")
            .profileComplete(profileComplete)
            .build();
    }
}
