# Project Structure: Competitive Programming Calendar + Notes App

**Version:** 1.0  
**Date:** July 4, 2026  
**Author:** Max Effort Reasoning Engine  

---

## 1. Executive Summary

This document defines the **complete project structure** for the Competitive Programming Calendar + Notes application. It covers:

- **Repository organization** (monorepo vs. multi-repo)
- **Directory structure** for frontend, backend, and shared code
- **Technology stack** details
- **Module and file organization**
- **Configuration files** and tooling
- **Naming conventions** and best practices

---

## 2. Repository Strategy

### 2.1 Recommended Approach: Monorepo

**Rationale:**
- Shared types and utilities between frontend and backend.
- Unified CI/CD pipeline.
- Simplified dependency management.
- Easier code reviews and refactoring.

**Tool:** **Turborepo** (optimized for TypeScript projects, caching, parallel builds)

**Alternative:** **Nx** (more feature-rich, steeper learning curve)

### 2.2 Repository Structure Overview

```
cp-calendar-app/
├── apps/
│   ├── web/                  # Frontend (React + Vite)
│   └── api/                  # Backend (Node.js + Express)
├── packages/
│   ├── shared/               # Shared types, utilities
│   ├── ui/                   # Shared UI components (future: mobile app)
│   └── config/               # Shared ESLint, Prettier, TS configs
├── docker/
│   ├── docker-compose.yml    # Local development stack
│   ├── Dockerfile.api        # Backend production image
│   └── Dockerfile.web        # Frontend production image (if needed)
├── .github/
│   └── workflows/
│       ├── ci.yml            # Lint, test, build
│       ├── deploy-api.yml    # Deploy backend to Railway
│       └── deploy-web.yml    # Deploy frontend to Vercel
├── docs/
│   ├── HLD.md
│   ├── Roadmap.md
│   ├── Architecture.md
│   └── UI-UX.md
├── scripts/
│   ├── seed-db.ts            # Database seeding
│   ├── migrate.sh            # Run Prisma migrations
│   └── deploy.sh             # Deployment helper
├── .env.example              # Environment variable template
├── .gitignore
├── turbo.json                # Turborepo configuration
├── package.json              # Root package.json (workspace)
├── pnpm-workspace.yaml       # pnpm workspace config (if using pnpm)
└── README.md
```

---

## 3. Frontend Structure (`apps/web`)

### 3.1 Technology Stack

| Layer          | Technology           | Purpose                          |
|----------------|----------------------|----------------------------------|
| Framework      | React 18             | UI library                       |
| Build Tool     | Vite                 | Fast dev server and bundler      |
| Language       | TypeScript           | Type safety                      |
| Styling        | Tailwind CSS         | Utility-first CSS                |
| State Mgmt     | Zustand / TanStack Query | Global state + server state  |
| Routing        | React Router v6      | Client-side routing              |
| Forms          | React Hook Form + Zod | Form validation                 |
| Markdown       | React Markdown / Tiptap | Note editor                   |
| Calendar UI    | FullCalendar.js      | Calendar display                 |
| HTTP Client    | Axios / Fetch + TanStack Query | API requests           |
| Analytics      | Mixpanel / PostHog   | User tracking                    |

### 3.2 Directory Structure

```
apps/web/
├── public/
│   ├── favicon.ico
│   ├── manifest.json         # PWA manifest
│   └── robots.txt
├── src/
│   ├── assets/
│   │   ├── images/           # Logo, icons
│   │   └── styles/
│   │       └── globals.css   # Tailwind imports, global styles
│   ├── components/
│   │   ├── ui/               # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Spinner.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Layout.tsx
│   │   ├── calendar/
│   │   │   ├── CalendarView.tsx
│   │   │   ├── ContestCard.tsx
│   │   │   ├── ContestList.tsx
│   │   │   └── SyncButton.tsx
│   │   ├── notes/
│   │   │   ├── NoteEditor.tsx
│   │   │   ├── NoteList.tsx
│   │   │   └── GenerateNoteButton.tsx
│   │   └── auth/
│   │       ├── LoginButton.tsx
│   │       └── UserMenu.tsx
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── CalendarPage.tsx
│   │   ├── NotesPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useContests.ts
│   │   ├── useNotes.ts
│   │   ├── useCalendarSync.ts
│   │   └── useLocalStorage.ts
│   ├── services/
│   │   ├── api.ts            # Axios instance, base config
│   │   ├── authService.ts
│   │   ├── contestService.ts
│   │   ├── noteService.ts
│   │   └── calendarService.ts
│   ├── store/
│   │   ├── authStore.ts      # Zustand store for auth state
│   │   └── uiStore.ts        # UI state (modals, themes)
│   ├── types/
│   │   ├── Contest.ts
│   │   ├── Note.ts
│   │   ├── User.ts
│   │   └── api.ts            # API response types
│   ├── utils/
│   │   ├── formatDate.ts
│   │   ├── timezone.ts       # IST conversion helpers
│   │   ├── validators.ts
│   │   └── constants.ts
│   ├── config/
│   │   └── env.ts            # Environment variable access
│   ├── App.tsx               # Root component
│   ├── main.tsx              # Entry point
│   └── vite-env.d.ts         # Vite type declarations
├── .env.development
├── .env.production
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

### 3.3 Key Files

#### `src/main.tsx`
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './assets/styles/globals.css';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
```

