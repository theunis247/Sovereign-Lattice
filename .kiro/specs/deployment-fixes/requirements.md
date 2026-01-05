# Deployment Fixes Requirements Document

## Introduction

This specification addresses critical deployment issues preventing the application from running properly in production environments, specifically Pterodactyl hosting. The main issues are missing dotenv dependency causing server crashes and concurrently compatibility problems with minimal container environments.

## Glossary

- **Pterodactyl**: Game server management panel with minimal container environments
- **dotenv**: Node.js module for loading environment variables from .env files
- **concurrently**: npm package for running multiple commands simultaneously
- **tsx**: TypeScript execution engine for Node.js
- **PM2**: Production process manager for Node.js applications
- **API Server**: Backend server component handling API requests
- **Frontend Server**: Vite preview server serving the built application

## Requirements

### Requirement 1

**User Story:** As a developer, I want the application to start successfully in production environments, so that users can access the deployed application without crashes.

#### Acceptance Criteria

1. WHEN the application starts in production, THE System SHALL load environment variables without module resolution errors
2. THE System SHALL include dotenv as a runtime dependency in package.json
3. IF dotenv module is missing, THEN THE System SHALL provide clear error handling and installation guidance
4. THE System SHALL start the API server without requiring external process management utilities

### Requirement 2

**User Story:** As a system administrator, I want the application to run reliably in minimal container environments, so that deployment is stable across different hosting platforms.

#### Acceptance Criteria

1. THE System SHALL operate without requiring the 'ps' command for process management
2. WHEN deployed in Pterodactyl or similar minimal environments, THE System SHALL start successfully
3. THE System SHALL use production-appropriate process management instead of development tools
4. IF concurrently fails due to missing system utilities, THEN THE System SHALL fallback to alternative process management

### Requirement 3

**User Story:** As a developer, I want proper separation between development and production deployment strategies, so that production deployments are optimized and stable.

#### Acceptance Criteria

1. THE System SHALL provide separate startup commands for development and production environments
2. WHEN in production mode, THE System SHALL serve static files efficiently without running Vite preview
3. THE System SHALL use PM2 or equivalent production process manager for multi-service orchestration
4. THE System SHALL include deployment documentation with environment-specific instructions

### Requirement 4

**User Story:** As a developer, I want clear troubleshooting guidance for deployment issues, so that I can quickly resolve problems in different hosting environments.

#### Acceptance Criteria

1. THE System SHALL provide diagnostic scripts to verify deployment requirements
2. WHEN deployment fails, THE System SHALL offer specific fix recommendations based on the error type
3. THE System SHALL include environment compatibility checks for different hosting platforms
4. THE System SHALL document common deployment issues and their solutions