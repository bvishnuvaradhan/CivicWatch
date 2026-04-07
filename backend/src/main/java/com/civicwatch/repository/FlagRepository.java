package com.civicwatch.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.civicwatch.model.Flag;

public interface FlagRepository extends JpaRepository<Flag, UUID> {
}
