package com.civicwatch.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class IssueRequest {
    private String title;
    private String description;
    private String category;
    private double latitude;
    private double longitude;
    private String address;
    private String imageUrl;
    private String severity;
}
