# API Specification Document: Competitive Programming Calendar + Notes App

**Version:** 1.0  
**Date:** July 4, 2026  
**Author:** Max Effort Reasoning Engine  
**Base URL:** `https://api.cpcontest.app`  
**API Version:** `v1`  

---

## 1. Executive Summary

This document provides a **complete REST API specification** for the Competitive Programming Calendar + Notes application. It covers:

- **API design principles and standards**
- **Authentication and authorization**
- **Complete endpoint reference with examples**
- **Request/response schemas**
- **Error handling and status codes**
- **Rate limiting and throttling**
- **Versioning strategy**
- **API testing and documentation tools**
- **Security best practices**

---

## 2. API Design Principles

### 2.1 RESTful Architecture

**Core Principles:**

1. **Resource-Based URLs**: Endpoints represent resources, not actions
   - ✅ `GET /api/v1/contests`
   - ❌ `GET /api/v1/getContests`

2. **HTTP Verbs**: Standard methods for CRUD operations
   - `GET`: Retrieve resources
   - `POST`: Create new resources
   - `PUT/PATCH`: Update existing resources
   - `DELETE`: Remove resources

3. **Stateless**: Each request contains all necessary information (JWT token)

4. **Consistent Naming**: 
   - Resources: plural nouns (`contests`, `notes`)
   - URL segments: kebab-case
   - JSON fields: camelCase

5. **HATEOAS (Hypermedia)**: Include relevant links in responses (future enhancement)

### 2.2 Response Standards

**Success Response Format:**
```json
{
  "success": true,
  "data": { /* resource data */ },
  "meta": {
    "timestamp": "2026-07-04T18:48:46Z",
    "requestId": "req_clx1y2z3a0000abc"
  }
}
```

**Error Response Format:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "email",
        "message": "Must be a valid email address"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-07-04T18:48:46Z",
    "requestId": "req_clx1y2z3a0001def"
  }
}
```

### 2.3 HTTP Status Codes

| Code | Meaning               | Usage                                      |
|------|-----------------------|--------------------------------------------|
| 200  | OK                    | Successful GET, PUT, PATCH, DELETE         |
| 201  | Created               | Successful POST (resource created)         |
| 204  | No Content            | Successful DELETE (no response body)       |
| 400  | Bad Request           | Invalid request syntax or parameters       |
| 401  | Unauthorized          | Missing or invalid authentication token    |
| 403  | Forbidden             | Authenticated but not authorized           |
| 404  | Not Found             | Resource does not exist                    |
| 409  | Conflict              | Resource already exists (duplicate)        |
| 422  | Unprocessable Entity  | Validation failed                          |
| 429  | Too Many Requests     | Rate limit exceeded                        |
| 500  | Internal Server Error | Unexpected server error                    |
| 503  | Service Unavailable   | Temporary service downtime                 |

---

## 3. Authentication & Authorization

### 3.1 OAuth 2.0 Flow

**Provider:** Google OAuth 2.0

**Scopes Required:**
- `openid`
- `email`
- `profile`
- `https://www.googleapis.com/auth/calendar` (for calendar sync)

**Flow Diagram:**

```
1. User clicks "Sign in with Google" on frontend
   ↓
2. Frontend redirects to /api/v1/auth/google
   ↓
3. Backend redirects to Google OAuth consent screen
   ↓
4. User grants permissions
   ↓
5. Google redirects to /api/v1/auth/google/callback with code
   ↓
6. Backend exchanges code for access token
   ↓
7. Backend creates/updates user in database
   ↓
8. Backend generates JWT token
   ↓
9. Backend redirects to frontend with JWT in query param or cookie
   ↓
10. Frontend stores JWT and uses for subsequent requests
```

### 3.2 JWT Token Structure

**Payload:**
```json
{
  "sub": "clx1y2z3a0000abc",  // User ID
  "email": "arjun@example.com",
  "name": "Arjun Kumar",
  "iat": 1720118926,            // Issued at (Unix timestamp)
  "exp": 1720723726             // Expires at (7 days)
}
```

**Header (in requests):**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3.3 Authorization Levels

| Level       | Access                                           |
|-------------|--------------------------------------------------|
| **Public**  | No auth required (e.g., health check)            |
| **User**    | Authenticated user (own data only)               |
| **Admin**   | Full access (future: admin dashboard)            |

