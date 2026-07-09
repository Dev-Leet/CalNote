import { IContestSource } from '../contest.cron';

/**
 * LeetCode has no official public contest-list REST API; this adapter targets
 * their GraphQL endpoint used by the site itself. Verify field names/endpoint
 * stability periodically — unofficial APIs can change without notice.
 */
export const leetcodeSource: IContestSource = {
  platform: 'leetcode',

  async fetchUpcoming() {
    const query = `
      query upcomingContests {
        upcomingContests {
          title
          titleSlug
          startTime
          duration
        }
      }
    `;

    const res = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    if (!res.ok) {
      throw new Error(`LeetCode GraphQL returned status ${res.status}`);
    }

    const data = (await res.json()) as {
      data: {
        upcomingContests: {
          title: string;
          titleSlug: string;
          startTime: number; // unix seconds
          duration: number; // seconds
        }[];
      };
    };

    return data.data.upcomingContests.map((c) => ({
      externalId: c.titleSlug,
      name: c.title,
      startTime: new Date(c.startTime * 1000),
      endTime: new Date((c.startTime + c.duration) * 1000),
      url: `https://leetcode.com/contest/${c.titleSlug}`,
      durationMinutes: Math.round(c.duration / 60),
    }));
  },
};
