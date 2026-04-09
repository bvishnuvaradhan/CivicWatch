package com.civicwatch.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.civicwatch.model.Comment;

public interface CommentRepository extends JpaRepository<Comment, UUID> {

    List<Comment> findByIssueId(UUID issueId);

    long countByIssueId(UUID issueId);

    void deleteByIssueId(UUID issueId);
}