**Current Implementation:** All protected routes require valid JWT token. Users can only access their own data (enforced by `user_id` foreign key constraints).

---

## 4. API Endpoints

### 4.1 Authentication

#### 4.1.1 Initiate Google OAuth

**Endpoint:** `GET /api/v1/auth/google`

**Description:** Redirects user to Google OAuth consent screen.

**Query Parameters:** None

**Response:** `302 Redirect` to Google OAuth URL

**Example:**
```bash
curl -X GET https://api.cpcontest.app/api/v1/auth/google
# User is redirected to:
# https://accounts.google.com/o/oauth2/v2/auth?client_id=...
```

---

#### 4.1.2 Google OAuth Callback

**Endpoint:** `GET /api/v1/auth/google/callback`

**Description:** Handles OAuth callback, exchanges code for tokens, creates JWT.

**Query Parameters:**
- `code` (string, required): Authorization code from Google
- `state` (string, optional): CSRF protection token

**Response:** `302 Redirect` to frontend with JWT

**Success Redirect:**
```
https://app.cpcontest.app/auth/success?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Error Redirect:**
```
https://app.cpcontest.app/auth/error?error=oauth_failed&message=User%20denied%20consent
```

---

#### 4.1.3 Get Current User

**Endpoint:** `GET /api/v1/auth/me`

**Description:** Retrieve authenticated user's profile.

**Authentication:** Required (JWT)

**Request Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx1y2z3a0000abc",
      "email": "arjun@example.com",
      "name": "Arjun Kumar",
      "avatarUrl": "https://lh3.googleusercontent.com/a/...",
      "timezone": "Asia/Kolkata",
      "createdAt": "2026-06-15T10:30:00Z"
    }
  },
  "meta": {
    "timestamp": "2026-07-04T18:48:46Z",
    "requestId": "req_clx1y2z3a0002ghi"
  }
}
```

**Error Response:** `401 Unauthorized`

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

---

#### 4.1.4 Logout

**Endpoint:** `POST /api/v1/auth/logout`

**Description:** Invalidate JWT token (optional: add to blacklist).

**Authentication:** Required

**Request Body:** None

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

### 4.2 Contests

#### 4.2.1 List Contests

**Endpoint:** `GET /api/v1/contests`

**Description:** Retrieve upcoming contests with optional filters.

**Authentication:** Optional (public data; no auth shows all, with auth can mark favorites in future)

**Query Parameters:**

| Parameter  | Type    | Required | Default | Description                          |
|------------|---------|----------|---------|--------------------------------------|
| `platform` | string  | No       | -       | Filter by platform: `leetcode`, `codeforces`, `codechef` |
| `upcoming` | boolean | No       | true    | Show only upcoming contests          |
| `limit`    | integer | No       | 20      | Results per page (max 100)           |
| `offset`   | integer | No       | 0       | Pagination offset                    |
| `sortBy`   | string  | No       | `startTime` | Sort field: `startTime`, `platform` |
| `order`    | string  | No       | `asc`   | Sort order: `asc`, `desc`            |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "contests": [
      {
        "id": "clx2a3b4c5000xyz",
        "platform": "LEETCODE",
        "name": "Weekly Contest 350",
        "url": "https://leetcode.com/contest/weekly-350",
        "startTime": "2026-07-05T08:00:00+05:30",
        "endTime": "2026-07-05T09:30:00+05:30",
        "durationMinutes": 90,
        "difficulty": "MEDIUM",
        "timeUntilStart": "14h 11m",
        "isActive": true
      },
      {
        "id": "clx2a3b4c5001abc",
        "platform": "CODEFORCES",
        "name": "Codeforces Round 850 (Div. 2)",
        "url": "https://codeforces.com/contest/1850",
        "startTime": "2026-07-06T20:05:00+05:30",
        "endTime": "2026-07-06T22:05:00+05:30",
        "durationMinutes": 120,
        "difficulty": "DIV2",
        "timeUntilStart": "2d 1h",
        "isActive": true
      }
    ],
    "pagination": {
      "total": 45,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    }
  },
  "meta": {
    "timestamp": "2026-07-04T18:48:46Z",
    "requestId": "req_clx1y2z3a0003jkl"
  }
}
```

**Example Requests:**

```bash
# All upcoming contests
curl -X GET https://api.cpcontest.app/api/v1/contests

