# ODIN - Optimal Dynamic Interplanetary Navigator

## Overview

ODIN is an AI-powered spacecraft trajectory planning system for autonomous Earth-to-Moon missions. The system provides real-time threat detection, intelligent decision-making capabilities, and multilingual support for space mission planning. It combines advanced orbital mechanics calculations with AI-driven autonomous planning to optimize spacecraft trajectories while ensuring crew safety and mission success.

The application is designed as an enterprise-grade, data-intensive space mission planning tool that prioritizes operational efficiency, mission-critical clarity, and professional reliability expected in aerospace applications.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with custom ODIN design system (Fluent Design approach)
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Visualization**: Plotly.js for 3D trajectory plotting and orbital mechanics visualization

### Backend Architecture
- **Primary Backend**: Node.js/Express server with TypeScript
- **Secondary Backend**: Python Flask application for specialized calculations
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Session-based authentication with bcrypt password hashing
- **API Design**: RESTful APIs with JSON responses

### Core Services
- **Trajectory Engine**: Lambert's problem solver, Hohmann transfers, and fuel optimization algorithms
- **Threat Monitor**: Space debris tracking, radiation exposure analysis, and solar activity monitoring
- **AI Decision Engine**: Autonomous decision-making for trajectory optimization and threat mitigation
- **Space Weather Service**: Real-time space weather data integration and forecasting

### Data Storage Solutions
- **Primary Database**: PostgreSQL for mission data, user accounts, and operational records
- **Schema Design**: Normalized tables for missions, trajectories, threat events, AI decisions, and space weather data
- **In-Memory Fallback**: Application gracefully handles database unavailability with in-memory storage

### Design System
- **Color Palette**: Space-themed colors (Deep Space Blue, Mission Orange, Lunar Silver)
- **Typography**: Inter for UI text, JetBrains Mono for technical data
- **Components**: Mission-critical interface with clear information hierarchy
- **Responsive Design**: Mobile-first approach with adaptive layouts

### Authentication and Authorization
- **User Management**: Username/password authentication with secure password requirements
- **Session Management**: Server-side session handling with secure cookies
- **Role-Based Access**: Designed for mission control personnel and operators

## External Dependencies

### Database Services
- **Neon Database**: PostgreSQL hosting with serverless architecture
- **Connection Pooling**: @neondatabase/serverless for efficient database connections

### UI and Component Libraries
- **Radix UI**: Accessible, unstyled UI primitives (@radix-ui/react-*)
- **Lucide React**: Icon library for consistent iconography
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development

### Visualization and Data Processing
- **Plotly.js**: 3D plotting library for trajectory visualization
- **React Plotly**: React wrapper for Plotly.js integration
- **NumPy/SciPy**: Python libraries for advanced mathematical calculations

### API and Networking
- **TanStack Query**: Powerful data synchronization for React applications
- **Axios/Fetch**: HTTP client for API communications
- **CORS**: Cross-origin resource sharing for frontend-backend communication

### Development Tools
- **TypeScript**: Type safety across frontend and backend
- **Vite**: Fast build tool with hot module replacement
- **ESBuild**: Fast JavaScript bundler for production builds
- **Drizzle Kit**: Database migration and schema management

### External Data Sources
- **NOAA Space Weather**: Space weather data integration (planned)
- **NASA CARA**: Space debris tracking data (planned)
- **Historical Datasets**: Space weather historical data for AI training

### Deployment and Infrastructure
- **Replit**: Development and hosting environment
- **WebSocket**: Real-time communication for live updates
- **Environment Variables**: Secure configuration management