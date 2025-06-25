# Replit Development Environment

## Overview

This is the Pierline Resume Optimizer - a Node.js web application successfully migrated from Replit Agent to the standard Replit environment. The platform provides resume analysis, ATS scoring, and email notifications for consultation services. It features MongoDB Atlas integration, Resend email service, and a professional interface for resume uploads and analysis.

## System Architecture

### Runtime Environment
- **Node.js Version**: 20 (LTS)
- **Platform**: Replit cloud environment
- **Nix Channel**: stable-24_05 for consistent package management

### Project Structure
The repository contains a complete web application structure:
- `.replit`: Defines the Replit environment modules and configuration
- `package.json`: Node.js dependencies and project metadata
- `index.js`: Main Express.js server with security middleware and API routes
- `public/`: Static files directory
- `public/index.html`: Frontend interface with server status checking

## Key Components

### Development Environment
- **Node.js Runtime**: Configured for modern JavaScript/TypeScript development
- **Web Module**: Enables web-based applications and HTTP server capabilities
- **Nix Package Manager**: Provides reproducible development environment

## Data Flow

The application follows a standard client-server architecture:
- Frontend: Static HTML/CSS/JavaScript served from `/public`
- Backend: Express.js server handling HTTP requests
- API endpoints: RESTful routes under `/api` namespace
- Security: Input validation, error handling, and proper HTTP status codes

## External Dependencies

### Platform Dependencies
- **Replit Platform**: Cloud-based development environment
- **Nix Package Manager**: For consistent package management across environments

### Current Dependencies
- **Express.js**: Web framework for Node.js providing HTTP server capabilities
- **MongoDB**: Database integration with Atlas cloud hosting
- **Resend**: Email service for upload notifications (API key: re_NNznr6D3_4Vqz24kz5VJgxCx2pEnrHz8u)
- **Multer**: File upload handling for PDF/DOC resume processing
- **Security**: CORS, Helmet, and rate limiting middleware
- **Authentication**: JWT-based user management system

## Deployment Strategy

### Current Setup
- **Development**: Replit cloud environment
- **Runtime**: Node.js 20 with web capabilities
- **Package Management**: Nix-based for reproducibility

### Future Considerations
The web module suggests this project may involve:
- Static site hosting
- Express.js or similar web framework
- Full-stack JavaScript application deployment

## Changelog

```
Changelog:
- June 19, 2025. Initial setup
- June 19, 2025. Migration completed from Replit Agent to standard Replit environment
  - Added Express.js server with security middleware
  - Created frontend interface with server status checking
  - Implemented proper client/server separation
  - Added API endpoints and error handling
- June 20, 2025. Complete redesign and functionality fix
  - Rebuilt React application with professional UI design
  - Fixed upload logic and blank page issues
  - Added proper branding for Pierline Consultation
  - Connected CTA buttons to actual Pierline business services
  - Implemented working download and consultation booking features
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```

## Development Notes

This is a blank slate Node.js project configured for web development. The next steps would typically involve:

1. Adding package.json for dependency management
2. Setting up project structure (src/, public/, etc.)
3. Choosing and configuring web framework
4. Implementing application logic
5. Adding database integration if needed

The current configuration provides a solid foundation for modern web application development with Node.js.