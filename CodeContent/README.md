# Competitive Programming Calendar + Notes App 🏆

> Never miss a coding contest again! Automatically sync LeetCode, Codeforces, and CodeChef contests to your Google Calendar with AI-powered notes.

[![Build Status](https://github.com/your-username/cp-calendar-app/workflows/CI/badge.svg)](https://github.com/your-username/cp-calendar-app/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)

---

## ✨ Features

- **🔄 Auto-Sync Contests**: One-click sync of upcoming contests to Google Calendar
- **📅 Multi-Platform Support**: LeetCode, Codeforces, CodeChef
- **🤖 AI-Generated Notes**: Smart contest prep notes powered by Ashna AI
- **⏰ Smart Reminders**: Customizable notifications (15 min, 1 hour, 1 day before)
- **🌍 Timezone Support**: Automatic timezone conversion
- **📱 Mobile-Friendly**: Responsive PWA design
- **🔐 Secure OAuth**: Google Sign-In with encrypted token storage

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ ([Download](https://nodejs.org/))
- **pnpm** 8+ (`npm install -g pnpm`)
- **PostgreSQL** 15+
- **Redis** 7+
- **Google Cloud** account (for OAuth & Calendar API)
- **Ashna AI** API key ([Get one](https://ashna.ai))

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/cp-calendar-app.git
cd cp-calendar-app

# Install dependencies
pnpm install

# Setup environment variables
cp .env.example apps/api/.env.development
cp .env.example apps/web/.env.development

# Start Docker services (Postgres + Redis)
cd docker && docker-compose up -d && cd ..

# Run database migrations
cd apps/api
pnpm prisma migrate dev
pnpm prisma db seed
cd ../..

# Start development servers
pnpm dev
```

**Open your browser:**
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:4000](http://localhost:4000)
- API Docs: [http://localhost:4000/api-docs](http://localhost:4000/api-docs)

---

## 📁 Project Structure

```
cp-calendar-app/
├── apps/
│   ├── web/                 # React + Vite + TypeScript frontend
│   │   ├── src/
│   │   │   ├── components/  # UI components
│   │   │   ├── pages/       # Page components
│   │   │   ├── hooks/       # Custom React hooks
│   │   │   ├── services/    # API service layer
│   │   │   └── store/       # Zustand state management
│   │   └── package.json
│   └── api/                 # Node.js + Express + Prisma backend
│       ├── src/
│       │   ├── controllers/ # Route handlers
│       │   ├── services/    # Business logic
│       │   ├── scrapers/    # Contest scrapers
│       │   ├── jobs/        # Background jobs (BullMQ)
│       │   └── routes/      # API routes
│       ├── prisma/          # Database schema
│       └── package.json
├── packages/
│   ├── shared/              # Shared TypeScript types
│   ├── ui/                  # Shared UI components
│   └── config/              # Shared ESLint/Prettier configs
├── docker/
│   └── docker-compose.yml   # PostgreSQL + Redis
├── .github/workflows/       # CI/CD pipelines
├── docs/                    # Documentation
├── turbo.json               # Turborepo config
└── package.json             # Root package.json
```

---

## 🛠️ Tech Stack

### Frontend
- **React 18** with **TypeScript**
- **Vite** (blazing fast dev server)
- **Tailwind CSS** + **shadcn/ui**
- **Zustand** (state management)
- **React Query** (data fetching)
- **React Hook Form** + **Zod** (forms & validation)

### Backend
- **Node.js** + **Express**
- **Prisma ORM** (PostgreSQL)
- **Passport.js** (OAuth authentication)
- **BullMQ** (job queue with Redis)
- **Winston** (logging)
- **Jest** (testing)

### Infrastructure
- **Docker** + **Docker Compose**
- **Turborepo** (monorepo)
- **GitHub Actions** (CI/CD)
- **Vercel** (frontend hosting)
- **Railway/Render** (backend hosting)

---

## 🔑 Configuration

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable **Google Calendar API**
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:4000/api/v1/auth/google/callback`
6. Copy **Client ID** and **Client Secret** to `.env`

### Ashna AI Setup

1. Sign up at [Ashna AI](https://ashna.ai)
2. Create API key
3. Add to `.env`: `ASHNA_AI_API_KEY=your_key_here`

### Environment Variables

See `.env.example` for all required variables.

---

## 📚 Documentation

- [📖 API Documentation](docs/API_Specification.md)
- [🏗️ System Architecture](docs/Architecture.md)
- [🗺️ Roadmap](docs/Roadmap.md)
- [🎨 UI/UX Design](docs/UI-UX.md)
- [🗄️ Database Schema](docs/Database_Schema_ERD.md)

---

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e
```

---

## 🚢 Deployment

### Frontend (Vercel)

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
cd apps/web
vercel --prod
```

### Backend (Railway)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy
cd apps/api
railway up
```

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Ashna AI](https://ashna.ai) for AI-powered notes generation
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Turborepo](https://turbo.build/) for monorepo magic
- Contest platforms: LeetCode, Codeforces, CodeChef

---

## 📧 Support

- **Email**: support@cpcontest.app
- **Discord**: [Join our community](https://discord.gg/cpcontest)
- **Issues**: [GitHub Issues](https://github.com/your-username/cp-calendar-app/issues)

---

**Made with ❤️ by competitive programmers, for competitive programmers**

⭐ **Star this repo** if you find it useful!
