// apps/api/src/services/calendarService.ts
// Google Calendar API integration for syncing contests

import { google, calendar_v3 } from 'googleapis';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { SyncStatus } from '@prisma/client';

interface SyncResult {
  contestId: string;
  status: 'success' | 'failed' | 'skipped';
  calendarEventId?: string;
  error?: string;
}

class CalendarService {
  /**
   * Create a Google Calendar client for a specific user
   */
  private getCalendarClient(accessToken: string, refreshToken?: string): calendar_v3.Calendar {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALLBACK_URL
    );

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    return google.calendar({ version: 'v3', auth: oauth2Client });
  }

  /**
   * Sync a list of contests to the user's Google Calendar
   */
  async syncContests(userId: string, contestIds?: string[]): Promise<{
    syncedCount: number;
    failedCount: number;
    results: SyncResult[];
  }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.accessToken) {
      throw new Error('User does not have Google Calendar connected');
    }

    // Get contests to sync
    const where = contestIds?.length
      ? { id: { in: contestIds } }
      : { startTime: { gte: new Date() } };

    const contests = await prisma.contest.findMany({
      where,
      orderBy: { startTime: 'asc' },
      take: 50, // Max 50 at once
    });

    const calendar = this.getCalendarClient(
      user.accessToken,
      user.refreshToken ?? undefined
    );

    const results: SyncResult[] = [];

    for (const contest of contests) {
      try {
        // Check if already synced
        const existing = await prisma.syncedContest.findUnique({
          where: { userId_contestId: { userId, contestId: contest.id } },
        });

        if (existing?.syncStatus === SyncStatus.SYNCED && existing.calendarEventId) {
          results.push({ contestId: contest.id, status: 'skipped' });
          continue;
        }

        // Build calendar event
        const event: calendar_v3.Schema$Event = {
          summary: `[${contest.platform}] ${contest.name}`,
          description: [
            `Platform: ${contest.platform}`,
            `URL: ${contest.url}`,
            `Duration: ${contest.duration} minutes`,
            '',
            'Synced by CalNote 🚀',
          ].join('\n'),
          start: {
            dateTime: contest.startTime.toISOString(),
            timeZone: user.timezone || 'Asia/Kolkata',
          },
          end: {
            dateTime: contest.endTime.toISOString(),
            timeZone: user.timezone || 'Asia/Kolkata',
          },
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'popup', minutes: 5 },
              { method: 'popup', minutes: 15 },
            ],
          },
          colorId: this.getPlatformColor(contest.platform as string),
        };

        const response = await calendar.events.insert({
          calendarId: user.calendarId || 'primary',
          requestBody: event,
        });

        const calendarEventId = response.data.id ?? undefined;

        // Upsert sync record
        await prisma.syncedContest.upsert({
          where: { userId_contestId: { userId, contestId: contest.id } },
          update: {
            calendarEventId,
            syncStatus: SyncStatus.SYNCED,
            syncError: null,
          },
          create: {
            userId,
            contestId: contest.id,
            calendarEventId,
            syncStatus: SyncStatus.SYNCED,
          },
        });

        results.push({ contestId: contest.id, status: 'success', calendarEventId });
        logger.info(`Synced contest ${contest.name} for user ${userId}`);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error(`Failed to sync contest ${contest.id}:`, error);

        await prisma.syncedContest.upsert({
          where: { userId_contestId: { userId, contestId: contest.id } },
          update: { syncStatus: SyncStatus.FAILED, syncError: msg },
          create: { userId, contestId: contest.id, syncStatus: SyncStatus.FAILED, syncError: msg },
        });

        results.push({ contestId: contest.id, status: 'failed', error: msg });
      }
    }

    const syncedCount = results.filter((r) => r.status === 'success').length;
    const failedCount = results.filter((r) => r.status === 'failed').length;

    return { syncedCount, failedCount, results };
  }

  /**
   * Get calendar sync status for a user
   */
  async getStatus(userId: string): Promise<{
    connected: boolean;
    syncedCount: number;
    lastSync?: string;
  }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const synced = await prisma.syncedContest.findMany({
      where: { userId, syncStatus: SyncStatus.SYNCED },
      orderBy: { syncedAt: 'desc' },
      take: 1,
    });

    return {
      connected: !!user?.accessToken,
      syncedCount: await prisma.syncedContest.count({
        where: { userId, syncStatus: SyncStatus.SYNCED },
      }),
      lastSync: synced[0]?.syncedAt?.toISOString(),
    };
  }

  /** Map platform to Google Calendar event color */
  private getPlatformColor(platform: string): string {
    const colors: Record<string, string> = {
      LEETCODE: '5',    // Yellow (Banana)
      CODEFORCES: '1',  // Blue (Lavender→Blueberry)
      CODECHEF: '6',    // Orange (Tangerine)
    };
    return colors[platform] ?? '8';
  }
}

export const calendarService = new CalendarService();
