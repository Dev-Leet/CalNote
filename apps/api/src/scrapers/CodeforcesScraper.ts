// apps/api/src/scrapers/CodeforcesScraper.ts
// Fetches Codeforces contests from Kontests.net API

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

export class CodeforcesScraper extends BaseScraper {
  readonly platform = Platform.CODEFORCES;
  readonly platformKey = 'codeforces';

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

        // Detect difficulty from name
        let difficulty: string | undefined;
        if (c.name.includes('Div. 1')) difficulty = 'Div. 1';
        else if (c.name.includes('Div. 2')) difficulty = 'Div. 2';
        else if (c.name.includes('Div. 3')) difficulty = 'Div. 3';
        else if (c.name.includes('Div. 4')) difficulty = 'Div. 4';
        else if (c.name.includes('Educational')) difficulty = 'Educational';

        // Extract CF contest ID from URL e.g. /contest/1234
        const idMatch = c.url.match(/\/contest\/(\d+)/);
        const externalId = idMatch?.[1];

        return {
          platform: this.platform,
          name: c.name,
          url: c.url,
          startTime,
          endTime,
          duration: durationMins,
          status: c.status || 'BEFORE',
          externalId,
          difficulty,
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