# LeetCode contests only
curl -X GET "https://api.cpcontest.app/api/v1/contests?platform=leetcode"

# Past contests (last 20)
curl -X GET "https://api.cpcontest.app/api/v1/contests?upcoming=false&limit=20"

# Paginated results
curl -X GET "https://api.cpcontest.app/api/v1/contests?limit=10&offset=10"
```

---

#### 4.2.2 Get Contest by ID

**Endpoint:** `GET /api/v1/contests/:id`

**Description:** Retrieve detailed information for a specific contest.

**Authentication:** Optional

**Path Parameters:**
- `id` (string, required): Contest ID

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "contest": {
      "id": "clx2a3b4c5000xyz",
      "platform": "LEETCODE",
      "name": "Weekly Contest 350",
      "url": "https://leetcode.com/contest/weekly-350",
      "startTime": "2026-07-05T08:00:00+05:30",
      "endTime": "2026-07-05T09:30:00+05:30",
      "durationMinutes": 90,
      "difficulty": "MEDIUM",
      "description": "Standard weekly LeetCode contest with 4 problems",
      "externalId": "weekly-350",
      "isActive": true,
      "createdAt": "2026-07-01T00:00:00Z",
      "updatedAt": "2026-07-01T00:00:00Z"
    }
  }
}
```

**Error Response:** `404 Not Found`

```json
{
  "success": false,
  "error": {
    "code": "CONTEST_NOT_FOUND",
    "message": "Contest with ID 'invalid_id' not found"
  }
}
```

---

### 4.3 Notes

#### 4.3.1 List User Notes

**Endpoint:** `GET /api/v1/notes`

**Description:** Retrieve all notes for authenticated user.

**Authentication:** Required

**Query Parameters:**

| Parameter    | Type    | Required | Default | Description                     |
|--------------|---------|----------|---------|---------------------------------|
| `contestId`  | string  | No       | -       | Filter by contest ID            |
| `limit`      | integer | No       | 20      | Results per page (max 100)      |
| `offset`     | integer | No       | 0       | Pagination offset               |
| `sortBy`     | string  | No       | `createdAt` | Sort field              |
| `order`      | string  | No       | `desc`  | Sort order: `asc`, `desc`       |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "notes": [
      {
        "id": "clx3a4b5c6000note",
        "title": "LeetCode Weekly 350 Prep",
        "content": "# Preparation Notes\n\n## Key Topics\n- Dynamic Programming\n- Graph Algorithms",
        "isAiGenerated": true,
        "isPinned": false,
        "tags": ["leetcode", "weekly", "dp"],
        "contest": {
          "id": "clx2a3b4c5000xyz",
          "name": "Weekly Contest 350",
          "platform": "LEETCODE",
          "startTime": "2026-07-05T08:00:00+05:30"
        },
        "createdAt": "2026-07-04T12:00:00Z",
        "updatedAt": "2026-07-04T12:00:00Z"
      }
    ],
    "pagination": {
      "total": 15,
      "limit": 20,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

---

#### 4.3.2 Get Note by ID

**Endpoint:** `GET /api/v1/notes/:id`

**Description:** Retrieve a specific note.

**Authentication:** Required

**Path Parameters:**
- `id` (string, required): Note ID

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "note": {
      "id": "clx3a4b5c6000note",
      "title": "LeetCode Weekly 350 Prep",
      "content": "# Preparation Notes\n\n## Key Topics\n- Dynamic Programming\n- Graph Algorithms\n\n## Strategy\n- Solve easy problems first\n- Time limit: 90 minutes",
      "isAiGenerated": true,
      "aiModelVersion": "ashna-v1.2",
      "isPinned": false,
      "tags": ["leetcode", "weekly", "dp"],
      "contestId": "clx2a3b4c5000xyz",
      "createdAt": "2026-07-04T12:00:00Z",
      "updatedAt": "2026-07-04T12:00:00Z"
    }
  }
}
```

**Error Response:** `404 Not Found` or `403 Forbidden` (if note belongs to another user)

---

#### 4.3.3 Create Note

**Endpoint:** `POST /api/v1/notes`

**Description:** Create a new note.

**Authentication:** Required

**Request Body:**

```json
{
  "title": "My Custom Study Plan",
  "content": "# Study Plan\n\n## Week 1\n- Arrays and Strings\n- Hash Tables",
  "contestId": "clx2a3b4c5000xyz",  // Optional
  "tags": ["study-plan", "basics"],
  "isPinned": false
}
```

**Validation Rules:**
- `title`: Max 500 characters (optional)
- `content`: Required, max 100,000 characters
- `contestId`: Must be valid contest ID (optional)
- `tags`: Max 10 tags, each max 50 characters

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "note": {
      "id": "clx3a4b5c6001xyz",
      "title": "My Custom Study Plan",
      "content": "# Study Plan\n\n## Week 1\n- Arrays and Strings\n- Hash Tables",
      "isAiGenerated": false,
      "isPinned": false,
      "tags": ["study-plan", "basics"],
      "contestId": "clx2a3b4c5000xyz",
      "createdAt": "2026-07-04T18:50:00Z",
      "updatedAt": "2026-07-04T18:50:00Z"
    }
  }
}
```

