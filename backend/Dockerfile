# Build stage
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app
COPY backend/ .
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=builder /app/target/civicwatch-api-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 10000
CMD ["java", "-Dserver.port=${PORT:-10000}", "-jar", "app.jar"]
