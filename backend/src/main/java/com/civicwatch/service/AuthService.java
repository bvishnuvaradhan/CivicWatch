package com.civicwatch.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.civicwatch.dto.AuthRequest;
import com.civicwatch.dto.RegisterRequest;
import com.civicwatch.model.Role;
import com.civicwatch.model.User;
import com.civicwatch.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final JdbcTemplate jdbcTemplate;

    @Transactional
    public Map<String, Object> register(RegisterRequest request) {
        if (repository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("An account with this email already exists");
        }

        var user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.USER)
                .build();
        var savedUser = repository.saveAndFlush(user);
        jdbcTemplate.update(
                "INSERT INTO notifications (user_id, type, title, message, is_read, link, created_at) VALUES (?, 'SYSTEM', ?, ?, FALSE, ?, NOW())",
                savedUser.getId(),
                "Welcome to CivicWatch",
                "Your account is ready. Start by reporting an issue or checking community activity.",
                "/dashboard"
        );
        var jwtToken = jwtService.generateToken(savedUser);

        Map<String, Object> response = new HashMap<>();
        response.put("token", jwtToken);
        response.put("user", savedUser);
        return response;
    }

    public Map<String, Object> login(AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );
        var user = repository.findByEmail(request.getEmail())
                .orElseThrow();
        var jwtToken = jwtService.generateToken(user);

        Map<String, Object> response = new HashMap<>();
        response.put("token", jwtToken);
        response.put("user", user);
        return response;
    }
}
