# Project Roadmap: Competitive Programming Calendar + Notes App

**Version:** 1.0  
**Date:** July 4, 2026  
**Author:** Max Effort Reasoning Engine  
**Project Duration:** 16 weeks (4 months)  

---

## 1. Executive Summary

This roadmap defines the phased development plan for the Competitive Programming Calendar + Notes application. The project is structured into **5 major phases** over 16 weeks, from initial planning through production launch and post-launch optimization.

**Key Milestones:**
- Week 4: Core backend + authentication ready
- Week 8: Contest scraping + calendar sync functional
- Week 12: AI agent integration complete
- Week 14: Beta testing complete
- Week 16: Production launch

---

## 2. Project Goals & Success Criteria

### 2.1 Goals

1. **Automate Contest Discovery**: Reduce manual effort for competitive programmers to track contests across 3 platforms.
2. **Seamless Calendar Integration**: One-click sync to Google Calendar with IST timezone and reminders.
3. **AI-Powered Productivity**: Leverage Ashna AI agents for intelligent note generation and web scraping.
4. **User Adoption**: Achieve 500 active users within 2 months of launch.
5. **Platform Reliability**: Maintain 99.5% uptime with sub-5-second response times.

### 2.2 Success Metrics

| Metric                          | Target                     | Measurement Method         |
|---------------------------------|----------------------------|----------------------------|
| Contest data accuracy           | ≥95% match with source    | Weekly audit               |
| Calendar sync success rate      | ≥98%                       | Backend logs               |
| Average sync latency            | <3 seconds                 | APM tools (Datadog)        |
| User retention (30-day)         | ≥60%                       | Analytics (Mixpanel)       |
| AI note quality rating          | ≥4/5                        | In-app survey              |
| System uptime                   | ≥99.5%                     | Uptime monitoring (Pingdom)|

---

## 3. Phased Development Plan

### Overview

| Phase | Duration | Focus Area                          | Key Deliverables                  |
|-------|----------|-------------------------------------|-----------------------------------|
| 0     | Week 1-2 | Planning & Setup                    | Requirements, tech stack, infra   |
| 1     | Week 3-6 | Core Backend + Auth                 | API, DB, OAuth, user management   |
| 2     | Week 7-10| Contest Scraping + Calendar Sync    | Scrapers, Google Calendar API     |
| 3     | Week 11-13| AI Agent Integration + Notes        | Ashna AI integration, note editor |
| 4     | Week 14-15| Testing, QA, Beta Launch            | End-to-end tests, beta feedback   |
| 5     | Week 16  | Production Launch + Monitoring      | Deploy, monitor, iterate          |

---

## Phase 0: Planning & Setup (Week 1-2)

### Objectives
- Finalize requirements and technical design.
- Set up development infrastructure.
- Create project skeleton.

### Tasks

#### Week 1: Requirements & Design Finalization
- **Stakeholder Alignment**
  - [ ] Review and approve HLD, System Architecture, UI/UX docs.
  - [ ] Define MVP scope vs. future enhancements.
  - [ ] Identify risks and mitigation strategies.

- **Technical Planning**
  - [ ] Finalize tech stack (React, Node.js, PostgreSQL, Redis, Ashna AI).
  - [ ] Design database schema (ERD).
  - [ ] Define API contracts (OpenAPI/Swagger spec).
  - [ ] Plan scraper architecture (LeetCode, Codeforces, CodeChef).

- **Team & Tools Setup**
  - [ ] Assign roles (frontend dev, backend dev, DevOps, QA).
  - [ ] Set up communication channels (Slack, Jira/Linear).
  - [ ] Configure version control (GitHub/GitLab with branch strategy).

#### Week 2: Infrastructure & Skeleton Code
- **Development Environment**
  - [ ] Initialize monorepo (Turborepo or Nx) or separate frontend/backend repos.
  - [ ] Set up local development with Docker Compose (PostgreSQL, Redis).
  - [ ] Configure linters (ESLint, Prettier) and formatters.
  - [ ] Set up CI/CD pipelines (GitHub Actions: lint, test, build).

- **Cloud Infrastructure**
  - [ ] Provision staging and production environments:
    - Frontend: Vercel project.
    - Backend: Railway/Render project.
    - Database: Supabase or Railway Postgres.
  - [ ] Set up environment variables management (Doppler, Vercel env).
  - [ ] Configure domain and SSL certificates.

