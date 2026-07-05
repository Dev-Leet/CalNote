# AI Agent Creation Guide for Competitive Programming Calendar App

**Version:** 1.0  
**Date:** July 5, 2026  
**Author:** Max Effort Reasoning Engine  

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Understanding AI Agents](#understanding-ai-agents)
3. [Agent Architecture Overview](#agent-architecture-overview)
4. [Prerequisites](#prerequisites)
5. [Creating AI Agents on Ashna AI Platform](#creating-ai-agents-on-ashna-ai-platform)
6. [Building Custom AI Agents from Scratch](#building-custom-ai-agents-from-scratch)
7. [Agent Integration with Your Application](#agent-integration-with-your-application)
8. [Implementation Examples](#implementation-examples)
9. [Security and Best Practices](#security-and-best-practices)
10. [Testing and Deployment](#testing-and-deployment)
11. [Monitoring and Maintenance](#monitoring-and-maintenance)
12. [Troubleshooting Guide](#troubleshooting-guide)

---

## Executive Summary

This comprehensive guide walks you through creating AI agents for the Competitive Programming Calendar + Notes application. You'll learn:

- **Two approaches**: Using Ashna AI Platform (no-code/low-code) and building custom agents from scratch
- **Web scraping agents** for LeetCode, Codeforces, and CodeChef
- **Note-taking agents** powered by LLMs
- **Integration strategies** for seamless app-agent communication
- **Production-ready patterns** with error handling and monitoring

---

## Understanding AI Agents

### What is an AI Agent?

An **AI agent** is an autonomous software entity that:

1. **Perceives** its environment through sensors (APIs, web scraping, databases)
2. **Reasons** using AI models (LLMs, machine learning)
3. **Acts** to achieve specific goals (data extraction, content generation, decision-making)
4. **Learns** from feedback to improve performance

### Agent Types for Your Application

#### 1. **Web Scraping Agent**
- **Purpose**: Extract contest data from competitive programming platforms
- **Inputs**: Platform URLs, search queries
- **Outputs**: Structured contest data (name, time, duration, platform)
- **Technology**: Puppeteer, Cheerio, Playwright

#### 2. **Note Generation Agent**
- **Purpose**: Generate intelligent notes from contest descriptions and user context
- **Inputs**: Contest details, user history, preferences
- **Outputs**: Markdown-formatted notes with insights
- **Technology**: OpenAI GPT-4, Anthropic Claude, Google Gemini

#### 3. **Scheduling Agent**
- **Purpose**: Manage calendar events and reminder notifications
- **Inputs**: Contest schedules, user timezone, notification preferences
- **Outputs**: Calendar events, email/SMS reminders
- **Technology**: Google Calendar API, Twilio, SendGrid

---

## Agent Architecture Overview

```mermaid
graph TD
    A[User Request] --> B{Agent Orchestrator}
    B --> C[Web Scraping Agent]
    B --> D[Note Generation Agent]
    B --> E[Scheduling Agent]
    
    C --> F[Kontests.net API]
    C --> G[Platform Websites]
    
    D --> H[OpenAI GPT-4]
    D --> I[User Context DB]
    
    E --> J[Google Calendar API]
    E --> K[Notification Service]
    
    C --> L[Contest Database]
    D --> L
    E --> L
    
    L --> M[Backend API]
    M --> N[Frontend App]
```

### Key Components

1. **Agent Orchestrator**: Routes requests to appropriate agents
2. **Agent Workers**: Specialized agents for specific tasks
3. **Context Store**: Maintains conversation history and user preferences
4. **Tool Registry**: Available functions agents can call
5. **Response Formatter**: Structures agent outputs for frontend consumption

---

## Prerequisites

### Technical Requirements

- **Node.js** v18+ and npm/yarn
- **TypeScript** knowledge
- **API Keys**:
  - OpenAI API key (GPT-4)
  - Anthropic API key (Claude 3.5) - optional
  - Google Cloud credentials (Calendar API)
  - Ashna AI account (for platform approach)

### Knowledge Requirements

- REST API design
- Asynchronous JavaScript/TypeScript
- Prompt engineering basics
- Web scraping fundamentals
- OAuth 2.0 flow

---

## Creating AI Agents on Ashna AI Platform

### Approach 1: No-Code Agent Builder (Recommended for Quick Start)

Ashna AI provides a visual agent builder with pre-built integrations.

#### Step 1: Create an Ashna AI Account

1. Visit [https://app.ashna.ai](https://app.ashna.ai)
2. Sign up with email or Google OAuth
3. Verify your email address
4. Complete onboarding wizard

#### Step 2: Create Your First Agent

1. **Navigate to Agent Builder**
   ```
   Dashboard → Agents → Create New Agent
   ```

2. **Configure Agent Basics**
   ```yaml
   Agent Name: Contest Scraper Agent
   Description: Scrapes competitive programming contests from multiple platforms
   Type: Web Scraping Agent
   Model: GPT-4 Turbo
   ```

3. **Define Agent Capabilities**
   
   **System Prompt:**
   ```
   You are a specialized web scraping agent for competitive programming contests.
   
   Your responsibilities:
   1. Fetch contest data from LeetCode, Codeforces, and CodeChef
   2. Parse HTML/JSON responses to extract:
      - Contest name
      - Start time and end time
      - Duration
      - Contest URL
      - Platform name
   3. Convert all times to Indian Standard Time (IST)
   4. Return structured JSON data
   
   Always validate data before returning.
   Handle errors gracefully and provide meaningful error messages.
   ```

4. **Add Tools and Integrations**
   
   Enable these built-in tools:
   - ✅ Web Search
   - ✅ HTTP Requests
   - ✅ JSON Parser
   - ✅ Date/Time Utilities

5. **Configure API Endpoints**
   
   Add custom endpoints:
   ```json
   {
     "endpoints": [
       {
         "name": "kontests_api",
         "url": "https://kontests.net/api/v1/{platform}",
         "method": "GET",
         "headers": {
           "Accept": "application/json"
         }
       },
       {
         "name": "clist_api",
         "url": "https://clist.by/api/v2/contest/",
         "method": "GET",
         "auth": "API_KEY"
       }
     ]
   }
   ```

#### Step 3: Create Note Generation Agent

1. **Create Second Agent**
   ```yaml
   Agent Name: Contest Note Generator
   Description: Generates intelligent notes for competitive programming contests
   Type: Content Generation Agent
   Model: GPT-4 Turbo
   ```

2. **System Prompt:**
   ```
   You are an expert competitive programming coach and note-taking assistant.
   
   When given contest information, generate comprehensive notes including:
   
   1. Contest Overview
      - Platform and contest name
      - Start time, end time, duration
      - Registration deadline (if applicable)
   
   2. Preparation Checklist
      - Topics to review based on contest type
      - Practice problems recommendations
      - Time management strategies
   
   3. Contest Strategy
      - Problem-solving approach
      - Time allocation per problem
      - Common pitfalls to avoid
   
   4. Post-Contest Actions
      - Editorial review plan
      - Upsolving schedule
      - Rating impact analysis
   
   Format all notes in clean Markdown.
   Personalize based on user's skill level and preferences when provided.
   ```

3. **Add Knowledge Base**
   
   Upload reference documents:
   - Competitive programming best practices
   - Platform-specific guidelines
   - Common algorithm templates
   - Time complexity cheat sheets

#### Step 4: Configure Agent Workflows

1. **Create Multi-Agent Workflow**
   
   ```yaml
   Workflow Name: Contest Discovery & Note Creation
   
   Steps:
     1. Trigger: User requests "Find upcoming contests"
     2. Agent 1 (Contest Scraper): Fetch contest data
     3. Filter: Remove past contests, apply user preferences
     4. Agent 2 (Note Generator): Create notes for each contest
     5. Output: Return contests with generated notes
   ```

2. **Set Up Triggers**
   
   - **Scheduled**: Every 6 hours (cron: `0 */6 * * *`)
   - **Webhook**: On-demand via API call
   - **User Action**: When user clicks "Refresh Contests"

#### Step 5: Test Your Agents

1. **Use Built-in Testing Console**
   ```
   Agent Builder → Test Tab → Enter Test Query
   ```

2. **Example Test Queries:**
   ```
   Query 1: "Find all LeetCode contests happening this week"
   Query 2: "Generate notes for the upcoming Codeforces Round 900"
   Query 3: "What contests are scheduled for tomorrow?"
   ```

3. **Review Outputs**
   - Verify data accuracy
   - Check JSON structure
   - Validate time conversions
   - Assess note quality

#### Step 6: Deploy and Get API Keys

1. **Deploy Agent**
   ```
   Agent Builder → Deploy → Production
   ```

2. **Get API Credentials**
   ```
   Settings → API Keys → Generate New Key
   ```
   
   Save these credentials:
   ```bash
   ASHNA_API_KEY=ashna_xxxxxxxxxxxxxxxxx
   ASHNA_AGENT_ID=agent_contest_scraper_xxxxx
   ASHNA_BASE_URL=https://api.ashna.ai/v1
   ```

---

## Building Custom AI Agents from Scratch

### Approach 2: Code-First Implementation

For full control and customization, build agents programmatically.

### Architecture: LangChain + OpenAI

We'll use **LangChain** framework for agent orchestration.

#### Step 1: Project Setup

```bash
# Create agents service directory
mkdir -p backend/src/agents
cd backend/src/agents

# Install dependencies
npm install langchain @langchain/openai @langchain/community
npm install cheerio axios puppeteer date-fns zod
npm install --save-dev @types/cheerio @types/node
```

#### Step 2: Base Agent Configuration

**File: `backend/src/agents/config.ts`**

```typescript
import { ChatOpenAI } from '@langchain/openai';
import { AgentExecutor, createOpenAIFunctionsAgent } from 'langchain/agents';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';

export const LLM_CONFIG = {
  modelName: 'gpt-4-turbo-preview',
  temperature: 0.3,
  maxTokens: 4000,
  timeout: 60000, // 60 seconds
};

export const createLLM = () => {
  return new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    ...LLM_CONFIG,
  });
};

export const createAgentPrompt = (systemMessage: string) => {
  return ChatPromptTemplate.fromMessages([
    ['system', systemMessage],
    ['human', '{input}'],
    new MessagesPlaceholder('agent_scratchpad'),
  ]);
};

export interface AgentContext {
  userId: string;
  timezone: string;
  preferences: {
    platforms: string[];
    notificationTimes: number[];
    skillLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  };
}
```

#### Step 3: Web Scraping Agent

**File: `backend/src/agents/contestScraperAgent.ts`**

```typescript
import { Tool } from '@langchain/core/tools';
import { AgentExecutor, createOpenAIFunctionsAgent } from 'langchain/agents';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { z } from 'zod';
import { createLLM, createAgentPrompt, AgentContext } from './config';
import { logger } from '../utils/logger';
import { zonedTimeToUtc, utcToZonedTime, format } from 'date-fns-tz';

// Validation schema
const ContestSchema = z.object({
  name: z.string(),
  platform: z.enum(['leetcode', 'codeforces', 'codechef']),
  url: z.string().url(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  duration: z.string(),
  status: z.enum(['upcoming', 'running', 'ended']),
});

type Contest = z.infer<typeof ContestSchema>;

// Tool 1: Fetch from Kontests.net API
class KontestsAPITool extends Tool {
  name = 'fetch_kontests_api';
  description = `Fetches contest data from Kontests.net API for a specific platform.
  Input should be a platform name: 'leetcode', 'codeforces', or 'codechef'.
  Returns JSON array of contests.`;

  async _call(platform: string): Promise<string> {
    try {
      const response = await axios.get(
        `https://kontests.net/api/v1/${platform.toLowerCase()}`,
        { timeout: 10000 }
      );

      const contests = response.data.map((contest: any) => ({
        name: contest.name,
        platform: platform.toLowerCase(),
        url: contest.url,
        startTime: contest.start_time,
        endTime: contest.end_time,
        duration: contest.duration,
        status: contest.status || 'upcoming',
      }));

      return JSON.stringify(contests);
    } catch (error) {
      logger.error(`Error fetching from Kontests API for ${platform}:`, error);
      return JSON.stringify({ error: `Failed to fetch ${platform} contests` });
    }
  }
}

// Tool 2: Convert timezone
class TimezoneConverterTool extends Tool {
  name = 'convert_timezone';
  description = `Converts a datetime string from UTC to a specified timezone.
  Input should be a JSON object: {"datetime": "ISO string", "timezone": "Asia/Kolkata"}.
  Returns the converted datetime in ISO format.`;

  async _call(input: string): Promise<string> {
    try {
      const { datetime, timezone } = JSON.parse(input);
      const utcDate = new Date(datetime);
      const zonedDate = utcToZonedTime(utcDate, timezone);
      const formatted = format(zonedDate, "yyyy-MM-dd'T'HH:mm:ssXXX", { timeZone: timezone });
      return formatted;
    } catch (error) {
      logger.error('Timezone conversion error:', error);
      return 'Error: Invalid datetime or timezone';
    }
  }
}

// Tool 3: Filter contests
class ContestFilterTool extends Tool {
  name = 'filter_contests';
  description = `Filters contests based on criteria.
  Input should be JSON: {"contests": [...], "filters": {"platform": [], "startAfter": "date", "startBefore": "date"}}.
  Returns filtered contest array.`;

  async _call(input: string): Promise<string> {
    try {
      const { contests, filters } = JSON.parse(input);
      
      let filtered = contests;

      if (filters.platform && filters.platform.length > 0) {
        filtered = filtered.filter((c: Contest) =>
          filters.platform.includes(c.platform)
        );
      }

      if (filters.startAfter) {
        const afterDate = new Date(filters.startAfter);
        filtered = filtered.filter(
          (c: Contest) => new Date(c.startTime) > afterDate
        );
      }

      if (filters.startBefore) {
        const beforeDate = new Date(filters.startBefore);
        filtered = filtered.filter(
          (c: Contest) => new Date(c.startTime) < beforeDate
        );
      }

      return JSON.stringify(filtered);
    } catch (error) {
      logger.error('Contest filtering error:', error);
      return JSON.stringify([]);
    }
  }
}

// Contest Scraper Agent
export class ContestScraperAgent {
  private executor: AgentExecutor;

  constructor() {
    const llm = createLLM();
    
    const tools = [
      new KontestsAPITool(),
      new TimezoneConverterTool(),
      new ContestFilterTool(),
    ];

    const systemMessage = `You are a specialized contest scraping agent for competitive programming platforms.
    
    Your capabilities:
    - Fetch contest data from LeetCode, Codeforces, and CodeChef using the Kontests.net API
    - Convert times to user's timezone (default: Asia/Kolkata for IST)
    - Filter contests based on user preferences
    - Validate and structure data correctly
    
    Always:
    1. Use the fetch_kontests_api tool for each requested platform
    2. Convert all times to the user's timezone
    3. Filter based on user preferences
    4. Return clean, validated JSON
    
    Handle errors gracefully and provide informative messages.`;

    const prompt = createAgentPrompt(systemMessage);

    const agent = createOpenAIFunctionsAgent({
      llm,
      tools,
      prompt,
    });

    this.executor = new AgentExecutor({
      agent,
      tools,
      verbose: process.env.NODE_ENV === 'development',
      maxIterations: 5,
    });
  }

  async scrapeContests(
    context: AgentContext
  ): Promise<{ contests: Contest[]; message: string }> {
    try {
      const input = `
        Fetch upcoming contests for these platforms: ${context.preferences.platforms.join(', ')}.
        Convert all times to ${context.timezone} timezone.
        Only include contests starting after now.
        Return the results as a JSON array.
      `;

      const result = await this.executor.invoke({
        input,
      });

      const contests = JSON.parse(result.output);
      
      // Validate each contest
      const validatedContests = contests
        .map((c: any) => {
          try {
            return ContestSchema.parse(c);
          } catch {
            return null;
          }
        })
        .filter((c: Contest | null) => c !== null);

      return {
        contests: validatedContests,
        message: `Successfully fetched ${validatedContests.length} contests`,
      };
    } catch (error) {
      logger.error('Contest scraping error:', error);
      throw new Error('Failed to scrape contests');
    }
  }
}
```

#### Step 4: Note Generation Agent

**File: `backend/src/agents/noteGeneratorAgent.ts`**

```typescript
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { createLLM, AgentContext } from './config';
import { logger } from '../utils/logger';
import { format } from 'date-fns';

interface Contest {
  name: string;
  platform: string;
  url: string;
  startTime: string;
  endTime: string;
  duration: string;
}

export class NoteGeneratorAgent {
  private llm: ChatOpenAI;
  private parser: StringOutputParser;

  constructor() {
    this.llm = createLLM();
    this.parser = new StringOutputParser();
  }

  async generateNote(
    contest: Contest,
    context: AgentContext
  ): Promise<string> {
    try {
      const skillLevel = context.preferences.skillLevel || 'intermediate';
      
      const systemPrompt = `You are an expert competitive programming coach.
      Generate comprehensive, actionable notes for upcoming contests.
      
      User Profile:
      - Skill Level: ${skillLevel}
      - Timezone: ${context.timezone}
      - Preferred Platforms: ${context.preferences.platforms.join(', ')}
      
      Format notes in clean Markdown with:
      1. Contest Overview
      2. Preparation Checklist
      3. Contest Strategy
      4. Post-Contest Plan
      
      Tailor advice to ${skillLevel} level competitors.
      Be specific, practical, and motivating.`;

      const contestInfo = `
Contest Details:
- Name: ${contest.name}
- Platform: ${contest.platform.toUpperCase()}
- Start Time: ${format(new Date(contest.startTime), 'PPpp')}
- Duration: ${contest.duration}
- URL: ${contest.url}
      `;

      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(`Generate notes for this contest:\n${contestInfo}`),
      ];

      const response = await this.llm.invoke(messages);
      const note = await this.parser.invoke(response);

      return note;
    } catch (error) {
      logger.error('Note generation error:', error);
      throw new Error('Failed to generate note');
    }
  }

  async generateBulkNotes(
    contests: Contest[],
    context: AgentContext
  ): Promise<Map<string, string>> {
    const notes = new Map<string, string>();

    // Generate notes in parallel (limit concurrency)
    const batchSize = 3;
    for (let i = 0; i < contests.length; i += batchSize) {
      const batch = contests.slice(i, i + batchSize);
      const promises = batch.map(async (contest) => {
        try {
          const note = await this.generateNote(contest, context);
          return { contestId: contest.url, note };
        } catch (error) {
          logger.error(`Failed to generate note for ${contest.name}:`, error);
          return null;
        }
      });

      const results = await Promise.all(promises);
      results.forEach((result) => {
        if (result) {
          notes.set(result.contestId, result.note);
        }
      });
    }

    return notes;
  }

  async enhanceExistingNote(
    existingNote: string,
    additionalContext: string
  ): Promise<string> {
    try {
      const systemPrompt = `You are enhancing an existing contest note.
      Add new insights while preserving the original structure.
      Merge new information seamlessly.`;

      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(`
Existing Note:
${existingNote}

Additional Context:
${additionalContext}

Enhance the note with this new information.`),
      ];

      const response = await this.llm.invoke(messages);
      const enhancedNote = await this.parser.invoke(response);

      return enhancedNote;
    } catch (error) {
      logger.error('Note enhancement error:', error);
      throw new Error('Failed to enhance note');
    }
  }
}
```

#### Step 5: Agent Orchestrator

**File: `backend/src/agents/orchestrator.ts`**

```typescript
import { ContestScraperAgent } from './contestScraperAgent';
import { NoteGeneratorAgent } from './noteGeneratorAgent';
import { AgentContext } from './config';
import { logger } from '../utils/logger';
import { Contest } from '../models/Contest';
import { Note } from '../models/Note';

export interface AgentRequest {
  type: 'scrape_contests' | 'generate_notes' | 'full_pipeline';
  context: AgentContext;
  params?: {
    contestIds?: string[];
    forceRefresh?: boolean;
  };
}

export interface AgentResponse {
  success: boolean;
  data?: any;
  message: string;
  executionTime: number;
}

export class AgentOrchestrator {
  private scraperAgent: ContestScraperAgent;
  private noteAgent: NoteGeneratorAgent;

  constructor() {
    this.scraperAgent = new ContestScraperAgent();
    this.noteAgent = new NoteGeneratorAgent();
  }

  async execute(request: AgentRequest): Promise<AgentResponse> {
    const startTime = Date.now();

    try {
      switch (request.type) {
        case 'scrape_contests':
          return await this.handleScrapeContests(request, startTime);
        
        case 'generate_notes':
          return await this.handleGenerateNotes(request, startTime);
        
        case 'full_pipeline':
          return await this.handleFullPipeline(request, startTime);
        
        default:
          throw new Error(`Unknown request type: ${request.type}`);
      }
    } catch (error) {
      logger.error('Agent orchestrator error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
      };
    }
  }

  private async handleScrapeContests(
    request: AgentRequest,
    startTime: number
  ): Promise<AgentResponse> {
    const result = await this.scraperAgent.scrapeContests(request.context);

    // Save to database
    for (const contest of result.contests) {
      await Contest.findOneAndUpdate(
        { url: contest.url },
        { ...contest, userId: request.context.userId },
        { upsert: true, new: true }
      );
    }

    return {
      success: true,
      data: result.contests,
      message: result.message,
      executionTime: Date.now() - startTime,
    };
  }

  private async handleGenerateNotes(
    request: AgentRequest,
    startTime: number
  ): Promise<AgentResponse> {
    const contestIds = request.params?.contestIds || [];
    
    // Fetch contests from database
    const contests = await Contest.find({
      _id: { $in: contestIds },
      userId: request.context.userId,
    });

    const notes = await this.noteAgent.generateBulkNotes(
      contests as any[],
      request.context
    );

    // Save notes to database
    const savedNotes = [];
    for (const [contestUrl, noteContent] of notes.entries()) {
      const contest = contests.find((c) => c.url === contestUrl);
      if (contest) {
        const note = await Note.create({
          contestId: contest._id,
          userId: request.context.userId,
          content: noteContent,
        });
        savedNotes.push(note);
      }
    }

    return {
      success: true,
      data: savedNotes,
      message: `Generated ${savedNotes.length} notes`,
      executionTime: Date.now() - startTime,
    };
  }

  private async handleFullPipeline(
    request: AgentRequest,
    startTime: number
  ): Promise<AgentResponse> {
    // Step 1: Scrape contests
    logger.info('Step 1: Scraping contests...');
    const scrapeResult = await this.scraperAgent.scrapeContests(request.context);

    // Step 2: Save contests to database
    const savedContests = [];
    for (const contest of scrapeResult.contests) {
      const saved = await Contest.findOneAndUpdate(
        { url: contest.url },
        { ...contest, userId: request.context.userId },
        { upsert: true, new: true }
      );
      savedContests.push(saved);
    }

    // Step 3: Generate notes for new contests
    logger.info('Step 2: Generating notes...');
    const notes = await this.noteAgent.generateBulkNotes(
      savedContests as any[],
      request.context
    );

    // Step 4: Save notes
    const savedNotes = [];
    for (const [contestUrl, noteContent] of notes.entries()) {
      const contest = savedContests.find((c) => c.url === contestUrl);
      if (contest) {
        const note = await Note.create({
          contestId: contest._id,
          userId: request.context.userId,
          content: noteContent,
        });
        savedNotes.push(note);
      }
    }

    return {
      success: true,
      data: {
        contests: savedContests,
        notes: savedNotes,
      },
      message: `Processed ${savedContests.length} contests and generated ${savedNotes.length} notes`,
      executionTime: Date.now() - startTime,
    };
  }
}
```

---

## Agent Integration with Your Application

### Backend API Endpoints

**File: `backend/src/routes/agents.ts`**

```typescript
import express from 'express';
import { AgentOrchestrator } from '../agents/orchestrator';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();
const orchestrator = new AgentOrchestrator();

// Scrape contests endpoint
router.post('/scrape-contests', authenticate, async (req, res) => {
  try {
    const context = {
      userId: req.user.id,
      timezone: req.body.timezone || 'Asia/Kolkata',
      preferences: {
        platforms: req.body.platforms || ['leetcode', 'codeforces', 'codechef'],
        notificationTimes: req.body.notificationTimes || [15, 60],
        skillLevel: req.user.skillLevel || 'intermediate',
      },
    };

    const result = await orchestrator.execute({
      type: 'scrape_contests',
      context,
    });

    res.json(result);
  } catch (error) {
    logger.error('Scrape contests endpoint error:', error);
    res.status(500).json({ error: 'Failed to scrape contests' });
  }
});

// Generate notes endpoint
router.post('/generate-notes', authenticate, async (req, res) => {
  try {
    const { contestIds } = req.body;

    if (!contestIds || !Array.isArray(contestIds)) {
      return res.status(400).json({ error: 'contestIds array is required' });
    }

    const context = {
      userId: req.user.id,
      timezone: req.user.timezone || 'Asia/Kolkata',
      preferences: {
        platforms: req.user.preferences?.platforms || ['leetcode', 'codeforces', 'codechef'],
        notificationTimes: req.user.preferences?.notificationTimes || [15, 60],
        skillLevel: req.user.skillLevel || 'intermediate',
      },
    };

    const result = await orchestrator.execute({
      type: 'generate_notes',
      context,
      params: { contestIds },
    });

    res.json(result);
  } catch (error) {
    logger.error('Generate notes endpoint error:', error);
    res.status(500).json({ error: 'Failed to generate notes' });
  }
});

// Full pipeline endpoint (scrape + generate)
router.post('/full-pipeline', authenticate, async (req, res) => {
  try {
    const context = {
      userId: req.user.id,
      timezone: req.body.timezone || req.user.timezone || 'Asia/Kolkata',
      preferences: {
        platforms: req.body.platforms || req.user.preferences?.platforms || ['leetcode', 'codeforces', 'codechef'],
        notificationTimes: req.body.notificationTimes || req.user.preferences?.notificationTimes || [15, 60],
        skillLevel: req.user.skillLevel || 'intermediate',
      },
    };

    const result = await orchestrator.execute({
      type: 'full_pipeline',
      context,
    });

    res.json(result);
  } catch (error) {
    logger.error('Full pipeline endpoint error:', error);
    res.status(500).json({ error: 'Failed to execute pipeline' });
  }
});

export default router;
```

### Frontend Integration

**File: `frontend/src/api/agents.ts`**

```typescript
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export interface ScrapeContestsRequest {
  platforms?: string[];
  timezone?: string;
  notificationTimes?: number[];
}

export interface GenerateNotesRequest {
  contestIds: string[];
}

export const agentAPI = {
  // Scrape contests using AI agent
  scrapeContests: async (params?: ScrapeContestsRequest) => {
    const response = await axios.post(`${API_BASE}/agents/scrape-contests`, params || {});
    return response.data;
  },

  // Generate notes for specific contests
  generateNotes: async (contestIds: string[]) => {
    const response = await axios.post(`${API_BASE}/agents/generate-notes`, { contestIds });
    return response.data;
  },

  // Run full pipeline (scrape + generate)
  runFullPipeline: async (params?: ScrapeContestsRequest) => {
    const response = await axios.post(`${API_BASE}/agents/full-pipeline`, params || {});
    return response.data;
  },
};
```

**Usage in React Component:**

```typescript
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { agentAPI } from '../api/agents';
import { toast } from 'react-hot-toast';

const ContestRefreshButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  const runPipelineMutation = useMutation({
    mutationFn: agentAPI.runFullPipeline,
    onSuccess: (data) => {
      toast.success(
        `${data.data.contests.length} contests found, ${data.data.notes.length} notes generated!`
      );
    },
    onError: () => {
      toast.error('Failed to refresh contests');
    },
  });

  return (
    <button
      onClick={() => runPipelineMutation.mutate()}
      disabled={runPipelineMutation.isPending}
      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
    >
      {runPipelineMutation.isPending ? 'Processing...' : 'Refresh with AI'}
    </button>
  );
};
```

---

## Implementation Examples

### Example 1: Using Ashna AI Platform Agent

**Backend Integration:**

```typescript
import axios from 'axios';

const ASHNA_API_KEY = process.env.ASHNA_API_KEY;
const ASHNA_AGENT_ID = process.env.ASHNA_AGENT_ID;

export async function callAshnaAgent(query: string, context: any) {
  try {
    const response = await axios.post(
      'https://api.ashna.ai/v1/agent/invoke',
      {
        agentId: ASHNA_AGENT_ID,
        query: query,
        context: context,
        stream: false,
      },
      {
        headers: {
          'Authorization': `Bearer ${ASHNA_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Ashna AI API error:', error);
    throw error;
  }
}

// Usage
const result = await callAshnaAgent(
  'Find all upcoming LeetCode contests',
  {
    userId: '12345',
    timezone: 'Asia/Kolkata',
    platforms: ['leetcode'],
  }
);
```

### Example 2: Custom LangChain Agent with Memory

**Conversational Agent with History:**

```typescript
import { BufferMemory } from 'langchain/memory';
import { ConversationChain } from 'langchain/chains';
import { ChatOpenAI } from '@langchain/openai';

export class ConversationalNoteAgent {
  private chain: ConversationChain;
  private memory: BufferMemory;

  constructor() {
    this.memory = new BufferMemory({
      returnMessages: true,
      memoryKey: 'chat_history',
    });

    const llm = new ChatOpenAI({
      modelName: 'gpt-4-turbo-preview',
      temperature: 0.7,
    });

    this.chain = new ConversationChain({
      llm,
      memory: this.memory,
    });
  }

  async chat(message: string): Promise<string> {
    const response = await this.chain.call({ input: message });
    return response.response;
  }

  async generateInteractiveNote(contestName: string): Promise<string> {
    await this.chat(
      `I want to create notes for the ${contestName} contest. Ask me questions to personalize the notes.`
    );

    // Continue conversation...
    const skillLevelResponse = await this.chat('What is your skill level?');
    // Process responses and generate final note

    return skillLevelResponse;
  }
}
```

### Example 3: Multi-Agent Collaboration

**Coordinated Scraping and Note Generation:**

```typescript
import { AgentExecutor } from 'langchain/agents';
import { ChatOpenAI } from '@langchain/openai';

export class MultiAgentSystem {
  private scraperAgent: ContestScraperAgent;
  private noteAgent: NoteGeneratorAgent;
  private coordinator: ChatOpenAI;

  constructor() {
    this.scraperAgent = new ContestScraperAgent();
    this.noteAgent = new NoteGeneratorAgent();
    this.coordinator = new ChatOpenAI({
      modelName: 'gpt-4-turbo-preview',
      temperature: 0,
    });
  }

  async execute(userQuery: string, context: AgentContext) {
    // Coordinator decides which agents to invoke
    const plan = await this.createExecutionPlan(userQuery);

    const results = [];

    for (const step of plan.steps) {
      if (step.agent === 'scraper') {
        const contests = await this.scraperAgent.scrapeContests(context);
        results.push({ step: step.name, data: contests });
      } else if (step.agent === 'note_generator') {
        const notes = await this.noteAgent.generateBulkNotes(
          results[results.length - 1].data.contests,
          context
        );
        results.push({ step: step.name, data: notes });
      }
    }

    return results;
  }

  private async createExecutionPlan(query: string) {
    // Use LLM to create execution plan
    const prompt = `Given this user query: "${query}"
    Create an execution plan with steps.
    Available agents: scraper, note_generator
    Return JSON format.`;

    // Implementation...
    return {
      steps: [
        { name: 'Scrape contests', agent: 'scraper' },
        { name: 'Generate notes', agent: 'note_generator' },
      ],
    };
  }
}
```

---

## Security and Best Practices

### 1. API Key Management

```bash
# .env file
OPENAI_API_KEY=sk-...
ASHNA_API_KEY=ashna_...
ASHNA_AGENT_ID=agent_...

# Never commit .env to version control
# Use environment variables in production
```

### 2. Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const agentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each user to 10 agent requests per window
  message: 'Too many agent requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

router.use('/agents', agentLimiter);
```

### 3. Input Validation

```typescript
import { z } from 'zod';

const ScrapeRequestSchema = z.object({
  platforms: z.array(z.enum(['leetcode', 'codeforces', 'codechef'])).optional(),
  timezone: z.string().optional(),
  notificationTimes: z.array(z.number()).optional(),
});

router.post('/scrape-contests', async (req, res) => {
  try {
    const validated = ScrapeRequestSchema.parse(req.body);
    // Proceed with validated data
  } catch (error) {
    return res.status(400).json({ error: 'Invalid request data' });
  }
});
```

### 4. Error Handling

```typescript
class AgentError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'AgentError';
  }
}

// Usage
try {
  await agent.execute();
} catch (error) {
  if (error instanceof AgentError) {
    logger.error(`Agent error [${error.code}]: ${error.message}`);
    
    if (error.retryable) {
      // Implement retry logic
      await retryWithBackoff(() => agent.execute());
    }
  }
}
```

### 5. Cost Monitoring

```typescript
import { encodingForModel } from 'js-tiktoken';

class TokenCounter {
  private encoder = encodingForModel('gpt-4');

  countTokens(text: string): number {
    return this.encoder.encode(text).length;
  }

  estimateCost(inputTokens: number, outputTokens: number): number {
    const INPUT_COST_PER_1K = 0.03; // GPT-4 Turbo
    const OUTPUT_COST_PER_1K = 0.06;

    return (
      (inputTokens / 1000) * INPUT_COST_PER_1K +
      (outputTokens / 1000) * OUTPUT_COST_PER_1K
    );
  }
}

// Log costs
const counter = new TokenCounter();
const inputTokens = counter.countTokens(prompt);
const outputTokens = counter.countTokens(response);
const cost = counter.estimateCost(inputTokens, outputTokens);

logger.info(`Agent call cost: $${cost.toFixed(4)}`);
```

---

## Testing and Deployment

### Unit Tests

**File: `backend/src/agents/__tests__/contestScraperAgent.test.ts`**

```typescript
import { ContestScraperAgent } from '../contestScraperAgent';
import { AgentContext } from '../config';

describe('ContestScraperAgent', () => {
  let agent: ContestScraperAgent;
  let mockContext: AgentContext;

  beforeEach(() => {
    agent = new ContestScraperAgent();
    mockContext = {
      userId: 'test-user-123',
      timezone: 'Asia/Kolkata',
      preferences: {
        platforms: ['leetcode'],
        notificationTimes: [15, 60],
      },
    };
  });

  it('should scrape contests successfully', async () => {
    const result = await agent.scrapeContests(mockContext);

    expect(result.contests).toBeInstanceOf(Array);
    expect(result.message).toContain('Successfully fetched');
  });

  it('should filter contests by platform', async () => {
    const result = await agent.scrapeContests(mockContext);

    result.contests.forEach((contest) => {
      expect(['leetcode']).toContain(contest.platform);
    });
  });

  it('should handle API errors gracefully', async () => {
    // Mock API failure
    jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));

    await expect(agent.scrapeContests(mockContext)).rejects.toThrow();
  });
});
```

### Integration Tests

```typescript
import request from 'supertest';
import app from '../app';

describe('Agent API Endpoints', () => {
  let authToken: string;

  beforeAll(async () => {
    // Get auth token
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password' });
    
    authToken = response.body.token;
  });

  it('POST /api/agents/scrape-contests', async () => {
    const response = await request(app)
      .post('/api/agents/scrape-contests')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ platforms: ['leetcode'] });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeInstanceOf(Array);
  });

  it('POST /api/agents/full-pipeline', async () => {
    const response = await request(app)
      .post('/api/agents/full-pipeline')
      .set('Authorization', `Bearer ${authToken}`)
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.data.contests).toBeInstanceOf(Array);
    expect(response.body.data.notes).toBeInstanceOf(Array);
  });
});
```

### Deployment Checklist

```markdown
## Pre-Deployment

- [ ] Environment variables configured
- [ ] API keys secured in vault/secrets manager
- [ ] Rate limiting enabled
- [ ] Error tracking configured (Sentry/DataDog)
- [ ] Logging configured (Winston/Pino)
- [ ] Database indexes created
- [ ] CORS configured properly

## Production Environment

- [ ] Use production OpenAI API key
- [ ] Enable request/response caching
- [ ] Set up monitoring dashboards
- [ ] Configure auto-scaling
- [ ] Enable backup/disaster recovery
- [ ] Document runbooks for common issues

## Post-Deployment

- [ ] Monitor error rates
- [ ] Track API costs
- [ ] Review agent performance metrics
- [ ] Collect user feedback
- [ ] Optimize slow queries
```

---

## Monitoring and Maintenance

### Metrics to Track

```typescript
import prometheus from 'prom-client';

const agentRequestDuration = new prometheus.Histogram({
  name: 'agent_request_duration_seconds',
  help: 'Duration of agent requests',
  labelNames: ['agent_type', 'status'],
});

const agentRequestCount = new prometheus.Counter({
  name: 'agent_request_count',
  help: 'Total number of agent requests',
  labelNames: ['agent_type', 'status'],
});

const agentCostGauge = new prometheus.Gauge({
  name: 'agent_cost_usd',
  help: 'Estimated cost of agent operations in USD',
  labelNames: ['agent_type'],
});

// Usage
const timer = agentRequestDuration.startTimer();
try {
  const result = await agent.execute();
  timer({ agent_type: 'scraper', status: 'success' });
  agentRequestCount.inc({ agent_type: 'scraper', status: 'success' });
} catch (error) {
  timer({ agent_type: 'scraper', status: 'error' });
  agentRequestCount.inc({ agent_type: 'scraper', status: 'error' });
}
```

### Logging Best Practices

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'agent-service' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Structured logging
logger.info('Agent request started', {
  agentType: 'scraper',
  userId: context.userId,
  platforms: context.preferences.platforms,
  timestamp: new Date().toISOString(),
});
```

### Performance Optimization

```typescript
// 1. Caching
import NodeCache from 'node-cache';

const contestCache = new NodeCache({ stdTTL: 3600 }); // 1 hour TTL

export async function getCachedContests(platform: string) {
  const cacheKey = `contests:${platform}`;
  
  const cached = contestCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const contests = await scrapeContests(platform);
  contestCache.set(cacheKey, contests);
  
  return contests;
}

// 2. Parallel Processing
import pMap from 'p-map';

const platforms = ['leetcode', 'codeforces', 'codechef'];
const contests = await pMap(
  platforms,
  async (platform) => await scrapeContests(platform),
  { concurrency: 3 }
);

// 3. Streaming Responses
import { StreamingTextResponse } from 'ai';

router.post('/generate-note-stream', async (req, res) => {
  const stream = await noteAgent.generateNoteStream(contest, context);
  return new StreamingTextResponse(stream);
});
```

---

## Troubleshooting Guide

### Common Issues

#### Issue 1: Agent Timeout

**Symptoms:**
```
Error: Agent execution timeout after 60000ms
```

**Solutions:**
1. Increase timeout in agent config
2. Optimize tool execution time
3. Break down complex tasks into smaller steps
4. Use async/streaming for long-running operations

```typescript
const executor = new AgentExecutor({
  agent,
  tools,
  maxIterations: 10,
  timeout: 120000, // Increase to 2 minutes
});
```

#### Issue 2: Rate Limit Exceeded

**Symptoms:**
```
Error: Rate limit exceeded for OpenAI API
```

**Solutions:**
1. Implement exponential backoff
2. Use caching for repeated queries
3. Upgrade OpenAI tier
4. Batch requests where possible

```typescript
import { retry } from '@lifeomic/attempt';

const result = await retry(
  async () => await llm.invoke(messages),
  {
    maxAttempts: 3,
    delay: 1000,
    factor: 2,
    handleError: (error, context) => {
      if (error.status === 429) {
        logger.warn(`Rate limited, attempt ${context.attemptNum}`);
      } else {
        throw error;
      }
    },
  }
);
```

#### Issue 3: Invalid Tool Outputs

**Symptoms:**
```
Error: Tool output validation failed
```

**Solutions:**
1. Add robust input validation to tools
2. Improve tool descriptions
3. Add examples in tool prompts
4. Use structured output parsing

```typescript
import { z } from 'zod';
import { StructuredOutputParser } from 'langchain/output_parsers';

const parser = StructuredOutputParser.fromZodSchema(
  z.object({
    contests: z.array(ContestSchema),
  })
);

const formatInstructions = parser.getFormatInstructions();
// Include formatInstructions in prompt
```

#### Issue 4: Memory Leaks

**Symptoms:**
```
Node process memory continuously increasing
```

**Solutions:**
1. Clear agent memory after each session
2. Limit conversation history size
3. Use streaming for large responses
4. Monitor memory usage

```typescript
// Clear memory periodically
setInterval(() => {
  memory.clear();
}, 3600000); // Every hour

// Or use sliding window
const memory = new BufferWindowMemory({
  k: 10, // Keep last 10 messages
});
```

---

## Appendix

### A. Environment Variables Template

```bash
# .env.example

# OpenAI Configuration
OPENAI_API_KEY=sk-...
OPENAI_ORG_ID=org-...
OPENAI_MODEL=gpt-4-turbo-preview

# Anthropic Configuration (Optional)
ANTHROPIC_API_KEY=sk-ant-...

# Ashna AI Platform (If using)
ASHNA_API_KEY=ashna_...
ASHNA_AGENT_ID=agent_...
ASHNA_BASE_URL=https://api.ashna.ai/v1

# Application
NODE_ENV=production
LOG_LEVEL=info

# Database
MONGODB_URI=mongodb://localhost:27017/cp_calendar

# Redis (for caching)
REDIS_URL=redis://localhost:6379

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=10

# Monitoring
SENTRY_DSN=https://...
PROMETHEUS_PORT=9090
```

### B. Prompt Templates Library

```typescript
export const PROMPT_TEMPLATES = {
  CONTEST_SCRAPER: `You are a specialized contest scraping agent...
  [Full template from earlier]
  `,

  NOTE_GENERATOR: `You are an expert competitive programming coach...
  [Full template from earlier]
  `,

  PERSONALIZED_NOTE: `Generate a personalized contest note for:
  - User: {{userName}}
  - Skill Level: {{skillLevel}}
  - Recent Performance: {{recentPerformance}}
  - Weak Topics: {{weakTopics}}
  
  Contest: {{contestName}}
  Focus on addressing the user's weak areas and building confidence.
  `,

  PROBLEM_RECOMMENDATIONS: `Based on the contest {{contestName}}, recommend:
  1. 5 practice problems to solve before the contest
  2. Topics to review
  3. Time management strategy
  
  User level: {{skillLevel}}
  Available time: {{hoursUntilContest}} hours
  `,
};
```

### C. Tool Registry

```typescript
export const AVAILABLE_TOOLS = {
  'fetch_kontests_api': KontestsAPITool,
  'convert_timezone': TimezoneConverterTool,
  'filter_contests': ContestFilterTool,
  'web_scraper': WebScraperTool,
  'calendar_sync': CalendarSyncTool,
  'send_notification': NotificationTool,
};

export function registerTool(name: string, tool: Tool) {
  AVAILABLE_TOOLS[name] = tool;
}
```

### D. Useful Resources

- **LangChain Documentation**: https://js.langchain.com/docs/
- **OpenAI API Reference**: https://platform.openai.com/docs/api-reference
- **Ashna AI Platform Docs**: https://docs.ashna.ai
- **Kontests.net API**: https://kontests.net/api
- **Clist.by API**: https://clist.by/api/v2/doc/

---

## Conclusion

You now have a comprehensive guide to creating AI agents for your Competitive Programming Calendar application. 

**Key Takeaways:**

1. **Two Approaches**: Use Ashna AI Platform for quick setup, or build custom agents for full control
2. **Modular Design**: Separate scraping, note generation, and orchestration concerns
3. **Production-Ready**: Implement proper error handling, monitoring, and security
4. **Scalable**: Design for growth with caching, rate limiting, and optimization

**Next Steps:**

1. Choose your agent approach (Ashna AI or custom)
2. Set up development environment
3. Implement basic scraping agent
4. Add note generation capabilities
5. Integrate with your application
6. Test thoroughly
7. Deploy to production
8. Monitor and iterate

Good luck building your intelligent competitive programming assistant! 🚀

---

**Document Version:** 1.0  
**Last Updated:** July 5, 2026  
**Author:** Max Effort Reasoning Engine
