package com.civicwatch.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.civicwatch.model.Worker;

public interface WorkerRepository extends JpaRepository<Worker, UUID> {

    List<Worker> findByIsAvailableTrue();
}