**Error Response:** `422 Unprocessable Entity`

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "content",
        "message": "Content is required"
      },
      {
        "field": "content",
        "message": "Content must not exceed 100000 characters"
      }
    ]
  }
}
```

---

#### 4.3.4 Update Note

**Endpoint:** `PUT /api/v1/notes/:id` or `PATCH /api/v1/notes/:id`

**Description:** Update an existing note.

**Authentication:** Required

**Path Parameters:**
- `id` (string, required): Note ID

**Request Body:** (all fields optional for PATCH)

```json
{
  "title": "Updated Study Plan",
  "content": "# Updated Content",
  "tags": ["updated"],
  "isPinned": true
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "note": {
      "id": "clx3a4b5c6001xyz",
      "title": "Updated Study Plan",
      "content": "# Updated Content",
      "isPinned": true,
      "tags": ["updated"],
      "updatedAt": "2026-07-04T19:00:00Z"
    }
  }
}
```

---

#### 4.3.5 Delete Note

**Endpoint:** `DELETE /api/v1/notes/:id`

**Description:** Delete a note.

**Authentication:** Required

**Path Parameters:**
- `id` (string, required): Note ID

**Response:** `204 No Content` (no body)

**Error Response:** `404 Not Found` or `403 Forbidden`

---

#### 4.3.6 Generate AI Note

**Endpoint:** `POST /api/v1/notes/generate`

**Description:** Generate an AI-powered note for a contest using Ashna AI agent.

**Authentication:** Required

**Request Body:**

```json
{
  "contestId": "clx2a3b4c5000xyz",
  "userPrompt": "Focus on dynamic programming patterns"  // Optional
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "note": {
      "content": "# Codeforces Round 850 Prep Notes\n\n## Common Patterns\n- Dynamic Programming (Knapsack, LCS)\n- Graph Traversal (BFS/DFS)\n- Greedy Algorithms\n\n## Tips\n- Read all problems first\n- Start with easiest (usually A/B)\n- Manage time: 30min per problem max\n\n## Resources\n- [CP Algorithms](https://cp-algorithms.com)\n- Practice problems: [Codeforces Gym](https://codeforces.com/gym)",
      "isAiGenerated": true,
      "aiModelVersion": "ashna-v1.2"
    }
  },
  "meta": {
    "generationTimeMs": 2340,
    "tokensUsed": 450
  }
}
```

**Error Response:** `503 Service Unavailable` (if Ashna AI agent is down)

```json
{
  "success": false,
  "error": {
    "code": "AI_SERVICE_UNAVAILABLE",
    "message": "Note generation service is temporarily unavailable. Please try again later."
  }
}
```

---

### 4.4 Calendar Sync

#### 4.4.1 Sync Contests to Google Calendar

**Endpoint:** `POST /api/v1/calendar/sync`

**Description:** Sync selected contests (or all upcoming) to user's Google Calendar.

**Authentication:** Required (with Google Calendar scope)

**Request Body:**

```json
{
  "contestIds": ["clx2a3b4c5000xyz", "clx2a3b4c5001abc"],  // Optional: omit for all upcoming
  "reminderMinutes": [5, 15]  // Optional: defaults to [5, 15]
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "syncResult": {
      "syncedCount": 5,
      "failedCount": 0,
      "syncedContests": [
        {
          "contestId": "clx2a3b4c5000xyz",
          "googleEventId": "abc123def456",
          "status": "SUCCESS"
        },
        {
          "contestId": "clx2a3b4c5001abc",
          "googleEventId": "xyz789uvw012",
          "status": "SUCCESS"
        }
      ],
      "failedContests": []
    },
    "syncLog": {
      "id": "clx4a5b6c7000log",
      "status": "SUCCESS",
      "syncedAt": "2026-07-04T19:05:00Z"
    }
  },
  "meta": {
    "durationMs": 2340
  }
}
```

**Error Response:** `401 Unauthorized` (if Calendar scope not granted)

```json
{
  "success": false,
  "error": {
    "code": "CALENDAR_PERMISSION_REQUIRED",
    "message": "Google Calendar permission not granted. Please reconnect your account.",
    "reconnectUrl": "https://app.cpcontest.app/settings/reconnect"
  }
}
```

---

#### 4.4.2 Get Calendar Sync Status

**Endpoint:** `GET /api/v1/calendar/status`

**Description:** Check if Google Calendar is connected and view last sync.

**Authentication:** Required

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "calendarStatus": {
      "isConnected": true,
      "hasPermission": true,
      "lastSync": {
        "syncedAt": "2026-07-04T19:05:00Z",
        "status": "SUCCESS",
        "syncedCount": 5
      },
      "totalEventsSynced": 127
    }
  }
}
```

