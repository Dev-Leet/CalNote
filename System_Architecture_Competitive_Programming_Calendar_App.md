# Detailed System Architecture: Competitive Programming Calendar + Notes App

**Version:** 1.0  
**Date:** July 4, 2026  
**Author:** Max Effort Reasoning Engine  

---

## 1. Executive Summary

This document provides a **comprehensive, detailed system architecture** for the Competitive Programming Calendar + Notes application. It covers:

- **System context and stakeholders**
- **Architectural patterns and principles**
- **Component-level design with interaction flows**
- **Data architecture and schema design**
- **API design and contracts**
- **Security architecture**
- **Deployment and infrastructure architecture**
- **Scalability and performance considerations**
- **Failure modes and resilience patterns**
- **Integration with external systems (Google Calendar, Ashna AI)**

---

## 2. System Context

### 2.1 Stakeholders

| Stakeholder            | Role                                      | Key Concerns                          |
|------------------------|-------------------------------------------|---------------------------------------|
| **End Users**          | Competitive programmers                   | Ease of use, accuracy, reliability    |
| **Development Team**   | Engineers building and maintaining system | Maintainability, testability, clarity |
| **Product Owner**      | Defines features and priorities           | Time to market, user satisfaction     |
| **DevOps/SRE**         | Infrastructure and reliability            | Uptime, performance, cost             |
| **External Systems**   | Google Calendar, Ashna AI, contest sites  | API stability, rate limits            |

### 2.2 System Boundary

**In Scope:**
- Web application (frontend + backend)
- Contest scraping and aggregation
- Google Calendar integration
- AI-powered note generation via Ashna AI
- User authentication and data management

**Out of Scope:**
- Native mobile apps (future phase)
- Contest problem-solving IDE
- Social features (leaderboards, forums)
- Payment processing (free service for MVP)

### 2.3 System Context Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                     External Systems                         │
│  ┌────────────┐  ┌───────────┐  ┌──────────┐  ┌──────────┐ │
│  │ LeetCode   │  │Codeforces │  │ CodeChef │  │ Clist.by │ │
│  │ (GraphQL)  │  │   (API)   │  │  (HTML)  │  │  (API)   │ │
│  └──────┬─────┘  └─────┬─────┘  └────┬─────┘  └────┬─────┘ │
│         │              │              │             │        │
└─────────┼──────────────┼──────────────┼─────────────┼────────┘
          │              │              │             │
          └──────────────┴──────────────┴─────────────┘
                         │
                         ▼
          ┌─────────────────────────────────┐
          │   Contest Scraper Service       │
          │   (Backend Job Queue)           │
          └────────────┬────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│              Core Application System                         │
│  ┌────────────────────────────────────────────────────┐     │
│  │                  Frontend (React)                  │     │
│  │  ┌──────────┐  ┌──────────┐  ┌─────────────────┐  │     │
│  │  │ Calendar │  │  Notes   │  │ User Dashboard  │  │     │
│  │  │   View   │  │  Editor  │  │   & Settings    │  │     │
│  │  └────┬─────┘  └────┬─────┘  └────────┬────────┘  │     │
│  └───────┼─────────────┼─────────────────┼───────────┘     │
│          │             │                 │                  │
│          └─────────────┴─────────────────┘                  │
│                        │                                     │
│                        ▼                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              API Gateway (Express)                  │   │
│  │  Auth │ Contests │ Notes │ Calendar │ User          │   │
│  └────┬──────────┬────────┬───────────┬────────────────┘   │
│       │          │        │           │                     │
│  ┌────▼──────────▼────────▼───────────▼────────────────┐   │
│  │          Business Logic Services                     │   │
│  │  AuthSvc │ ContestSvc │ NoteSvc │ CalendarSvc        │   │
│  └────┬──────────┬────────┬───────────┬────────────────┘   │
│       │          │        │           │                     │
│       └──────────┴────────┴───────────┘                     │
│                  │                                           │
│  ┌───────────────▼────────────────────────────────────┐    │
│  │          Data Access Layer (Prisma ORM)            │    │
│  └───────────────┬────────────────────────────────────┘    │
│                  │                                           │
└──────────────────┼───────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────┐
│                    Data Stores                               │
│  ┌─────────────────┐         ┌────────────────┐             │
│  │   PostgreSQL    │         │     Redis      │             │
│  │   (Primary DB)  │         │  (Cache/Queue) │             │
│  └─────────────────┘         └────────────────┘             │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                  External Integrations                       │
│  ┌────────────────────┐      ┌─────────────────────────┐    │
│  │  Google Calendar   │      │      Ashna AI           │    │
│  │      API (OAuth)   │      │   Agent Platform        │    │
│  │                    │      │  - Contest Fetcher      │    │
│  │  - Create Events   │      │  - Notes Generator      │    │
│  │  - Set Reminders   │      │                         │    │
│  └────────────────────┘      └─────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                   User (Browser)                             │
│  Competitive Programmer accessing via HTTPS                  │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Architectural Patterns & Principles

