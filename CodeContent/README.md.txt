# CP Calendar App

> Never miss a coding contest. Track LeetCode, Codeforces, and CodeChef contests with smart reminders and Google Calendar sync.

## 🚀 Features

- **Multi-Platform Support**: LeetCode, Codeforces, CodeChef
- **Unified Calendar View**: See all contests in one place
- **Google Calendar Integration**: Auto-sync with your calendar
- **Smart Reminders**: 15 min, 1 hour, and 1 day before contests
- **Personal Notes**: Take contest-specific notes
- **Real-Time Updates**: Automatic contest data scraping
- **Modern UI**: Beautiful, responsive interface
- **PWA Support**: Install as a mobile app

## 📦 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for blazing-fast development
- **TailwindCSS** for styling
- **Zustand** for state management
- **TanStack Query** for data fetching
- **React Router** for navigation

### Backend
- **Node.js** + **Express**
- **TypeScript** throughout
- **Prisma ORM** with PostgreSQL
- **Redis** for caching
- **Passport.js** for Google OAuth
- **Node-Cron** for scheduled tasks

### Infrastructure
- **PostgreSQL** database
- **Redis** cache
- **Docker** & Docker Compose
- **Turborepo** for monorepo management
- **pnpm** for package management

## 🛠️ Project Structure

```
cp-calendar-app/
├── apps/
│   ├── api/                  # Express backend
│   └── web/                  # React frontend
├── packages/
│   ├── database/             # Prisma schema & migrations
│   ├── shared/               # Shared types & utilities
│   └── config/               # Shared configurations
├── docker-compose.yml       # Local development setup
└── turbo.json               # Turborepo config
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+
- **pnpm** 8+
- **Docker** (optional, for PostgreSQL & Redis)
- **Google Cloud** project with OAuth 2.0 credentials

### 1. Clone the Repository

```bash
git clone <repository-url>
cd cp-calendar-app
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and add your:
- Google OAuth credentials
- Database URL
- JWT secret
- Encryption key

### 4. Start Infrastructure

```bash
# Start PostgreSQL and Redis
docker-compose up -d
```

### 5. Set Up Database

```bash
# Push Prisma schema
pnpm db:push

# Or run migrations
pnpm db:migrate
```

### 6. Start Development Servers

```bash
# Start all apps in parallel
pnpm dev
```

Visit:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:4000
- **Prisma Studio**: `pnpm db:studio`

## 🔑 Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google Calendar API**
4. Create **OAuth 2.0 credentials**:
   - Application type: Web application
   - Authorized redirect URIs:
     - `http://localhost:4000/api/v1/auth/google/callback`
     - Add production URLs later
5. Copy **Client ID** and **Client Secret** to `.env`

## 📚 Available Scripts

```bash
# Development
pnpm dev                 # Start all apps
pnpm dev --filter=api    # Start API only
pnpm dev --filter=web    # Start web only

# Build
pnpm build               # Build all apps
pnpm build --filter=api  # Build API only

# Database
pnpm db:push             # Push schema changes
pnpm db:migrate          # Run migrations
pnpm db:studio           # Open Prisma Studio
pnpm db:seed             # Seed database

# Code Quality
pnpm lint                # Lint all packages
pnpm format              # Format code with Prettier
pnpm test                # Run tests

# Clean
pnpm clean               # Remove node_modules & build artifacts
```

## 📝 API Endpoints

### Authentication
- `GET /api/v1/auth/google` - Initiate Google OAuth
- `GET /api/v1/auth/google/callback` - OAuth callback
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/logout` - Logout

### Contests
- `GET /api/v1/contests` - Get all contests
- `GET /api/v1/contests/:id` - Get contest by ID
- `GET /api/v1/contests/platform/:platform` - Get by platform
- `GET /api/v1/contests/upcoming` - Upcoming contests
- `POST /api/v1/contests/sync` - Trigger manual sync

### Calendar
- `GET /api/v1/calendar/events` - Get user's calendar events
- `POST /api/v1/calendar/add/:contestId` - Add contest to calendar

### Notes
- `GET /api/v1/notes` - Get user's notes
- `POST /api/v1/notes` - Create note
- `PUT /api/v1/notes/:id` - Update note
- `DELETE /api/v1/notes/:id` - Delete note

## 🐛 Known Issues & Limitations

- Contest data depends on third-party APIs (LeetCode, Codeforces, CodeChef)
- Google Calendar sync requires OAuth consent
- Rate limits apply to contest scraping

## 🛡️ Security

- All sensitive tokens are encrypted (AES-256)
- JWT-based authentication
- Google OAuth 2.0 for secure login
- Environment-based secrets
- CORS protection
- Rate limiting (recommended for production)

## 🚀 Deployment

### Docker

```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Start production
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables (Production)

Make sure to set:
- Secure `JWT_SECRET`
- Strong `ENCRYPTION_KEY`
- Production database URL
- Production Google OAuth redirect URI

## 📝 License

MIT License - feel free to use for your own projects!

## 👨‍💻 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push and open a Pull Request

---

**Built with ❤️ for competitive programmers**
