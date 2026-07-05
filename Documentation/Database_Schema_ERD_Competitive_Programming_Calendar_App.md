# Database Schema & ERD Document: Competitive Programming Calendar + Notes App

**Version:** 1.0  
**Date:** July 4, 2026  
**Author:** Max Effort Reasoning Engine  

---

## 1. Executive Summary

This document provides a **comprehensive database schema and Entity-Relationship Diagram (ERD)** for the Competitive Programming Calendar + Notes application. It covers:

- **Database selection rationale**
- **Complete entity-relationship model**
- **Detailed table schemas with constraints**
- **Index strategy for performance**
- **Data integrity and validation rules**
- **Migration strategy**
- **Backup and recovery procedures**
- **Query optimization patterns**
- **Scalability considerations**

---

## 2. Database Technology Selection

### 2.1 Primary Database: PostgreSQL 15

**Rationale:**

| Factor              | PostgreSQL Advantage                                      |
|---------------------|-----------------------------------------------------------|
| **ACID Compliance** | Full transactional support for data integrity             |
| **Rich Data Types** | Native JSON, UUID, timestamp with timezone support        |
| **Full-Text Search**| Built-in search capabilities (future enhancement)          |
| **Scalability**     | Read replicas, partitioning, connection pooling           |
| **Ecosystem**       | Excellent ORM support (Prisma), mature tooling            |
| **Cost**            | Open-source, free; Railway/Supabase offer managed hosting |
| **Performance**     | Optimized for read-heavy workloads with proper indexing   |

**Alternatives Considered:**
- **MySQL**: Less robust JSON support, weaker for complex queries
- **MongoDB**: NoSQL unsuitable for relational data (users ↔ notes ↔ contests)
- **SQLite**: Not suitable for production; no concurrent write support

### 2.2 Cache Layer: Redis

**Purpose:**
- Session storage (JWT tokens, OAuth state)
- Contest data caching (6-hour TTL)
- Rate limiting counters
- Background job queue (Bull)

**Hosted on:** Upstash (serverless Redis) or Railway Redis addon

---

## 3. Entity-Relationship Diagram (ERD)

### 3.1 High-Level ERD

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          DATABASE SCHEMA                                 │
│                     cp_calendar_production                               │
└──────────────────────────────────────────────────────────────────────────┘

┌─────────────────────┐
│       User          │
├─────────────────────┤       1
│ id (PK)             │◄─────────┐
│ email               │          │
│ name                │          │
│ oauth_provider      │          │
│ oauth_token (enc)   │          │
│ oauth_refresh_token │          │
│ token_expires_at    │          │
│ avatar_url          │          │
│ timezone            │          │
│ created_at          │          │
│ updated_at          │          │
└─────────────────────┘          │
                                 │
                                 │ N (owns)
                    ┌────────────┴────────────┐
                    │                         │
                    │                         │
          ┌─────────▼──────────┐    ┌────────▼─────────┐
          │       Note         │    │    SyncLog       │
          ├────────────────────┤    ├──────────────────┤
          │ id (PK)            │    │ id (PK)          │
          │ user_id (FK)       │    │ user_id (FK)     │
          │ contest_id (FK)?   │    │ status           │
          │ content (text)     │    │ message          │
          │ is_ai_generated    │    │ synced_count     │
          │ created_at         │    │ failed_count     │
          │ updated_at         │    │ synced_at        │
          └──────────┬─────────┘    └──────────────────┘
                     │
                     │ N:1 (optional)
                     │
          ┌──────────▼─────────────────────────┐
          │          Contest                   │
          ├────────────────────────────────────┤
          │ id (PK)                            │
          │ platform (enum)                    │
          │ name                               │
          │ url                                │
          │ start_time_utc                     │
          │ start_time_ist                     │
          │ end_time_utc                       │
          │ end_time_ist                       │
          │ duration_minutes                   │
          │ difficulty                         │
          │ external_id                        │
          │ created_at                         │
          │ updated_at                         │
          └────────────────────────────────────┘
                     ▲
                     │
                     │ N:M (future: user subscriptions)
                     │
          ┌──────────┴─────────────────────────┐
          │    UserContestSubscription         │
          │         (Future Table)             │
          ├────────────────────────────────────┤
          │ id (PK)                            │
          │ user_id (FK)                       │
          │ contest_id (FK)                    │
          │ subscribed_at                      │
          │ reminder_sent                      │
          └────────────────────────────────────┘