- **Project Skeleton**
  - [ ] Create React app (Vite + TypeScript).
  - [ ] Create Node.js backend (Express + TypeScript).
  - [ ] Integrate Prisma ORM with PostgreSQL.
  - [ ] Set up health check endpoints (`/health`, `/api/status`).

### Deliverables
- ✅ Approved design documents (HLD, Architecture, UI/UX).
- ✅ Development environment ready (local + cloud).
- ✅ Project skeleton with CI/CD.
- ✅ Team onboarded and tooling configured.

---

## Phase 1: Core Backend + Authentication (Week 3-6)

### Objectives
- Build foundational backend services.
- Implement user authentication and authorization.
- Establish database schema and API structure.

### Tasks

#### Week 3: Database & API Foundation
- **Database Schema Implementation**
  - [ ] Define Prisma schema for `users`, `contests`, `notes`, `sync_logs`.
  - [ ] Run migrations and seed test data.
  - [ ] Set up connection pooling and indexes.

- **Core API Endpoints**
  - [ ] `GET /api/health` – Health check.
  - [ ] `GET /api/contests` – List contests (with filters: platform, upcoming).
  - [ ] `GET /api/contests/:id` – Get contest details.
  - [ ] `POST /api/notes` – Create note.
  - [ ] `GET /api/notes/:id` – Get note.
  - [ ] `PUT /api/notes/:id` – Update note.
  - [ ] `DELETE /api/notes/:id` – Delete note.

- **Middleware & Utilities**
  - [ ] Request validation (Zod or Joi).
  - [ ] Error handling middleware.
  - [ ] Logging (Winston + Datadog).
  - [ ] Rate limiting (express-rate-limit).

#### Week 4: Authentication & Authorization
- **OAuth 2.0 Integration**
  - [ ] Set up Passport.js with Google OAuth strategy.
  - [ ] Implement `/auth/google` and `/auth/google/callback` routes.
  - [ ] Store OAuth tokens securely (encrypted in DB).
  - [ ] Implement token refresh logic.

- **Session Management**
  - [ ] Use JWT or session cookies for authenticated requests.
  - [ ] Middleware: `requireAuth` for protected routes.
  - [ ] User profile endpoints:
    - `GET /api/user/profile` – Get current user.
    - `PUT /api/user/profile` – Update user settings.
    - `DELETE /api/user/account` – Delete account.

#### Week 5-6: User Management & Testing
- **User Features**
  - [ ] User preferences (timezone, notification settings).
  - [ ] Email verification (optional for MVP).
  - [ ] Logout and token revocation.

- **Testing**
  - [ ] Unit tests for core services (Jest).
  - [ ] Integration tests for API endpoints (Supertest).
  - [ ] Test coverage ≥80% for backend.

- **Documentation**
  - [ ] Generate API documentation (Swagger UI).
  - [ ] Write developer README for backend setup.

### Deliverables
- ✅ Functional backend API with CRUD operations.
- ✅ Google OAuth authentication working.
- ✅ Database schema deployed and tested.
- ✅ API documentation available.
- ✅ Test suite with ≥80% coverage.

---

## Phase 2: Contest Scraping + Calendar Sync (Week 7-10)

### Objectives
- Implement contest data scraping for LeetCode, Codeforces, CodeChef.
- Integrate Google Calendar API for event sync.
- Convert all times to IST and set reminders.

### Tasks

#### Week 7: Contest Scraper Development
- **Scraper Service Architecture**
  - [ ] Create `ScraperService` with platform-specific modules:
    - `LeetCodeScraper` (GraphQL API or HTML parsing).
    - `CodeforcesScraper` (official REST API).
    - `CodeChefScraper` (HTML parsing with Cheerio/Puppeteer).
  - [ ] Implement fallback to aggregator API (Clist.by or Kontests.net).

- **Data Parsing & Normalization**
  - [ ] Parse contest name, start time, duration, URL.
  - [ ] Convert all timestamps to UTC, then IST.
  - [ ] Store in `contests` table with deduplication logic.

- **Scheduled Scraping**
  - [ ] Set up cron job (node-cron or Bull queue) to run every 6 hours.
  - [ ] Log scraping results (success/failure, data count).
  - [ ] Error handling: retry logic, alerting on failures.

