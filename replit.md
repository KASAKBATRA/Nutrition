# NutriCare++ - Smart Health and Nutrition Companion

## Overview

NutriCare++ is a comprehensive full-stack health and nutrition application that combines AI-powered nutrition guidance with social features and professional consultation. The app serves as a smart companion for users looking to track their nutrition, connect with nutritionists, and engage with a health-focused community. Built with modern web technologies, it features a responsive design with a green and white theme and supports multiple languages including English, Hindi, Urdu, Punjabi, Marathi, and Gujarati.

The application provides three core experiences: a user panel for personal health tracking and social interaction, a nutritionist panel for professional consultation management, and an AI chatbot that provides context-aware nutrition advice in multiple languages.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite as the build tool and development server
- **UI Components**: Shadcn/ui component library built on Radix UI primitives with Tailwind CSS for styling
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Styling**: Tailwind CSS with custom CSS variables for theming, supporting both light and dark modes

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with structured route handling
- **Authentication**: Replit Auth integration using OpenID Connect (OIDC) with passport.js
- **Session Management**: Express sessions with PostgreSQL session store using connect-pg-simple

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Neon serverless driver
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Session Storage**: PostgreSQL table for session persistence

### Core Features Architecture
- **Multi-language Support**: Context-based language switching with comprehensive translation system
- **Food Logging**: Meal tracking with nutritional analysis and calorie counting
- **Health Tracking**: Weight, BMI, hydration, and progress monitoring with data visualization
- **Social Features**: Instagram-like community feed with posts, likes, comments, and friend system
- **Professional Consultation**: Appointment booking and management system for nutritionist interactions
- **Real-time Messaging**: Chat system for user communication
- **Responsive Design**: Mobile-first approach with floating action menus and adaptive layouts

### Authentication and Authorization
- **Provider**: Replit Auth with automatic user provisioning
- **Session Management**: Server-side sessions with PostgreSQL storage
- **User Roles**: Role-based access control supporting regular users and nutritionists
- **Security**: CSRF protection, secure session cookies, and environment-based configuration

## External Dependencies

### Third-party Services
- **AI Integration**: OpenAI GPT-4o for intelligent nutrition advice and conversational AI
- **Authentication**: Replit Auth service for user identity management
- **Database Hosting**: Neon PostgreSQL for serverless database operations
- **Development Tools**: Replit development environment with integrated tooling

### Key Libraries and Frameworks
- **UI Framework**: React 18 with extensive Radix UI component ecosystem
- **Database**: Drizzle ORM with Neon serverless PostgreSQL driver
- **Styling**: Tailwind CSS with class-variance-authority for component variants
- **Data Fetching**: TanStack Query for robust server state management
- **Form Handling**: React Hook Form with Zod validation schemas
- **Date Management**: date-fns for date formatting and manipulation
- **Icons**: Font Awesome and Lucide React for comprehensive icon coverage
- **Development**: TypeScript, Vite, and various development utilities for optimal developer experience