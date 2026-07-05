# CP Calendar App - Project Setup Guide

> Complete step-by-step guide to set up the Competitive Programming Calendar project from scratch using Git Bash.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Structure Creation](#project-structure-creation)
3. [Configuration Files](#configuration-files)
4. [Database Setup](#database-setup)
5. [Backend Setup](#backend-setup)
6. [Frontend Setup](#frontend-setup)
7. [Running the Application](#running-the-application)

---

## Prerequisites

Before starting, ensure you have:

- **Node.js** 20+ installed
- **pnpm** 8+ installed (`npm install -g pnpm`)
- **Git Bash** or any Unix-like terminal
- **Docker Desktop** (for PostgreSQL and Redis)
- **Google Cloud Project** with OAuth 2.0 credentials

---

## Project Structure Creation

### Step 1: Create Root Directory

```bash
# Create project root
mkdir cp-calendar-app
cd cp-calendar-app

# Initialize Git
git init

# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Production
dist/
build/
*.tsbuildinfo

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Prisma
packages/database/prisma/migrations/
EOF
```

### Step 2: Create Monorepo Structure

```bash
# Create main directories
mkdir -p apps/api/src
mkdir -p apps/web/src
mkdir -p packages/database/prisma
mkdir -p packages/shared/src
mkdir -p packages/config
```

### Step 3: Create Backend Directory Structure

```bash
# API directories
mkdir -p apps/api/src/config
mkdir -p apps/api/src/controllers
mkdir -p apps/api/src/middlewares
mkdir -p apps/api/src/routes
mkdir -p apps/api/src/services
mkdir -p apps/api/src/scrapers
mkdir -p apps/api/src/cron
mkdir -p apps/api/src/utils
mkdir -p apps/api/src/types
```

### Step 4: Create Frontend Directory Structure

```bash
# Web app directories
mkdir -p apps/web/src/components/layout
mkdir -p apps/web/src/components/dashboard
mkdir -p apps/web/src/components/calendar
mkdir -p apps/web/src/components/notes
mkdir -p apps/web/src/components/settings
mkdir -p apps/web/src/components/common
mkdir -p apps/web/src/pages
mkdir -p apps/web/src/store
mkdir -p apps/web/src/hooks
mkdir -p apps/web/src/utils
mkdir -p apps/web/src/types
mkdir -p apps/web/src/styles
mkdir -p apps/web/public
```

### Step 5: Create Shared Packages Structure

```bash
# Shared types
mkdir -p packages/shared/src/types

# Config packages
mkdir -p packages/config/eslint
mkdir -p packages/config/typescript
```

---

## Configuration Files

### Step 6: Initialize pnpm Workspace

```bash
# Create pnpm-workspace.yaml in root
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'apps/*'
  - 'packages/*'
EOF
```

### Step 7: Create Turbo Configuration

```bash
# Create turbo.json in root
cat > turbo.json << 'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "build/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "test": {
      "dependsOn": ["^build"]
    },
    "clean": {
      "cache": false
    }
  }
}
EOF
```

### Step 8: Create TypeScript Configurations

```bash
# Root tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
EOF

# API tsconfig.json
cat > apps/api/tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# Web tsconfig.json
cat > apps/web/tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF

# Web tsconfig.node.json
cat > apps/web/tsconfig.node.json << 'EOF'
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
EOF
```

---

## Database Setup

### Step 9: Create Environment Files

```bash
# Root .env file
cat > .env << 'EOF'
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cp_calendar"

# Redis
REDIS_URL="redis://localhost:6379"

# API
NODE_ENV="development"
PORT=4000
API_URL="http://localhost:4000"
FRONTEND_URL="http://localhost:3000"

# Google OAuth (Replace with your credentials)
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:4000/api/v1/auth/google/callback"

# JWT
JWT_SECRET="change-this-to-a-random-32-character-string"
JWT_EXPIRES_IN="7d"

# Encryption
ENCRYPTION_KEY="change-this-to-a-random-32-char-key"

# Logging
LOG_LEVEL="info"

# Cron
SCRAPE_CRON_SCHEDULE="0 */6 * * *"
REMINDER_CRON_SCHEDULE="*/5 * * * *"
EOF

# Create .env for web
cat > apps/web/.env << 'EOF'
VITE_API_URL=http://localhost:4000
EOF
```

### Step 10: Initialize Database Package

```bash
# Create database package.json
cat > packages/database/package.json << 'EOF'
{
  "name": "@cp-calendar/database",
  "version": "1.0.0",
  "private": true,
  "main": "./index.ts",
  "types": "./index.ts",
  "scripts": {
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts",
    "generate": "prisma generate"
  },
  "dependencies": {
    "@prisma/client": "^5.9.1"
  },
  "devDependencies": {
    "prisma": "^5.9.1",
    "tsx": "^4.7.1"
  }
}
EOF

# Create database index
cat > packages/database/index.ts << 'EOF'
export * from '@prisma/client';
export { prisma } from './prisma/client';
EOF

# Create Prisma client wrapper
cat > packages/database/prisma/client.ts << 'EOF'
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
EOF
```

---

## Backend Setup

### Step 11: Create API Entry Point

```bash
# Create main server file
cat > apps/api/src/index.ts << 'EOF'
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env';
import { logger } from './config/logger';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { initCronJobs } from './cron';

const app = express();

// Middlewares
app.use(helmet());
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/v1', routes);

// Error handler
app.use(errorHandler);

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  logger.info(`\u26a1 API server running on port ${PORT}`);
  logger.info(`\ud83d\udd17 Frontend URL: ${config.frontendUrl}`);
  
  // Initialize cron jobs
  initCronJobs();
  logger.info('\u23f0 Cron jobs initialized');
});

export default app;
EOF
```

---

## Frontend Setup

### Step 12: Create Frontend Entry Point

```bash
# Create main.tsx
cat > apps/web/src/main.tsx << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

# Create index.css
cat > apps/web/src/styles/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply antialiased;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}
EOF

# Create index.html
cat > apps/web/index.html << 'EOF'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CP Calendar - Never Miss a Contest</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF
```

---

## Running the Application

### Step 13: Install Dependencies

```bash
# Install all dependencies
pnpm install

# Generate Prisma client
cd packages/database
pnpm prisma generate
cd ../..
```

### Step 14: Start Infrastructure

```bash
# Start Docker containers (PostgreSQL & Redis)
docker-compose up -d

# Wait for containers to be healthy
sleep 5
```

### Step 15: Set Up Database

```bash
# Push Prisma schema to database
pnpm db:push

# Or run migrations
# pnpm db:migrate
```

### Step 16: Start Development Servers

```bash
# Start all apps in development mode
pnpm dev

# Or start individually:
# pnpm dev --filter=api    # API only
# pnpm dev --filter=web    # Web only
```

### Step 17: Access the Application

- **Frontend**: http://localhost:3000
- **API**: http://localhost:4000
- **Prisma Studio**: Run `pnpm db:studio`

---

## Verification Checklist

☐ Project structure created  
☐ All configuration files in place  
☐ Docker containers running  
☐ Database schema pushed  
☐ Backend server started on port 4000  
☐ Frontend server started on port 3000  
☐ Google OAuth credentials configured  
☐ Can access landing page  

---

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 4000
lsof -ti:4000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Database Connection Issues

```bash
# Check Docker containers
docker ps

# Restart containers
docker-compose restart

# View logs
docker-compose logs postgres
```

### Prisma Issues

```bash
# Reset database
pnpm db:push --force-reset

# Regenerate client
cd packages/database
pnpm prisma generate
```

---

## Next Steps

1. **Configure Google OAuth**:
   - Go to Google Cloud Console
   - Create OAuth 2.0 credentials
   - Update `.env` with your credentials

2. **Test the Application**:
   - Visit http://localhost:3000
   - Click "Sign In with Google"
   - Authorize the app
   - Explore the dashboard

3. **Start Development**:
   - Add more features
   - Customize the UI
   - Deploy to production

---

**✅ Setup Complete!**

Your CP Calendar app is now ready for development. Happy coding! 🚀