---

#### 4.4.3 Get Sync History

**Endpoint:** `GET /api/v1/calendar/sync-history`

**Description:** Retrieve calendar sync logs.

**Authentication:** Required

**Query Parameters:**
- `limit` (integer, optional): Default 10, max 50
- `offset` (integer, optional): Default 0

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "syncLogs": [
      {
        "id": "clx4a5b6c7000log",
        "status": "SUCCESS",
        "syncedCount": 5,
        "failedCount": 0,
        "durationMs": 2340,
        "syncedAt": "2026-07-04T19:05:00Z"
      },
      {
        "id": "clx4a5b6c7001log",
        "status": "PARTIAL",
        "syncedCount": 3,
        "failedCount": 2,
        "message": "2 events failed due to Google API rate limit",
        "durationMs": 5120,
        "syncedAt": "2026-07-03T10:30:00Z"
      }
    ],
    "pagination": {
      "total": 25,
      "limit": 10,
      "offset": 0
    }
  }
}
```

---

### 4.5 User Settings

#### 4.5.1 Get User Settings

**Endpoint:** `GET /api/v1/user/settings`

**Description:** Retrieve user preferences.

**Authentication:** Required

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "settings": {
      "timezone": "Asia/Kolkata",
      "notificationPrefs": {
        "email": true,
        "push": false
      },
      "defaultCalendarView": "month",
      "reminderMinutes": [5, 15],
      "preferredPlatforms": ["LEETCODE", "CODEFORCES", "CODECHEF"],
      "showPastContests": false,
      "theme": "light"
    }
  }
}
```

---

#### 4.5.2 Update User Settings

**Endpoint:** `PUT /api/v1/user/settings` or `PATCH /api/v1/user/settings`

**Description:** Update user preferences.

**Authentication:** Required

**Request Body:** (all fields optional for PATCH)

```json
{
  "timezone": "America/New_York",
  "notificationPrefs": {
    "email": false,
    "push": true
  },
  "reminderMinutes": [10, 30]
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "settings": {
      "timezone": "America/New_York",
      "notificationPrefs": {
        "email": false,
        "push": true
      },
      "reminderMinutes": [10, 30]
    }
  }
}
```

---

#### 4.5.3 Delete Account

**Endpoint:** `DELETE /api/v1/user/account`

**Description:** Permanently delete user account and all associated data.

**Authentication:** Required

**Request Body:**

```json
{
  "confirm": true,
  "password": "user_google_account_email"  // For verification
}
```

**Response:** `204 No Content`