#### `src/App.tsx`
```typescript
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import CalendarPage from './pages/CalendarPage';
import NotesPage from './pages/NotesPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';
import { useAuth } from './hooks/useAuth';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={isAuthenticated ? <DashboardPage /> : <HomePage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
```

#### `vite.config.ts`
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
```

---

## 4. Backend Structure (`apps/api`)

### 4.1 Technology Stack

| Layer          | Technology           | Purpose                          |
|----------------|----------------------|----------------------------------|
| Runtime        | Node.js 20 LTS       | JavaScript runtime               |
| Framework      | Express.js           | Web framework                    |
| Language       | TypeScript           | Type safety                      |
| ORM            | Prisma               | Database access                  |
| Database       | PostgreSQL 15        | Relational database              |
| Cache          | Redis                | Session storage, caching         |
| Auth           | Passport.js          | OAuth 2.0 (Google)               |
| Validation     | Zod                  | Runtime schema validation        |
| Logging        | Winston              | Structured logging               |
| Task Queue     | Bull                 | Background jobs (scraping, sync) |
| Testing        | Jest + Supertest     | Unit + integration tests         |
| API Docs       | Swagger / OpenAPI    | Auto-generated API docs          |

### 4.2 Directory Structure

```
apps/api/
├── prisma/
│   ├── migrations/           # Prisma migration files
│   ├── schema.prisma         # Database schema
│   └── seed.ts               # Database seeding script
├── src/
│   ├── config/
│   │   ├── env.ts            # Environment variables (validated with Zod)
│   │   ├── database.ts       # Prisma client instance
│   │   ├── redis.ts          # Redis client instance
│   │   └── logger.ts         # Winston logger config
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── contestController.ts
│   │   ├── noteController.ts
│   │   ├── calendarController.ts
│   │   └── userController.ts
│   ├── services/
│   │   ├── authService.ts
│   │   ├── contestService.ts
│   │   ├── calendarService.ts
│   │   ├── noteService.ts
│   │   ├── scraperService.ts
│   │   └── ashnaService.ts   # Ashna AI agent integration
│   ├── scrapers/
│   │   ├── BaseScraper.ts    # Abstract base class
│   │   ├── LeetCodeScraper.ts
│   │   ├── CodeforcesScraper.ts
│   │   ├── CodeChefScraper.ts
│   │   └── AggregatorScraper.ts # Fallback (Clist.by)
│   ├── jobs/
│   │   ├── contestScraperJob.ts
│   │   ├── calendarSyncJob.ts
│   │   └── noteGenerationJob.ts
│   ├── routes/
│   │   ├── index.ts          # Main router aggregator
│   │   ├── authRoutes.ts
│   │   ├── contestRoutes.ts
│   │   ├── noteRoutes.ts
│   │   ├── calendarRoutes.ts
│   │   └── userRoutes.ts
│   ├── middlewares/
│   │   ├── authMiddleware.ts # JWT/session validation
│   │   ├── errorHandler.ts   # Global error handler
│   │   ├── rateLimiter.ts    # Rate limiting
│   │   ├── validator.ts      # Request validation (Zod)
│   │   └── logger.ts         # HTTP request logger
│   ├── types/
│   │   ├── Contest.ts
│   │   ├── Note.ts
│   │   ├── User.ts
│   │   └── express.d.ts      # Extend Express Request type
│   ├── utils/
│   │   ├── timezone.ts       # UTC <-> IST conversion
│   │   ├── crypto.ts         # Encryption helpers
│   │   ├── errors.ts         # Custom error classes
│   │   └── constants.ts
│   ├── app.ts                # Express app setup
│   └── server.ts             # Server entry point
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   └── utils/
│   ├── integration/
│   │   └── routes/
│   └── setup.ts              # Test environment setup
├── .env.development
├── .env.production
├── .env.test
├── package.json
├── tsconfig.json
├── jest.config.js
└── nodemon.json
```

### 4.3 Key Files

#### `src/server.ts`
```typescript
import app from './app';
import { config } from './config/env';
import { logger } from './config/logger';
import { startBackgroundJobs } from './jobs';

