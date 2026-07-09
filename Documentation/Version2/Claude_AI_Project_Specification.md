# Project Specification: Competitive Programming Calendar & Notes Application

**Project Name:** CP Calendar Pro  
**Target Platform:** Full-stack web application  
**Primary Technologies:** MERN Stack (MongoDB, Express.js, React, Node.js)  
**AI Integration:** Ashna AI Agents  
**External Integrations:** Google Calendar API, LeetCode, Codeforces, CodeChef  

---

## Executive Summary

Build a comprehensive calendar and note-taking application specifically designed for competitive programmers. The application automatically scrapes contest information from LeetCode, Codeforces, and CodeChef, converts all times to Indian Standard Time (IST), sets automatic reminders (5 and 15 minutes before contests), and integrates AI-powered note-taking and event creation capabilities. All contest data, notes, and custom events sync bidirectionally with Google Calendar.

---

## Core Functionality Requirements

### 1. Contest Aggregation System

#### 1.1 Data Sources
- **LeetCode**: Scrape upcoming contests using GraphQL API
- **Codeforces**: Fetch contests via official REST API
- **CodeChef**: Retrieve contests from CodeChef's internal API

#### 1.2 Contest Data Requirements
- Contest name
- Platform identifier (leetcode, codeforces, codechef)
- Contest URL (direct link to contest page)
- Start time (must convert to IST UTC+5:30)
- End time (must convert to IST UTC+5:30)
- Duration (human-readable format)
- Platform-specific contest ID

#### 1.3 Scraping Requirements
- **Method**: Direct web scraping (NO AI agents for contest fetching)
- **Schedule**: Automated scraping every 6 hours via cron job
- **Storage**: Save all contests to MongoDB database
- **Sync**: Automatically create Google Calendar events for each contest
- **Reminders**: Set two reminders per contest:
  - 5 minutes before start
  - 15 minutes before start