**Note:** This action cascades to delete all notes and sync logs (as per FK constraints).

---

### 4.6 Health & Monitoring

#### 4.6.1 Health Check

**Endpoint:** `GET /api/v1/health`

**Description:** Check API health status.

**Authentication:** None

**Response:** `200 OK`

```json
{
  "status": "ok",
  "timestamp": "2026-07-04T18:48:46Z",
  "uptime": 345600,  // seconds
  "version": "1.0.0",
  "checks": {
    "database": "ok",
    "redis": "ok",
    "googleCalendarApi": "ok",
    "ashnaAiAgent": "ok"
  }
}
```

**Degraded Response:** `503 Service Unavailable`

```json
{
  "status": "degraded",
  "timestamp": "2026-07-04T18:48:46Z",
  "checks": {
    "database": "ok",
    "redis": "error",
    "googleCalendarApi": "ok",
    "ashnaAiAgent": "timeout"
  }
}
```

---

#### 4.6.2 API Metrics (Admin Only - Future)

**Endpoint:** `GET /api/v1/admin/metrics`

**Description:** Retrieve API usage metrics.

**Authentication:** Admin role required

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "metrics": {
      "totalRequests24h": 125000,
      "avgResponseTimeMs": 87,
      "p95ResponseTimeMs": 245,
      "errorRate": 0.02,
      "activeUsers24h": 1250,
      "topEndpoints": [
        {"path": "/api/v1/contests", "count": 45000},
        {"path": "/api/v1/notes", "count": 32000}
      ]
    }
  }
}
```

---

## 5. Error Codes Reference

### 5.1 Error Code List

| Code                          | HTTP Status | Description                                  |
|-------------------------------|-------------|----------------------------------------------|
| `VALIDATION_ERROR`            | 422         | Request validation failed                    |
| `UNAUTHORIZED`                | 401         | Missing or invalid authentication token      |
| `FORBIDDEN`                   | 403         | Insufficient permissions                     |
| `NOT_FOUND`                   | 404         | Resource not found                           |
| `CONTEST_NOT_FOUND`           | 404         | Contest ID does not exist                    |
| `NOTE_NOT_FOUND`              | 404         | Note ID does not exist                       |
| `USER_NOT_FOUND`              | 404         | User ID does not exist                       |
| `CONFLICT`                    | 409         | Resource already exists                      |
| `RATE_LIMIT_EXCEEDED`         | 429         | Too many requests                            |
| `CALENDAR_PERMISSION_REQUIRED`| 401         | Google Calendar scope not granted            |
| `CALENDAR_SYNC_FAILED`        | 500         | Calendar sync encountered an error           |
| `AI_SERVICE_UNAVAILABLE`      | 503         | Ashna AI agent unreachable                   |
| `INTERNAL_SERVER_ERROR`       | 500         | Unexpected server error                      |
| `SERVICE_UNAVAILABLE`         | 503         | Temporary service downtime                   |

### 5.2 Error Response Schema

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;              // Machine-readable error code
    message: string;           // Human-readable error message
    details?: Array<{          // Optional validation details
      field: string;
      message: string;
    }>;
    requestId?: string;        // For support troubleshooting
  };
  meta: {
    timestamp: string;         // ISO 8601
    requestId: string;
  };
}
```

---

## 6. Rate Limiting

### 6.1 Rate Limit Rules

**Default Limits:**

| User Type        | Requests per Hour | Requests per Day |
|------------------|-------------------|------------------|
| **Unauthenticated** | 60             | 500              |
| **Authenticated**   | 1000           | 10,000           |
| **Premium (Future)**| 5000           | 50,000           |

**Rate Limit Headers:**

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 987
X-RateLimit-Reset: 1720122446  # Unix timestamp
```

**Rate Limit Exceeded Response:** `429 Too Many Requests`

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Please try again in 15 minutes.",
    "retryAfter": 900  // seconds
  }
}
```

### 6.2 Implementation

**Strategy:** Token bucket algorithm with Redis

```typescript
// Pseudocode
const rateLimitKey = `rate_limit:${userId}:${hour}`;
const requestCount = await redis.incr(rateLimitKey);
if (requestCount === 1) {
  await redis.expire(rateLimitKey, 3600);  // 1 hour
}

if (requestCount > RATE_LIMIT) {
  throw new RateLimitError();
}
```

