# Chomper - Gamified Task Management App

## Overview

Chomper is a mobile-first task management application with a unique gamification twist: a virtual monster companion that "chomps" on completed tasks. The app combines clean, minimalist productivity features with delightful character-driven motivation. Built as a full-stack web application, it uses a modern React frontend with a Node.js/Express backend and PostgreSQL database.

The core concept is simple: users create and manage tasks, and when they complete them, their monster companion celebrates by "chomping" the task, earning happiness points and building streaks. This creates an engaging feedback loop that makes productivity feel rewarding and fun.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript, using Vite as the build tool and development server.

**UI Component System**: Radix UI primitives with shadcn/ui component library, styled with Tailwind CSS. The design system uses a "minimalism with personality" philosophy - clean, spacious layouts with playful gamified elements layered on top.

**Routing**: Wouter for lightweight client-side routing. Four main views:
- Home (`/`) - Task list and input
- Progress (`/progress`) - Combined monster companion and statistics (achievements unlock monsters)
- Recurring (`/recurring`) - Dedicated page for managing recurring/repeating tasks
- Settings (`/settings`) - Theme, preferences, data management

**State Management**: TanStack Query (React Query) for server state management with optimistic updates. No additional global state library needed - component state and React Query handle all data flow.

**Animation**: Framer Motion for smooth transitions, celebrations, and monster animations. Key use case is the celebration overlay when tasks are completed.

**Mobile-First Design**: Max width of 512px (max-w-lg), single-column layouts, bottom navigation bar for primary navigation. The app is designed primarily for mobile use with desktop as a larger viewport of the same experience.

**Theme System**: Custom theme provider supporting light/dark/system modes. Uses CSS variables for all colors, with warm minimalist palette for light mode and appropriate dark mode counterpart.

### Backend Architecture

**Server Framework**: Express.js on Node.js with TypeScript.

**API Design**: RESTful JSON API with the following endpoints:
- `GET /api/tasks` - Retrieve all tasks
- `GET /api/tasks/:id` - Get single task
- `POST /api/tasks` - Create new task
- `PATCH /api/tasks/:id` - Update task (primarily for completion)
- `DELETE /api/tasks/:id` - Delete task
- `DELETE /api/tasks/completed` - Bulk delete completed tasks
- `GET /api/stats` - Get monster statistics
- `PATCH /api/stats` - Update monster stats

**Data Layer**: Storage abstraction (IStorage interface) with DatabaseStorage implementation. This allows the business logic to be decoupled from the specific database implementation.

**Database ORM**: Drizzle ORM for type-safe database queries and migrations. Schema definitions use Drizzle's type system, with Zod schemas generated for runtime validation.

**Build Process**: Custom esbuild configuration that bundles server code with select dependencies (allowlist approach) to reduce file system calls and improve cold start performance. Client built with Vite.

**Development Mode**: In development, uses Vite's middleware mode for HMR (Hot Module Replacement) with the Express server.

### Authentication

**Replit Auth (OIDC)**: Users authenticate via Replit's OpenID Connect flow, supporting Google, GitHub, X, Apple, and email/password login methods.

**Auth Flow**:
- `/api/login` - Initiates Replit OAuth login
- `/api/callback` - OAuth callback endpoint
- `/api/logout` - Logs user out and clears session
- `/api/auth/user` - Returns current authenticated user

**Session Management**: PostgreSQL-backed sessions using connect-pg-simple with 7-day TTL. Session secret stored in environment variable.

**Client Auth**: useAuth hook checks authentication state and displays landing page for logged-out users.

### Database Schema

**PostgreSQL** with four main tables:

1. **sessions** - Session storage for authentication
   - sid (primary key)
   - sess (JSONB)
   - expire (timestamp)

2. **users** - User profiles from Replit Auth
   - id (varchar, primary key - from OIDC sub claim)
   - email (varchar, unique)
   - firstName, lastName (varchar)
   - profileImageUrl (varchar)
   - createdAt, updatedAt (timestamp)

3. **tasks** - Core task data (scoped by userId)
   - id (UUID, primary key)
   - userId (varchar, references users.id)
   - title (text)
   - completed (boolean, default false)
   - category (text: personal, work, health, other)
   - notes (text, nullable)
   - dueDate (timestamp, nullable)
   - createdAt (timestamp, auto-generated)
   - completedAt (timestamp, nullable)
   - priority (text, default "medium")
   - isRecurring (boolean, default false)
   - recurringPattern (text: daily, weekly, monthly)
   - scheduledFor (timestamp, for scheduled recurring tasks)