### 3.1 Core Architectural Pattern: Layered Architecture

```
┌────────────────────────────────────────┐
│      Presentation Layer (Frontend)     │  ← React, UI Components
└──────────────┬─────────────────────────┘
               │ HTTP/REST
┌──────────────▼─────────────────────────┐
│         API Layer (Controllers)        │  ← Express Routes, Validation
└──────────────┬─────────────────────────┘
               │
┌──────────────▼─────────────────────────┐
│      Business Logic Layer (Services)   │  ← Core business rules
└──────────────┬─────────────────────────┘
               │
┌──────────────▼─────────────────────────┐
│    Data Access Layer (Repositories)    │  ← Prisma ORM, DB queries
└──────────────┬─────────────────────────┘
               │
┌──────────────▼─────────────────────────┐
│         Data Layer (Database)          │  ← PostgreSQL, Redis
└────────────────────────────────────────┘
```

### 3.2 Design Principles

1. **Separation of Concerns**: Each layer has a single, well-defined responsibility.
2. **Dependency Inversion**: Higher layers depend on abstractions, not concrete implementations.
3. **Single Responsibility Principle**: Each module/class has one reason to change.
4. **Open/Closed Principle**: Open for extension (new scrapers), closed for modification.
5. **DRY (Don't Repeat Yourself)**: Shared types and utilities in `packages/shared`.
6. **KISS (Keep It Simple)**: Favor simple, readable solutions over clever complexity.
7. **Fail Fast**: Validate inputs early; use Zod schemas at API boundaries.
8. **Graceful Degradation**: Cache data; serve stale data if external services fail.

### 3.3 Cross-Cutting Concerns

| Concern          | Implementation                                      |
|------------------|-----------------------------------------------------|
| **Logging**      | Winston → Datadog; structured JSON logs             |
| **Error Handling**| Global error handler middleware; custom error types |
| **Authentication**| JWT tokens; Passport.js OAuth middleware           |
| **Authorization** | Role-based (future); currently user-scoped data    |
| **Validation**   | Zod schemas at API entry points                     |
| **Caching**      | Redis for contests, sessions; HTTP cache headers    |
| **Rate Limiting**| express-rate-limit per user/IP                      |
| **Monitoring**   | APM (Datadog), error tracking (Sentry)              |

---

## 4. Component Architecture

### 4.1 Frontend Components

#### 4.1.1 Component Hierarchy

```
App
├── Layout
│   ├── Header
│   │   ├── Logo
│   │   ├── Navigation
│   │   └── UserMenu
│   ├── Sidebar (optional)
│   └── Footer
├── Router
│   ├── HomePage
│   ├── DashboardPage
│   │   ├── UpcomingContests (ContestList)
│   │   └── QuickStats
│   ├── CalendarPage
│   │   ├── CalendarView (FullCalendar.js)
│   │   ├── ContestFilter
│   │   └── SyncButton
│   ├── NotesPage
│   │   ├── NoteList
│   │   └── NoteEditor
│   │       ├── MarkdownEditor (Tiptap)
│   │       └── GenerateNoteButton
│   └── SettingsPage
│       ├── ProfileSettings
│       ├── NotificationSettings
│       └── CalendarSettings
└── Modals
    ├── LoginModal
    ├── NoteGenerationModal
    └── ConfirmationModal
```

#### 4.1.2 State Management Strategy

**Global State (Zustand):**
- `authStore`: User authentication state, tokens
- `uiStore`: Theme, modal visibility, notifications

**Server State (TanStack Query):**
- `useContests()`: Fetch and cache contest data
- `useNotes()`: Fetch user notes
- `useCalendarSync()`: Sync status and trigger

**Local State (useState):**
- Form inputs, UI toggles, transient states

#### 4.1.3 Frontend Data Flow

```
User Action (e.g., "Sync Calendar")
         |
         ▼
Event Handler (onClick)
         |
         ▼
Service Call (calendarService.syncContests)
         |
         ▼
Axios HTTP Request → Backend API
         |
         ▼
TanStack Query (cache update, optimistic UI)
         |
         ▼
Component Re-render (success/error state)
         |
         ▼
User Feedback (toast notification)
```

### 4.2 Backend Components

#### 4.2.1 Service Layer Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  API Controllers                        │
│  (Handle HTTP, validate input, call services, format)   │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┴────────────┐
         │                        │
┌────────▼─────────┐    ┌─────────▼──────────┐
│  Core Services   │    │  Integration Svcs  │
│                  │    │                     │
│ - ContestSvc     │    │ - CalendarSvc      │
│ - NoteSvc        │    │   (Google API)     │
│ - AuthSvc        │    │ - AshnaService     │
│ - UserSvc        │    │   (AI Agents)      │
└────────┬─────────┘    └─────────┬──────────┘
         │                        │
         └───────────┬────────────┘
                     │
         ┌───────────▼────────────┐
         │   Data Access Layer    │
         │   (Prisma Repositories)│
         └───────────┬────────────┘
                     │
         ┌───────────▼────────────┐
         │    PostgreSQL + Redis  │
         └────────────────────────┘
```

#### 4.2.2 Service Interaction Example: Contest Sync Flow

```
┌─────────────┐
│ Cron Job    │  (Every 6 hours)
│ Scheduler   │
└──────┬──────┘
       │
       ▼
┌──────────────────────┐
│ contestScraperJob.ts │
└──────┬───────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│   ScraperService.scrapeAllPlatforms │
└──────┬──────────────────────────────┘
       │
       ├──► LeetCodeScraper.fetchContests()  ──┐
       ├──► CodeforcesScraper.fetchContests() ─┤
       └──► CodeChefScraper.fetchContests()   ─┤
                                                │
       ┌────────────────────────────────────────┘
       │ (Returns Contest[])
       ▼
┌──────────────────────────────────────┐
│  ContestService.upsertContests()     │
│  - Convert UTC → IST                 │
│  - Deduplicate by (platform, name)   │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Prisma: contest.upsert()            │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  PostgreSQL Database                 │
│  contests table updated              │
└──────────────────────────────────────┘
```

#### 4.2.3 Scraper Architecture (Strategy Pattern)

```typescript
// Base interface
abstract class BaseScraper {
  abstract platform: Platform;
  abstract fetchContests(): Promise<Contest[]>;
  
  protected convertToIST(utcDate: Date): Date {
    // Common timezone conversion logic
  }
  
  protected handleErrors(error: Error): void {
    // Common error handling
  }
}

// Concrete implementations
class LeetCodeScraper extends BaseScraper {
  platform = Platform.LEETCODE;
  
  async fetchContests(): Promise<Contest[]> {
    // LeetCode-specific GraphQL query
  }
}

class CodeforcesScraper extends BaseScraper {
  platform = Platform.CODEFORCES;
  
  async fetchContests(): Promise<Contest[]> {
    // Codeforces REST API call
  }
}

class CodeChefScraper extends BaseScraper {
  platform = Platform.CODECHEF;
  
  async fetchContests(): Promise<Contest[]> {
    // HTML scraping with Cheerio
  }
}
```

---

## 5. Data Architecture

### 5.1 Entity-Relationship Diagram (ERD)

```
┌──────────────────┐
│      User        │
├──────────────────┤
│ id: String (PK)  │
│ email: String    │
│ name: String?    │
│ oauthProvider    │
│ oauthToken (enc) │
│ createdAt        │
│ updatedAt        │
└────────┬─────────┘
         │
         │ 1:N
         │
    ┌────▼────────────┐
    │                 │
┌───▼─────────┐  ┌───▼─────────┐
│    Note     │  │  SyncLog    │
├─────────────┤  ├─────────────┤
│ id (PK)     │  │ id (PK)     │
│ userId (FK) │  │ userId (FK) │
│ contestId?  │  │ status      │
│ content     │  │ message?    │
│ isAiGen     │  │ syncedAt    │
│ createdAt   │  └─────────────┘
│ updatedAt   │
└──────┬──────┘
       │
       │ N:1 (optional)
       │
┌──────▼──────────────┐
│      Contest        │
├─────────────────────┤
│ id: String (PK)     │
│ platform: Enum      │
│ name: String        │
│ url: String         │
│ startTimeUtc: Date  │
│ startTimeIst: Date  │
│ duration: Int?      │
│ createdAt: Date     │
│ updatedAt: Date     │
└─────────────────────┘
  Unique: (platform, name, startTimeUtc)
  Index: (platform, startTimeIst)
```

### 5.2 Database Schema (Prisma)

See [Project Structure](#) document for full `schema.prisma`.

**Key Design Decisions:**

1. **User ID**: CUID (cryptographically random, URL-safe) for security.
2. **OAuth Token**: Stored encrypted (AES-256) with application secret.
3. **Contest Deduplication**: Unique constraint on `(platform, name, startTimeUtc)` prevents duplicates.
4. **Soft Deletes**: Not implemented in MVP; hard delete on user account deletion cascades to notes.
5. **Indexes**: 
   - `(platform, startTimeIst)` for fast contest queries.
   - `(userId, contestId)` for note lookups.

### 5.3 Redis Cache Schema

**Key Patterns:**

| Key Pattern                  | Value Type | TTL     | Purpose                          |
|------------------------------|------------|---------|----------------------------------|
| `contests:all`               | JSON Array | 6 hours | All upcoming contests            |
| `contests:platform:{name}`   | JSON Array | 6 hours | Platform-specific contests       |
| `user:session:{userId}`      | JSON       | 7 days  | User session data                |
| `ashna:note:{contestId}`     | String     | 1 hour  | Cached AI-generated notes        |
| `scraper:lock:{platform}`    | Boolean    | 1 hour  | Prevent concurrent scraping      |

---

## 6. API Design

### 6.1 RESTful API Principles

- **Resource-based URLs**: `/api/contests`, `/api/notes`
- **HTTP verbs**: GET (read), POST (create), PUT/PATCH (update), DELETE
- **Stateless**: No server-side session; JWT or OAuth tokens in headers
- **Versioning**: `/api/v1/...` (future-proofing)
- **Pagination**: Query params `?limit=20&offset=0` or cursor-based
- **Filtering**: `?platform=LEETCODE&upcoming=true`
- **Sorting**: `?sortBy=startTime&order=asc`

### 6.2 Core API Endpoints

#### 6.2.1 Authentication

```
GET  /api/auth/google
     → Redirect to Google OAuth consent

GET  /api/auth/google/callback
     → Handle OAuth callback, create session
     ← 302 Redirect to frontend with token

GET  /api/auth/me
     → Get current user profile
     ← 200 { user: { id, email, name } }

POST /api/auth/logout
     → Invalidate session/token
     ← 200 { message: "Logged out" }
```

#### 6.2.2 Contests

```
GET  /api/contests
     Query: ?platform=LEETCODE&upcoming=true&limit=50&offset=0
     ← 200 { contests: Contest[], total: number, hasMore: boolean }

GET  /api/contests/:id
     ← 200 { contest: Contest }
     ← 404 { error: "Contest not found" }
```

#### 6.2.3 Notes

```
GET  /api/notes
     Query: ?contestId={id}
     ← 200 { notes: Note[] }

GET  /api/notes/:id
     ← 200 { note: Note }

POST /api/notes
     Body: { contestId?, content: string }
     ← 201 { note: Note }

PUT  /api/notes/:id
     Body: { content: string }
     ← 200 { note: Note }

DELETE /api/notes/:id
     ← 204 No Content

POST /api/notes/generate
     Body: { contestId: string, userPrompt?: string }
     ← 200 { note: { content: string, isAiGenerated: true } }
     (Calls Ashna AI agent)
```

#### 6.2.4 Calendar Sync

```
POST /api/calendar/sync
     Body: { contestIds: string[] } (empty array = sync all upcoming)
     ← 200 { 
         syncedCount: number, 
         failedCount: number, 
         syncLog: SyncLog 
       }
     (Creates events in Google Calendar)

GET  /api/calendar/status
     ← 200 { 
         connected: boolean, 
         lastSync: Date?, 
         eventCount: number 
       }
```

#### 6.2.5 User

```
GET  /api/user/settings
     ← 200 { settings: { timezone, notifications, ... } }

PUT  /api/user/settings
     Body: { timezone: "Asia/Kolkata", ... }
     ← 200 { settings: {...} }

DELETE /api/user/account
     ← 204 No Content
     (Cascade deletes notes, sync logs)
```

### 6.3 API Request/Response Examples

#### Request: Create AI Note

```http
POST /api/notes/generate
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "contestId": "clx1y2z3a0000abcdef123456",
  "userPrompt": "Focus on dynamic programming patterns"
}
```

#### Response: AI Note Generated

```json
{
  "note": {
    "content": "# Codeforces Round 850 Prep Notes\n\n## Common Patterns\n- Dynamic Programming (Knapsack, LCS)\n- Graph Traversal (BFS/DFS)\n- Greedy Algorithms\n\n## Tips\n- Read all problems first\n- Start with easiest (usually A/B)\n- Manage time: 30min per problem max\n\n## Resources\n- [CP Algorithms](https://cp-algorithms.com)\n- Practice problems: [Codeforces Gym](https://codeforces.com/gym)",
    "isAiGenerated": true
  }
}
```

### 6.4 Error Response Format

```json
{
  "error": "Validation failed",
  "message": "Invalid contestId format",
  "statusCode": 400,
  "timestamp": "2026-07-04T18:32:00Z",
  "path": "/api/notes/generate"
}
```

---

## 7. Security Architecture

### 7.1 Authentication Flow (OAuth 2.0)

```
┌──────┐                                     ┌─────────┐
│ User │                                     │ Google  │
│      │                                     │  OAuth  │
└───┬──┘                                     └────┬────┘
    │                                             │
    │ 1. Click "Login with Google"                │
    ▼                                             │
