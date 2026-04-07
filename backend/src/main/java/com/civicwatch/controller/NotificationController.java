package com.civicwatch.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.civicwatch.service.IssueService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class NotificationController {

    private final IssueService issueService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getMyNotifications() {
        return ResponseEntity.ok(issueService.getMyNotifications());
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Map<String, Object>> markAllRead() {
        return ResponseEntity.ok(issueService.markAllNotificationsRead());
    }

    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<Map<String, Object>> markRead(@PathVariable String notificationId) {
        return ResponseEntity.ok(issueService.markNotificationRead(notificationId));
    }
}