4. **monsterStats** - Gamification metrics (scoped by userId)
   - id (UUID, primary key)
   - userId (varchar, references users.id)
   - tasksChomped (integer, total completed)
   - currentStreak (integer, consecutive days)
   - longestStreak (integer, record)
   - lastActiveDate (timestamp)
   - happinessLevel (integer 0-100, default 50)

5. **achievements** - User achievements (scoped by userId)
   - id (varchar, primary key)
   - userId (varchar, references users.id)
   - name, description, icon, type (text)
   - requirement (integer)
   - unlockedAt (timestamp, nullable)

**Schema Management**: Drizzle Kit handles migrations. Schema definitions in `shared/schema.ts` are the single source of truth, with generated Zod schemas for validation.

### Key Design Decisions

**Monorepo Structure**: Client, server, and shared code in a single repository with path aliases (`@/`, `@shared/`, `@assets/`) for clean imports.

**Type Safety**: End-to-end TypeScript with shared types between client and server. Database schema types are derived from Drizzle definitions and used throughout the application.

**Validation Strategy**: Zod schemas generated from Drizzle schemas using drizzle-zod. This ensures database constraints match runtime validation with a single source of truth.

**Session Management**: Uses connect-pg-simple for PostgreSQL-backed sessions (infrastructure present but not fully wired in current auth flow).

**Asset Management**: Design guidelines document specifies the visual language, which includes a custom monster character design and specific typography/spacing systems.

**Error Handling**: Client-side toast notifications for user feedback. Server-side logging with timestamps. Form validation happens both client-side (immediate feedback) and server-side (security).

## External Dependencies

### Core Infrastructure
- **Neon Database** (@neondatabase/serverless) - Serverless PostgreSQL database with WebSocket support for connection pooling
- **Drizzle ORM** (drizzle-orm, drizzle-kit) - Type-safe ORM and migration tool

### UI Framework & Components
- **Radix UI** (@radix-ui/*) - Unstyled, accessible component primitives for building the design system
- **shadcn/ui** - Pre-built components using Radix UI primitives (configuration in components.json)
- **Tailwind CSS** - Utility-first CSS framework with custom design tokens
- **Framer Motion** - Animation library for transitions and celebrations
- **Lucide React** - Icon system

### State & Data Management
- **TanStack Query** (@tanstack/react-query) - Server state management with caching and optimistic updates
- **React Hook Form** (@hookform/resolvers) - Form state and validation
- **Zod** (zod, zod-validation-error, drizzle-zod) - Runtime schema validation

### Utilities
- **date-fns** - Date manipulation and formatting (used for task due dates and streak calculations)
- **clsx / tailwind-merge** - Conditional className utilities
- **class-variance-authority** - Type-safe component variant management
- **nanoid** - Unique ID generation

### Development Tools
- **Vite** - Build tool and dev server with HMR
- **TypeScript** - Type system
- **Replit Vite Plugins** - Development experience enhancements (error overlay, dev banner, cartographer)

### Routing & Navigation
- **Wouter** - Lightweight client-side routing library

### Theme Management
- Custom theme provider implementation (no external library) managing light/dark/system modes with localStorage persistence

### Native Mobile App (Capacitor)

**Platform**: Capacitor wraps the web app for native iOS and Android deployment.

**Key Files**:
- `capacitor.config.ts` - Core Capacitor configuration
- `android/` - Android project files (generated with `npx cap add android`)
- `ios/` - iOS project files (generated with `npx cap add ios`)

**Push Notifications Architecture**:
The app uses a dual-channel push strategy:
- **Web Push (VAPID)**: For browser/PWA users via `web-push` library
- **Native Push (FCM/APNs)**: For native mobile apps via `@capacitor/push-notifications`

**Database Tables for Push**:
- `pushSubscriptions` - Web Push subscriptions with VAPID endpoints
- `deviceTokens` - Native FCM/APNs tokens for iOS and Android

**Notification Scheduler**:
- Cron job runs every minute checking for exact HH:MM match
- Timezone-aware delivery at user's configured time (default 7:00 AM)
- Motivational messages based on outstanding task count

**Building Native Apps**:
```bash
# Build web assets first
npm run build

# Sync to native projects
npx cap sync

# Open native IDEs
npx cap open android  # Opens Android Studio
npx cap open ios      # Opens Xcode
```

**Required Setup for Production Push**:
1. **Android**: Configure Firebase project, add `google-services.json`
2. **iOS**: Configure Apple Push Notification service (APNs) in Developer Portal
3. **Server**: Set `FIREBASE_SERVICE_ACCOUNT` environment variable for FCM