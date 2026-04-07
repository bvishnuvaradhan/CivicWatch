package com.civicwatch.config;

import com.fasterxml.jackson.databind.Module;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.fasterxml.jackson.databind.deser.std.UUIDDeserializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.UUID;

@Configuration
public class JacksonConfig {

    @Bean
    public Module uuidModule() {
        SimpleModule module = new SimpleModule();
        module.addDeserializer(UUID.class, new UUIDDeserializer());
        return module;
    }
}
