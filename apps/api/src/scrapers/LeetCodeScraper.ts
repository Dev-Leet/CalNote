// apps/api/src/scrapers/LeetCodeScraper.ts
// Fetches LeetCode contests from Kontests.net API

import axios from 'axios';
import { Platform } from '@prisma/client';
import { BaseScraper, ScrapedContest } from './BaseScraper';
import { KONTESTS_BASE_URL } from '@cp-calendar/shared';

interface KontestsContest {
  name: string;
  url: string;
  start_time: string;
  end_time: string;
  duration: string;
  site: string;
  in_24_hours: string;
  status: string;
}

export class LeetCodeScraper extends BaseScraper {
  readonly platform = Platform.LEETCODE;
  readonly platformKey = 'leetcode';

  async fetchContests(): Promise<ScrapedContest[]> {
    try {
      this.log('Fetching from Kontests.net...');

      const response = await axios.get<KontestsContest[]>(
        `${KONTESTS_BASE_URL}/${this.platformKey}`,
        { timeout: 15000 }
      );

      const contests: ScrapedContest[] = response.data.map((c) => {
        const startTime = new Date(c.start_time);
        const endTime = new Date(c.end_time);
        const durationMins = this.parseDuration(c.duration);

        return {
          platform: this.platform,
          name: c.name,
          url: c.url,
          startTime,
          endTime,
          duration: durationMins,
          status: c.status || 'BEFORE',
          externalId: c.url.split('/').pop(), // Extract slug from URL
        };
      });

      const filtered = this.filterUpcoming(contests);
      this.log(`Fetched ${filtered.length} upcoming contests`);
      return filtered;
    } catch (error) {
      this.logError('Failed to fetch contests', error);
      return [];
    }
  }
}
