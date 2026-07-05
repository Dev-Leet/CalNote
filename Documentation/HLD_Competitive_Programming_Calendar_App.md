# High-Level Design (HLD): Competitive Programming Calendar + Notes App

**Version:** 1.0  
**Date:** July 4, 2026  
**Author:** Max Effort Reasoning Engine  

---

## 1. Executive Summary

This document outlines the **High-Level Design** for a Calendar + Notes application tailored for competitive programmers. The system will:

- Automatically scrape upcoming contests from **LeetCode**, **Codeforces**, and **CodeChef**.
- Sync contest events to a user's calendar with **Indian Standard Time (IST)** timestamps.
- Set reminders at **-5 minutes** and **-15 minutes** before each contest.
- Enable AI-assisted note creation and insertion into calendar events.
- Integrate with **Ashna AI agents** for web search and intelligent note generation.

---

## 2. System Objectives

### 2.1 Functional Requirements

1. **Contest Discovery**
   - Fetch upcoming contests from LeetCode, Codeforces, CodeChef.
   - Handle rate limits, site structure changes, and API availability.

2. **Calendar Integration**
   - Sync events to Google Calendar (or custom in-app calendar).
   - Display events in IST.
   - Attach alarms/reminders (-5 min, -15 min).

3. **AI-Powered Notes**
   - Allow users to request AI-generated notes (contest prep tips, problem patterns, etc.).
   - Insert notes into calendar event descriptions or linked notes storage.

4. **Agentic AI Integration**
   - Use Ashna AI agents for:
     - **Web search**: Scraping/fetching contest data.
     - **Note generation**: Context-aware note creation.

5. **User Management**
   - OAuth-based authentication (Google, GitHub).
   - Multi-user support with isolated calendars.

### 2.2 Non-Functional Requirements

- **Scalability**: Support 10,000+ users with minimal latency.
- **Reliability**: 99.5% uptime; graceful degradation if third-party APIs fail.
- **Security**: Encrypted credentials, OAuth 2.0, HTTPS.
- **Performance**: Contest updates within 5 minutes of source updates.
- **Maintainability**: Modular codebase, CI/CD pipelines.

---

## 3. System Architecture Overview

### 3.1 High-Level Components

```
┌─────────────────┐
│   User (Web)    │
│   (React PWA)   │
└────────┬────────┘
         │
         │ HTTPS
         ▼
┌─────────────────────────────────────┐
│       API Gateway (Node.js)         │
│  ┌──────────────┬──────────────┐    │
│  │ Auth Service │ Calendar API │    │
│  └──────────────┴──────────────┘    │
└────────┬────────────────────────────┘
         │
         ├─► Google Calendar API (OAuth)
         │
         ├─► Database (PostgreSQL)
         │   - Users, Events, Notes
         │
         ├─► Contest Scraper Service
         │   - Scheduled jobs (cron)
         │   - LeetCode, Codeforces, CodeChef
         │
         └─► Ashna AI Agent (API)
             - Web search for contests
             - AI note generation
```

### 3.2 Data Flow

1. **Contest Ingestion**
   - **Scheduled Task** (every 6 hours) triggers Contest Scraper.
   - Scraper calls Ashna AI agent to fetch latest contest data.
   - Results stored in DB with IST timestamps.

2. **Calendar Sync**
   - User authenticates via OAuth.
   - Backend reads DB, pushes events to Google Calendar API.
   - Reminders set programmatically.

3. **Note Creation**
   - User requests note for a contest.
   - Backend sends context (contest name, platform, time) to Ashna AI agent.
   - Agent returns note; backend stores and attaches to calendar event.

---

## 4. Key Design Decisions

### 4.1 Data Sources

| Platform    | Data Source                  | Method          |
|-------------|------------------------------|------------------|
| LeetCode    | GraphQL API (unofficial)     | HTTP + parsing  |
| Codeforces  | Official API                 | REST API        |
| CodeChef    | Web scraping (HTML parsing)  | Puppeteer/Cheerio|
| Aggregator  | Clist.by / Kontests.net API  | Fallback option |

**Rationale**: Use official APIs where available; fallback to scraping or third-party aggregators.

### 4.2 Calendar Backend

**Choice**: Google Calendar API  
**Alternatives**: Custom iCal server, Outlook API, in-app calendar (FullCalendar.js)  
**Rationale**: Google Calendar is widely used, supports OAuth, and has robust reminder features.

### 4.3 AI Agent Integration

**Ashna AI Agent Roles**:
- **Web Search Agent**: Executes web scraping tasks, returns structured JSON.
- **Notes Agent**: Generates contextual notes given contest metadata.

**Integration Method**: RESTful API calls from backend to Ashna AI agent endpoints.

### 4.4 Timezone Handling

- All source times converted to UTC, then to IST (UTC+5:30) before storage.
- Client displays times in IST; optionally supports user-selected timezones.

### 4.5 Reminder Mechanism

- Google Calendar API supports `reminders.overrides` array.
- Set two popup reminders: 5 minutes, 15 minutes before event start.

---

## 5. Component Breakdown

### 5.1 Frontend (React PWA)

- **Pages**: Dashboard, Calendar View, Notes Editor, Settings.
- **Features**:
  - Display upcoming contests in a calendar grid.
  - One-click sync to Google Calendar.
  - AI note generator modal.
  - Responsive design (mobile-first).