┌────────────┐                                    │
│  Frontend  │                                    │
└─────┬──────┘                                    │
      │                                           │
      │ 2. GET /api/auth/google                   │
      ▼                                           │
┌────────────┐                                    │
│  Backend   │  3. Redirect to Google consent ───▶│
└─────┬──────┘                                    │
      │                                           │
      │ ◀── 4. User grants permission ────────────┘
      │                                           │
      │ 5. Callback: /api/auth/google/callback    │
      │     with authorization code               │
      ▼                                           │
┌────────────┐                                    │
│  Backend   │  6. Exchange code for tokens ─────▶│
│            │ ◀── 7. Access token + refresh ─────┘
└─────┬──────┘
      │ 8. Store encrypted token in DB
      │ 9. Create session JWT
      │
      │ 10. Redirect to frontend with JWT
      ▼
┌────────────┐
│  Frontend  │ 11. Store JWT in httpOnly cookie
│            │     or localStorage (with XSS protection)
└────────────┘
```

### 7.2 Authorization Strategy

**Current (MVP):**
- **User-scoped data**: Users can only access their own notes, sync logs.
- **Public data**: Contests are globally visible (no auth required for read).
- **Middleware**: `requireAuth` validates JWT on protected routes.

**Future (Post-MVP):**
- **Role-based access control (RBAC)**: Admin, Premium User, Free User.
- **Organization/Team accounts**: Multi-user workspaces.

### 7.3 Data Security

#### 7.3.1 Encryption

| Data Type          | Encryption Method                  | Key Storage         |
|--------------------|------------------------------------|---------------------|
| OAuth tokens (DB)  | AES-256-GCM                        | Env var (rotated)   |
| JWT secret         | N/A (HMAC-SHA256 for signing)      | Env var             |
| Passwords (future) | bcrypt (cost factor 12)            | N/A (hashed)        |
| Data in transit    | TLS 1.3                            | Let's Encrypt cert  |
| Data at rest (DB)  | PostgreSQL encryption at rest      | Cloud provider keys |

#### 7.3.2 Input Validation & Sanitization

```typescript
// Example: Zod schema for note creation
import { z } from 'zod';

