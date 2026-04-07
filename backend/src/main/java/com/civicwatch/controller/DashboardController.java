package com.civicwatch.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.civicwatch.model.User;
import com.civicwatch.repository.UserRepository;
import com.civicwatch.service.IssueService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DashboardController {

    private final IssueService service;
    private final UserRepository userRepository;

    @GetMapping("/users/me")
    public ResponseEntity<User> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElseThrow();
        return ResponseEntity.ok(user);
    }

    @DeleteMapping("/users/me")
    @Transactional
    public ResponseEntity<Map<String, Object>> deleteCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getRole() != com.civicwatch.model.Role.USER) {
            throw new RuntimeException("Only regular users can delete their own account");
        }

        userRepository.delete(user);
        userRepository.flush();

        return ResponseEntity.ok(Map.of("ok", true));
    }

    @GetMapping("/activity")
    public ResponseEntity<List<Map<String, Object>>> getActivity() {
        return ResponseEntity.ok(service.getActivityFeed());
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<List<Map<String, Object>>> getLeaderboard() {
        return ResponseEntity.ok(service.getLeaderboard());
    }
}