const PORT = config.PORT || 4000;

const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`Environment: ${config.NODE_ENV}`);
});

// Start background jobs (scraping, sync)
startBackgroundJobs();

process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
  });
});
```

#### `src/app.ts`
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { requestLogger } from './middlewares/logger';
import { rateLimiter } from './middlewares/rateLimiter';

const app = express();

// Security & performance
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(compression());

// Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(requestLogger);

// Rate limiting
app.use('/api', rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', routes);

// Error handling
app.use(errorHandler);

export default app;
```

#### `prisma/schema.prisma`
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  oauthProvider String   @default("google")
  oauthToken    String?  @db.Text // Encrypted
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  notes         Note[]
  syncLogs      SyncLog[]
}

model Contest {
  id           String   @id @default(cuid())
  platform     Platform
  name         String
  url          String
  startTimeUtc DateTime
  startTimeIst DateTime
  duration     Int?     // minutes
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  notes        Note[]

  @@unique([platform, name, startTimeUtc])
  @@index([platform, startTimeIst])
}

enum Platform {
  LEETCODE
  CODEFORCES
  CODECHEF
}

model Note {
  id         String   @id @default(cuid())
  userId     String
  contestId  String?
  content    String   @db.Text
  isAiGenerated Boolean @default(false)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  contest    Contest? @relation(fields: [contestId], references: [id], onDelete: SetNull)

  @@index([userId, contestId])
}

model SyncLog {
  id        String   @id @default(cuid())
  userId    String
  status    SyncStatus
  message   String?
  syncedAt  DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, syncedAt])
}

enum SyncStatus {
  SUCCESS
  FAILED
  PARTIAL
}
```

#### `src/services/scraperService.ts`
```typescript
import { LeetCodeScraper } from '../scrapers/LeetCodeScraper';
import { CodeforcesScraper } from '../scrapers/CodeforcesScraper';
import { CodeChefScraper } from '../scrapers/CodeChefScraper';
import { Platform } from '@prisma/client';
import { logger } from '../config/logger';
import { prisma } from '../config/database';

const scrapers = {
  [Platform.LEETCODE]: new LeetCodeScraper(),
  [Platform.CODEFORCES]: new CodeforcesScraper(),
  [Platform.CODECHEF]: new CodeChefScraper(),
};

export async function scrapeAllPlatforms() {
  logger.info('Starting contest scraping for all platforms');

  for (const [platform, scraper] of Object.entries(scrapers)) {
    try {
      const contests = await scraper.fetchContests();
      logger.info(`Scraped ${contests.length} contests from ${platform}`);

      // Upsert contests
      for (const contest of contests) {
        await prisma.contest.upsert({
          where: {
            platform_name_startTimeUtc: {
              platform: contest.platform,
              name: contest.name,
              startTimeUtc: contest.startTimeUtc,
            },
          },
          update: contest,
          create: contest,
        });
      }
    } catch (error) {
      logger.error(`Failed to scrape ${platform}:`, error);
    }
  }

  logger.info('Contest scraping completed');
}
```

---

## 5. Shared Package (`packages/shared`)

### 5.1 Purpose

Share TypeScript types, validation schemas, and utilities between frontend and backend.

### 5.2 Structure

```
packages/shared/
├── src/
│   ├── types/
│   │   ├── Contest.ts
│   │   ├── Note.ts
│   │   ├── User.ts
│   │   └── index.ts
│   ├── schemas/
│   │   ├── contestSchema.ts  # Zod schemas
│   │   ├── noteSchema.ts
│   │   └── userSchema.ts
│   ├── utils/
│   │   ├── timezone.ts
│   │   └── validators.ts
│   └── index.ts              # Export all
├── package.json
└── tsconfig.json
```

### 5.3 Example: Shared Type

#### `src/types/Contest.ts`
```typescript
export enum Platform {
  LEETCODE = 'LEETCODE',
  CODEFORCES = 'CODEFORCES',
  CODECHEF = 'CODECHEF',
}

