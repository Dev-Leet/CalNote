# Revised Application Architecture: Web Scraping + AI Notes & Calendar Agent

**Version:** 2.0  
**Date:** July 8, 2026  
**Major Changes:**
- ✅ Removed AI agent for contest fetching (pure web scraping)
- ✅ Enhanced AI Notes Agent with timestamped notes
- ✅ Added AI Calendar Agent for event creation
- ✅ Google Calendar integration for notes and events

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Contest Scraping System (No AI)](#contest-scraping-system-no-ai)
3. [AI Notes Agent (Enhanced)](#ai-notes-agent-enhanced)
4. [AI Calendar Agent (New)](#ai-calendar-agent-new)
5. [Google Calendar Integration](#google-calendar-integration)
6. [Complete Implementation](#complete-implementation)
7. [API Specifications](#api-specifications)
8. [Database Schema Updates](#database-schema-updates)
9. [Frontend Implementation](#frontend-implementation)
10. [Testing & Deployment](#testing--deployment)

---

## Architecture Overview

### System Components

```mermaid
graph TD
    A[User] --> B[Frontend React App]
    
    B --> C[Backend API]
    
    C --> D[Contest Scraper Service]
    C --> E[AI Notes Agent]
    C --> F[AI Calendar Agent]
    C --> G[Google Calendar API]
    
    D --> H[LeetCode Direct Scraping]
    D --> I[Codeforces API]
    D --> J[CodeChef API]
    
    E --> K[OpenAI GPT-4]
    E --> L[Notes Database]
    
    F --> K
    F --> G
    F --> M[Events Database]
    
    H --> N[Contest Database]
    I --> N
    J --> N
    
    G --> O[User's Google Calendar]
```

### Key Changes from v1.0

| Component | v1.0 (Old) | v2.0 (New) |
|-----------|-----------|------------|
| **Contest Fetching** | AI Agent with web search | Pure direct web scraping |
| **Notes** | Simple AI note generation | Timestamped notes with AI |
| **Calendar Events** | Manual creation | AI-powered event creation |
| **Google Calendar** | One-way sync (contests) | Two-way (contests + notes + custom events) |

---

## Contest Scraping System (No AI)

### Pure Web Scraping Architecture

**No LLMs involved** - Direct API calls and HTML parsing only.

#### Implementation

**File: `backend/src/services/contestScrapingService.ts`**

```typescript
import axios from 'axios';
import { logger } from '../utils/logger';
import { Contest } from '../models/Contest';
import { GoogleCalendarService } from './googleCalendarService';

interface ScrapedContest {
  name: string;
  platform: 'leetcode' | 'codeforces' | 'codechef';
  url: string;
  startTime: string;
  endTime: string;
  duration: string;
}

export class ContestScrapingService {
  private googleCalendarService: GoogleCalendarService;

  constructor() {
    this.googleCalendarService = new GoogleCalendarService();
  }

  /**
   * Scrape LeetCode contests via GraphQL
   */
  async scrapeLeetCode(): Promise<ScrapedContest[]> {
    try {
      const response = await axios.post(
        'https://leetcode.com/graphql',
        {
          query: `
            query contestList {
              allContests {
                title
                titleSlug
                startTime
                duration
                isVirtual
              }
            }
          `,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          },
        }
      );

      const contests = response.data.data.allContests
        .filter((c: any) => !c.isVirtual && c.startTime * 1000 > Date.now())
        .map((c: any) => {
          const startTime = new Date(c.startTime * 1000);
          const endTime = new Date(startTime.getTime() + c.duration * 1000);

          return {
            name: c.title,
            platform: 'leetcode' as const,
            url: `https://leetcode.com/contest/${c.titleSlug}`,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            duration: `${Math.floor(c.duration / 60)} minutes`,
          };
        });

      return contests;
    } catch (error) {
      logger.error('LeetCode scraping error:', error);
      return [];
    }
  }

  /**
   * Scrape Codeforces contests via official API
   */
  async scrapeCodeforces(): Promise<ScrapedContest[]> {
    try {
      const response = await axios.get(
        'https://codeforces.com/api/contest.list',
        {
          params: { gym: false },
        }
      );

      if (response.data.status !== 'OK') {
        throw new Error('Codeforces API error');
      }

      const contests = response.data.result
        .filter((c: any) => c.phase === 'BEFORE')
        .map((c: any) => {
          const startTime = new Date(c.startTimeSeconds * 1000);
          const endTime = new Date(
            startTime.getTime() + c.durationSeconds * 1000
          );

          return {
            name: c.name,
            platform: 'codeforces' as const,
            url: `https://codeforces.com/contest/${c.id}`,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            duration: `${Math.floor(c.durationSeconds / 3600)} hours`,
          };
        });

      return contests;
    } catch (error) {
      logger.error('Codeforces scraping error:', error);
      return [];
    }
  }

  /**
   * Scrape CodeChef contests via internal API
   */
  async scrapeCodeChef(): Promise<ScrapedContest[]> {
    try {
      const response = await axios.get(
        'https://www.codechef.com/api/list/contests/all',
        {
          params: {
            sort_by: 'START',
            sorting_order: 'asc',
          },
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      const futureContests = response.data.future_contests || [];

      const contests = futureContests.map((c: any) => ({
        name: c.contest_name,
        platform: 'codechef' as const,
        url: `https://www.codechef.com/${c.contest_code}`,
        startTime: c.contest_start_date_iso,
        endTime: c.contest_end_date_iso,
        duration: c.contest_duration,
      }));

      return contests;
    } catch (error) {
      logger.error('CodeChef scraping error:', error);
      return [];
    }
  }

  /**
   * Scrape all platforms and save to database + Google Calendar
   */
  async scrapeAndSaveAllContests(userId: string, timezone: string = 'Asia/Kolkata') {
    logger.info('Starting contest scraping for all platforms...');

    const [leetcode, codeforces, codechef] = await Promise.all([
      this.scrapeLeetCode(),
      this.scrapeCodeforces(),
      this.scrapeCodeChef(),
    ]);

    const allContests = [...leetcode, ...codeforces, ...codechef];
    logger.info(`Found ${allContests.length} total contests`);

    const results = {
      saved: 0,
      calendarSynced: 0,
      failed: 0,
    };

    for (const contest of allContests) {
      try {
        // Save to database
        const saved = await Contest.findOneAndUpdate(
          { url: contest.url, userId },
          {
            ...contest,
            userId,
            timezone,
            reminders: [5, 15], // 5 and 15 minutes before
          },
          { upsert: true, new: true }
        );

        results.saved++;

        // Sync to Google Calendar
        try {
          await this.googleCalendarService.createContestEvent(
            userId,
            saved,
            timezone
          );
          results.calendarSynced++;
        } catch (calError) {
          logger.error('Google Calendar sync failed:', calError);
        }
      } catch (error) {
        logger.error(`Failed to save contest ${contest.name}:`, error);
        results.failed++;
      }
    }

    return {
      total: allContests.length,
      ...results,
    };
  }
}
```

#### Cron Job for Automated Scraping

**File: `backend/src/cron/scrapeContests.ts`**

```typescript
import cron from 'node-cron';
import { ContestScrapingService } from '../services/contestScrapingService';
import { User } from '../models/User';
import { logger } from '../utils/logger';

const scrapingService = new ContestScrapingService();

/**
 * Schedule scraping every 6 hours for all users
 */
export function scheduleContestScraping() {
  // Run every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    logger.info('Running scheduled contest scraping...');

    try {
      // Get all active users
      const users = await User.find({ isActive: true });

      for (const user of users) {
        try {
          await scrapingService.scrapeAndSaveAllContests(
            user._id.toString(),
            user.timezone || 'Asia/Kolkata'
          );
        } catch (error) {
          logger.error(`Scraping failed for user ${user._id}:`, error);
        }
      }
    } catch (error) {
      logger.error('Scheduled scraping error:', error);
    }
  });

  logger.info('Contest scraping scheduled: every 6 hours');
}
```

---

## AI Notes Agent (Enhanced)

### Features

1. **Timestamped Notes** - Each note has creation and update timestamps
2. **AI-Powered Content** - GPT-4 helps format and enhance notes
3. **Calendar Integration** - Notes can be added to Google Calendar
4. **Search & Organize** - Full-text search and tagging

### Implementation

**File: `backend/src/agents/notesAgent.ts`**

```typescript
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { logger } from '../utils/logger';
import { Note } from '../models/Note';
import { GoogleCalendarService } from '../services/googleCalendarService';

export interface CreateNoteRequest {
  userId: string;
  content: string;
  title?: string;
  tags?: string[];
  contestId?: string;
  addToCalendar?: boolean;
  reminderTime?: string; // ISO datetime for calendar reminder
}

export interface EnhanceNoteRequest {
  content: string;
  context?: string;
  userId: string;
}

export class NotesAgent {
  private llm: ChatOpenAI;
  private parser: StringOutputParser;
  private googleCalendarService: GoogleCalendarService;

  constructor() {
    this.llm = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'gpt-4-turbo-preview',
      temperature: 0.3,
    });
    this.parser = new StringOutputParser();
    this.googleCalendarService = new GoogleCalendarService();
  }

  /**
   * Create timestamped note with AI enhancement
   */
  async createTimestampedNote(request: CreateNoteRequest) {
    try {
      const timestamp = new Date();

      // Enhance content with AI if requested
      let enhancedContent = request.content;
      if (!request.content.startsWith('SKIP_AI:')) {
        enhancedContent = await this.enhanceNoteContent({
          content: request.content,
          userId: request.userId,
        });
      } else {
        enhancedContent = request.content.replace('SKIP_AI:', '');
      }

      // Create note in database
      const note = await Note.create({
        userId: request.userId,
        title: request.title || this.generateTitle(request.content),
        content: enhancedContent,
        tags: request.tags || [],
        contestId: request.contestId,
        createdAt: timestamp,
        updatedAt: timestamp,
        metadata: {
          wordCount: enhancedContent.split(/\s+/).length,
          characterCount: enhancedContent.length,
        },
      });

      logger.info(`Created note ${note._id} at ${timestamp.toISOString()}`);

      // Add to Google Calendar if requested
      if (request.addToCalendar && request.reminderTime) {
        await this.addNoteToCalendar(
          request.userId,
          note,
          request.reminderTime
        );
      }

      return {
        success: true,
        note,
        timestamp: timestamp.toISOString(),
      };
    } catch (error) {
      logger.error('Note creation error:', error);
      throw new Error('Failed to create note');
    }
  }

  /**
   * Enhance note content using AI
   */
  async enhanceNoteContent(request: EnhanceNoteRequest): Promise<string> {
    try {
      const systemPrompt = `You are a helpful note-taking assistant.
      
      Your task:
      - Format the user's note in clean, organized Markdown
      - Add structure (headings, lists, emphasis) where appropriate
      - Preserve all original information
      - Fix grammar and spelling errors
      - Add relevant emojis for visual appeal (sparingly)
      - Keep the user's voice and style
      
      DO NOT:
      - Add information not present in the original
      - Change the meaning or intent
      - Make it overly formal if casual
      - Remove any important details`;

      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(`Format and enhance this note:\n\n${request.content}`),
      ];

      const response = await this.llm.invoke(messages);
      return await this.parser.invoke(response);
    } catch (error) {
      logger.error('Note enhancement error:', error);
      // Return original content if AI fails
      return request.content;
    }
  }

  /**
   * Add note to Google Calendar as a reminder event
   */
  async addNoteToCalendar(
    userId: string,
    note: any,
    reminderTime: string
  ) {
    try {
      const event = await this.googleCalendarService.createNoteEvent(
        userId,
        {
          noteId: note._id.toString(),
          title: note.title,
          description: note.content,
          reminderTime: new Date(reminderTime),
          reminders: [5, 15], // 5 and 15 minutes before
        }
      );

      // Update note with calendar event ID
      await Note.findByIdAndUpdate(note._id, {
        googleCalendarEventId: event.id,
      });

      return event;
    } catch (error) {
      logger.error('Failed to add note to calendar:', error);
      throw error;
    }
  }

  /**
   * Generate smart title from content
   */
  private generateTitle(content: string): string {
    const firstLine = content.split('\n')[0];
    const truncated = firstLine.substring(0, 60);
    return truncated.length < firstLine.length
      ? `${truncated}...`
      : truncated;
  }

  /**
   * Update existing note with new timestamp
   */
  async updateNote(noteId: string, updates: Partial<CreateNoteRequest>) {
    try {
      const timestamp = new Date();

      const note = await Note.findByIdAndUpdate(
        noteId,
        {
          ...updates,
          updatedAt: timestamp,
        },
        { new: true }
      );

      if (!note) {
        throw new Error('Note not found');
      }

      return {
        success: true,
        note,
        updatedAt: timestamp.toISOString(),
      };
    } catch (error) {
      logger.error('Note update error:', error);
      throw error;
    }
  }

  /**
   * Search notes with timestamps
   */
  async searchNotes(userId: string, query: string, filters?: any) {
    try {
      const searchCriteria: any = {
        userId,
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { content: { $regex: query, $options: 'i' } },
          { tags: { $in: [query] } },
        ],
      };

      if (filters?.startDate) {
        searchCriteria.createdAt = { $gte: new Date(filters.startDate) };
      }

      if (filters?.endDate) {
        searchCriteria.createdAt = {
          ...searchCriteria.createdAt,
          $lte: new Date(filters.endDate),
        };
      }

      const notes = await Note.find(searchCriteria)
        .sort({ createdAt: -1 })
        .limit(50);

      return notes;
    } catch (error) {
      logger.error('Note search error:', error);
      throw error;
    }
  }
}
```

---

## AI Calendar Agent (New)

### Features

1. **Natural Language Event Creation** - "Remind me to practice DP tomorrow at 5 PM"
2. **Smart Parsing** - Extracts date, time, title from natural language
3. **Google Calendar Integration** - Automatically syncs events
4. **Recurring Events** - Support for daily, weekly, monthly patterns

### Implementation

**File: `backend/src/agents/calendarAgent.ts`**

```typescript
import { ChatOpenAI } from '@langchain/openai';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { GoogleCalendarService } from '../services/googleCalendarService';
import { Event } from '../models/Event';
import { parseISO, addDays, addWeeks, addMonths, setHours, setMinutes } from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

