package com.civicwatch.repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.civicwatch.model.Issue;
import com.civicwatch.model.Status;

public interface IssueRepository extends JpaRepository<Issue, UUID> {

    long countByAssignedWorkerIdAndStatusIn(UUID workerId, Collection<Status> statuses);

    List<Issue> findByCreatedByIdOrderByCreatedAtDesc(UUID createdById);

    List<Issue> findAllByOrderByCreatedAtDesc();

    List<Issue> findByCategoryIgnoreCaseOrderByCreatedAtDesc(String category);

    List<Issue> findByStatusOrderByCreatedAtDesc(Status status);

    List<Issue> findByCategoryIgnoreCaseAndStatusOrderByCreatedAtDesc(String category, Status status);

    List<Issue> findByAssignedWorkerIdOrderByCreatedAtDesc(UUID workerId);

    long countByStatus(Status status);

    long countByCreatedAtBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);

    @Query("SELECT i.category, COUNT(i) FROM Issue i GROUP BY i.category")
    List<Object[]> countByCategoryGroup();

    @Query("SELECT i.status, COUNT(i) FROM Issue i GROUP BY i.status")
    List<Object[]> countByStatusGroup();

    @Query("SELECT i.createdBy.id, COUNT(i) FROM Issue i WHERE i.createdBy.id IN :userIds GROUP BY i.createdBy.id")
    List<Object[]> countReportsByCreatorIds(@Param("userIds") Collection<UUID> userIds);

    @Query("""
                        SELECT i
                        FROM Issue i
                        WHERE (:category IS NULL OR :category = '' OR UPPER(:category) = 'ALL' OR LOWER(i.category) = LOWER(:category))
                            AND (:status IS NULL OR :status = '' OR UPPER(:status) = 'ALL' OR i.status = :status)
                            AND (
                                        :search IS NULL OR :search = ''
                                        OR LOWER(COALESCE(i.title, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                                        OR LOWER(COALESCE(i.description, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                                        OR LOWER(COALESCE(i.address, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                                    )
                        ORDER BY i.createdAt DESC
                        """)
    Page<Issue> searchIssues(@Param("category") String category, @Param("status") Status status, @Param("search") String search, Pageable pageable);
}