export const createNoteSchema = z.object({
  contestId: z.string().cuid().optional(),
  content: z.string().min(1).max(50000),
});

// In controller:
const validated = createNoteSchema.parse(req.body);
```

**Frontend:**
- Use DOMPurify for HTML sanitization in markdown rendering.
- Escape user inputs in all displays.

### 7.4 Security Best Practices Checklist

- [x] HTTPS only (redirect HTTP → HTTPS)
- [x] Helmet.js for security headers (CSP, HSTS, etc.)
- [x] CORS configured (whitelist frontend domain)
- [x] Rate limiting (100 req/hour per user, 1000/hour per IP)
- [x] SQL injection protection (Prisma parameterized queries)
- [x] XSS protection (React auto-escaping + DOMPurify)
- [x] CSRF protection (SameSite cookies, CSRF tokens for state-changing ops)
- [x] Secrets in env vars (never in code)
- [x] Regular dependency audits (`pnpm audit`)
- [x] Error messages don't leak sensitive info
- [x] Logging excludes secrets (filter before Winston)

---

## 8. Integration Architecture

### 8.1 Google Calendar API Integration

#### 8.1.1 OAuth Scopes Required

```
https://www.googleapis.com/auth/calendar
https://www.googleapis.com/auth/calendar.events
```

#### 8.1.2 Event Creation Flow

```
Backend CalendarService
        │
        ▼