#### Week 8: Google Calendar API Integration
- **OAuth Scope Setup**
  - [ ] Add `https://www.googleapis.com/auth/calendar` scope to OAuth flow.
  - [ ] Prompt users to grant calendar permissions on first login.

- **Calendar Sync Logic**
  - [ ] Implement `CalendarService`:
    - `syncContests(userId)` – Sync user's subscribed contests.
    - `createEvent(contest, userId)` – Create Google Calendar event.
    - `updateEvent(eventId, updates)` – Update existing event.
    - `deleteEvent(eventId)` – Remove event.
  - [ ] Event format:
    - **Summary**: `[Platform] Contest Name` (e.g., `[Codeforces] Div. 2 Round 850`).
    - **Description**: Contest URL + AI-generated notes (if available).
    - **Start/End**: IST times.
    - **Reminders**: Popup at -5 min and -15 min.

- **Sync Triggers**
  - [ ] Manual sync: `POST /api/calendar/sync`.
  - [ ] Auto-sync: Background job after each scrape cycle.
  - [ ] Track sync status in `sync_logs` table.

#### Week 9: Timezone & Reminder Logic
- **Timezone Conversion**
  - [ ] Use `luxon` or `date-fns-tz` for robust timezone handling.
  - [ ] Unit tests for UTC → IST conversion.
  - [ ] Handle edge cases (DST, leap seconds).

- **Reminder Configuration**
  - [ ] Set `reminders.overrides` in Google Calendar API:
    ```json
    "reminders": {
      "useDefault": false,
      "overrides": [
        {"method": "popup", "minutes": 5},
        {"method": "popup", "minutes": 15}
      ]
    }
    ```
  - [ ] Allow users to customize reminder times (future enhancement).

#### Week 10: Error Handling & Monitoring
- **Resilience**
  - [ ] Implement exponential backoff for API rate limits.
  - [ ] Cache contest data in Redis (TTL: 6 hours).
  - [ ] Fallback to cached data if scraping fails.

- **Monitoring**
  - [ ] Set up alerts for scraper failures (Slack/email).
  - [ ] Dashboard for scraper health (Grafana or admin panel).
  - [ ] Log detailed errors (platform, error type, timestamp).

### Deliverables
- ✅ Automated contest scraping from 3 platforms.
- ✅ Google Calendar sync functional with IST times and reminders.
- ✅ Scheduled jobs running reliably.
- ✅ Monitoring and alerting in place.

---

## Phase 3: AI Agent Integration + Notes (Week 11-13)

### Objectives
- Integrate Ashna AI agents for web search and note generation.
- Build AI-powered note editor in frontend.
- Enable seamless note attachment to calendar events.

### Tasks

#### Week 11: Ashna AI Agent Setup
- **Agent Configuration**
  - [ ] Create Ashna AI account and agents:
    - **Contest Fetcher Agent**: Web search tool, returns contest JSON.
    - **Notes Generator Agent**: LLM-based note generation.
  - [ ] Obtain API keys and configure authentication.

- **Backend Integration**
  - [ ] Create `AshnaService` module:
    - `fetchContests(platform)` – Call Contest Fetcher agent.
    - `generateNote(contestContext)` – Call Notes Generator agent.
  - [ ] Implement retry logic and timeout handling.
  - [ ] Cache agent responses (Redis, TTL: 1 hour).

- **Testing Agent Calls**
  - [ ] Mock agent responses for unit tests.
  - [ ] Test live agent calls in staging environment.
  - [ ] Validate JSON schema from agent responses.

#### Week 12: Notes Feature Development
- **API Endpoints**
  - [ ] `POST /api/notes/generate` – Request AI note for a contest.
    - Input: `contestId`, optional user prompt.
    - Output: Generated note (Markdown).
  - [ ] `POST /api/notes/:id/attach` – Attach note to calendar event.
    - Update Google Calendar event description.

- **Frontend: Note Editor**
  - [ ] Build note editor UI (React Markdown editor or Tiptap).
  - [ ] "Generate AI Note" button on contest detail page.
  - [ ] Display generated note, allow editing before saving.
  - [ ] Save note to backend and optionally sync to calendar.

- **Note Templates**
  - [ ] Define default note structure:
    - Contest name, platform, time.
    - Problem-solving tips.
    - Common patterns (DP, graphs, greedy, etc.).
    - External resources (practice problems, editorials).