```

### 3.2 Detailed ERD with Cardinality

```
                  ┌───────────┐
                  │   User    │
                  └─────┬─────┘
                        │ 1
                        │
           ┌────────────┼────────────┐
           │            │            │
         1:N          1:N          1:N
           │            │            │
    ┌──────▼─────┐ ┌───▼────┐ ┌────▼─────────┐
    │    Note    │ │SyncLog │ │CalendarEvent │
    │            │ │        │ │  (Future)    │
    └──────┬─────┘ └────────┘ └──────────────┘
           │
         N:1 (optional)
           │
    ┌──────▼────────┐
    │   Contest     │
    └───────────────┘

Legend:
  1   = one
  N   = many
  FK  = Foreign Key
  PK  = Primary Key
  ?   = nullable
```

---

## 4. Detailed Table Schemas

### 4.1 Table: `users`

**Purpose:** Store authenticated user accounts and OAuth credentials.

```sql
CREATE TABLE users (
  id                    VARCHAR(30) PRIMARY KEY,  -- CUID: clx1y2z3a0000...
  email                 VARCHAR(255) NOT NULL UNIQUE,
  name                  VARCHAR(255),
  oauth_provider        VARCHAR(50) NOT NULL DEFAULT 'google',
  oauth_token           TEXT,                     -- Encrypted AES-256
  oauth_refresh_token   TEXT,                     -- Encrypted
  token_expires_at      TIMESTAMPTZ,
  avatar_url            TEXT,
  timezone              VARCHAR(50) DEFAULT 'Asia/Kolkata',
  notification_prefs    JSONB DEFAULT '{}',       -- {"email": true, "push": false}
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Comments
COMMENT ON TABLE users IS 'Authenticated user accounts with OAuth credentials';
COMMENT ON COLUMN users.oauth_token IS 'Google OAuth access token (encrypted at rest)';
COMMENT ON COLUMN users.timezone IS 'User preferred timezone for display';
```

**Constraints:**
- `email`: Must be valid email format (validated by application layer)
- `oauth_provider`: Currently only `'google'`, expandable to `'github'`, `'microsoft'`
- `timezone`: IANA timezone identifier (e.g., `'Asia/Kolkata'`, `'America/New_York'`)

**Encryption:**
- `oauth_token` and `oauth_refresh_token` encrypted using application-level AES-256-GCM
- Encryption key stored in environment variable `ENCRYPTION_KEY` (32-byte base64)

**Sample Data:**
```sql
INSERT INTO users (id, email, name, oauth_provider, timezone)
VALUES 
  ('clx1y2z3a0000abc', 'arjun@example.com', 'Arjun Kumar', 'google', 'Asia/Kolkata'),
  ('clx1y2z3a0001def', 'priya@example.com', 'Priya Sharma', 'google', 'Asia/Kolkata');
```

---

### 4.2 Table: `contests`

**Purpose:** Store competitive programming contest schedules from all platforms.

```sql
CREATE TYPE platform_enum AS ENUM ('LEETCODE', 'CODEFORCES', 'CODECHEF');
CREATE TYPE difficulty_enum AS ENUM ('EASY', 'MEDIUM', 'HARD', 'DIV1', 'DIV2', 'DIV3', 'UNKNOWN');

CREATE TABLE contests (
  id                    VARCHAR(30) PRIMARY KEY,  -- CUID
  platform              platform_enum NOT NULL,
  name                  VARCHAR(500) NOT NULL,
  url                   TEXT NOT NULL,
  start_time_utc        TIMESTAMPTZ NOT NULL,
  start_time_ist        TIMESTAMPTZ NOT NULL,     -- Indexed for queries
  end_time_utc          TIMESTAMPTZ,
  end_time_ist          TIMESTAMPTZ,
  duration_minutes      INTEGER,                  -- Contest duration
  difficulty            difficulty_enum DEFAULT 'UNKNOWN',
  external_id           VARCHAR(255),             -- Platform's contest ID
  description           TEXT,
  is_active             BOOLEAN DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique constraint: same contest on same platform at same time
  CONSTRAINT uq_contest_platform_time UNIQUE (platform, name, start_time_utc)
);

-- Indexes
CREATE INDEX idx_contests_platform ON contests(platform);
CREATE INDEX idx_contests_start_ist ON contests(start_time_ist DESC);
CREATE INDEX idx_contests_platform_start ON contests(platform, start_time_ist);
CREATE INDEX idx_contests_active ON contests(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_contests_upcoming ON contests(start_time_ist) 
  WHERE start_time_ist > NOW() AND is_active = TRUE;

-- Full-text search (future)
CREATE INDEX idx_contests_name_fts ON contests USING GIN(to_tsvector('english', name));

COMMENT ON TABLE contests IS 'Competitive programming contest schedules';
COMMENT ON COLUMN contests.start_time_ist IS 'Indexed for fast upcoming contest queries';
COMMENT ON COLUMN contests.external_id IS 'Platform-specific contest identifier';
```

**Validation Rules:**
- `start_time_utc` and `start_time_ist` must be consistent (validated in application)
- `end_time_utc` must be after `start_time_utc`
- `duration_minutes` should match `end_time - start_time` (when both present)
- `url` must be valid URL format

**Sample Data:**
```sql
INSERT INTO contests (id, platform, name, url, start_time_utc, start_time_ist, duration_minutes, difficulty)
VALUES 
  (
    'clx2a3b4c5000xyz',
    'LEETCODE',
    'Weekly Contest 350',
    'https://leetcode.com/contest/weekly-350',
    '2026-07-05 02:30:00+00',  -- 8:00 AM IST
    '2026-07-05 08:00:00+05:30',
    90,
    'MEDIUM'
  ),
  (
    'clx2a3b4c5001abc',
    'CODEFORCES',
    'Codeforces Round 850 (Div. 2)',
    'https://codeforces.com/contest/1850',
    '2026-07-06 14:35:00+00',  -- 8:05 PM IST
    '2026-07-06 20:05:00+05:30',
    120,
    'DIV2'
  );
```

---

### 4.3 Table: `notes`

**Purpose:** Store user-created or AI-generated notes linked to contests.

```sql
CREATE TABLE notes (
  id                    VARCHAR(30) PRIMARY KEY,
  user_id               VARCHAR(30) NOT NULL,
  contest_id            VARCHAR(30),              -- Nullable: note may be standalone
  title                 VARCHAR(500),
  content               TEXT NOT NULL,            -- Markdown format
  is_ai_generated       BOOLEAN DEFAULT FALSE,
  ai_model_version      VARCHAR(50),              -- e.g., 'ashna-v1.2'
  tags                  TEXT[],                   -- Array of tags
  is_pinned             BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_notes_user FOREIGN KEY (user_id) 
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_notes_contest FOREIGN KEY (contest_id) 
    REFERENCES contests(id) ON DELETE SET NULL,
  CONSTRAINT chk_content_length CHECK (LENGTH(content) <= 100000)
);

-- Indexes
CREATE INDEX idx_notes_user ON notes(user_id, created_at DESC);
CREATE INDEX idx_notes_contest ON notes(contest_id) WHERE contest_id IS NOT NULL;
CREATE INDEX idx_notes_user_contest ON notes(user_id, contest_id);
CREATE INDEX idx_notes_pinned ON notes(user_id, is_pinned) WHERE is_pinned = TRUE;

-- Full-text search
CREATE INDEX idx_notes_content_fts ON notes USING GIN(to_tsvector('english', content));

COMMENT ON TABLE notes IS 'User notes for contest preparation';
COMMENT ON COLUMN notes.is_ai_generated IS 'TRUE if generated by Ashna AI agent';
COMMENT ON COLUMN notes.content IS 'Markdown formatted text, max 100KB';
```

**Validation Rules:**
- `content` max length: 100,000 characters (enforced by CHECK constraint)
- `user_id` must reference existing user
- `contest_id` optional; if set, must reference existing contest
- `tags` array limited to 10 tags max (application validation)

**Cascade Behavior:**
- User deleted → All notes deleted (CASCADE)
- Contest deleted → Notes remain but `contest_id` set to NULL (SET NULL)

**Sample Data:**
```sql
INSERT INTO notes (id, user_id, contest_id, title, content, is_ai_generated)
VALUES 
  (
    'clx3a4b5c6000note',
    'clx1y2z3a0000abc',  -- Arjun's user ID
    'clx2a3b4c5000xyz',  -- LeetCode Weekly 350
    'LeetCode Weekly 350 Prep',
    '# Preparation Notes\n\n## Key Topics\n- Dynamic Programming\n- Graph Algorithms\n\n## Strategy\n- Solve easy problems first\n- Time limit: 90 minutes',
    TRUE  -- AI-generated
  );
```

---

### 4.4 Table: `sync_logs`

**Purpose:** Track calendar synchronization attempts and results.

```sql
CREATE TYPE sync_status_enum AS ENUM ('SUCCESS', 'PARTIAL', 'FAILED');

CREATE TABLE sync_logs (
  id                    VARCHAR(30) PRIMARY KEY,
  user_id               VARCHAR(30) NOT NULL,
  status                sync_status_enum NOT NULL,
  message               TEXT,                     -- Error details or success summary
  synced_count          INTEGER DEFAULT 0,        -- Number of events synced
  failed_count          INTEGER DEFAULT 0,
  contest_ids           TEXT[],                   -- Array of contest IDs synced
  google_calendar_ids   TEXT[],                   -- Array of Google event IDs created
  duration_ms           INTEGER,                  -- Sync duration in milliseconds
  synced_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_sync_logs_user FOREIGN KEY (user_id) 
    REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_sync_logs_user ON sync_logs(user_id, synced_at DESC);
CREATE INDEX idx_sync_logs_status ON sync_logs(status);
CREATE INDEX idx_sync_logs_synced_at ON sync_logs(synced_at DESC);

COMMENT ON TABLE sync_logs IS 'Audit log for Google Calendar sync operations';
COMMENT ON COLUMN sync_logs.google_calendar_ids IS 'Google Calendar event IDs for rollback';
```

**Sample Data:**
```sql
INSERT INTO sync_logs (id, user_id, status, message, synced_count, failed_count, duration_ms)
VALUES 
  (
    'clx4a5b6c7000log',
    'clx1y2z3a0000abc',
    'SUCCESS',
    'Successfully synced 5 contests to Google Calendar',
    5,
    0,
    2340  -- 2.34 seconds
  );
```

---

### 4.5 Table: `user_preferences` (Future)

**Purpose:** Store user-specific settings and preferences.

```sql
CREATE TABLE user_preferences (
  id                    VARCHAR(30) PRIMARY KEY,
  user_id               VARCHAR(30) NOT NULL UNIQUE,
  theme                 VARCHAR(20) DEFAULT 'light',  -- 'light', 'dark', 'auto'
  language              VARCHAR(10) DEFAULT 'en',     -- ISO 639-1 code
  notification_email    BOOLEAN DEFAULT TRUE,
  notification_push     BOOLEAN DEFAULT FALSE,
  reminder_minutes      INTEGER[] DEFAULT ARRAY[5, 15],  -- Default reminders
  default_calendar_view VARCHAR(20) DEFAULT 'month',     -- 'month', 'week', 'day'
  show_past_contests    BOOLEAN DEFAULT FALSE,
  preferred_platforms   TEXT[] DEFAULT ARRAY['LEETCODE', 'CODEFORCES', 'CODECHEF'],
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_user_prefs_user FOREIGN KEY (user_id) 
    REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_prefs_user ON user_preferences(user_id);

COMMENT ON TABLE user_preferences IS 'User-specific application settings';
```

---

### 4.6 Table: `api_keys` (Future: Admin/API Access)

**Purpose:** Store API keys for programmatic access (future feature).

```sql
CREATE TABLE api_keys (
  id                    VARCHAR(30) PRIMARY KEY,
  user_id               VARCHAR(30) NOT NULL,
  key_hash              VARCHAR(64) NOT NULL UNIQUE,  -- SHA-256 hash
  key_prefix            VARCHAR(10) NOT NULL,         -- First 8 chars for display
  name                  VARCHAR(100) NOT NULL,
  scopes                TEXT[] DEFAULT ARRAY['read'],  -- 'read', 'write', 'admin'
  is_active             BOOLEAN DEFAULT TRUE,
  last_used_at          TIMESTAMPTZ,
  expires_at            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_api_keys_user FOREIGN KEY (user_id) 
    REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_active ON api_keys(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE api_keys IS 'API keys for programmatic access (future feature)';
```

---

## 5. Prisma Schema Definition

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "fullTextIndex"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                  String   @id @default(cuid())
  email               String   @unique
  name                String?
  oauthProvider       String   @default("google") @map("oauth_provider")
  oauthToken          String?  @map("oauth_token") @db.Text
  oauthRefreshToken   String?  @map("oauth_refresh_token") @db.Text
  tokenExpiresAt      DateTime? @map("token_expires_at")
  avatarUrl           String?  @map("avatar_url") @db.Text
  timezone            String   @default("Asia/Kolkata")
  notificationPrefs   Json     @default("{}") @map("notification_prefs") @db.JsonB
  createdAt           DateTime @default(now()) @map("created_at")
  updatedAt           DateTime @updatedAt @map("updated_at")
  
  notes               Note[]
  syncLogs            SyncLog[]
  
  @@index([email])
  @@index([createdAt(sort: Desc)])
  @@map("users")
}

enum Platform {
  LEETCODE
  CODEFORCES
  CODECHEF
}

enum Difficulty {
  EASY
  MEDIUM
  HARD
  DIV1
  DIV2
  DIV3
  UNKNOWN
}

model Contest {
  id              String     @id @default(cuid())
  platform        Platform
  name            String     @db.VarChar(500)
  url             String     @db.Text
  startTimeUtc    DateTime   @map("start_time_utc")
  startTimeIst    DateTime   @map("start_time_ist")
  endTimeUtc      DateTime?  @map("end_time_utc")
  endTimeIst      DateTime?  @map("end_time_ist")
  durationMinutes Int?       @map("duration_minutes")
  difficulty      Difficulty @default(UNKNOWN)
  externalId      String?    @map("external_id") @db.VarChar(255)
  description     String?    @db.Text
  isActive        Boolean    @default(true) @map("is_active")
  createdAt       DateTime   @default(now()) @map("created_at")
  updatedAt       DateTime   @updatedAt @map("updated_at")
  
  notes           Note[]
  
  @@unique([platform, name, startTimeUtc], name: "uq_contest_platform_time")
  @@index([platform])
  @@index([startTimeIst(sort: Desc)])
  @@index([platform, startTimeIst])
  @@index([isActive], map: "idx_contests_active")
  @@map("contests")
}

model Note {
  id               String    @id @default(cuid())
  userId           String    @map("user_id")
  contestId        String?   @map("contest_id")
  title            String?   @db.VarChar(500)
  content          String    @db.Text
  isAiGenerated    Boolean   @default(false) @map("is_ai_generated")
  aiModelVersion   String?   @map("ai_model_version") @db.VarChar(50)
  tags             String[]  @default([])
  isPinned         Boolean   @default(false) @map("is_pinned")
  createdAt        DateTime  @default(now()) @map("created_at")
  updatedAt        DateTime  @updatedAt @map("updated_at")
  
  user             User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  contest          Contest?  @relation(fields: [contestId], references: [id], onDelete: SetNull)
  
  @@index([userId, createdAt(sort: Desc)])
  @@index([contestId])
  @@index([userId, contestId])
  @@index([userId, isPinned])
  @@map("notes")
}

enum SyncStatus {
  SUCCESS
  PARTIAL
  FAILED
}

model SyncLog {
  id                 String     @id @default(cuid())
  userId             String     @map("user_id")
  status             SyncStatus
  message            String?    @db.Text
  syncedCount        Int        @default(0) @map("synced_count")
  failedCount        Int        @default(0) @map("failed_count")
  contestIds         String[]   @default([]) @map("contest_ids")
  googleCalendarIds  String[]   @default([]) @map("google_calendar_ids")
  durationMs         Int?       @map("duration_ms")
  syncedAt           DateTime   @default(now()) @map("synced_at")
  
  user               User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId, syncedAt(sort: Desc)])
  @@index([status])
  @@index([syncedAt(sort: Desc)])
  @@map("sync_logs")
}
```

---

## 6. Index Strategy

### 6.1 Query Patterns & Indexes

| Query Pattern                              | Index Used                          | Justification                           |
|--------------------------------------------|-------------------------------------|-----------------------------------------|
| Upcoming contests (all platforms)          | `idx_contests_upcoming`             | Partial index (WHERE future + active)   |
| Upcoming contests (specific platform)      | `idx_contests_platform_start`       | Composite index (platform, start_time)  |
| User's notes (recent first)                | `idx_notes_user`                    | Composite (user_id, created_at DESC)    |
| Notes for a contest                        | `idx_notes_contest`                 | Partial index (WHERE contest_id != NULL)|
| User's sync history                        | `idx_sync_logs_user`                | Composite (user_id, synced_at DESC)     |
| Full-text search in notes                  | `idx_notes_content_fts`             | GIN index for ts_vector                 |

### 6.2 Index Maintenance

**Monitoring:**
- Use `pg_stat_user_indexes` to track index usage
- Identify unused indexes quarterly
- Rebuild fragmented indexes after bulk data changes

**Commands:**
```sql
-- Check index usage
SELECT 
  schemaname, tablename, indexname, 
  idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;

-- Rebuild index
REINDEX INDEX CONCURRENTLY idx_contests_upcoming;
```

---

## 7. Data Integrity & Constraints

### 7.1 Foreign Key Constraints

```sql
-- Notes reference users (cascade delete)
ALTER TABLE notes 
  ADD CONSTRAINT fk_notes_user 
  FOREIGN KEY (user_id) REFERENCES users(id) 
  ON DELETE CASCADE;

-- Notes reference contests (set null on delete)
ALTER TABLE notes 
  ADD CONSTRAINT fk_notes_contest 
  FOREIGN KEY (contest_id) REFERENCES contests(id) 
  ON DELETE SET NULL;

-- Sync logs reference users (cascade delete)
ALTER TABLE sync_logs 
  ADD CONSTRAINT fk_sync_logs_user 
  FOREIGN KEY (user_id) REFERENCES users(id) 
  ON DELETE CASCADE;
```

### 7.2 Check Constraints

```sql
-- Note content length
ALTER TABLE notes 
  ADD CONSTRAINT chk_content_length 
  CHECK (LENGTH(content) <= 100000);

-- Contest times consistency
ALTER TABLE contests 
  ADD CONSTRAINT chk_end_after_start 
  CHECK (end_time_utc IS NULL OR end_time_utc > start_time_utc);

-- Sync counts non-negative
ALTER TABLE sync_logs 
  ADD CONSTRAINT chk_sync_counts_positive 
  CHECK (synced_count >= 0 AND failed_count >= 0);
```

### 7.3 Unique Constraints

```sql
-- Prevent duplicate contests
ALTER TABLE contests 
  ADD CONSTRAINT uq_contest_platform_time 
  UNIQUE (platform, name, start_time_utc);

-- One user per email
ALTER TABLE users 
  ADD CONSTRAINT uq_user_email 
  UNIQUE (email);
```

---

## 8. Migration Strategy

### 8.1 Initial Migration

**Using Prisma Migrate:**

```bash
# Create initial migration
prisma migrate dev --name init

# Apply to production
prisma migrate deploy
```

**Generated SQL:**
```sql
-- Migration: 20260704000000_init

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('LEETCODE', 'CODEFORCES', 'CODECHEF');
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'DIV1', 'DIV2', 'DIV3', 'UNKNOWN');
CREATE TYPE "SyncStatus" AS ENUM ('SUCCESS', 'PARTIAL', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
  -- (full schema as defined above)
);

-- CreateTable
CREATE TABLE "contests" (...)

-- CreateTable
CREATE TABLE "notes" (...)

-- CreateTable
CREATE TABLE "sync_logs" (...)

-- CreateIndex
CREATE INDEX "idx_users_email" ON "users"("email");
-- (all other indexes)

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "fk_notes_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
-- (all other foreign keys)
```

### 8.2 Subsequent Migrations

**Example: Add `difficulty` column to contests**

```bash
prisma migrate dev --name add_contest_difficulty
```

**Generated:**
```sql
-- Migration: 20260710120000_add_contest_difficulty

ALTER TABLE "contests" 
  ADD COLUMN "difficulty" "Difficulty" DEFAULT 'UNKNOWN';

CREATE INDEX "idx_contests_difficulty" ON "contests"("difficulty");
```

### 8.3 Rollback Strategy

**Manual Rollback (Prisma doesn't auto-rollback):**

```sql
-- Revert last migration manually
ALTER TABLE "contests" DROP COLUMN "difficulty";
DROP INDEX "idx_contests_difficulty";

-- Mark migration as reverted in Prisma
DELETE FROM "_prisma_migrations" 
WHERE "migration_name" = '20260710120000_add_contest_difficulty';
```

**Best Practice**: Test migrations in staging first.

---

## 9. Backup & Recovery

### 9.1 Automated Backups

**Railway Postgres:**
- Automatic daily backups (retained 7 days on free tier, 30 days on Pro)
- Point-in-time recovery (PITR) available on Pro plan

**Manual Backup:**
```bash
# Full database dump
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Compressed backup
pg_dump $DATABASE_URL | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Schema only
pg_dump --schema-only $DATABASE_URL > schema_backup.sql

# Data only
pg_dump --data-only $DATABASE_URL > data_backup.sql
```

### 9.2 Restore Procedure

```bash
# Restore from backup
psql $DATABASE_URL < backup_20260704_120000.sql

# Or from compressed
gunzip -c backup_20260704_120000.sql.gz | psql $DATABASE_URL
```

### 9.3 Disaster Recovery Plan

1. **Detection**: Monitoring alerts (Datadog, Railway logs)
2. **Assessment**: Identify data loss scope (timestamp, tables affected)
3. **Communication**: Notify users via status page
4. **Restore**: 
   - Stop application writes
   - Restore latest backup
   - Apply transaction logs (if PITR enabled)
   - Verify data integrity
5. **Resume**: Restart application, monitor closely
6. **Post-Mortem**: Document incident, improve backup strategy

**RTO (Recovery Time Objective):** 4 hours  
**RPO (Recovery Point Objective):** 24 hours (daily backups)

---

## 10. Query Optimization Patterns

### 10.1 Common Query: Upcoming Contests

**Inefficient:**
```sql
SELECT * FROM contests 
WHERE start_time_ist > NOW() 
ORDER BY start_time_ist ASC;
```

**Optimized:**
```sql
SELECT 
  id, platform, name, url, 
  start_time_ist, duration_minutes, difficulty
FROM contests 
WHERE start_time_ist > NOW() AND is_active = TRUE
ORDER BY start_time_ist ASC
LIMIT 50;
```

**Uses Index:** `idx_contests_upcoming` (partial index)

**Prisma Query:**
```typescript
const upcomingContests = await prisma.contest.findMany({
  where: {
    startTimeIst: { gte: new Date() },
    isActive: true,
  },
  select: {
    id: true,
    platform: true,
    name: true,
    url: true,
    startTimeIst: true,
    durationMinutes: true,
    difficulty: true,
  },
  orderBy: { startTimeIst: 'asc' },
  take: 50,
});
```

### 10.2 Common Query: User Notes with Contest Details

**Inefficient (N+1 problem):**
```typescript
const notes = await prisma.note.findMany({ where: { userId } });
for (const note of notes) {
  if (note.contestId) {
    const contest = await prisma.contest.findUnique({ 
      where: { id: note.contestId } 
    });
    // Process contest
  }
}
```

**Optimized (JOIN):**
```typescript
const notes = await prisma.note.findMany({
  where: { userId },
  include: { 
    contest: {
      select: { id: true, name: true, platform: true, startTimeIst: true }
    }
  },
  orderBy: { createdAt: 'desc' },
  take: 20,
});
```

**Raw SQL (for reference):**
```sql
SELECT 
  n.id, n.title, n.content, n.created_at,
  c.id AS contest_id, c.name AS contest_name, 
  c.platform, c.start_time_ist
FROM notes n
LEFT JOIN contests c ON n.contest_id = c.id
WHERE n.user_id = $1
ORDER BY n.created_at DESC
LIMIT 20;
```

### 10.3 Pagination Best Practices

**Offset-based (good for small datasets):**
```typescript
const page = 2;
const pageSize = 20;
const contests = await prisma.contest.findMany({
  skip: (page - 1) * pageSize,
  take: pageSize,
  orderBy: { startTimeIst: 'asc' },
});
```

**Cursor-based (better for large datasets):**
```typescript
const contests = await prisma.contest.findMany({
  take: 20,
  cursor: lastCursorId ? { id: lastCursorId } : undefined,
  skip: lastCursorId ? 1 : 0,  // Skip the cursor itself
  orderBy: { startTimeIst: 'asc' },
});
```

---

## 11. Scalability Considerations

### 11.1 Read Replicas

**Setup (PostgreSQL):**
```yaml
# docker-compose.yml (example)
postgres-primary:
  image: postgres:15
  environment:
    POSTGRES_DB: cp_calendar
    POSTGRES_REPLICATION_MODE: master

postgres-replica:
  image: postgres:15
  environment:
    POSTGRES_MASTER_HOST: postgres-primary
    POSTGRES_REPLICATION_MODE: slave
```

**Application (Prisma with read replicas):**
```typescript
// Use read replica for queries
const contestsReadOnly = await prisma.$queryRaw`
  SELECT * FROM contests WHERE start_time_ist > NOW()
`;

// Use primary for writes
const newNote = await prisma.note.create({ data: {...} });
```

### 11.2 Partitioning (Future)

**Scenario:** Contests table grows to millions of rows

**Strategy:** Partition by `start_time_ist` (yearly or quarterly)

```sql
-- Create partitioned table
CREATE TABLE contests_partitioned (
  LIKE contests INCLUDING ALL
) PARTITION BY RANGE (start_time_ist);

-- Create partitions
CREATE TABLE contests_2026 PARTITION OF contests_partitioned
  FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

CREATE TABLE contests_2027 PARTITION OF contests_partitioned
  FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');
```

### 11.3 Connection Pooling

**PgBouncer Configuration:**
```ini
[databases]
cp_calendar = host=localhost port=5432 dbname=cp_calendar

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 20
reserve_pool_size = 5
```

**Prisma Configuration:**
```env
DATABASE_URL="postgresql://user:pass@pgbouncer:6432/cp_calendar?pgbouncer=true&connection_limit=20"
```

---

## 12. Monitoring & Maintenance

### 12.1 Key Metrics to Monitor

| Metric                       | Target         | Alert Threshold |
|------------------------------|----------------|------------------|
| Connection count             | <50            | >80              |
| Query response time (p95)    | <100ms         | >500ms           |
| Database size                | <10GB (MVP)    | >8GB             |
| Cache hit ratio              | >95%           | <85%             |
| Slow query count (>1s)       | 0              | >10/hour         |
| Replication lag (if replicas)| <1s            | >10s             |

### 12.2 Database Maintenance Tasks

**Weekly:**
```sql
-- Vacuum and analyze
VACUUM ANALYZE;

-- Check table bloat
SELECT 
  schemaname, tablename, 
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

**Monthly:**
- Review slow query log
- Rebuild fragmented indexes
- Audit unused indexes
- Update table statistics

### 12.3 Query Performance Analysis

```sql
-- Find slow queries
SELECT 
  query, 
  calls, 
  total_time, 
  mean_time, 
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Explain query plan
EXPLAIN ANALYZE
SELECT * FROM contests 
WHERE start_time_ist > NOW() 
ORDER BY start_time_ist ASC 
LIMIT 50;
```

---

## 13. Security Best Practices

### 13.1 Database User Roles

```sql
-- Application user (read/write)
CREATE USER cp_calendar_app WITH PASSWORD 'secure_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO cp_calendar_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO cp_calendar_app;

-- Read-only user (for analytics)
CREATE USER cp_calendar_readonly WITH PASSWORD 'readonly_password';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO cp_calendar_readonly;

-- Revoke dangerous permissions
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
```

### 13.2 Row-Level Security (Future: Multi-tenancy)

```sql
-- Enable RLS on notes table
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own notes
CREATE POLICY notes_isolation ON notes
  USING (user_id = current_setting('app.current_user_id')::VARCHAR);

-- Set current user in application
SET app.current_user_id = 'clx1y2z3a0000abc';
```

### 13.3 Encrypted Columns

**Application-level encryption (AES-256-GCM):**

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'base64');
const ALGORITHM = 'aes-256-gcm';

export function encrypt(text: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

---

## 14. Data Seeding

### 14.1 Seed Script (Development)

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.syncLog.deleteMany();
  await prisma.note.deleteMany();
  await prisma.contest.deleteMany();
  await prisma.user.deleteMany();

  // Create test users
  const arjun = await prisma.user.create({
    data: {
      email: 'arjun@example.com',
      name: 'Arjun Kumar',
      timezone: 'Asia/Kolkata',
    },
  });

  const priya = await prisma.user.create({
    data: {
      email: 'priya@example.com',
      name: 'Priya Sharma',
      timezone: 'Asia/Kolkata',
    },
  });

  // Create sample contests
  const leetcodeContest = await prisma.contest.create({
    data: {
      platform: 'LEETCODE',
      name: 'Weekly Contest 350',
      url: 'https://leetcode.com/contest/weekly-350',
      startTimeUtc: new Date('2026-07-05T02:30:00Z'),
      startTimeIst: new Date('2026-07-05T08:00:00+05:30'),
      durationMinutes: 90,
      difficulty: 'MEDIUM',
    },
  });

  const codeforcesContest = await prisma.contest.create({
    data: {
      platform: 'CODEFORCES',
      name: 'Codeforces Round 850 (Div. 2)',
      url: 'https://codeforces.com/contest/1850',
      startTimeUtc: new Date('2026-07-06T14:35:00Z'),
      startTimeIst: new Date('2026-07-06T20:05:00+05:30'),
      durationMinutes: 120,
      difficulty: 'DIV2',
    },
  });

  // Create sample notes
  await prisma.note.create({
    data: {
      userId: arjun.id,
      contestId: leetcodeContest.id,
      title: 'LeetCode Weekly 350 Prep',
      content: `# Preparation Notes\n\n## Key Topics\n- Dynamic Programming\n- Graph Algorithms\n\n## Strategy\n- Solve easy problems first\n- Time limit: 90 minutes`,
      isAiGenerated: true,
    },
  });

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Run seed:**
```bash
prisma db seed
```

---

## 15. Conclusion

This database schema document provides a **production-ready, scalable foundation** for the Competitive Programming Calendar + Notes application. Key design decisions:

1. **PostgreSQL 15** for ACID compliance and rich data types
2. **Normalized schema** (3NF) to eliminate redundancy
3. **Strategic indexes** for common query patterns
4. **Foreign key constraints** with appropriate cascade rules
5. **Prisma ORM** for type-safe database access
6. **Encryption at rest** for sensitive OAuth tokens
7. **Comprehensive backup strategy** (daily automated backups)
8. **Query optimization patterns** to maintain sub-100ms response times
9. **Scalability path** (read replicas, partitioning, connection pooling)

**Next Steps:**
- Run initial migration: `prisma migrate dev --name init`
- Seed development database: `prisma db seed`
- Set up automated backups in production
- Configure monitoring (pg_stat_statements, Datadog)
- Proceed to API Specification document

---

**Document Status**: Draft v1.0  
**Approvers**: Database Architect, Backend Lead, DevOps Lead  
**Revision History**:
- 2026-07-04: Initial draft.