┌────────────────────────────────────────┐
│  1. Get user's OAuth token from DB     │
│     (decrypt with app secret)           │
└────────────┬───────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│  2. Initialize Google Calendar client  │
│     (googleapis npm package)            │
└────────────┬───────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│  3. For each contest:                  │
│     calendar.events.insert({           │
│       calendarId: 'primary',           │
│       resource: {                      │
│         summary: '[Platform] Name',    │
│         description: 'URL + notes',    │
│         start: { dateTime: IST },      │
│         end: { dateTime: IST+duration},│
│         reminders: {                   │
│           useDefault: false,           │
│           overrides: [                 │
│             {method: 'popup', min: 5}, │
│             {method: 'popup', min: 15} │
│           ]                            │
│         }                              │
│       }                                │
│     })                                 │
└────────────┬───────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│  4. Handle API responses:              │
│     - 200 OK: Log success              │
│     - 401 Unauthorized: Refresh token  │
│     - 403 Forbidden: User re-auth      │
│     - 429 Rate limit: Exponential      │
│       backoff, retry                   │
└────────────┬───────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│  5. Update SyncLog in DB               │
└────────────────────────────────────────┘
```

#### 8.1.3 Rate Limit Handling

**Google Calendar API Quotas:**
- **Queries per day**: 1,000,000 (unlikely to hit)
- **Queries per 100 seconds per user**: 500

**Strategy:**
- Implement exponential backoff on 429 errors.
- Batch sync requests (max 50 events per sync call).
- Cache event IDs to avoid duplicate creation.

### 8.2 Ashna AI Agent Integration

#### 8.2.1 Agent Architecture

```
┌─────────────────────────────────────────┐
│        Backend AshnaService             │
└────────────┬────────────────────────────┘
             │
             ├─► Contest Fetcher Agent
             │   ┌────────────────────────┐
             │   │ Input: { platform }    │
             │   │ Output: Contest[]      │
             │   │ Method: Web search     │
             │   │   + scraping tools     │
             │   └────────────────────────┘
             │
             └─► Notes Generator Agent
                 ┌────────────────────────┐
                 │ Input: {               │
                 │   contestName,         │
                 │   platform,            │
                 │   startTime,           │
                 │   userPrompt?          │
                 │ }                      │
                 │ Output: {              │
                 │   content: string      │
                 │ }                      │
                 │ Method: LLM generation │
                 └────────────────────────┘
