package com.civicwatch.controller;

import com.civicwatch.model.Issue;
import com.civicwatch.service.IssueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/review")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ReviewController {

    private final IssueService issueService;

    @GetMapping("/pending")
    public ResponseEntity<List<Issue>> getPendingReviews() {
        List<Issue> pending = issueService.getReviewPendingTasks();
        return ResponseEntity.ok(pending);
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<Map<String, Object>> approveReview(@PathVariable String id) {
        try {
            UUID issueId = UUID.fromString(id);
            Map<String, Object> result = issueService.approveReview(issueId);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Invalid issue ID format"
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", e.getMessage()
            ));
        }
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<Map<String, Object>> rejectReview(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {
        try {
            UUID issueId = UUID.fromString(id);
            String notes = request.getOrDefault("notes", "");
            Map<String, Object> result = issueService.rejectReview(issueId, notes);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Invalid issue ID format"
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", e.getMessage()
            ));
        }
    }
}
