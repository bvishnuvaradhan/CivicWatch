package com.civicwatch.controller;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.civicwatch.model.Issue;
import com.civicwatch.service.IssueService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/worker")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('WORKER')")
public class WorkerController {

    private final IssueService issueService;

    @GetMapping("/tasks")
    public ResponseEntity<List<Issue>> getMyTasks() {
        return ResponseEntity.ok(issueService.getTasksForCurrentWorker());
    }

    @PutMapping("/tasks/{id}/status")
    public ResponseEntity<Map<String, Object>> updateTaskStatus(@PathVariable UUID id, @RequestBody Map<String, String> request) {
        issueService.updateTaskStatusForCurrentWorker(id, request.get("status"));
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PostMapping("/tasks/{id}/submit-review")
    public ResponseEntity<Map<String, Object>> submitForReview(@PathVariable UUID id, @RequestBody Map<String, String> request) {
        String photoUrl = request.get("photoUrl");
        Map<String, Object> result = issueService.submitTaskForReview(id, photoUrl);
        return ResponseEntity.ok(result);
    }
}
