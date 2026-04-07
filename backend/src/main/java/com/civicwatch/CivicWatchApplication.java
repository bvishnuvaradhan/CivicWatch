package com.civicwatch;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CivicWatchApplication {

    public static void main(String[] args) {
        SpringApplication.run(CivicWatchApplication.class, args);
    }
}