#### Week 13: Refinement & UX Polish
- **AI Quality Improvements**
  - [ ] Fine-tune agent prompts for better note quality.
  - [ ] Add user feedback mechanism (thumbs up/down on notes).
  - [ ] Collect feedback to iterate on prompts.

- **Performance Optimization**
  - [ ] Batch note generation requests.
  - [ ] Prefetch notes for upcoming contests (background job).
  - [ ] Optimize agent response time (<5 seconds).

- **Testing**
  - [ ] End-to-end tests: Contest → Note Generation → Calendar Sync.
  - [ ] Load testing for concurrent note generation requests.

### Deliverables
- ✅ Ashna AI agents integrated and functional.
- ✅ AI-powered note generation feature live.
- ✅ Notes can be attached to calendar events.
- ✅ User feedback loop established.

---

## Phase 4: Testing, QA & Beta Launch (Week 14-15)

### Objectives
- Comprehensive testing (unit, integration, E2E).
- Beta launch with limited users for feedback.
- Bug fixes and performance tuning.

### Tasks

#### Week 14: Testing & QA
- **Automated Testing**
  - [ ] Achieve ≥85% code coverage (frontend + backend).
  - [ ] E2E tests with Playwright/Cypress:
    - User login flow.
    - Contest listing and filtering.
    - Calendar sync.
    - Note generation and editing.
  - [ ] Performance tests (load testing with k6 or Artillery).

- **Manual Testing**
  - [ ] Cross-browser testing (Chrome, Firefox, Safari).
  - [ ] Mobile responsiveness (iOS Safari, Android Chrome).
  - [ ] Accessibility audit (WCAG 2.1 AA compliance).
  - [ ] Security audit (OWASP checklist, dependency scan).

- **Bug Triage**
  - [ ] Set up bug tracking (Jira/Linear).
  - [ ] Prioritize critical bugs (P0/P1) for immediate fix.
  - [ ] Create regression test suite.

#### Week 15: Beta Launch
- **Beta User Recruitment**
  - [ ] Invite 50-100 competitive programmers (Reddit, Discord, Twitter).
  - [ ] Provide onboarding guide and video tutorial.

- **Feedback Collection**
  - [ ] In-app feedback form.
  - [ ] Weekly survey (usability, feature requests, bugs).
  - [ ] Schedule 1-on-1 user interviews (10 users).

- **Iteration**
  - [ ] Fix critical bugs reported by beta users.
  - [ ] Make UX improvements based on feedback.
  - [ ] Optimize scraper accuracy (compare against manual checks).

### Deliverables
- ✅ Comprehensive test suite (≥85% coverage).
- ✅ Beta version live with 50+ active users.
- ✅ Feedback collected and prioritized.
- ✅ Critical bugs resolved.

---

## Phase 5: Production Launch + Post-Launch (Week 16+)

### Objectives
- Public production launch.
- Monitor system health and user engagement.
- Plan next iterations based on data.

### Tasks

#### Week 16: Production Launch
- **Final Preparations**
  - [ ] Security review and penetration testing.
  - [ ] Performance benchmarking (target: <2s page load, <3s API response).
  - [ ] Set up production monitoring (Datadog, Sentry).
  - [ ] Configure alerting (uptime, error rates, latency).

- **Deployment**
  - [ ] Deploy frontend to Vercel.
  - [ ] Deploy backend to Railway/Render with auto-scaling.
  - [ ] Run database migrations on production DB.
  - [ ] Smoke tests on production environment.

- **Launch Activities**
  - [ ] Announce on social media (Twitter, Reddit, HackerNews).
  - [ ] Publish blog post explaining features and Ashna AI integration.
  - [ ] Set up analytics (Mixpanel, Google Analytics).
  - [ ] Monitor first 24 hours closely.

#### Post-Launch (Week 17+)
- **Monitoring & Support**
  - [ ] Daily health checks (uptime, error rates, user growth).
  - [ ] Respond to user support requests (email, Discord, Twitter).
  - [ ] Publish weekly metrics report (signups, active users, contest syncs).

- **Continuous Improvement**
  - [ ] Analyze user behavior (most used features, drop-off points).
  - [ ] Prioritize feature backlog based on usage data.
  - [ ] Plan next sprint (mobile app, multi-calendar support, etc.).