---

## 7. Pagination

### 7.1 Offset-Based Pagination

**Query Parameters:**
- `limit` (integer): Results per page (default 20, max 100)
- `offset` (integer): Skip N results (default 0)

**Response:**

```json
{
  "data": {
    "items": [...],
    "pagination": {
      "total": 150,
      "limit": 20,
      "offset": 40,
      "hasMore": true
    }
  }
}
```

### 7.2 Cursor-Based Pagination (Future)

**Query Parameters:**
- `limit` (integer): Results per page
- `cursor` (string): Opaque cursor from previous response

**Response:**

```json
{
  "data": {
    "items": [...],
    "pagination": {
      "nextCursor": "eyJpZCI6ImNseDJ6M2E0YjVjNjAwMHh5eiJ9",
      "hasMore": true
    }
  }
}
```

---

## 8. Versioning Strategy

### 8.1 URL-Based Versioning

**Current Approach:** Version in URL path

```
https://api.cpcontest.app/api/v1/contests
https://api.cpcontest.app/api/v2/contests  # Future
```

**Rationale:**
- Clear and explicit
- Easy to route at CDN/proxy level
- Multiple versions can coexist

### 8.2 Version Lifecycle

1. **Active:** Current stable version (`v1`)
2. **Deprecated:** Older version with sunset warning headers
3. **Retired:** No longer accessible (redirect to latest)

**Deprecation Header:**

```
Deprecation: true
Sunset: Sat, 31 Dec 2026 23:59:59 GMT
Link: <https://api.cpcontest.app/api/v2/contests>; rel="successor-version"
```

### 8.3 Breaking vs Non-Breaking Changes

**Non-Breaking (Patch in same version):**
- Adding new optional fields
- Adding new endpoints
- Adding new error codes
- Performance improvements

**Breaking (Requires new version):**
- Removing fields
- Changing field types
- Changing response structure
- Removing endpoints
- Changing authentication

---

## 9. Security Best Practices

### 9.1 HTTPS Only

- All API traffic over TLS 1.3
- HTTP requests redirect to HTTPS
- HSTS header: `Strict-Transport-Security: max-age=31536000; includeSubDomains`

### 9.2 CORS Configuration

```typescript
const corsOptions = {
  origin: [
    'https://app.cpcontest.app',
    'https://staging.cpcontest.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
```

### 9.3 Security Headers

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
```

### 9.4 Input Sanitization

- All inputs validated with Zod schemas
- SQL injection prevented by Prisma parameterized queries
- XSS prevented by output escaping (React auto-escaping + DOMPurify)

### 9.5 Secrets Management

- Environment variables for all secrets
- Never expose secrets in error messages or logs
- Rotate OAuth tokens and encryption keys quarterly

---

## 10. API Testing

### 10.1 Postman Collection

**Available at:** `https://api.cpcontest.app/api/v1/postman-collection.json`

**Import into Postman:**
1. Open Postman
2. Import → Link → Paste URL above
3. Set environment variables: `BASE_URL`, `JWT_TOKEN`

### 10.2 OpenAPI/Swagger Spec

**Available at:** `https://api.cpcontest.app/api/v1/docs`

**Interactive Docs:** Swagger UI at `https://api.cpcontest.app/api/v1/docs/ui`

### 10.3 Example cURL Commands

**Get upcoming contests:**
```bash
curl -X GET https://api.cpcontest.app/api/v1/contests \
  -H "Content-Type: application/json"
```

**Create a note:**
```bash
curl -X POST https://api.cpcontest.app/api/v1/notes \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Note",
    "content": "# Test Content"
  }'
```

**Sync to calendar:**
```bash
curl -X POST https://api.cpcontest.app/api/v1/calendar/sync \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contestIds": ["clx2a3b4c5000xyz"]
  }'
```

---

## 11. Integration Examples

### 11.1 JavaScript/TypeScript (Axios)

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.cpcontest.app/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add JWT token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Fetch upcoming contests
async function getUpcomingContests() {
  try {
    const response = await api.get('/contests', {
      params: { upcoming: true, limit: 20 }
    });
    return response.data.data.contests;
  } catch (error) {
    console.error('Failed to fetch contests:', error.response.data);
    throw error;
  }
}

