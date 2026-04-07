# CivicWatch Project Structure

This project is divided into two main parts:

## 📁 /backend (Spring Boot)
- **Framework**: Spring Boot 3.3+ (Java 21)
- **Database**: PostgreSQL (Optimized for Neon with PostGIS)
- **Security**: JWT-based stateless authentication
- **Spatial**: PostGIS Geography types for location-based reporting
- **Key Files**:
  - `pom.xml`: Maven dependencies
  - `src/main/java/com/civicwatch/`: Java source code
  - `src/main/resources/application.properties`: Configuration

## 📁 /frontend (React)
- **Framework**: React 18 (Vite)
- **Styling**: Tailwind CSS
- **State Management**: React Hooks & Context API
- **API Client**: Axios with JWT interceptors
- **Key Files**:
  - `package.json`: Frontend dependencies
  - `src/`: React source code
  - `vite.config.ts`: Vite configuration

## 🚀 Getting Started

### Backend
1. Open `/backend` in your Java IDE.
2. Configure your Neon database connection in `application.properties` or environment variables.
3. Run `CivicWatchApplication.java`.

### Frontend
1. Run `npm install` in the root or `/frontend`.
2. Run `npm run dev` to start the preview.
3. The frontend is configured to talk to the backend at `http://localhost:8085`.

## 🗄 Database Setup
Use the `schema.sql` file in the root directory to initialize your Neon PostgreSQL database. It includes PostGIS extensions and spatial indexes.
