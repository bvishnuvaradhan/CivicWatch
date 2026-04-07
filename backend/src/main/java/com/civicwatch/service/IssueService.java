package com.civicwatch.service;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.civicwatch.dto.WorkerCreateRequest;
import com.civicwatch.model.Comment;
import com.civicwatch.model.Issue;
import com.civicwatch.model.Role;
import com.civicwatch.model.User;
import com.civicwatch.model.Vote;
import com.civicwatch.model.Worker;
import com.civicwatch.repository.CommentRepository;
import com.civicwatch.repository.IssueRepository;
import com.civicwatch.repository.UserRepository;
import com.civicwatch.repository.VoteRepository;
import com.civicwatch.repository.WorkerRepository;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class IssueService {

    private static final int MAX_ACTIVE_ISSUES_PER_WORKER = 5;

    private final IssueRepository repository;
    private final CommentRepository commentRepository;
    private final VoteRepository voteRepository;
    private final WorkerRepository workerRepository;
    private final UserRepository userRepository;
    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;

    @PostConstruct
    public void initSchemaSafeguards() {
        try {
            ensureIssueReviewColumns();
        } catch (DataAccessException ignored) {
            // Keep startup resilient; endpoints will still surface DB errors if schema is unreachable.
        }
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        String email = authentication.getName();
        return userRepository.findByEmail(email).orElse(null);
    }

    public List<Issue> getAllIssues() {
        return repository.findAll().stream()
                .sorted(Comparator.comparing(Issue::getCreatedAt, Comparator.nullsLast(LocalDateTime::compareTo)).reversed())
                .map(this::enrichIssueCounts)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Issue> getMyReportedIssues() {
        User currentUser = getCurrentUser();
        if (currentUser == null || currentUser.getId() == null) {
            throw new RuntimeException("Please login to view your issues");
        }
        return repository.findByCreatedByIdOrderByCreatedAtDesc(currentUser.getId())
                .stream()
                .map(this::enrichIssueCounts)
                .toList();
    }

    public List<Issue> getIssues(String category, String status, String search) {
        String normalizedCategory = category == null ? "ALL" : category;
        String normalizedStatus = status == null ? "ALL" : status;
        String normalizedSearch = search == null ? "" : search.trim().toLowerCase();

        return repository.findAll().stream()
                .sorted(Comparator.comparing(Issue::getCreatedAt, Comparator.nullsLast(LocalDateTime::compareTo)).reversed())
                .filter(issue -> "ALL".equals(normalizedCategory) || normalizedCategory.equalsIgnoreCase(issue.getCategory()))
                .filter(issue -> "ALL".equals(normalizedStatus) || normalizedStatus.equalsIgnoreCase(issue.getStatus().name()))
                .filter(issue -> normalizedSearch.isEmpty()
                || (issue.getTitle() != null && issue.getTitle().toLowerCase().contains(normalizedSearch))
                || (issue.getDescription() != null && issue.getDescription().toLowerCase().contains(normalizedSearch))
                || (issue.getAddress() != null && issue.getAddress().toLowerCase().contains(normalizedSearch)))
                .map(this::enrichIssueCounts)
                .toList();
    }

    public Issue createIssue(Issue issue) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            throw new RuntimeException("Please login to report an issue");
        }
        issue.setCreatedBy(currentUser);
        if (issue.getStatus() == null) {
            issue.setStatus(com.civicwatch.model.Status.OPEN);
        }
        Issue savedIssue = repository.save(issue);
        // Reporter rewards: +50 base, +20 if image provided
        addReputationPoints(currentUser, 50);
        if (issue.getImageUrl() != null && !issue.getImageUrl().isBlank()) {
            addReputationPoints(currentUser, 20);
        }
        return enrichIssueCounts(savedIssue);
    }

    public Issue getIssueById(UUID id) {
        Issue issue = repository.findById(id).orElseThrow();
        return enrichIssueCounts(issue);
    }

    public Comment addComment(UUID issueId, Comment comment) {
        Issue issue = getIssueById(issueId);
        User currentUser = getCurrentUser();
        comment.setIssue(issue);
        if (currentUser != null) {
            comment.setUser(currentUser);
        }
        Comment savedComment = commentRepository.save(comment);
        // Comment reward: +5
        if (currentUser != null) {
            addReputationPoints(currentUser, 5);
        }
        return savedComment;
    }

    public List<Comment> getCommentsByIssueId(UUID issueId) {
        return commentRepository.findByIssueId(issueId);
    }

    public void vote(UUID issueId, Vote vote) {
        Issue issue = getIssueById(issueId);
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            throw new RuntimeException("Please login to vote");
        }
        vote.setIssue(issue);
        vote.setUser(currentUser);
        voteRepository.save(vote);

        // Upvote received reward: +2 to issue creator
        if (issue.getCreatedBy() != null) {
            addReputationPoints(issue.getCreatedBy(), 2);
        }
    }

    public Map<String, Object> getStats() {
        List<Issue> issues = repository.findAll();
        Map<String, Object> stats = new HashMap<>();
        stats.put("total", issues.size());
        stats.put("activeUsers", userRepository.count());
        stats.put("byCategory", issues.stream().collect(Collectors.groupingBy(Issue::getCategory, Collectors.counting())));
        stats.put("byStatus", issues.stream().collect(Collectors.groupingBy(i -> i.getStatus().name(), Collectors.counting())));
        stats.put("resolvedPercentage", issues.isEmpty()
                ? 0
                : Math.round((issues.stream().filter(issue -> issue.getStatus() == com.civicwatch.model.Status.RESOLVED).count() * 100.0) / issues.size()));
        stats.put("reportsToday", issues.stream()
                .filter(issue -> issue.getCreatedAt() != null && issue.getCreatedAt().toLocalDate().equals(LocalDate.now()))
                .count());

        List<Map<String, Object>> weeklyActivity = new ArrayList<>();
        LocalDate startDate = LocalDate.now().minusDays(6);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("EEE");
        for (int offset = 0; offset < 7; offset++) {
            LocalDate day = startDate.plusDays(offset);
            long count = issues.stream()
                    .filter(issue -> issue.getCreatedAt() != null && issue.getCreatedAt().toLocalDate().equals(day))
                    .count();
            Map<String, Object> entry = new HashMap<>();
            entry.put("name", day.format(formatter));
            entry.put("reports", count);
            weeklyActivity.add(entry);
        }
        stats.put("weeklyActivity", weeklyActivity);
        return stats;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getActivityFeed() {
        String sql = """
                SELECT x.type, x.id, x.action, x.created_at AS created_at, x.user_name AS user_name
                FROM (
                    SELECT 'ISSUE' AS type,
                           i.id::text AS id,
                           COALESCE(i.title, 'reported an issue') AS action,
                          i.created_at AS created_at,
                           COALESCE(u.name, 'Citizen') AS user_name
                    FROM issues i
                    LEFT JOIN users u ON i.user_id::text = u.id::text

                    UNION ALL

                    SELECT 'COMMENT' AS type,
                           c.id::text AS id,
                           COALESCE(c.text, 'commented on an issue') AS action,
                              c.created_at AS created_at,
                           COALESCE(u.name, 'Citizen') AS user_name
                    FROM comments c
                    LEFT JOIN users u ON c.user_id::text = u.id::text

                    UNION ALL

                    SELECT 'VOTE' AS type,
                           v.id::text AS id,
                           'voted on an issue' AS action,
                              v.created_at AS created_at,
                           COALESCE(u.name, 'Citizen') AS user_name
                    FROM votes v
                    LEFT JOIN users u ON v.user_id::text = u.id::text
                ) x
                ORDER BY x.created_at DESC NULLS LAST
                LIMIT 20
                """;

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);
        return rows.stream().map(row -> {
            Map<String, Object> entry = new HashMap<>();
            entry.put("type", String.valueOf(getRowValue(row, "type", "ISSUE")));
            entry.put("id", String.valueOf(getRowValue(row, "id", "")));
            entry.put("action", String.valueOf(getRowValue(row, "action", "activity")));
            entry.put("userName", String.valueOf(getRowValue(row, "user_name", "Citizen")));

            Object createdAtValue = getRowValue(row, "created_at", null);
            LocalDateTime createdAtLocal = toLocalDateTime(createdAtValue);
            long createdAtEpochMs = createdAtLocal.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
            entry.put("createdAtEpochMs", createdAtEpochMs);
            entry.put("createdAt", createdAtLocal.toString());
            return entry;
        }).toList();
    }

    private Object getRowValue(Map<String, Object> row, String key, Object defaultValue) {
        if (row.containsKey(key)) {
            return row.get(key);
        }
        String camel = toCamelCase(key);
        if (row.containsKey(camel)) {
            return row.get(camel);
        }
        for (Map.Entry<String, Object> entry : row.entrySet()) {
            if (entry.getKey() != null && entry.getKey().equalsIgnoreCase(key)) {
                return entry.getValue();
            }
            if (entry.getKey() != null && entry.getKey().equalsIgnoreCase(camel)) {
                return entry.getValue();
            }
        }
        return defaultValue;
    }

    private String toCamelCase(String value) {
        StringBuilder sb = new StringBuilder();
        boolean upper = false;
        for (char c : value.toCharArray()) {
            if (c == '_') {
                upper = true;
                continue;
            }
            sb.append(upper ? Character.toUpperCase(c) : c);
            upper = false;
        }
        return sb.toString();
    }

    private LocalDateTime toLocalDateTime(Object value) {
        if (value == null) {
            return LocalDateTime.now();
        }
        if (value instanceof LocalDateTime localDateTime) {
            return localDateTime;
        }
        if (value instanceof Timestamp timestamp) {
            return timestamp.toLocalDateTime();
        }
        if (value instanceof OffsetDateTime offsetDateTime) {
            return offsetDateTime.toLocalDateTime();
        }
        if (value instanceof Date date) {
            return LocalDateTime.ofInstant(date.toInstant(), ZoneId.systemDefault());
        }
        String raw = String.valueOf(value);
        try {
            return LocalDateTime.parse(raw);
        } catch (Exception ignored) {
            try {
                return OffsetDateTime.parse(raw).toLocalDateTime();
            } catch (Exception ignoredAgain) {
                return LocalDateTime.now();
            }
        }
    }

    public List<Map<String, Object>> getLeaderboard() {
        List<Issue> issues = repository.findAll();
        return userRepository.findAll().stream()
                .filter(user -> user.getRole() == Role.USER)
                .sorted((left, right) -> Integer.compare(right.getReputationPoints(), left.getReputationPoints()))
                .map(user -> {
                    Map<String, Object> entry = new HashMap<>();
                    entry.put("id", user.getId());
                    entry.put("name", user.getName());
                    entry.put("reputationPoints", user.getReputationPoints());
                    entry.put("reportsCount", issues.stream().filter(issue -> issue.getCreatedBy() != null && user.getId().equals(issue.getCreatedBy().getId())).count());
                    return entry;
                })
                .toList();
    }

    public void updateStatus(UUID id, String status) {
        String normalizedStatus = status == null ? "" : status.trim().toUpperCase(Locale.ROOT);
        if (normalizedStatus.isBlank()) {
            throw new RuntimeException("Status is required");
        }

        com.civicwatch.model.Status nextStatus;
        try {
            nextStatus = com.civicwatch.model.Status.valueOf(normalizedStatus);
        } catch (IllegalArgumentException ex) {
            throw new RuntimeException("Invalid status: " + status);
        }

        String assignedWorkerId = jdbcTemplate.queryForObject(
                "SELECT worker_id::text FROM issues WHERE id::text = ?",
                String.class,
                id.toString()
        );

        int updated = jdbcTemplate.update(
                "UPDATE issues SET status = ? WHERE id::text = ?",
                nextStatus.name(),
                id.toString()
        );
        if (updated == 0) {
            throw new RuntimeException("Issue not found");
        }

        if (assignedWorkerId != null && !assignedWorkerId.isBlank()) {
            try {
                refreshWorkerAvailabilityById(UUID.fromString(assignedWorkerId));
            } catch (IllegalArgumentException ignored) {
                // Ignore invalid legacy data.
            }
        }

        logAudit("STATUS_UPDATED", "Issue " + id + " status changed to " + normalizedStatus);
    }

    public void assignWorker(UUID issueId, UUID workerId) {
        Long workerExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM workers WHERE id::text = ?",
                Long.class,
                workerId.toString()
        );
        if (workerExists == null || workerExists == 0) {
            throw new RuntimeException("Worker not found");
        }

        String currentWorkerId = jdbcTemplate.queryForObject(
                "SELECT worker_id::text FROM issues WHERE id::text = ?",
                String.class,
                issueId.toString()
        );

        boolean alreadyAssignedToTarget = currentWorkerId != null && currentWorkerId.equals(workerId.toString());

        if (!alreadyAssignedToTarget && getActiveAssignmentCount(workerId) >= MAX_ACTIVE_ISSUES_PER_WORKER) {
            throw new RuntimeException("Worker is busy. Maximum 5 active issues can be assigned.");
        }

        // If issue had a different worker, release that previous worker first.
        if (currentWorkerId != null && !currentWorkerId.isBlank() && !currentWorkerId.equals(workerId.toString())) {
            try {
                refreshWorkerAvailabilityById(UUID.fromString(currentWorkerId));
            } catch (IllegalArgumentException ignored) {
                // Ignore invalid legacy data.
            }
        }

        int updated = jdbcTemplate.update(
                "UPDATE issues SET worker_id = CAST(? AS uuid), status = 'IN_PROGRESS' WHERE id::text = ?",
                workerId.toString(),
                issueId.toString()
        );
        if (updated == 0) {
            throw new RuntimeException("Issue not found");
        }

        refreshWorkerAvailabilityById(workerId);
        logAudit("WORKER_ASSIGNED", "Assigned worker " + workerId + " to issue " + issueId);
    }

    public List<Worker> getAllWorkers() {
        return workerRepository.findAll().stream().map(this::enrichWorkerAvailability).toList();
    }

    public Worker createWorker(Worker worker) {
        worker.setAvailable(worker.isAvailable());
        Worker saved = workerRepository.save(worker);
        return enrichWorkerAvailability(saved);
    }

    @Transactional(readOnly = true)
    public List<Issue> getTasksForCurrentWorker() {
        User currentUser = getCurrentUser();
        if (currentUser == null || currentUser.getId() == null) {
            throw new RuntimeException("Please login to view tasks");
        }

        Worker worker = workerRepository.findAll().stream()
                .filter(item -> item.getUser() != null && currentUser.getId().equals(item.getUser().getId()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("No worker profile linked to this account"));

        return repository.findAll().stream()
                .filter(issue -> issue.getAssignedWorker() != null
                && issue.getAssignedWorker().getId() != null
                && issue.getAssignedWorker().getId().equals(worker.getId()))
                .map(this::enrichIssueCounts)
                .toList();
    }

    @Transactional
    public void updateTaskStatusForCurrentWorker(UUID issueId, String status) {
        User currentUser = getCurrentUser();
        if (currentUser == null || currentUser.getId() == null) {
            throw new RuntimeException("Please login to update task status");
        }

        Worker worker = workerRepository.findAll().stream()
                .filter(item -> item.getUser() != null && currentUser.getId().equals(item.getUser().getId()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("No worker profile linked to this account"));

        Issue issue = getIssueById(issueId);
        if (issue.getAssignedWorker() == null
                || issue.getAssignedWorker().getId() == null
                || !issue.getAssignedWorker().getId().equals(worker.getId())) {
            throw new RuntimeException("You are not assigned to this issue");
        }

        String normalizedStatus = status == null ? "" : status.trim().toUpperCase(Locale.ROOT);
        if (!"IN_PROGRESS".equals(normalizedStatus) && !"REVIEW".equals(normalizedStatus)) {
            throw new RuntimeException("Workers can only set status to IN_PROGRESS or REVIEW");
        }

        updateStatus(issueId, normalizedStatus);
    }

    @Transactional
    public Map<String, Object> submitTaskForReview(UUID issueId, String photoUrl) {
        User currentUser = getCurrentUser();
        if (currentUser == null || currentUser.getId() == null) {
            throw new RuntimeException("Please login to submit task for review");
        }

        Worker worker = workerRepository.findAll().stream()
                .filter(item -> item.getUser() != null && currentUser.getId().equals(item.getUser().getId()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("No worker profile linked to this account"));

        Issue issue = getIssueById(issueId);
        if (issue.getAssignedWorker() == null
                || issue.getAssignedWorker().getId() == null
                || !issue.getAssignedWorker().getId().equals(worker.getId())) {
            throw new RuntimeException("You are not assigned to this issue");
        }

        if (photoUrl == null || photoUrl.isBlank()) {
            throw new RuntimeException("Photo is required for review submission");
        }

        // Update issue with review photo and set status to REVIEW
        issue.setReviewPhotoUrl(photoUrl);
        issue.setStatus(com.civicwatch.model.Status.REVIEW);
        repository.save(issue);

        logAudit("TASK_SUBMITTED_FOR_REVIEW", "Issue " + issueId + " submitted for review by worker");

        Map<String, Object> response = new HashMap<>();
        response.put("ok", true);
        response.put("message", "Task submitted for review");
        return response;
    }

    @Transactional
    public Map<String, Object> approveReview(UUID issueId) {
        Issue issue = getIssueById(issueId);
        if (issue.getStatus() != com.civicwatch.model.Status.REVIEW) {
            throw new RuntimeException("Only tasks in REVIEW status can be approved");
        }

        // Approve: set status to RESOLVED (or IN_PROGRESS if they want more work)
        updateStatus(issueId, "RESOLVED");

        logAudit("REVIEW_APPROVED", "Issue " + issueId + " review approved");

        Map<String, Object> response = new HashMap<>();
        response.put("ok", true);
        response.put("message", "Review approved, task marked as resolved");
        return response;
    }

    @Transactional
    public Map<String, Object> rejectReview(UUID issueId, String notes) {
        Issue issue = getIssueById(issueId);
        if (issue.getStatus() != com.civicwatch.model.Status.REVIEW) {
            throw new RuntimeException("Only tasks in REVIEW status can be rejected");
        }

        // Reject: move back to IN_PROGRESS, keep notes, and clear old review evidence so worker can resubmit.
        int updated = jdbcTemplate.update(
                "UPDATE issues SET status = 'IN_PROGRESS', review_notes = ?, review_photo_url = NULL WHERE id::text = ?",
                Objects.toString(notes, ""),
                issueId.toString()
        );
        if (updated == 0) {
            throw new RuntimeException("Issue not found");
        }

        if (issue.getAssignedWorker() != null && issue.getAssignedWorker().getId() != null) {
            refreshWorkerAvailabilityById(issue.getAssignedWorker().getId());
        }

        logAudit("REVIEW_REJECTED", "Issue " + issueId + " review rejected with notes: " + notes);

        Map<String, Object> response = new HashMap<>();
        response.put("ok", true);
        response.put("message", "Review rejected, task returned to worker");
        return response;
    }

    @Transactional(readOnly = true)
    public List<Issue> getReviewPendingTasks() {
        // Admin endpoint to get all tasks pending review
        return repository.findAll().stream()
                .filter(issue -> issue.getStatus() == com.civicwatch.model.Status.REVIEW)
                .map(this::enrichIssueCounts)
                .toList();
    }

    @Transactional
    public Map<String, Object> createWorkerWithCredentials(WorkerCreateRequest request) {
        String name = clean(request.getName());
        String specialization = clean(request.getSpecialization());
        String phone = clean(request.getPhone());
        String email = clean(request.getEmail());
        String password = clean(request.getPassword());

        if (name == null || name.isBlank()) {
            throw new RuntimeException("Worker name is required");
        }

        if (email == null || email.isBlank()) {
            throw new RuntimeException("Worker email is required");
        }

        if (password == null || password.isBlank()) {
            throw new RuntimeException("Worker password is required");
        }

        String resolvedEmail = email.toLowerCase(Locale.ROOT);
        if (userRepository.findByEmail(resolvedEmail).isPresent()) {
            throw new RuntimeException("A worker account with this email already exists");
        }

        String resolvedPassword = password;

        User workerUser = User.builder()
                .name(name)
                .email(resolvedEmail)
                .password(passwordEncoder.encode(resolvedPassword))
                .role(Role.WORKER)
                .reputationPoints(0)
                .isBlocked(false)
                .build();
        User savedUser = userRepository.save(workerUser);

        Worker worker = Worker.builder()
                .name(name)
                .specialization(specialization)
                .phone(phone)
                .isAvailable(true)
                .user(savedUser)
                .build();
        Worker savedWorker = workerRepository.save(worker);
        savedWorker = enrichWorkerAvailability(savedWorker);

        logAudit("WORKER_CREATED", "Worker " + savedWorker.getId() + " created with user " + savedUser.getEmail());

        Map<String, Object> response = new HashMap<>();
        response.put("worker", savedWorker);
        response.put("credentials", Map.of(
                "email", savedUser.getEmail(),
                "password", resolvedPassword
        ));
        return response;
    }

    @Transactional
    public Map<String, Object> removeWorker(UUID workerId) {
        if (workerId == null) {
            throw new RuntimeException("workerId is required");
        }

        Long exists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM workers WHERE id::text = ?",
                Long.class,
                workerId.toString()
        );
        if (exists == null || exists == 0) {
            throw new RuntimeException("Worker not found");
        }

        String workerUserId = jdbcTemplate.queryForObject(
                "SELECT user_id::text FROM workers WHERE id::text = ?",
                String.class,
                workerId.toString()
        );

        int reassigned = jdbcTemplate.update(
                """
                UPDATE issues
                SET worker_id = NULL,
                    status = CASE
                        WHEN status IN ('OPEN', 'IN_PROGRESS', 'REVIEW') THEN 'OPEN'
                        ELSE status
                    END
                WHERE worker_id::text = ?
                """,
                workerId.toString()
        );

        int removed = jdbcTemplate.update(
                "DELETE FROM workers WHERE id::text = ?",
                workerId.toString()
        );

        int blockedUsers = 0;
        if (workerUserId != null && !workerUserId.isBlank()) {
            blockedUsers = jdbcTemplate.update(
                    "UPDATE users SET is_blocked = TRUE WHERE id::text = ?",
                    workerUserId
            );
        }

        logAudit(
                "WORKER_REMOVED",
                "Worker " + workerId + " removed. Issues reset=" + reassigned + ", linked user blocked=" + blockedUsers
        );

        Map<String, Object> response = new HashMap<>();
        response.put("removed", removed);
        response.put("issuesReset", reassigned);
        response.put("linkedUserBlocked", blockedUsers);
        return response;
    }

    private long getActiveAssignmentCount(UUID workerId) {
        if (workerId == null) {
            return 0;
        }
        Long count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM issues
                WHERE worker_id IS NOT NULL
                  AND worker_id::text = ?
                  AND status IN ('OPEN', 'IN_PROGRESS')
                """,
                Long.class,
                workerId.toString()
        );
        return count == null ? 0 : count;
    }

    private Worker enrichWorkerAvailability(Worker worker) {
        if (worker == null || worker.getId() == null) {
            return worker;
        }
        long activeCount = getActiveAssignmentCount(worker.getId());
        worker.setActiveIssueCount(activeCount);
        worker.setAvailable(activeCount < MAX_ACTIVE_ISSUES_PER_WORKER);
        return worker;
    }

    private void refreshWorkerAvailabilityById(UUID workerId) {
        if (workerId == null) {
            return;
        }
        long activeCount = getActiveAssignmentCount(workerId);
        boolean isAvailable = activeCount < MAX_ACTIVE_ISSUES_PER_WORKER;
        jdbcTemplate.update(
                "UPDATE workers SET is_available = ? WHERE id::text = ?",
                isAvailable,
                workerId.toString()
        );
    }

    @Transactional(readOnly = true)
    public Map<String, String> getSystemConfig() {
        try {
            ensureSystemConfigTable();
            List<Map<String, Object>> rows = jdbcTemplate.queryForList("SELECT key, value FROM system_config");

            if (rows.isEmpty()) {
                Map<String, String> defaults = getDefaultSystemConfig();
                defaults.forEach((k, v) -> jdbcTemplate.update(
                        "INSERT INTO system_config(key, value, updated_at) VALUES (?, ?, NOW())",
                        k,
                        v
                ));
                return new HashMap<>(defaults);
            }

            Map<String, String> config = new HashMap<>();
            for (Map<String, Object> row : rows) {
                config.put(String.valueOf(row.get("key")), String.valueOf(row.get("value")));
            }
            return config;
        } catch (DataAccessException ignored) {
            // Keep admin panel usable if database config table cannot be read.
            return new HashMap<>(getDefaultSystemConfig());
        }
    }

    @Transactional
    public Map<String, String> updateSystemConfig(Map<String, String> configValues) {
        ensureSystemConfigTable();
        for (Map.Entry<String, String> entry : configValues.entrySet()) {
            if (entry.getKey() == null || entry.getKey().isBlank()) {
                continue;
            }
            jdbcTemplate.update(
                    """
                    INSERT INTO system_config(key, value, updated_at)
                    VALUES (?, ?, NOW())
                    ON CONFLICT (key)
                    DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
                    """,
                    entry.getKey(),
                    Objects.toString(entry.getValue(), "")
            );
        }
        logAudit("SYSTEM_CONFIG_UPDATED", "Admin updated system configuration");
        return getSystemConfig();
    }

    @Transactional
    public Map<String, Object> broadcastNotification(Map<String, String> request) {
        ensureAdminTables();
        String title = clean(request.get("title"));
        String message = clean(request.get("message"));
        String link = clean(request.get("link"));
        String audience = normalizeNotificationAudience(request.get("audience"));
        if (title == null || title.isBlank() || message == null || message.isBlank()) {
            throw new RuntimeException("Title and message are required");
        }

        int recipients = sendSystemNotificationByAudience(title, message, link, audience);

        logAudit("NOTIFICATION_BROADCAST", "Broadcast sent to " + recipients + " recipients audience=" + audience + ": " + title);
        Map<String, Object> response = new HashMap<>();
        response.put("recipients", recipients);
        response.put("title", title);
        response.put("audience", audience);
        return response;
    }

    @Transactional
    public Map<String, Object> scheduleNotification(Map<String, String> request) {
        ensureAdminTables();
        ensureNotificationScheduleTable();

        String title = clean(request.get("title"));
        String message = clean(request.get("message"));
        String link = clean(request.get("link"));
        String scheduleAtRaw = clean(request.get("scheduleAt"));
        String audience = normalizeNotificationAudience(request.get("audience"));

        if (title == null || title.isBlank() || message == null || message.isBlank()) {
            throw new RuntimeException("Title and message are required");
        }
        if (scheduleAtRaw == null || scheduleAtRaw.isBlank()) {
            throw new RuntimeException("scheduleAt is required");
        }

        LocalDateTime scheduleAt;
        try {
            scheduleAt = LocalDateTime.parse(scheduleAtRaw);
        } catch (Exception ex) {
            throw new RuntimeException("Invalid scheduleAt. Use ISO format like 2026-04-07T10:30");
        }

        User currentUser = getCurrentUser();
        String creatorId = (currentUser != null && currentUser.getId() != null) ? currentUser.getId().toString() : null;
        String scheduleId = UUID.randomUUID().toString();

        jdbcTemplate.update(
                """
                INSERT INTO notification_schedules (id, title, message, link, audience, schedule_at, status, created_by, created_at)
                VALUES (CAST(? AS uuid), ?, ?, ?, ?, ?, 'PENDING', CAST(NULLIF(?, '') AS uuid), NOW())
                """,
                scheduleId,
                title,
                message,
                (link == null || link.isBlank()) ? "/activity" : link,
                audience,
                Timestamp.valueOf(scheduleAt),
                creatorId == null ? "" : creatorId
        );

        Map<String, Object> response = new HashMap<>();
        response.put("id", scheduleId);
        response.put("status", "PENDING");
        response.put("scheduleAt", scheduleAt.toString());
        response.put("title", title);
        response.put("audience", audience);

        logAudit("NOTIFICATION_SCHEDULED", "Scheduled notification " + scheduleId + " audience=" + audience + " at " + scheduleAt);
        return response;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getScheduledNotifications() {
        try {
            ensureNotificationScheduleTable();
            String sql = """
                    SELECT id::text AS id,
                           title,
                           message,
                           link,
                           audience,
                           schedule_at,
                           status,
                           recipients,
                           created_at,
                           processed_at
                    FROM notification_schedules
                    ORDER BY schedule_at DESC
                    LIMIT 200
                    """;

            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);
            return rows.stream().map(row -> {
                Map<String, Object> entry = new HashMap<>();
                entry.put("id", String.valueOf(getRowValue(row, "id", "")));
                entry.put("title", String.valueOf(getRowValue(row, "title", "")));
                entry.put("message", String.valueOf(getRowValue(row, "message", "")));
                entry.put("link", String.valueOf(getRowValue(row, "link", "/activity")));
                entry.put("audience", String.valueOf(getRowValue(row, "audience", "USERS")));
                entry.put("status", String.valueOf(getRowValue(row, "status", "PENDING")));
                entry.put("recipients", getRowValue(row, "recipients", 0));
                entry.put("scheduleAt", String.valueOf(getRowValue(row, "schedule_at", "")));
                entry.put("createdAt", String.valueOf(getRowValue(row, "created_at", "")));
                entry.put("processedAt", String.valueOf(getRowValue(row, "processed_at", "")));
                return entry;
            }).toList();
        } catch (DataAccessException ignored) {
            // Keep the admin page usable if the schedule table is unavailable.
            return List.of();
        }
    }

    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void dispatchScheduledNotifications() {
        try {
            ensureNotificationScheduleTable();
            List<Map<String, Object>> dueRows = jdbcTemplate.queryForList(
                    """
                    SELECT id::text AS id, title, message, link, audience
                    FROM notification_schedules
                    WHERE status = 'PENDING'
                      AND schedule_at <= (NOW() AT TIME ZONE 'Asia/Kolkata')
                    ORDER BY schedule_at ASC
                    LIMIT 100
                    """
            );

            for (Map<String, Object> row : dueRows) {
                String id = String.valueOf(getRowValue(row, "id", ""));
                try {
                    String title = String.valueOf(getRowValue(row, "title", ""));
                    String message = String.valueOf(getRowValue(row, "message", ""));
                    String link = String.valueOf(getRowValue(row, "link", "/activity"));
                    String audience = normalizeNotificationAudience(String.valueOf(getRowValue(row, "audience", "USERS")));

                    int recipients = sendSystemNotificationByAudience(title, message, link, audience);
                    jdbcTemplate.update(
                            """
                            UPDATE notification_schedules
                            SET status = 'SENT', processed_at = NOW(), recipients = ?
                            WHERE id::text = ?
                            """,
                            recipients,
                            id
                    );
                    logAudit("NOTIFICATION_SCHEDULE_SENT", "Scheduled notification sent: " + id + " audience=" + audience + " recipients=" + recipients);
                } catch (RuntimeException ex) {
                    jdbcTemplate.update(
                            """
                            UPDATE notification_schedules
                            SET status = 'FAILED', processed_at = NOW(), recipients = 0
                            WHERE id::text = ?
                            """,
                            id
                    );
                    logAudit("NOTIFICATION_SCHEDULE_FAILED", "Scheduled notification failed: " + id + " reason=" + ex.getMessage());
                }
            }
        } catch (DataAccessException ignored) {
            // Scheduler should never crash the app on transient DB failures.
        }
    }

    private String normalizeNotificationAudience(String rawAudience) {
        String audience = rawAudience == null ? "USERS" : rawAudience.trim().toUpperCase(Locale.ROOT);
        if ("ALL".equals(audience) || "ALL_EXCEPT_ADMIN".equals(audience) || "NON_ADMIN".equals(audience)) {
            return "ALL";
        }
        if ("USER".equals(audience) || "USERS".equals(audience)) {
            return "USERS";
        }
        if ("WORKER".equals(audience) || "WORKERS".equals(audience)) {
            return "WORKERS";
        }
        throw new RuntimeException("Invalid audience. Use USERS, WORKERS, or ALL");
    }

    private int sendSystemNotificationByAudience(String title, String message, String link, String audience) {
        String normalizedAudience = normalizeNotificationAudience(audience);
        if ("ALL".equals(normalizedAudience)) {
            return jdbcTemplate.update(
                    """
                    INSERT INTO notifications (user_id, type, title, message, is_read, link, created_at)
                    SELECT id, 'SYSTEM', ?, ?, FALSE, ?, NOW()
                    FROM users
                    WHERE is_blocked = FALSE
                    """,
                    title,
                    message,
                    (link == null || link.isBlank()) ? "/activity" : link
            );
        }

        String role = "USERS".equals(normalizedAudience) ? "USER" : "WORKER";
        return jdbcTemplate.update(
                """
                INSERT INTO notifications (user_id, type, title, message, is_read, link, created_at)
                SELECT id, 'SYSTEM', ?, ?, FALSE, ?, NOW()
                FROM users
                WHERE is_blocked = FALSE
                  AND role = ?
                """,
                title,
                message,
                (link == null || link.isBlank()) ? "/activity" : link,
                role
        );
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAuditLogs() {
        try {
            ensureAdminTables();

            // Record that audit logs were viewed so the panel always reflects recent admin activity.
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String actor = (auth != null && auth.isAuthenticated()) ? auth.getName() : "system";
            jdbcTemplate.update(
                    "INSERT INTO audit_logs(id, actor, action, details, created_at) VALUES (?, ?, ?, ?, NOW())",
                    UUID.randomUUID(),
                    actor,
                    "AUDIT_LOGS_VIEWED",
                    "Admin opened audit logs"
            );

            String sql = """
                    SELECT id::text AS id,
                           actor,
                           action,
                           details,
                           created_at,
                           (EXTRACT(EPOCH FROM created_at) * 1000)::bigint AS created_at_epoch_ms
                    FROM audit_logs
                    ORDER BY created_at DESC
                    LIMIT 100
                    """;

            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);
            return rows.stream().map(row -> {
                Map<String, Object> entry = new HashMap<>();
                entry.put("id", String.valueOf(getRowValue(row, "id", "")));
                entry.put("actor", String.valueOf(getRowValue(row, "actor", "system")));
                entry.put("action", String.valueOf(getRowValue(row, "action", "UNKNOWN")));
                entry.put("details", String.valueOf(getRowValue(row, "details", "")));

                Object createdAtValue = getRowValue(row, "created_at", null);
                LocalDateTime createdAtLocal = toLocalDateTime(createdAtValue);
                long createdAtEpochMs = createdAtLocal.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
                entry.put("createdAt", createdAtLocal.toString());
                entry.put("createdAtEpochMs", createdAtEpochMs);
                return entry;
            }).toList();
        } catch (DataAccessException ignored) {
            // Keep admin UI functional even if audit table cannot be created/read.
            return List.of();
        }
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getMyNotifications() {
        User currentUser = getCurrentUser();
        if (currentUser == null || currentUser.getId() == null) {
            throw new RuntimeException("Please login to view notifications");
        }

        String sql = """
                SELECT id::text AS id,
                       type,
                       title,
                       message,
                       is_read,
                       link,
                       created_at,
                       (EXTRACT(EPOCH FROM created_at) * 1000)::bigint AS created_at_epoch_ms
                FROM notifications
                WHERE user_id::text = ?
                ORDER BY created_at DESC
                LIMIT 50
                """;

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, currentUser.getId().toString());
        return rows.stream().map(row -> {
            Map<String, Object> entry = new HashMap<>();
            entry.put("id", String.valueOf(getRowValue(row, "id", "")));
            entry.put("type", String.valueOf(getRowValue(row, "type", "SYSTEM")));
            entry.put("title", String.valueOf(getRowValue(row, "title", "Notification")));
            entry.put("message", String.valueOf(getRowValue(row, "message", "")));
            entry.put("isRead", Boolean.TRUE.equals(getRowValue(row, "is_read", false)));
            entry.put("link", String.valueOf(getRowValue(row, "link", "")));

            Object createdAtValue = getRowValue(row, "created_at", null);
            LocalDateTime createdAtLocal = toLocalDateTime(createdAtValue);
            Object createdAtEpochValue = getRowValue(row, "created_at_epoch_ms", null);
            long createdAtEpochMs = (createdAtEpochValue instanceof Number number)
                    ? number.longValue()
                    : createdAtLocal.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
            entry.put("createdAt", Instant.ofEpochMilli(createdAtEpochMs).toString());
            entry.put("createdAtEpochMs", createdAtEpochMs);
            return entry;
        }).toList();
    }

    @Transactional
    public Map<String, Object> markAllNotificationsRead() {
        User currentUser = getCurrentUser();
        if (currentUser == null || currentUser.getId() == null) {
            throw new RuntimeException("Please login to update notifications");
        }

        int updated = jdbcTemplate.update(
                "UPDATE notifications SET is_read = TRUE WHERE user_id::text = ? AND is_read = FALSE",
                currentUser.getId().toString()
        );

        Map<String, Object> response = new HashMap<>();
        response.put("updated", updated);
        return response;
    }

    @Transactional
    public Map<String, Object> markNotificationRead(String notificationId) {
        User currentUser = getCurrentUser();
        if (currentUser == null || currentUser.getId() == null) {
            throw new RuntimeException("Please login to update notifications");
        }
        if (notificationId == null || notificationId.isBlank()) {
            throw new RuntimeException("Notification id is required");
        }

        int updated = jdbcTemplate.update(
                "UPDATE notifications SET is_read = TRUE WHERE id::text = ? AND user_id::text = ?",
                notificationId,
                currentUser.getId().toString()
        );

        Map<String, Object> response = new HashMap<>();
        response.put("updated", updated);
        response.put("id", notificationId);
        return response;
    }

    private Issue enrichIssueCounts(Issue issue) {
        if (issue == null || issue.getId() == null) {
            return issue;
        }
        issue.setVoteCount(voteRepository.countByIssueId(issue.getId()));
        issue.setCommentCount(commentRepository.countByIssueId(issue.getId()));
        return issue;
    }

    private void addReputationPoints(User user, int delta) {
        if (user == null || delta == 0) {
            return;
        }
        // Business rule: admins never gain points
        if (user.getRole() == Role.ADMIN) {
            return;
        }
        user.setReputationPoints(Math.max(0, user.getReputationPoints() + delta));
        userRepository.save(user);
    }

    private void ensureAdminTables() {
        ensureSystemConfigTable();
        ensureIssueReviewColumns();
        ensureNotificationScheduleTable();
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS audit_logs (
                    id UUID PRIMARY KEY,
                    actor TEXT,
                    action TEXT,
                    details TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """);
    }

    private void ensureSystemConfigTable() {
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS system_config (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """);
    }

    private void ensureIssueReviewColumns() {
        jdbcTemplate.execute("ALTER TABLE issues ADD COLUMN IF NOT EXISTS review_photo_url TEXT");
        jdbcTemplate.execute("ALTER TABLE issues ADD COLUMN IF NOT EXISTS review_notes TEXT");
    }

    private void ensureNotificationScheduleTable() {
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS notification_schedules (
                    id UUID PRIMARY KEY,
                    title TEXT NOT NULL,
                    message TEXT NOT NULL,
                    link TEXT,
                    audience TEXT NOT NULL DEFAULT 'USERS',
                    schedule_at TIMESTAMP NOT NULL,
                    status TEXT NOT NULL DEFAULT 'PENDING',
                    recipients INTEGER DEFAULT 0,
                    created_by UUID,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    processed_at TIMESTAMP
                )
                """);
        jdbcTemplate.execute("ALTER TABLE notification_schedules ADD COLUMN IF NOT EXISTS audience TEXT NOT NULL DEFAULT 'USERS'");
    }

    private Map<String, String> getDefaultSystemConfig() {
        return Map.of(
                "maintenanceMode", "false",
                "autoAssignRadiusKm", "5",
                "maxOpenIssuesPerUser", "10"
        );
    }

    private void logAudit(String action, String details) {
        try {
            ensureAdminTables();
            String actor = "system";
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated()) {
                actor = auth.getName();
            }
            jdbcTemplate.update(
                    "INSERT INTO audit_logs(id, actor, action, details, created_at) VALUES (?, ?, ?, ?, NOW())",
                    UUID.randomUUID(),
                    actor,
                    action,
                    details
            );
        } catch (DataAccessException ignored) {
            // Audit logging should never block core admin actions.
        }
    }

    private String clean(String value) {
        return value == null ? null : value.trim();
    }
}
