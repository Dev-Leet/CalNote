import { IContestSource, RawContest } from './IContestSource';

/**
 * LeetCode has no official public REST endpoint for contest listings; this
 * targets the GraphQL endpoint the site itself uses. Unofficial APIs can
 * change without notice — treat scrape failures here as expected/recoverable
 * (contest.service.ts continues to other sources on failure).
 */
interface LeetCodeGraphQLResponse {
  data: {
    upcomingContests: {
      title: string;
      titleSlug: string;
      startTime: number; // unix seconds
      duration: number;  // seconds
    }[];
  };
}

export const leetcodeSource: IContestSource = {
  platform: 'leetcode',

  async fetchUpcoming(): Promise<RawContest[]> {
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

    const data = (await res.json()) as LeetCodeGraphQLResponse;

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