### 5.2 Backend (Node.js + Express)

- **Modules**:
  - **Auth Service**: OAuth 2.0 (Passport.js).
  - **Contest Service**: CRUD for contests, scheduled scraping.
  - **Calendar Service**: Google Calendar API wrapper.
  - **Notes Service**: AI agent integration, note storage.
  - **Scraper Service**: Platform-specific scraper classes.

### 5.3 Database (PostgreSQL)

**Tables**:
- `users` (id, email, oauth_token, created_at)
- `contests` (id, platform, name, start_time_utc, start_time_ist, url)
- `notes` (id, user_id, contest_id, content, created_at)
- `sync_logs` (id, user_id, synced_at, status)

### 5.4 Ashna AI Agents

**Agent 1: Contest Fetcher**
- **Input**: Platform name (LeetCode/Codeforces/CodeChef).
- **Output**: JSON array of contests with name, start time, URL.
- **Method**: Web search tool, scraping, API calls.

**Agent 2: Notes Generator**
- **Input**: Contest metadata (name, platform, difficulty estimate).
- **Output**: Markdown note (tips, problem types, resources).
- **Method**: LLM-based generation using contest context.

---

## 6. Security Considerations

- **OAuth Tokens**: Stored encrypted (AES-256) in DB.
- **API Keys**: Environment variables, never committed to version control.
- **HTTPS Only**: Enforce TLS 1.2+ for all communications.
- **Rate Limiting**: Prevent abuse (100 requests/hour per user).
- **Input Validation**: Sanitize all user inputs to prevent XSS/SQL injection.

---

## 7. Scalability & Performance

- **Caching**: Redis cache for contest data (TTL: 6 hours).
- **Load Balancing**: Horizontal scaling with Docker + Kubernetes.
- **Async Jobs**: Bull queue for scraping and sync tasks.
- **CDN**: Serve static assets via Cloudflare/Vercel.

---

## 8. Error Handling & Monitoring

- **Logging**: Structured logs (Winston) sent to Datadog/Sentry.
- **Alerts**: Slack/Email notifications for scraper failures.
- **Graceful Degradation**: If scraper fails, serve cached data; notify user of stale data.

---

## 9. Deployment Architecture

- **Frontend**: Vercel (Next.js/React).
- **Backend**: Railway / Render (Node.js).
- **Database**: Supabase / Railway Postgres.
- **Cron Jobs**: GitHub Actions or built-in scheduler.
- **AI Agents**: Ashna AI cloud (API endpoints).

---

## 10. Dependencies & Integrations

| Component         | Technology / Service       |
|-------------------|----------------------------|
| Frontend          | React, Tailwind CSS        |
| Backend           | Node.js, Express, Prisma   |
| Database          | PostgreSQL                 |
| Auth              | Google OAuth 2.0           |
| Calendar          | Google Calendar API        |
| Scraping          | Puppeteer, Cheerio, Axios  |
| AI Agents         | Ashna AI API               |
| Caching           | Redis                      |
| Queue             | Bull                       |
| Deployment        | Vercel, Railway, Docker    |

---

## 11. Assumptions

1. Users have Google accounts for OAuth and Calendar sync.
2. Ashna AI agents can be invoked via REST API with authentication tokens.
3. LeetCode, Codeforces, CodeChef maintain current HTML/API structures (or fallback to aggregator).
4. Contests are updated at most every 6 hours (acceptable latency).
5. Reminders are handled client-side via Google Calendar notifications.

---

## 12. Risks & Mitigations

| Risk                              | Mitigation                                      |
|-----------------------------------|-------------------------------------------------|
| Website structure changes         | Version scraper logic; use aggregator fallback  |
| Google Calendar API rate limits   | Implement exponential backoff, user quotas      |
| Ashna AI agent downtime           | Cache last successful responses; retry logic    |
| Timezone conversion errors        | Unit tests for all timezone conversions         |
| User token expiry                 | Refresh tokens automatically; prompt re-auth    |

---

## 13. Success Metrics

- **Uptime**: ≥99.5%.
- **Contest Data Freshness**: <6 hours lag.
- **Sync Success Rate**: ≥98%.
- **User Engagement**: ≥70% of users sync ≥1 contest/week.
- **AI Note Quality**: User satisfaction ≥4/5 (survey).

---

## 14. Future Enhancements

- **Multi-Calendar Support**: Outlook, Apple Calendar.
- **Contest Analytics**: Track participation, performance trends.
- **Community Notes**: Share AI-generated notes with other users.
- **Browser Extension**: One-click add contests from platform pages.
- **Mobile App**: Native iOS/Android with push notifications.

---

## 15. Conclusion

This HLD establishes a robust, scalable foundation for a competitive programming calendar app. The architecture separates concerns (frontend, backend, AI agents), ensures security and reliability, and leverages modern cloud services for deployment. The integration with Ashna AI agents provides intelligent automation for both contest discovery and note generation.

**Next Steps**:
- Review and approve HLD.
- Proceed to Roadmap document for phased development plan.

---

**Document Status**: Draft v1.0  
**Approvers**: Product Owner, Engineering Lead  
**Revision History**:
- 2026-07-04: Initial draft.