export interface Contest {
  id: string;
  platform: Platform;
  name: string;
  url: string;
  startTimeUtc: Date;
  startTimeIst: Date;
  duration?: number; // minutes
  createdAt: Date;
  updatedAt: Date;
}

export interface ContestCreateInput {
  platform: Platform;
  name: string;
  url: string;
  startTimeUtc: Date;
  duration?: number;
}
```

---

## 6. Configuration Files

### 6.1 Root `package.json` (Turborepo)

```json
{
  "name": "cp-calendar-app",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "clean": "turbo run clean && rm -rf node_modules"
  },
  "devDependencies": {
    "turbo": "^1.10.0",
    "prettier": "^3.0.0",
    "typescript": "^5.2.0"
  },
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=8.0.0"
  }
}
```

### 6.2 `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "clean": {
      "cache": false
    }
  }
}
```

### 6.3 `.env.example`

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/cp_calendar_dev

# Redis
REDIS_URL=redis://localhost:6379

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback

# Google Calendar API
GOOGLE_CALENDAR_API_KEY=your_api_key

# Ashna AI
ASHNA_AI_API_KEY=your_ashna_api_key
ASHNA_AI_CONTEST_AGENT_URL=https://api.ashna.ai/agents/contest-fetcher
ASHNA_AI_NOTES_AGENT_URL=https://api.ashna.ai/agents/notes-generator

# JWT
JWT_SECRET=your_jwt_secret_key

# Frontend
FRONTEND_URL=http://localhost:3000

# Logging
LOG_LEVEL=info

# Environment
NODE_ENV=development
```

### 6.4 Docker Compose (Local Development)

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: cpuser
      POSTGRES_PASSWORD: cppass
      POSTGRES_DB: cp_calendar_dev
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data

  adminer:
    image: adminer
    ports:
      - '8080:8080'
    depends_on:
      - postgres

volumes:
  postgres_data:
  redis_data:
```

---

## 7. Naming Conventions

### 7.1 Files & Directories

- **Components**: PascalCase (e.g., `CalendarView.tsx`, `NoteEditor.tsx`)
- **Utilities/Services**: camelCase (e.g., `authService.ts`, `timezone.ts`)
- **Types/Interfaces**: PascalCase (e.g., `Contest.ts`, `User.ts`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth.ts`, `useContests.ts`)
- **Routes**: camelCase with `Routes` suffix (e.g., `authRoutes.ts`)
- **Tests**: Same name as file + `.test.ts` (e.g., `authService.test.ts`)

### 7.2 Code