// Event parsing schema
const EventSchema = z.object({
  title: z.string().describe('The event title or name'),
  description: z.string().optional().describe('Optional event description'),
  date: z.string().describe('Event date in YYYY-MM-DD format'),
  time: z.string().describe('Event time in HH:MM format (24-hour)'),
  duration: z.number().optional().describe('Duration in minutes (default 60)'),
  isRecurring: z.boolean().optional().describe('Whether this is a recurring event'),
  recurrencePattern: z
    .enum(['daily', 'weekly', 'monthly', 'none'])
    .optional()
    .describe('Recurrence pattern'),
  reminders: z
    .array(z.number())
    .optional()
    .describe('Reminder times in minutes before event'),
});

type ParsedEvent = z.infer<typeof EventSchema>;

export interface CreateEventRequest {
  userId: string;
  naturalLanguageInput: string;
  timezone?: string;
}

export class CalendarAgent {
  private llm: ChatOpenAI;
  private parser: StructuredOutputParser<ParsedEvent>;
  private googleCalendarService: GoogleCalendarService;

  constructor() {
    this.llm = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'gpt-4-turbo-preview',
      temperature: 0,
    });
    this.parser = StructuredOutputParser.fromZodSchema(EventSchema);
    this.googleCalendarService = new GoogleCalendarService();
  }

  /**
   * Parse natural language and create calendar event
   */
  async createEventFromNaturalLanguage(request: CreateEventRequest) {
    try {
      const timezone = request.timezone || 'Asia/Kolkata';

      // Step 1: Parse natural language using AI
      const parsedEvent = await this.parseNaturalLanguage(
        request.naturalLanguageInput,
        timezone
      );

      logger.info('Parsed event:', parsedEvent);

      // Step 2: Create datetime objects
      const eventDateTime = this.createEventDateTime(
        parsedEvent.date,
        parsedEvent.time,
        timezone
      );

      const endDateTime = new Date(
        eventDateTime.getTime() + (parsedEvent.duration || 60) * 60000
      );

      // Step 3: Save to database
      const event = await Event.create({
        userId: request.userId,
        title: parsedEvent.title,
        description: parsedEvent.description || '',
        startTime: eventDateTime,
        endTime: endDateTime,
        timezone,
        isRecurring: parsedEvent.isRecurring || false,
        recurrencePattern: parsedEvent.recurrencePattern || 'none',
        reminders: parsedEvent.reminders || [5, 15],
        createdByAI: true,
        originalInput: request.naturalLanguageInput,
      });

      // Step 4: Sync to Google Calendar
      const googleEvent = await this.googleCalendarService.createCustomEvent(
        request.userId,
        {
          eventId: event._id.toString(),
          title: event.title,
          description: event.description,
          startTime: event.startTime,
          endTime: event.endTime,
          timezone,
          reminders: event.reminders,
          recurrence: this.buildRecurrenceRule(event.recurrencePattern),
        }
      );

      // Update with Google Calendar ID
      await Event.findByIdAndUpdate(event._id, {
        googleCalendarEventId: googleEvent.id,
      });

      return {
        success: true,
        event,
        googleCalendarLink: googleEvent.htmlLink,
        parsedData: parsedEvent,
      };
    } catch (error) {
      logger.error('Calendar agent error:', error);
      throw new Error('Failed to create event from natural language');
    }
  }

  /**
   * Parse natural language input using GPT-4
   */
  private async parseNaturalLanguage(
    input: string,
    timezone: string
  ): Promise<ParsedEvent> {
    try {
      const formatInstructions = this.parser.getFormatInstructions();

      const prompt = `You are an intelligent calendar assistant.
      
Current date and time: ${new Date().toISOString()}
User timezone: ${timezone}

Parse the following natural language input into a structured event:
"${input}"

Rules:
- Use relative dates (today, tomorrow, next week, etc.)
- Default duration is 60 minutes if not specified
- Default reminders are [5, 15] minutes if not specified
- Infer time of day from context (morning = 9 AM, afternoon = 2 PM, evening = 6 PM)
- For "practice DP", "solve problems", etc., create appropriate study event titles

${formatInstructions}`;

      const response = await this.llm.invoke(prompt);
      const parsed = await this.parser.parse(response.content as string);

      return parsed;
    } catch (error) {
      logger.error('Natural language parsing error:', error);
      throw new Error('Failed to parse natural language input');
    }
  }

  /**
   * Create datetime from parsed date and time
   */
  private createEventDateTime(
    date: string,
    time: string,
    timezone: string
  ): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const baseDate = parseISO(date);
    const withTime = setMinutes(setHours(baseDate, hours), minutes);

    // Convert to UTC from user's timezone
    return zonedTimeToUtc(withTime, timezone);
  }

  /**
   * Build Google Calendar recurrence rule
   */
  private buildRecurrenceRule(pattern: string): string[] | undefined {
    if (!pattern || pattern === 'none') {
      return undefined;
    }

    const rules: { [key: string]: string } = {
      daily: 'RRULE:FREQ=DAILY',
      weekly: 'RRULE:FREQ=WEEKLY',
      monthly: 'RRULE:FREQ=MONTHLY',
    };

    return rules[pattern] ? [rules[pattern]] : undefined;
  }

  /**
   * Update existing event
   */
  async updateEvent(
    eventId: string,
    updates: Partial<CreateEventRequest>
  ) {
    try {
      const event = await Event.findById(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      // If natural language provided, re-parse
      if (updates.naturalLanguageInput) {
        const parsedEvent = await this.parseNaturalLanguage(
          updates.naturalLanguageInput,
          event.timezone
        );

        const eventDateTime = this.createEventDateTime(
          parsedEvent.date,
          parsedEvent.time,
          event.timezone
        );

        const endDateTime = new Date(
          eventDateTime.getTime() + (parsedEvent.duration || 60) * 60000
        );

        event.title = parsedEvent.title;
        event.description = parsedEvent.description || '';
        event.startTime = eventDateTime;
        event.endTime = endDateTime;
      }

      await event.save();

      // Update Google Calendar
      if (event.googleCalendarEventId) {
        await this.googleCalendarService.updateEvent(
          event.userId.toString(),
          event.googleCalendarEventId,
          {
            title: event.title,
            description: event.description,
            startTime: event.startTime,
            endTime: event.endTime,
          }
        );
      }

      return {
        success: true,
        event,
      };
    } catch (error) {
      logger.error('Event update error:', error);
      throw error;
    }
  }

  /**
   * Delete event from database and Google Calendar
   */
  async deleteEvent(eventId: string) {
    try {
      const event = await Event.findById(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      // Delete from Google Calendar
      if (event.googleCalendarEventId) {
        await this.googleCalendarService.deleteEvent(
          event.userId.toString(),
          event.googleCalendarEventId
        );
      }

      // Delete from database
      await Event.findByIdAndDelete(eventId);

      return { success: true };
    } catch (error) {
      logger.error('Event deletion error:', error);
      throw error;
    }
  }
}
```

---

## Google Calendar Integration

### Service Implementation

**File: `backend/src/services/googleCalendarService.ts`**

```typescript
import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { logger } from '../utils/logger';
import { User } from '../models/User';

interface CalendarEventOptions {
  eventId?: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  timezone: string;
  reminders: number[];
  recurrence?: string[];
}

export class GoogleCalendarService {
  private calendar: calendar_v3.Calendar;

  constructor() {
    this.calendar = google.calendar({ version: 'v3' });
  }

  /**
   * Get OAuth2 client for user
   */
  private async getAuthClient(userId: string): Promise<OAuth2Client> {
    const user = await User.findById(userId);
    if (!user || !user.googleAccessToken) {
      throw new Error('User not authenticated with Google');
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    });

    return oauth2Client;
  }

  /**
   * Create contest event in Google Calendar
   */
  async createContestEvent(
    userId: string,
    contest: any,
    timezone: string
  ) {
    try {
      const auth = await this.getAuthClient(userId);

      const event: calendar_v3.Schema$Event = {
        summary: `${contest.platform.toUpperCase()}: ${contest.name}`,
        description: `Contest URL: ${contest.url}\n\nPlatform: ${contest.platform}\nDuration: ${contest.duration}`,
        start: {
          dateTime: contest.startTime,
          timeZone: timezone,
        },
        end: {
          dateTime: contest.endTime,
          timeZone: timezone,
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 5 },
            { method: 'popup', minutes: 15 },
          ],
        },
        colorId: this.getContestColor(contest.platform),
      };

      const response = await this.calendar.events.insert({
        auth,
        calendarId: 'primary',
        requestBody: event,
      });

      logger.info(`Created Google Calendar event: ${response.data.id}`);
      return response.data;
    } catch (error) {
      logger.error('Google Calendar contest event creation error:', error);
      throw error;
    }
  }

  /**
   * Create note event (reminder) in Google Calendar
   */
  async createNoteEvent(
    userId: string,
    options: {
      noteId: string;
      title: string;
      description: string;
      reminderTime: Date;
      reminders: number[];
    }
  ) {
    try {
      const auth = await this.getAuthClient(userId);

      const event: calendar_v3.Schema$Event = {
        summary: `📝 Note: ${options.title}`,
        description: `${options.description}\n\n---\nNote ID: ${options.noteId}`,
        start: {
          dateTime: options.reminderTime.toISOString(),
        },
        end: {
          dateTime: new Date(
            options.reminderTime.getTime() + 15 * 60000
          ).toISOString(),
        },
        reminders: {
          useDefault: false,
          overrides: options.reminders.map((min) => ({
            method: 'popup',
            minutes: min,
          })),
        },
        colorId: '7', // Peacock (blue) for notes
      };

      const response = await this.calendar.events.insert({
        auth,
        calendarId: 'primary',
        requestBody: event,
      });

      return response.data;
    } catch (error) {
      logger.error('Note event creation error:', error);
      throw error;
    }
  }

  /**
   * Create custom event in Google Calendar
   */
  async createCustomEvent(userId: string, options: CalendarEventOptions) {
    try {
      const auth = await this.getAuthClient(userId);

      const event: calendar_v3.Schema$Event = {
        summary: options.title,
        description: options.description,
        start: {
          dateTime: options.startTime.toISOString(),
          timeZone: options.timezone,
        },
        end: {
          dateTime: options.endTime.toISOString(),
          timeZone: options.timezone,
        },
        reminders: {
          useDefault: false,
          overrides: options.reminders.map((min) => ({
            method: 'popup',
            minutes: min,
          })),
        },
        recurrence: options.recurrence,
        colorId: '9', // Blue for custom events
      };

      const response = await this.calendar.events.insert({
        auth,
        calendarId: 'primary',
        requestBody: event,
      });

      return response.data;
    } catch (error) {
      logger.error('Custom event creation error:', error);
      throw error;
    }
  }

  /**
   * Update existing event
   */
  async updateEvent(
    userId: string,
    eventId: string,
    updates: Partial<CalendarEventOptions>
  ) {
    try {
      const auth = await this.getAuthClient(userId);

      const event: calendar_v3.Schema$Event = {};

      if (updates.title) event.summary = updates.title;
      if (updates.description) event.description = updates.description;
      if (updates.startTime) {
        event.start = {
          dateTime: updates.startTime.toISOString(),
          timeZone: updates.timezone,
        };
      }
      if (updates.endTime) {
        event.end = {
          dateTime: updates.endTime.toISOString(),
          timeZone: updates.timezone,
        };
      }

      const response = await this.calendar.events.patch({
        auth,
        calendarId: 'primary',
        eventId,
        requestBody: event,
      });

      return response.data;
    } catch (error) {
      logger.error('Event update error:', error);
      throw error;
    }
  }

  /**
   * Delete event from Google Calendar
   */
  async deleteEvent(userId: string, eventId: string) {
    try {
      const auth = await this.getAuthClient(userId);

      await this.calendar.events.delete({
        auth,
        calendarId: 'primary',
        eventId,
      });

      logger.info(`Deleted Google Calendar event: ${eventId}`);
    } catch (error) {
      logger.error('Event deletion error:', error);
      throw error;
    }
  }

  /**
   * Get contest color based on platform
   */
  private getContestColor(platform: string): string {
    const colors: { [key: string]: string } = {
      leetcode: '5', // Yellow
      codeforces: '11', // Red
      codechef: '10', // Green
    };
    return colors[platform] || '1';
  }
}
```

---

## API Specifications

### Contest Scraping Endpoints

**File: `backend/src/routes/contests.ts`**

```typescript
import express from 'express';
import { ContestScrapingService } from '../services/contestScrapingService';
import { authenticate } from '../middleware/auth';
import { Contest } from '../models/Contest';

