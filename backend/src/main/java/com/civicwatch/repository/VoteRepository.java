package com.civicwatch.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.civicwatch.model.Vote;

public interface VoteRepository extends JpaRepository<Vote, UUID> {

    List<Vote> findByIssueId(UUID issueId);

    long countByIssueId(UUID issueId);

    void deleteByIssueId(UUID issueId);
}
