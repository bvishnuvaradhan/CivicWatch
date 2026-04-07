package com.civicwatch.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class WorkerCreateRequest {

    @NotBlank(message = "Worker name is required")
    private String name;

    private String specialization;

    private String phone;

    @NotBlank(message = "Worker email is required")
    @Email(message = "Worker email must be valid")
    private String email;

    @NotBlank(message = "Worker password is required")
    private String password;
}
