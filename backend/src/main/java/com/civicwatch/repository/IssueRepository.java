package com.civicwatch.repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.civicwatch.model.Issue;
import com.civicwatch.model.Status;

public interface IssueRepository extends JpaRepository<Issue, UUID> {

    long countByAssignedWorkerIdAndStatusIn(UUID workerId, Collection<Status> statuses);

    List<Issue> findByCreatedByIdOrderByCreatedAtDesc(UUID createdById);
}