- **Color Coding**: Different calendar colors per platform:
  - LeetCode: Yellow (#5)
  - Codeforces: Red (#11)
  - CodeChef: Green (#10)

#### 1.4 Contest Display
- Show upcoming contests in chronological order
- Display platform logo/icon for each contest
- Show countdown timer to contest start
- Filter by platform
- Search by contest name
- Quick access link to contest URL

---

### 2. AI-Powered Notes System

#### 2.1 Ashna AI Notes Agent

**Agent Purpose**: Enhance user notes with proper formatting and structure

**Agent Capabilities**:
- Format raw text into clean Markdown
- Add appropriate headings, lists, and emphasis
- Preserve all original information
- Fix grammar and spelling errors
- Add relevant emojis sparingly
- Organize coding topics (algorithms, data structures) clearly
- Maintain user's original voice and tone

**Integration Requirements**:
- Use Ashna AI agent (not direct OpenAI)
- Agent ID stored in environment variable
- API calls through Ashna AI platform
- Handle rate limits and errors gracefully

#### 2.2 Timestamped Notes

**Note Structure**:
- Unique note ID
- User ID (creator)
- Title (auto-generated from first line if not provided)
- Content (Markdown-formatted after AI enhancement)
- Tags (array of strings for categorization)
- Contest ID (optional link to related contest)
- Creation timestamp (ISO 8601 format)
- Last updated timestamp (ISO 8601 format)
- Metadata:
  - Word count
  - Character count
  - Enhanced by AI flag
- Google Calendar event ID (if added to calendar)

#### 2.3 Note Features

**Creation**:
- User writes note in plain text
- Optional: Skip AI enhancement with "SKIP_AI:" prefix
- AI enhances content automatically
- Save to database with timestamp
- Option to add to Google Calendar as reminder event

**Calendar Integration**:
- User can set reminder time for note
- Creates Google Calendar event with:
  - Title: "📝 Note: [note title]"
  - Description: Full note content
  - Reminder time: User-specified
  - Reminders: 5 and 15 minutes before
  - Color: Blue (#7)

**Search & Organization**:
- Full-text search across title and content
- Search by tags
- Filter by date range (creation date)
- Filter by contest (notes linked to specific contests)
- Sort by newest/oldest
- Pagination (50 notes per page)

**Update & Delete**:
- Edit note content (re-enhance with AI)
- Update title, tags
- Delete note (also removes from Google Calendar if linked)
- Track update history with timestamps

---

### 3. AI-Powered Calendar Events System

#### 3.1 Ashna AI Calendar Agent

**Agent Purpose**: Parse natural language input into structured calendar events

**Agent Capabilities**:
- Extract event title from natural language
- Parse date expressions (today, tomorrow, next Monday, etc.)
- Parse time expressions (5 PM, morning, afternoon, evening)
- Detect duration (default 60 minutes if not specified)
- Identify recurring patterns (daily, weekly, monthly)
- Infer context-appropriate times:
  - Morning → 9 AM
  - Afternoon → 2 PM
  - Evening → 6 PM
  - Night → 8 PM
- Output structured JSON format

**JSON Output Schema**:
```json
{
  "title": "string",
  "description": "string (optional)",
  "date": "YYYY-MM-DD",
  "time": "HH:MM" (24-hour),
  "duration": number (minutes),
  "isRecurring": boolean,
  "recurrencePattern": "none" | "daily" | "weekly" | "monthly",
  "reminders": [5, 15]
}
```

#### 3.2 Event Creation from Natural Language

**Input Examples**:
- "Remind me to practice DP tomorrow at 5 PM"
- "Schedule study session every Monday at 7 PM"
- "Add contest preparation on Friday afternoon for 2 hours"
- "Daily practice at 9 AM"

**Processing Flow**:
1. User submits natural language input
2. Send to Ashna AI Calendar Agent with context:
   - Current date and time
   - User's timezone (default IST)
3. Agent returns structured JSON
4. Parse date and time into proper datetime objects
5. Convert to UTC for storage
6. Save to MongoDB
7. Create Google Calendar event
8. Return success with event details and Google Calendar link

#### 3.3 Event Data Structure

**Event Model**:
- Unique event ID
- User ID (owner)
- Title
- Description (optional)
- Start time (UTC, converted from IST)
- End time (calculated from start + duration)
- Timezone (user's timezone, default Asia/Kolkata)
- Is recurring flag
- Recurrence pattern (none, daily, weekly, monthly)
- Reminders array (minutes before event)
- Google Calendar event ID
- Created by AI flag (true for AI-created events)
- Original natural language input (for reference)
- Creation timestamp

#### 3.4 Event Management

**Display**:
- Show all upcoming events
- Calendar view (month, week, day)
- List view with filters
- Distinguish AI-created vs manual events
- Show original natural language input for AI events

**Update**:
- User can update with new natural language input
- Re-parse with AI agent
- Update database and Google Calendar
- Track modification history

**Delete**:
- Remove from database
- Remove from Google Calendar
- Cascade delete for recurring events (ask user)

**Recurring Events**:
- Support RRULE format for Google Calendar
- Daily: RRULE:FREQ=DAILY
- Weekly: RRULE:FREQ=WEEKLY
- Monthly: RRULE:FREQ=MONTHLY

---

### 4. Google Calendar Integration

#### 4.1 Authentication
- OAuth 2.0 authentication flow
- Scopes required:
  - `https://www.googleapis.com/auth/calendar`
  - `https://www.googleapis.com/auth/calendar.events`
- Store access token and refresh token securely
- Automatic token refresh when expired

#### 4.2 Event Types

**Contest Events**:
- Summary: "[PLATFORM]: [Contest Name]"
- Description: Contest URL, platform, duration
- Start/end times in IST
- Color coded by platform
- Reminders: 5 and 15 minutes

**Note Reminder Events**:
- Summary: "📝 Note: [Note Title]"
- Description: Full note content + Note ID
- User-specified reminder time
- Reminders: 5 and 15 minutes
- Color: Blue (#7)

**Custom AI Events**:
- Summary: Event title from AI parsing
- Description: Event description (if any)
- Start/end times from AI parsing
- Recurring rules (if recurring)
- Reminders: Default 5 and 15 minutes
- Color: Blue (#9)

#### 4.3 Bidirectional Sync

**Local → Google Calendar**:
- Create event in Google Calendar when:
  - Contest is scraped
  - Note is saved with calendar option
  - Custom event is created via AI
- Update Google Calendar when:
  - Event is modified
  - Note is updated (if linked to calendar)
- Delete from Google Calendar when:
  - Event is deleted
  - Note is deleted (if linked to calendar)

**Google Calendar → Local** (Optional Future Feature):
- Fetch events from Google Calendar
- Sync external events to local database
- Handle conflicts (last-write-wins or user prompt)

#### 4.4 Calendar Service Requirements

**Methods Needed**:
- `createContestEvent(userId, contest, timezone)` → GoogleCalendarEvent
- `createNoteEvent(userId, noteData)` → GoogleCalendarEvent
- `createCustomEvent(userId, eventData)` → GoogleCalendarEvent
- `updateEvent(userId, eventId, updates)` → GoogleCalendarEvent
- `deleteEvent(userId, eventId)` → void
- `getEvents(userId, startDate, endDate)` → GoogleCalendarEvent[]

---

### 5. User Authentication & Profile

#### 5.1 Authentication Methods
- Email/password registration and login
- Google OAuth (for Google Calendar access)
- JWT-based session management
- Secure password hashing (bcrypt, min 10 rounds)

#### 5.2 User Profile

**User Data Structure**:
- Unique user ID
- Email (unique, verified)
- Password hash (if email/password auth)
- Full name
- Timezone (default: Asia/Kolkata)
- Google OAuth tokens:
  - Access token
  - Refresh token
  - Token expiry
- Preferences:
  - Default reminder times
  - Preferred platforms (filter contests)
  - Theme (light/dark)
- Account status (active/inactive)
- Created at timestamp
- Last login timestamp

#### 5.3 Authorization
- Users can only access their own:
  - Contests (user-specific copy of scraped contests)
  - Notes
  - Events
  - Google Calendar integration
- Admin role for:
  - Viewing system stats
  - Managing cron jobs
  - Viewing logs

---

### 6. Backend Architecture

#### 6.1 Technology Stack
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Passport.js + JWT
- **AI Integration**: Ashna AI SDK (axios-based)
- **Scheduling**: node-cron
- **Date/Time**: date-fns, date-fns-tz
- **Google APIs**: googleapis package
- **Validation**: Joi or Zod
- **Logging**: Winston
- **Environment**: dotenv

#### 6.2 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts          # MongoDB connection
│   │   ├── passport.ts          # Auth strategies
│   │   └── google.ts            # Google OAuth config
│   ├── models/
│   │   ├── User.ts              # User schema
│   │   ├── Contest.ts           # Contest schema
│   │   ├── Note.ts              # Note schema
│   │   └── Event.ts             # Event schema
│   ├── services/
│   │   ├── ashnaClient.ts       # Ashna AI SDK wrapper
│   │   ├── contestScrapingService.ts  # Contest scraping
│   │   ├── notesService.ts      # Notes with AI
│   │   ├── calendarService.ts   # Events with AI
│   │   └── googleCalendarService.ts  # Google Calendar integration
│   ├── routes/
│   │   ├── auth.ts              # Auth endpoints
│   │   ├── contests.ts          # Contest endpoints
│   │   ├── notes.ts             # Notes endpoints
│   │   └── events.ts            # Events endpoints
│   ├── middleware/
│   │   ├── auth.ts              # JWT verification
│   │   ├── validation.ts        # Request validation
│   │   └── errorHandler.ts     # Global error handling
│   ├── cron/
│   │   └── scrapeContests.ts   # Contest scraping cron job
│   ├── utils/
│   │   ├── logger.ts            # Winston logger
│   │   ├── timezone.ts          # Timezone utilities
│   │   └── validators.ts        # Common validators
│   └── index.ts                 # App entry point
├── .env.example
├── package.json
└── tsconfig.json
```

#### 6.3 Database Schemas

**User Schema**:
```typescript
{
  _id: ObjectId,
  email: string (unique, indexed),
  passwordHash: string,
  name: string,
  timezone: string (default: 'Asia/Kolkata'),
  googleAccessToken: string,
  googleRefreshToken: string,
  googleTokenExpiry: Date,
  preferences: {
    reminderTimes: number[],
    preferredPlatforms: string[],
    theme: 'light' | 'dark'
  },
  isActive: boolean,
  createdAt: Date,
  lastLogin: Date
}
```

**Contest Schema**:
```typescript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', indexed),
  name: string,
  platform: 'leetcode' | 'codeforces' | 'codechef',
  url: string (unique per user),
  startTime: Date (indexed),
  endTime: Date,
  duration: string,
  timezone: string,
  reminders: number[],
  googleCalendarEventId: string,
  createdAt: Date,
  updatedAt: Date
}
```

**Note Schema**:
```typescript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', indexed),
  title: string,
  content: string (text index),
  tags: string[],
  contestId: ObjectId (ref: 'Contest', optional),
  googleCalendarEventId: string (optional),
  createdAt: Date (indexed),
  updatedAt: Date,
  metadata: {
    wordCount: number,
    characterCount: number,
    enhancedByAI: boolean
  }
}
```

**Event Schema**:
```typescript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', indexed),
  title: string,
  description: string,
  startTime: Date (indexed),
  endTime: Date,
  timezone: string,
  isRecurring: boolean,
  recurrencePattern: 'none' | 'daily' | 'weekly' | 'monthly',
  reminders: number[],
  googleCalendarEventId: string,
  createdByAI: boolean,
  originalInput: string (optional),
  createdAt: Date
}
```

#### 6.4 API Endpoints

**Authentication**:
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/password
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user profile
- `PATCH /api/auth/profile` - Update profile

**Contests**:
- `POST /api/contests/scrape` - Manual trigger scraping (auth required)
- `GET /api/contests` - Get all user's contests
- `GET /api/contests/upcoming` - Get upcoming contests only
- `GET /api/contests/:id` - Get single contest
- `DELETE /api/contests/:id` - Delete contest

**Notes**:
- `POST /api/notes` - Create note (AI enhanced)
- `GET /api/notes` - Get all user's notes
- `GET /api/notes/:id` - Get single note
- `GET /api/notes/search?q=query` - Search notes
- `PATCH /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

**Events**:
- `POST /api/events/create-with-ai` - Create event from natural language
- `GET /api/events` - Get all user's events
- `GET /api/events/:id` - Get single event
- `PATCH /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

**System**:
- `GET /health` - Health check
- `GET /api/stats` - System statistics (admin only)

#### 6.5 Environment Variables

```bash
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/cp_calendar

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRY=7d

# Ashna AI
ASHNA_API_KEY=ashna_sk_your_key
ASHNA_API_BASE_URL=https://app.ashna.ai/api
ASHNA_NOTES_AGENT_ID=notes-enhancer-xxxxx
ASHNA_CALENDAR_AGENT_ID=calendar-parser-xxxxx

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

# CORS
CLIENT_URL=http://localhost:3000
```

---

### 7. Frontend Architecture

#### 7.1 Technology Stack
- **Framework**: React 18+
- **Language**: TypeScript
- **Routing**: React Router v6
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **HTTP Client**: Axios
- **UI Framework**: Tailwind CSS
- **Icons**: Lucide React or Heroicons
- **Date Handling**: date-fns
- **Forms**: React Hook Form
- **Notifications**: React Hot Toast
- **Calendar UI**: React Big Calendar or FullCalendar

#### 7.2 Project Structure

```
frontend/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── GoogleLoginButton.tsx
│   │   ├── contests/
│   │   │   ├── ContestList.tsx
│   │   │   ├── ContestCard.tsx
│   │   │   ├── ContestFilters.tsx
│   │   │   └── CountdownTimer.tsx
│   │   ├── notes/
│   │   │   ├── NotesWithAI.tsx
│   │   │   ├── NoteCard.tsx
│   │   │   ├── NoteEditor.tsx
│   │   │   └── NoteSearch.tsx
│   │   ├── events/
│   │   │   ├── CalendarAIAgent.tsx
│   │   │   ├── EventList.tsx
│   │   │   ├── CalendarView.tsx
│   │   │   └── EventCard.tsx
│   │   └── common/
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorMessage.tsx
│   │       └── ConfirmDialog.tsx
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── ContestsPage.tsx
│   │   ├── NotesPage.tsx
│   │   ├── CalendarPage.tsx
│   │   └── ProfilePage.tsx
│   ├── api/
│   │   ├── auth.ts
│   │   ├── contests.ts
│   │   ├── notes.ts
│   │   └── events.ts
│   ├── stores/
│   │   ├── authStore.ts         # Zustand auth store
│   │   └── uiStore.ts           # UI state (theme, etc.)
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useContests.ts
│   │   ├── useNotes.ts
│   │   └── useEvents.ts
│   ├── utils/
│   │   ├── timezone.ts
│   │   ├── formatting.ts
│   │   └── validators.ts
│   ├── types/
│   │   ├── user.ts
│   │   ├── contest.ts
│   │   ├── note.ts
│   │   └── event.ts
│   ├── App.tsx
│   └── index.tsx
├── .env.example
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

#### 7.3 Key UI Components

**HomePage**:
- Welcome section with user greeting
- Quick stats:
  - Upcoming contests count
  - Total notes
  - Events this week
- Quick actions:
  - Create note
  - Add event with AI
  - Scrape contests
- Recent activity feed

**ContestsPage**:
- Filter by platform (All, LeetCode, Codeforces, CodeChef)
- Search by contest name
- Sort by date/platform
- Contest cards showing:
  - Platform logo
  - Contest name
  - Start time (IST)
  - Duration
  - Countdown timer
  - "View Contest" link
  - Google Calendar status (synced/not synced)
- Manual scrape button
- Auto-refresh indicator

**NotesPage**:
- Create note form:
  - Title input (optional)
  - Content textarea
  - Tags input (comma-separated)
  - "Add to Calendar" checkbox
  - Reminder time picker (if calendar enabled)
  - Submit button with loading state
- Notes list:
  - Note cards with preview
  - Timestamp display
  - Tags display
  - Edit/delete actions
  - Expand to full view
- Search bar (real-time search)
- Filter by tags
- Date range filter

**CalendarPage**:
- Natural language input form:
  - Large text input
  - Example suggestions
  - Submit button
  - Loading state
- Calendar view:
  - Month view (default)
  - Week view
  - Day view
  - Toggle between views
- Event list (upcoming)
- Event cards showing:
  - Title
  - Date/time
  - Duration
  - Recurring indicator
  - Original natural language input (for AI events)
  - Edit/delete actions
  - Google Calendar link

**ProfilePage**:
- User information
- Timezone selector
- Theme toggle (light/dark)
- Preferred platforms checkboxes
- Default reminder times
- Google Calendar connection status
- Disconnect/reconnect Google Calendar
- Change password
- Delete account

#### 7.4 Responsive Design

**Breakpoints**:
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

**Mobile Optimizations**:
- Collapsible sidebar → hamburger menu
- Stack contest cards vertically
- Simplified calendar view (list on mobile)
- Touch-friendly buttons (min 44px height)
- Bottom navigation for main sections

#### 7.5 State Management

**Zustand Auth Store**:
- User object
- Token
- Login status
- Login/logout methods
- Initialize from localStorage
- Axios interceptor for auth header

**TanStack Query Cache**:
- Contests query with 5-minute stale time
- Notes query with refetch on window focus
- Events query with 2-minute stale time
- Mutations with optimistic updates
- Auto-invalidate related queries on mutation

---

### 8. Ashna AI Agent Configuration

#### 8.1 Notes Enhancement Agent

**Agent Configuration**:
- **Name**: `notes-enhancer`
- **Display Name**: Notes Enhancement Agent
- **Description**: Enhances user notes with Markdown formatting
- **Model**: GPT-4 Turbo
- **Temperature**: 0.3
- **Max Tokens**: 1000
- **Response Format**: Text

**System Prompt**:
```
You are a helpful note-taking assistant for a competitive programming calendar app.

Your task:
- Format the user's note in clean, organized Markdown
- Add structure (headings, lists, emphasis) where appropriate
- Preserve all original information exactly as provided
- Fix grammar and spelling errors
- Add relevant emojis for visual appeal (use sparingly)
- Keep the user's voice and style
- If the note mentions coding topics (algorithms, data structures), organize them clearly

DO NOT:
- Add information not present in the original note
- Change the meaning or intent
- Make it overly formal if the tone is casual
- Remove any important details
- Add external knowledge or facts

Output only the enhanced note in Markdown format, nothing else.
```

**Expected Input/Output**:

Input:
```
practice greedy algorithms
solve 5 problems
revise theory
```

Output:
```markdown
## Practice Greedy Algorithms 🎯

### Tasks
- ✅ Solve 5 greedy algorithm problems
- ✅ Revise greedy algorithm theory

### Focus Areas
- Interval scheduling
- Huffman coding
- Activity selection
```

#### 8.2 Calendar Event Parser Agent

**Agent Configuration**:
- **Name**: `calendar-parser`
- **Display Name**: Calendar Event Parser
- **Description**: Parses natural language into structured events
- **Model**: GPT-4 Turbo
- **Temperature**: 0
- **Max Tokens**: 500
- **Response Format**: JSON

**System Prompt**:
```
You are an intelligent calendar parsing assistant.

Your task:
Parse natural language input into a structured JSON event.

Current information:
- Today's date: {current_date}
- User timezone: {timezone}

Rules:
1. Extract event title, date, time, and duration
2. Use relative dates (today, tomorrow, next week, etc.)
3. Default duration is 60 minutes if not specified
4. Default reminders are [5, 15] minutes if not specified
5. Infer time of day from context:
   - Morning = 9 AM
   - Afternoon = 2 PM
   - Evening = 6 PM
   - Night = 8 PM
6. For "practice", "solve", "study" events, create appropriate titles
7. Detect recurring patterns (daily, weekly, monthly)

Output ONLY valid JSON in this exact format:
{
  "title": "Event title",
  "description": "Optional description",
  "date": "YYYY-MM-DD",
  "time": "HH:MM" (24-hour format),
  "duration": 60,
  "isRecurring": false,
  "recurrencePattern": "none",
  "reminders": [5, 15]
}

Do NOT include any explanation, only the JSON object.
```

**Expected Input/Output**:

Input:
```
Remind me to practice DP tomorrow at 5 PM
```

Variables:
```
current_date: 2026-07-08T10:00:00Z
timezone: Asia/Kolkata
```

Output:
```json
{
  "title": "Practice DP",
  "description": "",
  "date": "2026-07-09",
  "time": "17:00",
  "duration": 60,
  "isRecurring": false,
  "recurrencePattern": "none",
  "reminders": [5, 15]
}
```

---

### 9. Error Handling & Edge Cases

#### 9.1 Contest Scraping Errors
- Platform API down → Log error, continue with other platforms
- Rate limiting → Implement exponential backoff
- Invalid contest data → Skip contest, log error
- Duplicate contests → Update existing instead of creating new
- Google Calendar sync failure → Retry 3 times, then flag for manual sync

#### 9.2 AI Agent Errors
- Ashna AI API timeout → Retry once, fallback to raw content
- Invalid JSON response → Parse again, fallback to raw content
- Rate limiting → Queue request, retry after delay
- Agent not found → Return clear error to user
- Empty response → Use original content without enhancement

#### 9.3 Google Calendar Errors
- Invalid credentials → Prompt user to reconnect
- Quota exceeded → Show warning, queue for later
- Event not found → Remove local reference
- Network failure → Retry with exponential backoff
- Permission denied → Guide user to grant permissions

#### 9.4 User Input Validation
- Empty note content → Show error "Content cannot be empty"
- Invalid date/time → Show error "Invalid date/time format"
- Missing required fields → Highlight missing fields
- SQL injection attempts → Sanitize and escape all inputs
- XSS attempts → Escape HTML in user content

---

### 10. Performance Requirements

#### 10.1 Response Times
- API endpoints: < 200ms (excluding AI calls)
- AI note enhancement: < 3 seconds
- AI event parsing: < 3 seconds
- Contest scraping: < 10 seconds per platform
- Page load: < 2 seconds (initial)
- Subsequent navigation: < 500ms

#### 10.2 Scalability
- Support up to 10,000 concurrent users
- Database queries optimized with indexes
- Implement pagination for large datasets
- Cache frequently accessed data (contests)
- Use CDN for static assets

#### 10.3 Database Optimization
- Index fields: userId, createdAt, startTime, email
- Text indexes for search: note content, title
- Compound indexes for common queries
- Regular cleanup of old contests (> 30 days past)
- Archive old notes (optional user setting)

---

### 11. Security Requirements

#### 11.1 Authentication Security
- Password minimum 8 characters
- Hash passwords with bcrypt (10+ rounds)
- Implement rate limiting on login (5 attempts per 15 min)
- JWT expiry: 7 days
- Refresh token rotation
- Secure HTTP-only cookies for tokens (production)

#### 11.2 API Security
- CORS whitelist for frontend domain
- Helmet.js for security headers
- Rate limiting: 100 requests per 15 minutes per IP
- Input validation on all endpoints
- SQL injection prevention (Mongoose escaping)
- XSS prevention (escape HTML output)

#### 11.3 Data Protection
- Environment variables for secrets (never commit)
- Encrypt Google OAuth tokens in database
- HTTPS only in production
- Regular security audits
- Dependency vulnerability scanning

---

### 12. Testing Requirements

#### 12.1 Backend Testing
- Unit tests for services (80%+ coverage)
- Integration tests for API endpoints
- Test contest scraping with mock data
- Test AI agent integration with mock responses
- Test Google Calendar integration
- Test authentication flows
- Test error handling and edge cases

#### 12.2 Frontend Testing
- Component unit tests (Jest + React Testing Library)
- Integration tests for user flows
- E2E tests (Playwright or Cypress):
  - Registration and login
  - Creating notes
  - Creating events with AI
  - Viewing contests
  - Updating profile
- Accessibility testing (a11y)

---

### 13. Deployment Requirements

#### 13.1 Backend Deployment
- Platform: Vercel, Heroku, Railway, or AWS
- Environment: Node.js 18+
- Database: MongoDB Atlas (production)
- Environment variables set in platform dashboard
- Automated deployment on git push (CI/CD)
- Health check endpoint for monitoring
- Logging to external service (LogDNA, Datadog)

#### 13.2 Frontend Deployment
- Platform: Vercel, Netlify, or AWS S3 + CloudFront
- Build command: `npm run build`
- Environment variables for API URL
- Automated deployment on git push
- CDN for static assets
- Gzip/Brotli compression

#### 13.3 Database Deployment
- MongoDB Atlas with replica set
- Automated backups (daily)
- Point-in-time recovery enabled
- Connection pooling
- Read replicas for scalability (optional)

---

### 14. Monitoring & Analytics

#### 14.1 Application Monitoring
- Error tracking (Sentry or similar)
- Performance monitoring (New Relic, Datadog)
- Uptime monitoring (UptimeRobot)
- API response time tracking
- Database query performance

#### 14.2 Usage Analytics
- Track:
  - User registrations
  - Notes created (with/without AI)
  - Events created (AI vs manual)
  - Contest scraping success rate
  - Google Calendar sync success rate
  - AI agent usage (calls, errors, latency)
- Display in admin dashboard

#### 14.3 Logging
- Structured logging (JSON format)
- Log levels: error, warn, info, debug
- Log rotation (daily)
- Retain logs for 30 days
- Sensitive data redaction (passwords, tokens)

---

### 15. Future Enhancements (Optional)

#### 15.1 Phase 2 Features
- Mobile app (React Native)
- Dark mode (already in architecture)
- Email notifications for contests
- SMS notifications (Twilio)
- Social sharing (share notes publicly)
- Collaborative notes (team notes)
- Contest reminders via WhatsApp
- Export notes to PDF/Markdown
- Import notes from other apps

#### 15.2 Advanced AI Features
- AI-generated study plans
- Problem recommendation based on contest history
- Automated contest performance analysis
- Chat with notes (RAG)
- Voice-to-note transcription

#### 15.3 Platform Extensions
- Support more platforms (HackerRank, AtCoder, etc.)
- Virtual contests
- Practice problem recommendations
- Leaderboard integration

---

## Success Criteria

### Minimum Viable Product (MVP)

**Must Have**:
1. ✅ User registration and authentication
2. ✅ Google OAuth for calendar access
3. ✅ Automated contest scraping (LeetCode, Codeforces, CodeChef)
4. ✅ Contest display with countdown timers
5. ✅ Google Calendar sync for contests
6. ✅ AI-powered note creation (Ashna AI)
7. ✅ Timestamped notes with search
8. ✅ AI-powered event creation from natural language
9. ✅ Google Calendar sync for notes and events
10. ✅ Responsive UI (mobile, tablet, desktop)
11. ✅ All times in IST
12. ✅ 5 and 15 minute reminders

**Performance**:
- Page load < 2 seconds
- API response < 200ms (non-AI)
- AI calls < 3 seconds
- Zero data loss
- 99.9% uptime

**Quality**:
- Clean, maintainable code
- TypeScript throughout
- Comprehensive error handling
- Secure authentication
- Accessibility compliance (WCAG 2.1 AA)

---

## Deliverables

1. **Backend Application**:
   - Complete Node.js/Express API
   - MongoDB database with schemas
   - Ashna AI integration
   - Google Calendar integration
   - Contest scraping service
   - Authentication system
   - Cron jobs for automation

2. **Frontend Application**:
   - React application with TypeScript
   - Responsive UI components
   - State management (Zustand)
   - API integration (React Query)
   - User authentication flow
   - All pages and features

3. **Documentation**:
   - README with setup instructions
   - API documentation (endpoints, request/response)
   - Environment variables guide
   - Deployment guide
   - User guide

4. **Configuration**:
   - Environment variable templates
   - Database seed data (optional)
   - Ashna AI agent configurations
   - Google OAuth setup instructions

---

## Timeline Estimate

**Phase 1: Backend Core (Week 1-2)**
- Day 1-2: Project setup, database schemas, auth
- Day 3-4: Contest scraping service
- Day 5-6: Ashna AI integration (notes, calendar)
- Day 7-8: Google Calendar integration
- Day 9-10: API endpoints, testing

**Phase 2: Frontend Core (Week 3-4)**
- Day 11-12: Project setup, routing, auth pages
- Day 13-14: Contests page
- Day 15-16: Notes page
- Day 17-18: Calendar/Events page
- Day 19-20: UI polish, responsive design, testing

**Phase 3: Integration & Deployment (Week 5)**
- Day 21-22: End-to-end testing
- Day 23: Bug fixes
- Day 24: Deployment setup
- Day 25: Production deployment and monitoring

**Total**: 4-5 weeks for MVP

---

## Priority Order

**P0 (Critical - MVP Blockers)**:
1. User authentication
2. Contest scraping (all 3 platforms)
3. Basic calendar view
4. Google Calendar sync for contests
5. IST timezone conversion

**P1 (High - Core Features)**:
1. AI-powered notes (Ashna AI)
2. AI-powered events (Ashna AI)
3. Note search and filtering
4. Event creation and management
5. Countdown timers

**P2 (Medium - Enhanced UX)**:
1. Responsive mobile design
2. Dark mode
3. Profile customization
4. Platform filtering
5. Manual contest scraping trigger

**P3 (Low - Nice to Have)**:
1. Email notifications
2. Export features
3. Social sharing
4. Advanced analytics
5. Performance optimizations

---

## Technical Constraints

1. **Must use Ashna AI agents** (not direct OpenAI)
2. **All times in IST** (UTC+5:30)
3. **Direct web scraping** for contests (no AI)
4. **Bidirectional Google Calendar sync**
5. **TypeScript** for both frontend and backend
6. **MongoDB** for database
7. **React** for frontend
8. **Express.js** for backend

---

## End of Specification

This document contains everything needed to build the complete Competitive Programming Calendar & Notes Application. Implement all features as specified, prioritize MVP deliverables, and ensure high code quality, security, and performance throughout.