```

#### 8.2.2 API Call Example

```typescript
// src/services/ashnaService.ts
import axios from 'axios';
import { config } from '../config/env';

export async function generateNote(contestContext: {
  contestName: string;
  platform: string;
  startTime: Date;
  userPrompt?: string;
}): Promise<string> {
  const response = await axios.post(
    config.ASHNA_AI_NOTES_AGENT_URL,
    {
      contest: contestContext,
      prompt: contestContext.userPrompt || 'Generate study notes',
    },
    {
      headers: {
        'Authorization': `Bearer ${config.ASHNA_AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds
    }
  );

  return response.data.content;
}
```

#### 8.2.3 Error Handling

```typescript
try {
  const note = await generateNote(context);
  return note;
} catch (error) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 429) {
      // Rate limited: retry with backoff
      logger.warn('Ashna AI rate limit hit');
      throw new ServiceUnavailableError('AI service busy, try again later');
    } else if (error.response?.status === 401) {
      // Auth issue
      logger.error('Invalid Ashna AI API key');
      throw new ConfigurationError('AI service authentication failed');
    }
  }
  // Fallback: return cached or generic note
  logger.error('Ashna AI call failed:', error);
  throw new ServiceUnavailableError('Note generation failed');
}
```

---

## 9. Deployment Architecture

### 9.1 Infrastructure Diagram

```
                    ┌──────────────────┐
                    │   User Browser   │
                    └────────┬─────────┘
                             │ HTTPS
                    ┌────────▼─────────┐
                    │  Cloudflare CDN  │
                    │  (DNS + DDoS)    │
                    └────────┬─────────┘
                             │
          ┌──────────────────┴──────────────────┐
          │                                     │
┌─────────▼──────────┐              ┌──────────▼─────────┐
│   Vercel (Frontend)│              │  Railway (Backend) │
│   ┌──────────────┐ │              │  ┌───────────────┐ │
│   │ React App    │ │              │  │ Node.js API   │ │
│   │ (Static)     │ │              │  │ + Cron Jobs   │ │
│   └──────────────┘ │              │  └───────┬───────┘ │
└────────────────────┘              │          │         │
                                    │  ┌───────▼───────┐ │
                                    │  │  PostgreSQL   │ │
                                    │  │  (Railway DB) │ │
                                    │  └───────────────┘ │
                                    └──────────┬─────────┘
                                               │
                    ┌──────────────────────────┴─────────────┐
                    │                                        │
          ┌─────────▼─────────┐                  ┌──────────▼────────┐
          │   Redis (Upstash) │                  │ External Services │
          │   (Cache + Queue) │                  │ - Google Calendar │
          └───────────────────┘                  │ - Ashna AI        │
                                                 │ - LeetCode API    │
                                                 │ - Codeforces API  │
                                                 └───────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                     Monitoring & Logging                         │
│  ┌────────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  Datadog   │  │  Sentry  │  │ Mixpanel │  │ Pingdom/     │  │
│  │  (APM/Logs)│  │ (Errors) │  │(Analytics)│  │ UptimeRobot  │  │
│  └────────────┘  └──────────┘  └──────────┘  └──────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### 9.2 Environment Configuration

| Environment | Frontend URL              | Backend URL               | Database        |
|-------------|---------------------------|---------------------------|------------------|
| Development | localhost:3000            | localhost:4000            | Local Postgres   |
| Staging     | staging.cpcontest.app     | api-staging.cpcontest.app | Railway Staging  |
| Production  | app.cpcontest.app         | api.cpcontest.app         | Railway Prod     |

### 9.3 Deployment Pipeline

```
Git Push to main branch
         │
         ▼
┌─────────────────────┐
│ GitHub Actions CI   │
│ - Lint              │
│ - Type check        │
│ - Unit tests        │
│ - Build             │
└──────────┬──────────┘
           │ ✓ All checks pass
           ├──────────────────────┐
           │                      │
┌──────────▼────────┐  ┌──────────▼──────────┐
│ Deploy Frontend   │  │ Deploy Backend      │
│ (Vercel)          │  │ (Railway)           │
│ - Build React     │  │ - Build TypeScript  │
│ - Deploy to CDN   │  │ - Run DB migrations │
│ - Invalidate cache│  │ - Restart service   │
└───────────────────┘  └──────────┬──────────┘
                                  │
                       ┌──────────▼──────────┐
                       │ Smoke Tests         │
                       │ - Health check      │
                       │ - Critical endpoints│
                       └──────────┬──────────┘
                                  │
                       ┌──────────▼──────────┐
                       │ Notify Team         │
                       │ (Slack/Discord)     │
                       └─────────────────────┘
```

### 9.4 Database Migration Strategy

**Approach**: Zero-downtime migrations

1. **Backward-compatible changes first**:
   - Add new columns as nullable.
   - Deploy backend that works with both old and new schema.

2. **Data migration (if needed)**:
   - Run migration script in Railway console.
   - Monitor progress with logs.

3. **Remove old columns (next release)**:
   - After all instances use new schema.

**Rollback Plan**:
- Keep previous Docker image tagged.
- Railway allows instant rollback to previous deployment.
- Database backups automated daily (Railway).

---

## 10. Scalability & Performance

### 10.1 Performance Targets

| Metric                     | Target       | Measurement              |
|----------------------------|--------------|---------------------------|
| Page load time (frontend)  | <2 seconds   | Lighthouse, WebPageTest   |
| API response time (p95)    | <500ms       | Datadog APM               |
| Database query time (p95)  | <100ms       | Prisma logs, pg stats     |
| Scraper job duration       | <5 minutes   | Job logs                  |
| Calendar sync duration     | <3 seconds   | CalendarService metrics   |
| Concurrent users supported | 1,000        | Load testing (k6)         |

### 10.2 Caching Strategy

#### 10.2.1 Multi-Level Cache

```
User Request
      │
      ▼
┌─────────────────┐
│ Browser Cache   │  (HTTP Cache-Control headers)
│ TTL: 5 minutes  │  For static assets, contest list
└────────┬────────┘
         │ Cache miss
         ▼
┌─────────────────┐
│ CDN Cache       │  (Cloudflare/Vercel)
│ (Vercel Edge)   │  For API responses marked cacheable
└────────┬────────┘
         │ Cache miss
         ▼
┌─────────────────┐
│ Redis Cache     │  (Backend)
│ TTL: 6 hours    │  Contest data, user sessions
└────────┬────────┘
         │ Cache miss
         ▼
┌─────────────────┐
│ PostgreSQL      │  (Source of truth)
└─────────────────┘
```

#### 10.2.2 Cache Invalidation

**Strategy**: Time-based TTL + event-based invalidation

- **Contests**: TTL 6 hours; invalidate on scraper job completion.
- **Notes**: No cache (user-specific, frequently updated).
- **User sessions**: TTL 7 days; invalidate on logout.

### 10.3 Database Optimization

#### 10.3.1 Indexes

```sql
-- Contests: Fast lookup by platform and time
CREATE INDEX idx_contests_platform_time 
  ON contests(platform, start_time_ist);

-- Notes: Fast user lookup
CREATE INDEX idx_notes_user_contest 
  ON notes(user_id, contest_id);

-- Sync logs: Recent sync history
CREATE INDEX idx_sync_logs_user_time 
  ON sync_logs(user_id, synced_at DESC);
```

#### 10.3.2 Query Optimization

**Example: Upcoming Contests Query**

```typescript
// Before optimization (N+1 problem)
const contests = await prisma.contest.findMany({
  where: { startTimeIst: { gte: new Date() } },
});
for (const contest of contests) {
  const notes = await prisma.note.findMany({ where: { contestId: contest.id } });
  // Process notes...
}

// After optimization (eager loading)
const contests = await prisma.contest.findMany({
  where: { startTimeIst: { gte: new Date() } },
  include: { notes: true }, // Join in one query
  take: 50,
});
```

### 10.4 Horizontal Scaling

**Current (MVP)**: Single backend instance (Railway autoscaling)

**Future (High Load)**:
- **Stateless backend**: Enable horizontal scaling (multiple instances).
- **Load balancer**: Railway/Vercel handles this automatically.
- **Session storage**: Redis (shared across instances).
- **Database**: PostgreSQL read replicas for read-heavy queries.

### 10.5 Background Job Optimization

**Current**: Node-cron for scheduled jobs

**Future (Scale)**:
- **Bull Queue** with Redis.
- **Separate worker processes** for scraping.
- **Distributed job processing** (multiple workers).

```
┌──────────────┐       ┌──────────────┐
│  API Server  │──────▶│ Redis Queue  │
└──────────────┘       └──────┬───────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
        ┌─────▼─────┐   ┌─────▼─────┐   ┌─────▼─────┐
        │  Worker 1 │   │  Worker 2 │   │  Worker 3 │
        │ (Scraper) │   │ (Scraper) │   │  (Sync)   │
        └───────────┘   └───────────┘   └───────────┘
```

---

## 11. Failure Modes & Resilience

### 11.1 Failure Mode Analysis

| Component Failure         | Impact                  | Mitigation                              |
|---------------------------|-------------------------|-----------------------------------------|
| **Frontend (Vercel)**     | Users can't access UI   | Vercel 99.99% SLA; cached assets on CDN |
| **Backend (Railway)**     | API calls fail          | Auto-restart; health checks; alerts     |
| **PostgreSQL**            | Data unavailable        | Railway automated backups (daily)       |
| **Redis**                 | Cache miss, slower      | Degrade gracefully; hit DB directly     |
| **Google Calendar API**   | Sync fails              | Retry with backoff; queue for later     |
| **Ashna AI Agent**        | Note generation fails   | Return cached note or skip AI feature   |
| **LeetCode/CF/CC down**   | Scraper fails           | Fallback to aggregator API (Clist.by)   |
| **Network partition**     | Requests timeout        | Circuit breaker pattern; fail fast      |

### 11.2 Resilience Patterns

#### 11.2.1 Circuit Breaker (External Services)

```typescript
import CircuitBreaker from 'opossum';

const breaker = new CircuitBreaker(fetchFromAshnaAI, {
  timeout: 10000,       // 10 seconds
  errorThresholdPercentage: 50,
  resetTimeout: 30000,  // 30 seconds
});

breaker.fallback(() => {
  logger.warn('Ashna AI circuit breaker open, using fallback');
  return getCachedNoteOrDefault();
});

export async function generateNoteWithCircuitBreaker(context) {
  return breaker.fire(context);
}
```

#### 11.2.2 Retry with Exponential Backoff

```typescript
import retry from 'async-retry';

export async function fetchWithRetry(url: string) {
  return retry(
    async (bail) => {
      try {
        const response = await axios.get(url);
        return response.data;
      } catch (error) {
        if (error.response?.status === 400) {
          // Don't retry client errors
          bail(error);
        }
        throw error; // Retry on network/server errors
      }
    },
    {
      retries: 3,
      factor: 2,        // Exponential backoff
      minTimeout: 1000, // 1s, 2s, 4s
    }
  );
}
```

#### 11.2.3 Graceful Degradation

**Example: Contest list unavailable**

```typescript
export async function getContests() {
  try {
    // Try Redis cache first
    const cached = await redis.get('contests:all');
    if (cached) return JSON.parse(cached);

    // Cache miss: query DB
    const contests = await prisma.contest.findMany({...});
    await redis.setex('contests:all', 21600, JSON.stringify(contests));
    return contests;
  } catch (error) {
    logger.error('Failed to fetch contests:', error);
    // Graceful degradation: return empty array or stale cached data
    return [];
  }
}
```

### 11.3 Health Checks & Monitoring

#### 11.3.1 Health Check Endpoint

```typescript
// GET /health
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: 'unknown',
      redis: 'unknown',
    },
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = 'ok';
  } catch (error) {
    health.checks.database = 'error';
    health.status = 'degraded';
  }

  try {
    await redis.ping();
    health.checks.redis = 'ok';
  } catch (error) {
    health.checks.redis = 'error';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});
```

#### 11.3.2 Alerting Rules

| Condition                       | Severity | Action                        |
|---------------------------------|----------|-------------------------------|
| API error rate >5%              | Critical | Slack alert to on-call eng    |
| p95 latency >2 seconds          | Warning  | Log to Datadog, review daily  |
| Database connection failure     | Critical | Page on-call, auto-restart    |
| Scraper job failure (3x in row) | Warning  | Slack alert, manual review    |
| Uptime <99.5% in 24h            | Critical | Incident post-mortem          |

---

## 12. Conclusion

This detailed system architecture provides a comprehensive blueprint for building a robust, scalable, and maintainable Competitive Programming Calendar + Notes application. Key architectural decisions include:

1. **Layered architecture** for clear separation of concerns.
2. **Monorepo with Turborepo** for efficient development.
3. **PostgreSQL + Redis** for reliable data storage and caching.
4. **Google Calendar API** for seamless event integration.
5. **Ashna AI agents** for intelligent contest discovery and note generation.
6. **Security-first design** with OAuth, encryption, and input validation.
7. **Resilience patterns** (circuit breaker, retry, graceful degradation).
8. **Cloud-native deployment** (Vercel, Railway) with CI/CD automation.

**Next Steps:**
- Review and approve this architecture document.
- Begin implementation following the roadmap and project structure.
- Proceed to UI/UX Design document for frontend specifications.

---

**Document Status**: Draft v1.0  
**Approvers**: Engineering Lead, Solutions Architect, DevOps Lead  
**Revision History**:
- 2026-07-04: Initial draft.
