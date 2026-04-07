package com.civicwatch.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class IssueResponse {
    private String id;
    private String title;
    private String description;
    private String category;
    private double latitude;
    private double longitude;
    private String address;
    private String imageUrl;
    private String severity;
    private String status;
    private LocalDateTime createdAt;
    private UserDto createdBy;
    private long voteCount;
    private long commentCount;
}