const router = express.Router();
const scrapingService = new ContestScrapingService();

// Manual trigger scraping
router.post('/scrape', authenticate, async (req, res) => {
  try {
    const result = await scrapingService.scrapeAndSaveAllContests(
      req.user.id,
      req.user.timezone || 'Asia/Kolkata'
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Scraping failed' });
  }
});

// Get all contests
router.get('/', authenticate, async (req, res) => {
  try {
    const contests = await Contest.find({ userId: req.user.id })
      .sort({ startTime: 1 })
      .limit(50);

    res.json({ contests });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contests' });
  }
});

// Get upcoming contests
router.get('/upcoming', authenticate, async (req, res) => {
  try {
    const contests = await Contest.find({
      userId: req.user.id,
      startTime: { $gt: new Date() },
    })
      .sort({ startTime: 1 })
      .limit(20);

    res.json({ contests });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch upcoming contests' });
  }
});

export default router;
```

### Notes Agent Endpoints

**File: `backend/src/routes/notes.ts`**

```typescript
import express from 'express';
import { NotesAgent } from '../agents/notesAgent';
import { authenticate } from '../middleware/auth';
import { Note } from '../models/Note';

const router = express.Router();
const notesAgent = new NotesAgent();

// Create timestamped note with AI
router.post('/', authenticate, async (req, res) => {
  try {
    const { content, title, tags, contestId, addToCalendar, reminderTime } =
      req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const result = await notesAgent.createTimestampedNote({
      userId: req.user.id,
      content,
      title,
      tags,
      contestId,
      addToCalendar,
      reminderTime,
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// Search notes
router.get('/search', authenticate, async (req, res) => {
  try {
    const { q, startDate, endDate } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Query parameter required' });
    }

    const notes = await notesAgent.searchNotes(req.user.id, q as string, {
      startDate,
      endDate,
    });

    res.json({ notes });
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get all notes
router.get('/', authenticate, async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ notes });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// Update note
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const result = await notesAgent.updateNote(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// Delete note
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await Note.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

export default router;
```

### Calendar Agent Endpoints

**File: `backend/src/routes/events.ts`**

```typescript
import express from 'express';
import { CalendarAgent } from '../agents/calendarAgent';
import { authenticate } from '../middleware/auth';
import { Event } from '../models/Event';

const router = express.Router();
const calendarAgent = new CalendarAgent();

// Create event from natural language
router.post('/create-with-ai', authenticate, async (req, res) => {
  try {
    const { input, timezone } = req.body;

    if (!input) {
      return res.status(400).json({ error: 'Input is required' });
    }

    const result = await calendarAgent.createEventFromNaturalLanguage({
      userId: req.user.id,
      naturalLanguageInput: input,
      timezone: timezone || req.user.timezone || 'Asia/Kolkata',
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Get all events
router.get('/', authenticate, async (req, res) => {
  try {
    const events = await Event.find({ userId: req.user.id })
      .sort({ startTime: 1 })
      .limit(50);

    res.json({ events });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Update event
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const result = await calendarAgent.updateEvent(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Delete event
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await calendarAgent.deleteEvent(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

export default router;
```

---

## Database Schema Updates

### Note Model

**File: `backend/src/models/Note.ts`**

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface INote extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  tags: string[];
  contestId?: mongoose.Types.ObjectId;
  googleCalendarEventId?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    wordCount: number;
    characterCount: number;
  };
}

const NoteSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    maxlength: 200,
  },
  content: {
    type: String,
    required: true,
  },
  tags: [{
    type: String,
    maxlength: 50,
  }],
  contestId: {
    type: Schema.Types.ObjectId,
    ref: 'Contest',
  },
  googleCalendarEventId: String,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  metadata: {
    wordCount: Number,
    characterCount: Number,
  },
});

// Text search index
NoteSchema.index({ title: 'text', content: 'text', tags: 'text' });

export const Note = mongoose.model<INote>('Note', NoteSchema);
```

### Event Model

**File: `backend/src/models/Event.ts`**

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  timezone: string;
  isRecurring: boolean;
  recurrencePattern: 'daily' | 'weekly' | 'monthly' | 'none';
  reminders: number[];
  googleCalendarEventId?: string;
  createdByAI: boolean;
  originalInput?: string;
  createdAt: Date;
}

const EventSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    maxlength: 200,
  },
  description: {
    type: String,
    default: '',
  },
  startTime: {
    type: Date,
    required: true,
    index: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  timezone: {
    type: String,
    default: 'Asia/Kolkata',
  },
  isRecurring: {
    type: Boolean,
    default: false,
  },
  recurrencePattern: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'none'],
    default: 'none',
  },
  reminders: [{
    type: Number,
  }],
  googleCalendarEventId: String,
  createdByAI: {
    type: Boolean,
    default: false,
  },
  originalInput: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Event = mongoose.model<IEvent>('Event', EventSchema);
```

---

## Frontend Implementation

### React Components

#### Notes Component with AI

**File: `frontend/src/components/NotesWithAI.tsx`**

```typescript
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notesAPI } from '../api/notes';
import { toast } from 'react-hot-toast';

const NotesWithAI: React.FC = () => {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [addToCalendar, setAddToCalendar] = useState(false);
  const [reminderTime, setReminderTime] = useState('');
  
  const queryClient = useQueryClient();

  const createNoteMutation = useMutation({
    mutationFn: notesAPI.createNote,
    onSuccess: (data) => {
      toast.success(`Note created at ${data.timestamp}`);
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setContent('');
      setTitle('');
    },
    onError: () => {
      toast.error('Failed to create note');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    createNoteMutation.mutate({
      content,
      title,
      addToCalendar,
      reminderTime: addToCalendar ? reminderTime : undefined,
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Create AI-Enhanced Note</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Title (optional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="Auto-generated if empty"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Note Content
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg h-40"
            placeholder="Write your note... AI will format and enhance it!"
            required
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={addToCalendar}
            onChange={(e) => setAddToCalendar(e.target.checked)}
            id="addToCalendar"
          />
          <label htmlFor="addToCalendar" className="text-sm">
            Add to Google Calendar as reminder
          </label>
        </div>

        {addToCalendar && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Reminder Time
            </label>
            <input
              type="datetime-local"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
        )}

        <button
          type="submit"
          disabled={createNoteMutation.isPending}
          className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {createNoteMutation.isPending ? 'Creating...' : '✨ Create Note with AI'}
        </button>
      </form>
    </div>
  );
};

export default NotesWithAI;
```

#### Calendar AI Agent Component

**File: `frontend/src/components/CalendarAIAgent.tsx`**

```typescript
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsAPI } from '../api/events';
import { toast } from 'react-hot-toast';

const CalendarAIAgent: React.FC = () => {
  const [input, setInput] = useState('');
  const [examples] = useState([
    'Remind me to practice DP tomorrow at 5 PM',
    'Schedule study session every Monday at 7 PM',
    'Add contest preparation on Friday afternoon for 2 hours',
    'Create recurring daily practice at 9 AM',
  ]);

  const queryClient = useQueryClient();

  const createEventMutation = useMutation({
    mutationFn: eventsAPI.createWithAI,
    onSuccess: (data) => {
      toast.success(
        <div>
          <p className="font-medium">Event created!</p>
          <p className="text-sm">{data.event.title}</p>
          <a
            href={data.googleCalendarLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 text-sm underline"
          >
            View in Google Calendar
          </a>
        </div>
      );
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setInput('');
    },
    onError: () => {
      toast.error('Failed to create event');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEventMutation.mutate({ input });
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">🤖 AI Calendar Agent</h2>
      <p className="text-gray-600 mb-6">
        Tell me what you want to schedule in natural language!
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            What do you want to schedule?
          </label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg text-lg"
            placeholder="e.g., Remind me to solve problems tomorrow at 6 PM"
            required
          />
        </div>

        <button
          type="submit"
          disabled={createEventMutation.isPending}
          className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
        >
          {createEventMutation.isPending
            ? '🔄 Creating event...'
            : '✨ Create Event with AI'}
        </button>
      </form>

      <div className="mt-8">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Try these examples:
        </h3>
        <div className="space-y-2">
          {examples.map((example, index) => (
            <button
              key={index}
              onClick={() => setInput(example)}
              className="block w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {createEventMutation.data && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-medium text-green-800 mb-2">✅ Event Created</h4>
          <p className="text-sm text-green-700">
            <strong>Title:</strong> {createEventMutation.data.event.title}
          </p>
          <p className="text-sm text-green-700">
            <strong>Time:</strong>{' '}
            {new Date(createEventMutation.data.event.startTime).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
};

export default CalendarAIAgent;
```

### API Client

**File: `frontend/src/api/notes.ts`**

```typescript
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const notesAPI = {
  createNote: async (data: {
    content: string;
    title?: string;
    tags?: string[];
    addToCalendar?: boolean;
    reminderTime?: string;
  }) => {
    const response = await axios.post(`${API_BASE}/notes`, data);
    return response.data;
  },

  getNotes: async () => {
    const response = await axios.get(`${API_BASE}/notes`);
    return response.data;
  },

  searchNotes: async (query: string) => {
    const response = await axios.get(`${API_BASE}/notes/search`, {
      params: { q: query },
    });
    return response.data;
  },

  updateNote: async (id: string, updates: any) => {
    const response = await axios.patch(`${API_BASE}/notes/${id}`, updates);
    return response.data;
  },

  deleteNote: async (id: string) => {
    const response = await axios.delete(`${API_BASE}/notes/${id}`);
    return response.data;
  },
};
```

**File: `frontend/src/api/events.ts`**

```typescript
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const eventsAPI = {
  createWithAI: async (data: { input: string; timezone?: string }) => {
    const response = await axios.post(`${API_BASE}/events/create-with-ai`, data);
    return response.data;
  },

  getEvents: async () => {
    const response = await axios.get(`${API_BASE}/events`);
    return response.data;
  },

  updateEvent: async (id: string, updates: any) => {
    const response = await axios.patch(`${API_BASE}/events/${id}`, updates);
    return response.data;
  },

  deleteEvent: async (id: string) => {
    const response = await axios.delete(`${API_BASE}/events/${id}`);
    return response.data;
  },
};
```

---

## Testing & Deployment

### Environment Variables

```bash
# .env

# OpenAI
OPENAI_API_KEY=sk-...

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback

# Database
MONGODB_URI=mongodb://localhost:27017/cp_calendar_v2

# Server
PORT=5000
NODE_ENV=development
```

### Start Application

```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm start
```

---

## Summary

### ✅ What Changed

| Feature | Old (v1.0) | New (v2.0) |
|---------|-----------|------------|
| Contest Fetching | AI Agent + Web Search | Pure web scraping (APIs) |
| Notes | Basic AI generation | Timestamped + Calendar integration |
| Calendar Events | Manual only | AI-powered natural language |
| AI Usage | Contest scraping + Notes | Notes enhancement + Event parsing only |

### 🎯 Key Benefits

1. **Faster Contest Scraping** - Direct APIs, no LLM overhead
2. **Cost Efficient** - Only use AI for notes and event parsing
3. **More Reliable** - Less dependent on AI, more deterministic
4. **Better UX** - Natural language event creation
5. **Timestamped Everything** - Full audit trail for notes and events

### 🚀 Next Steps

1. Implement these changes in your codebase
2. Test locally
3. Deploy to production
4. Monitor AI costs (should be much lower!)

---

**Your application is now leaner, faster, and smarter!** 🎉