// Generate AI note
async function generateAiNote(contestId: string) {
  try {
    const response = await api.post('/notes/generate', {
      contestId,
      userPrompt: 'Focus on graph algorithms'
    });
    return response.data.data.note;
  } catch (error) {
    if (error.response.status === 503) {
      console.error('AI service unavailable');
    }
    throw error;
  }
}
```

### 11.2 Python (requests)

```python
import requests

BASE_URL = 'https://api.cpcontest.app/api/v1'
JWT_TOKEN = 'your_jwt_token_here'

headers = {
    'Authorization': f'Bearer {JWT_TOKEN}',
    'Content-Type': 'application/json'
}

# Get user notes
def get_notes():
    response = requests.get(
        f'{BASE_URL}/notes',
        headers=headers,
        params={'limit': 10}
    )
    response.raise_for_status()
    return response.json()['data']['notes']

# Sync contests
def sync_to_calendar(contest_ids):
    response = requests.post(
        f'{BASE_URL}/calendar/sync',
        headers=headers,
        json={'contestIds': contest_ids}
    )
    response.raise_for_status()
    return response.json()['data']['syncResult']
```

---

## 12. Changelog

### v1.0.0 (2026-07-04) - Initial Release

**Added:**
- Authentication endpoints (Google OAuth)
- Contest listing and retrieval
- Notes CRUD operations
- AI note generation
- Google Calendar sync
- User settings management
- Rate limiting (1000 req/hour for authenticated users)
- Health check endpoint

**API Surface:**
- 18 endpoints across 6 resource groups
- JWT authentication
- Offset-based pagination
- OpenAPI/Swagger documentation

---

## 13. Future API Enhancements

### v1.1 (Planned: Q4 2026)

- [ ] Cursor-based pagination for large datasets
- [ ] WebSocket support for real-time contest updates
- [ ] Bulk operations (bulk note creation, bulk sync)
- [ ] Partial response fields (`?fields=id,name,startTime`)
- [ ] GraphQL endpoint (alongside REST)

### v2.0 (Planned: 2027)

- [ ] Multi-calendar support (Outlook, Apple Calendar)
- [ ] Contest participation tracking
- [ ] Social features (share notes, follow users)
- [ ] Webhook subscriptions (notify on new contests)
- [ ] Admin dashboard API

---

## 14. Support & Resources

### 14.1 Documentation Links

- **Interactive API Docs:** https://api.cpcontest.app/api/v1/docs/ui
- **OpenAPI Spec (JSON):** https://api.cpcontest.app/api/v1/docs/openapi.json
- **Postman Collection:** https://api.cpcontest.app/api/v1/postman-collection.json
- **Developer Guide:** https://docs.cpcontest.app/api/getting-started

### 14.2 Support Channels

- **GitHub Issues:** https://github.com/cp-calendar/api/issues
- **Discord Community:** https://discord.gg/cpcontest
- **Email:** api-support@cpcontest.app

### 14.3 Status Page

- **API Status:** https://status.cpcontest.app
- **Incident History:** https://status.cpcontest.app/history

---

## 15. Conclusion

This API specification provides a **comprehensive, production-ready REST API** for the Competitive Programming Calendar + Notes application. Key features:

1. **RESTful design** with consistent resource naming and HTTP verb usage
2. **OAuth 2.0 + JWT** for secure authentication
3. **Comprehensive error handling** with machine-readable error codes
4. **Rate limiting** to prevent abuse
5. **Pagination** for scalable data retrieval
6. **OpenAPI/Swagger docs** for interactive exploration
7. **Security best practices** (HTTPS, CORS, input validation)
8. **Versioning strategy** for backward compatibility
9. **Clear integration examples** in multiple languages

**Next Steps:**
- Implement API routes according to this specification
- Generate OpenAPI schema from code (using decorators or annotations)
- Set up Postman collection for integration testing
- Deploy to staging and run API acceptance tests
- Publish interactive API documentation

---

**Document Status**: Draft v1.0  
**Approvers**: Backend Lead, API Architect, Frontend Lead  
**Revision History**:
- 2026-07-04: Initial draft.