- **Community Building**
  - [ ] Create Discord server or Slack community.
  - [ ] Share user success stories (testimonials).
  - [ ] Run contests or giveaways to boost engagement.

### Deliverables
- ✅ Production app live and stable.
- ✅ Monitoring and alerting operational.
- ✅ User growth tracked and analyzed.
- ✅ Roadmap for next features defined.

---

## 4. Resource Allocation

### Team Structure (Recommended)

| Role                  | Allocation | Responsibilities                              |
|-----------------------|------------|-----------------------------------------------|
| **Product Manager**   | 25%        | Requirements, roadmap, stakeholder comm       |
| **Frontend Developer**| 100%       | React app, UI/UX implementation               |
| **Backend Developer** | 100%       | API, scraper, calendar sync, AI integration   |
| **DevOps Engineer**   | 50%        | Infrastructure, CI/CD, monitoring             |
| **QA Engineer**       | 50%        | Test planning, manual/automated testing       |
| **Designer (UI/UX)**  | 25%        | Design review, UI polish, user research       |

**Total**: ~3.5 FTEs

### Budget Estimate (Monthly)

| Item                      | Cost (USD) | Notes                              |
|---------------------------|------------|------------------------------------||
| Cloud hosting (Vercel)    | $20        | Pro plan for frontend              |
| Backend hosting (Railway) | $30        | Starter plan with scaling          |
| Database (Supabase)       | $25        | Pro plan (10GB storage)            |
| Ashna AI API              | $50-$100   | Depends on usage volume            |
| Monitoring (Datadog)      | $31        | Free tier or Pro                   |
| Domain + SSL              | $15        | Annual cost / 12                   |
| **Total**                 | **~$171-$221** | Scales with user growth        |

---

## 5. Risk Management

| Risk                              | Probability | Impact | Mitigation Strategy                          |
|-----------------------------------|-------------|--------|----------------------------------------------|
| Website structure changes         | High        | High   | Use aggregator API fallback; version scraper |
| Google Calendar API rate limits   | Medium      | High   | Implement backoff, queue, user quotas       |
| Ashna AI agent downtime           | Low         | Medium | Cache responses; retry; manual fallback      |
| Delayed features (scope creep)    | Medium      | Medium | Strict MVP scope; defer enhancements         |
| Low user adoption                 | Medium      | High   | Marketing, community outreach, referrals     |
| Security vulnerability            | Low         | High   | Regular audits, dependency scanning, HTTPS   |

---

## 6. Dependencies & External Factors

### Critical Dependencies
- **LeetCode/Codeforces/CodeChef APIs/HTML**: Must remain accessible and structurally stable.
- **Google Calendar API**: Must maintain current features and rate limits.
- **Ashna AI Platform**: Must provide reliable agent API access.

### Assumptions
- Users have Google accounts.
- Competitive programming contest schedules are public.
- Ashna AI agents can be invoked programmatically.

---

## 7. Post-Launch Roadmap (Weeks 17-28)

### Sprint 1 (Weeks 17-20): Mobile App
- Develop React Native or Flutter app for iOS/Android.
- Push notifications for contest reminders (Firebase Cloud Messaging).
- Offline mode for viewing cached contests.

### Sprint 2 (Weeks 21-24): Multi-Calendar & Analytics
- Outlook Calendar and Apple Calendar integration.
- User analytics dashboard (participation history, win rate tracking).
- Export contest data (CSV, iCal).

### Sprint 3 (Weeks 25-28): Community & Gamification
- Shared public notes (community-contributed tips).
- Leaderboards and badges for contest participation.
- Browser extension for one-click contest import.

---

## 8. Conclusion

This roadmap provides a clear, phased approach to building a competitive programming calendar app with AI-powered features. By following this plan, the team will deliver a robust MVP in 16 weeks, with continuous improvement post-launch.

**Key Success Factors:**
- Disciplined scope management (avoid feature creep in MVP).
- Robust testing and QA throughout.
- Strong Ashna AI agent integration for differentiation.
- Active user feedback loop from beta onward.

**Next Steps:**
- Approve roadmap and allocate resources.
- Kickoff Phase 0 (Planning & Setup).
- Proceed to detailed Project Structure document.

---

**Document Status**: Draft v1.0  
**Approvers**: Product Owner, Engineering Lead, Stakeholders  
**Revision History**:
- 2026-07-04: Initial draft.