- **Variables/Functions**: camelCase (e.g., `fetchContests`, `userId`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRIES`, `API_BASE_URL`)
- **Classes**: PascalCase (e.g., `LeetCodeScraper`, `AuthService`)
- **Interfaces/Types**: PascalCase (e.g., `Contest`, `UserProfile`)
- **Enums**: PascalCase (e.g., `Platform`, `SyncStatus`)

---

## 8. Git Workflow

### 8.1 Branch Strategy (Git Flow)

- **`main`**: Production-ready code
- **`develop`**: Integration branch for features
- **`feature/*`**: New features (e.g., `feature/calendar-sync`)
- **`bugfix/*`**: Bug fixes (e.g., `bugfix/scraper-timeout`)
- **`hotfix/*`**: Urgent production fixes
- **`release/*`**: Release preparation

### 8.2 Commit Message Convention (Conventional Commits)

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Example**:
```
feat(scraper): add Codeforces API integration

- Implement CodeforcesScraper class
- Add timezone conversion for contest times
- Handle API rate limits with exponential backoff

Closes #42
```

---

## 9. CI/CD Pipeline

### 9.1 GitHub Actions Workflow (`.github/workflows/ci.yml`)

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm test
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
```

### 9.2 Deployment Workflow (`.github/workflows/deploy-api.yml`)

```yaml
name: Deploy API

on:
  push:
    branches: [main]
    paths:
      - 'apps/api/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        run: |
          curl -X POST ${{ secrets.RAILWAY_WEBHOOK_URL }}
```

---

## 10. Testing Strategy

### 10.1 Test Organization

```
tests/
├── unit/
│   ├── services/
│   │   ├── authService.test.ts
│   │   ├── scraperService.test.ts
│   │   └── calendarService.test.ts
│   └── utils/
│       └── timezone.test.ts
├── integration/
│   └── routes/
│       ├── auth.test.ts
│       ├── contests.test.ts
│       └── notes.test.ts
└── e2e/
    └── calendar-sync.test.ts
```

### 10.2 Coverage Goals

- **Unit Tests**: ≥80% coverage for services and utils
- **Integration Tests**: All API endpoints
- **E2E Tests**: Critical user flows (login, sync, note generation)

---

## 11. Documentation Standards

### 11.1 Code Comments

- **JSDoc** for public functions:
  ```typescript
  /**
   * Fetches upcoming contests from all platforms
   * @returns {Promise<Contest[]>} Array of contest objects
   * @throws {ScraperError} If all scrapers fail
   */
  export async function fetchAllContests(): Promise<Contest[]> {
    // ...
  }
  ```

### 11.2 README Files

- Root `README.md`: Project overview, setup instructions
- `apps/web/README.md`: Frontend-specific setup
- `apps/api/README.md`: Backend-specific setup

---

## 12. Security Best Practices

### 12.1 Environment Variables

- Never commit `.env` files
- Use `.env.example` as template
- Encrypt sensitive values in DB (OAuth tokens)

### 12.2 Dependencies

- Regular `pnpm audit` checks
- Use Dependabot for automated updates
- Pin critical dependency versions

### 12.3 Input Validation

- Validate all user inputs with Zod schemas
- Sanitize HTML in notes (use DOMPurify on frontend)

---

## 13. Performance Optimization

### 13.1 Frontend

- **Code splitting**: React.lazy for route-based splitting
- **Image optimization**: WebP format, lazy loading
- **Bundle analysis**: Use `vite-plugin-bundle-visualizer`
- **PWA caching**: Service worker for offline support

### 13.2 Backend

- **Database indexing**: Index frequently queried fields
- **Query optimization**: Use Prisma's `select` and `include` carefully
- **Caching**: Redis for contest data, user sessions
- **Compression**: gzip/brotli for API responses

---

## 14. Monitoring & Observability

### 14.1 Logging

- **Structured logs** (JSON format) via Winston
- **Log levels**: error, warn, info, debug
- **Centralized logging**: Send to Datadog or Logtail

### 14.2 Metrics

- **APM**: Datadog APM for request tracing
- **Custom metrics**: Contest scrape success rate, sync latency
- **Alerts**: Slack notifications for critical errors

### 14.3 Error Tracking

- **Sentry** for frontend and backend error tracking
- Source maps uploaded for stack trace readability

---

## 15. Deployment

### 15.1 Frontend (Vercel)

- **Build command**: `pnpm build --filter=web`
- **Output directory**: `apps/web/dist`
- **Environment variables**: Set in Vercel dashboard
- **Custom domain**: Connect via Vercel DNS

### 15.2 Backend (Railway)

- **Dockerfile** or buildpack auto-detection
- **Start command**: `node dist/server.js`
- **Environment variables**: Set in Railway dashboard
- **Database**: Railway Postgres addon

### 15.3 Database Migrations

- Run `pnpm prisma migrate deploy` in Railway before each deployment
- Use Railway's "Deploy Hooks" for automated migrations

---

## 16. Future Considerations

### 16.1 Mobile App

- Add `apps/mobile` (React Native or Flutter)
- Reuse `packages/shared` for types
- Share backend API

### 16.2 Microservices

- If scale demands, split scraper into separate service
- Use message queue (RabbitMQ, Kafka) for async communication

### 16.3 Multi-Tenancy

- Add `organizationId` to schema for team accounts
- Row-level security in Postgres

---

## 17. Conclusion

This project structure establishes a scalable, maintainable foundation for the Competitive Programming Calendar + Notes app. The monorepo approach with Turborepo enables efficient development, shared code reuse, and streamlined deployment.

**Key Principles**:
- **Separation of Concerns**: Clear boundaries between frontend, backend, and shared code
- **Type Safety**: TypeScript throughout, shared types via `packages/shared`
- **Testability**: Organized test structure with high coverage goals
- **Scalability**: Modular architecture supports future growth
- **Developer Experience**: Hot reload, linting, formatting, and clear conventions

**Next Steps**:
- Set up initial repository structure
- Configure tooling (ESLint, Prettier, Turborepo)
- Initialize frontend and backend skeletons
- Proceed to Detailed System Architecture document

---

**Document Status**: Draft v1.0  
**Approvers**: Engineering Lead, DevOps Lead  
**Revision History**:
- 2026-07-04: Initial draft.
