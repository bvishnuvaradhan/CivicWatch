package com.civicwatch.controller;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.civicwatch.dto.WorkerCreateRequest;
import com.civicwatch.model.Worker;
import com.civicwatch.service.IssueService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final IssueService service;

    private UUID parseUuid(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new RuntimeException(field + " is required");
        }
        try {
            return UUID.fromString(value.trim());
        } catch (IllegalArgumentException ex) {
            throw new RuntimeException("Invalid " + field + ": " + value);
        }
    }

    @PatchMapping("/issues/{id}/status")
    public ResponseEntity<Map<String, Object>> updateStatus(@PathVariable String id, @RequestBody Map<String, String> request) {
        service.updateStatus(parseUuid(id, "issueId"), request.get("status"));
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PostMapping("/issues/{id}/assign")
    public ResponseEntity<Map<String, Object>> assignWorker(@PathVariable String id, @RequestBody Map<String, String> request) {
        UUID issueId = parseUuid(id, "issueId");
        UUID workerId = parseUuid(request.get("workerId"), "workerId");
        service.assignWorker(issueId, workerId);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @GetMapping("/workers")
    public ResponseEntity<List<Worker>> getAllWorkers() {
        return ResponseEntity.ok(service.getAllWorkers());
    }

    @PostMapping("/workers")
    public ResponseEntity<Map<String, Object>> createWorker(@Valid @RequestBody WorkerCreateRequest request) {
        return ResponseEntity.ok(service.createWorkerWithCredentials(request));
    }

    @DeleteMapping("/workers/{id}")
    public ResponseEntity<Map<String, Object>> removeWorker(@PathVariable String id) {
        return ResponseEntity.ok(service.removeWorker(parseUuid(id, "workerId")));
    }

    @GetMapping("/system-config")
    public ResponseEntity<Map<String, String>> getSystemConfig() {
        return ResponseEntity.ok(service.getSystemConfig());
    }

    @PatchMapping("/system-config")
    public ResponseEntity<Map<String, String>> updateSystemConfig(@RequestBody Map<String, String> request) {
        return ResponseEntity.ok(service.updateSystemConfig(request));
    }

    @PostMapping("/notifications/broadcast")
    public ResponseEntity<Map<String, Object>> broadcastNotification(@RequestBody Map<String, String> request) {
        return ResponseEntity.ok(service.broadcastNotification(request));
    }

    @PostMapping("/notifications/schedule")
    public ResponseEntity<Map<String, Object>> scheduleNotification(@RequestBody Map<String, String> request) {
        return ResponseEntity.ok(service.scheduleNotification(request));
    }

    @GetMapping("/notifications/schedules")
    public ResponseEntity<List<Map<String, Object>>> getScheduledNotifications() {
        return ResponseEntity.ok(service.getScheduledNotifications());
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<List<Map<String, Object>>> getAuditLogs() {
        return ResponseEntity.ok(service.getAuditLogs());
    }
}
