package com.civicwatch.controller;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.civicwatch.dto.CommentRequest;
import com.civicwatch.dto.VoteRequest;
import com.civicwatch.model.Comment;
import com.civicwatch.model.Issue;
import com.civicwatch.model.Vote;
import com.civicwatch.service.IssueService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/issues")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class IssueController {

    private final IssueService service;

    @GetMapping("/nearby")
    public ResponseEntity<List<Issue>> getNearbyIssues(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "ALL") String category,
            @RequestParam(defaultValue = "ALL") String status,
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "5000") double radius,
            @RequestParam(defaultValue = "50") int limit
    ) {
        return ResponseEntity.ok(service.getIssues(category, status, search, limit));
    }

    @PostMapping
    public ResponseEntity<Issue> createIssue(@RequestBody Issue issue) {
        return ResponseEntity.ok(service.createIssue(issue));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Issue> getIssueById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getIssueById(id));
    }

    @PostMapping("/{id}/comment")
    public ResponseEntity<Comment> addComment(@PathVariable UUID id, @RequestBody CommentRequest request) {
        Comment comment = Comment.builder().text(request.getText()).build();
        return ResponseEntity.ok(service.addComment(id, comment));
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<List<Comment>> getComments(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getCommentsByIssueId(id));
    }

    @PostMapping("/{id}/vote")
    public ResponseEntity<Void> vote(@PathVariable UUID id, @RequestBody(required = false) VoteRequest request) {
        service.vote(id, new Vote());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(service.getStats());
    }

    @GetMapping("/mine")
    public ResponseEntity<List<Issue>> getMyIssues() {
        return ResponseEntity.ok(service.getMyReportedIssues());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteIssue(@PathVariable UUID id) {
        service.deleteIssue(id);
        return ResponseEntity.ok().build();
    }
}
