<div align="center">
  <h1>📅 CP Calendar Pro (CalNote)</h1>
  <p><strong>A Next-Generation AI-Powered Scheduling Assistant for Competitive Programmers</strong></p>

  <!-- Badges -->
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge" alt="Express.js" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
</div>

<br />

## 📖 Overview

**CP Calendar Pro** is a full-stack scheduling application purpose-built for competitive programmers and busy developers. It aggregates upcoming programming contests from major platforms (Codeforces, LeetCode, CodeChef, AtCoder) and layers a **context-aware AI scheduling agent** on top of a traditional calendar and notes system.

Instead of just creating isolated events, the AI reasons over your existing calendar, upcoming contests, and personal preferences (e.g., sleep schedules, timezone) to propose or directly create optimal calendar blocks.

## ✨ Key Features

- 🧠 **Context-Aware AI Scheduling**: Chat with your calendar! The AI agent creates optimal schedules by analyzing your existing events and upcoming contests.
- 🔄 **Pluggable AI Architecture**: Utilizes a Strategy Pattern to support two AI backends interchangeable at runtime:
  - **Ashna AI**: Fast, managed proprietary AI service.
  - **Custom AI Agent**: Bring your own LLM API (Anthropic, OpenAI, etc.).
- 🏆 **Contest Aggregator**: Automated scraper powered by `Agenda.js` pulling real-time contest data from top competitive programming platforms.
- 📅 **Google Calendar Sync**: Two-way synchronization with Google Calendar so your AI-scheduled blocks reflect everywhere.
- 📝 **Rich-Text Notes**: Integrated `Tiptap` notes system, allowing you to attach rich text, code snippets, and to-do lists directly to calendar events or keep them standalone.
- 🔐 **Robust Security**: JWT-based authentication with short-lived access tokens and rotated refresh tokens. Google OAuth is also fully supported.

## 🏗 Architecture & Tech Stack

CP Calendar Pro follows a **layered, service-oriented monolith** architecture, ensuring strict internal boundaries via TypeScript interfaces while avoiding premature microservice complexity.

### Frontend
- **Framework**: React 18 with Vite
- **Language**: TypeScript (`strict: true`)
- **State Management**: Zustand (Client UI State), TanStack Query (Server State Caching)
- **Routing**: React Router v6
- **UI Libraries**: React Big Calendar, Tiptap (Rich Text Editor), Lucide React (Icons)
- **Styling**: Vanilla CSS / Tailwind with predefined custom CSS variables for a premium dark mode UI.

### Backend
- **Runtime**: Node.js v20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Authentication**: JWT, bcrypt, Google Auth Library
- **AI Integration**: Google GenAI SDK, Custom REST Clients
- **Validation**: Zod & Joi
- **Job Queues & Tasks**: BullMQ (Async AI tasks), Agenda (Cron scraping tasks)

### Database & Infrastructure
- **Primary Database**: MongoDB (via Mongoose)
- **Cache & Message Broker**: Redis (Caches contest data, powers BullMQ)
- **Containerization**: Docker & Docker Compose

## 📂 Project Structure

```text
CP Calendar Pro/
├── backend/                  # Express.js + TS Backend
│   ├── src/
│   │   ├── config/           # Environment, DB, and Redis configurations
│   │   ├── models/           # Mongoose Data Models (User, Contest, Event, Note)
│   │   ├── modules/          # Domain modules (auth, contests, events, notes, ai)
│   │   ├── middleware/       # Express middlewares (auth, validation, error handling)
│   │   └── utils/            # Helper functions
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                 # React + Vite Frontend
│   ├── src/
│   │   ├── app/              # Global App layout & providers
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Page components (Auth, Calendar, Contests, Notes, Settings)
│   │   ├── queries/          # TanStack Query hooks
│   │   ├── stores/           # Zustand state stores
│   │   ├── styles/           # Global CSS and design tokens
│   │   └── types/            # TypeScript interfaces
│   ├── Dockerfile
│   └── package.json
│
├── Documentation/            # Detailed High-Level Design, ERD, Data flows, and SRS
└── docker-compose.yml        # Orchestrates MongoDB, Redis, Frontend, and Backend
```

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v20 or higher)
- [Docker](https://www.docker.com/) and Docker Compose
- A MongoDB URI (if running locally without Docker)
- A Redis instance (if running locally without Docker)

### Environment Variables
You will need to create `.env` files for both the frontend and backend.
Refer to `frontend/.env.example` and `backend/.env.example` for the required keys (e.g., Database URIs, JWT Secrets, Google Client IDs, AI API Keys).

### Run using Docker (Recommended)
The easiest way to get the entire stack (Mongo, Redis, API, Client) running is via Docker Compose.

```bash
# Clone the repository
git clone <your-repo-url>
cd CalNote

# Spin up the containers
docker-compose up --build
```
- Frontend will be available at: `http://localhost:5173`
- Backend API will be available at: `http://localhost:4000`

### Run Locally (Development Mode)

**1. Start the Backend**
```bash
cd backend
npm install
npm run dev
```

**2. Start the Frontend**
```bash
cd frontend
npm install
npm run dev
```

## 🔌 Core API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/login` | Authenticate user & get tokens |
| `POST` | `/api/v1/auth/google` | Google OAuth login |
| `GET`  | `/api/v1/contests` | Fetch aggregated contests (cached) |
| `POST` | `/api/v1/ai/schedule` | Generate dynamic schedule via AI |
| `GET`  | `/api/v1/events` | Get user calendar events |
| `POST` | `/api/v1/notes` | Create a standalone or event-linked note |

*For complete API documentation and schemas, please refer to `Documentation/CP_Calendar_Pro_Documentation.md`.*

## 🎨 Design Philosophy

The UI is built to feel like a hybrid of a modern productivity calendar and a competitive-programming tool. 
- **Premium Dark Mode**: High-contrast, easy-on-the-eyes interface built for long coding sessions.
- **Persistent AI Interface**: The AI Chat and Provider Toggle are first-class citizens, persistently docked for rapid context-aware scheduling.
- **Timezone Enforcement**: Enforces IST (`Asia/Kolkata`) strictly across the UI for consistency, while correctly managing Google Calendar's native timezone syncs under the hood.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! 
1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License
This project is licensed under the MIT License.
