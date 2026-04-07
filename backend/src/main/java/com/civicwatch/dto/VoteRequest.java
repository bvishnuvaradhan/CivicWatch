package com.civicwatch.dto;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
public class VoteRequest {
    // This DTO is intentionally empty - just for type safety
    // The vote is created server-side with current user and issue
}
