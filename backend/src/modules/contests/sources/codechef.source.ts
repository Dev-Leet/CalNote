import { IContestSource, RawContest } from './IContestSource';

/**
 * CodeChef exposes a public, unauthenticated REST endpoint for contest
 * listings. Response shape verified against api.codechef.com/contests —
 * revisit if CodeChef changes their API surface.
 */
interface CodeChefContest {
  contest_code: string;
  contest_name: string;
  contest_start_date_iso: string;
  contest_end_date_iso: string;
  contest_duration: string; // minutes, as a string
}

interface CodeChefApiResponse {
  future_contests: CodeChefContest[];
  present_contests: CodeChefContest[];
}

// Anything at or above this duration is excluded — CodeChef's contest-list
// API mixes genuine short timed contests with long-format "long challenge"
// / practice-style entries that share the same API shape but aren't
// contests in the sense this app schedules study/sleep around. 4 hours
// (240 min) is the explicit cutoff per product decision.
const MAX_CONTEST_DURATION_MINUTES = 240;

export const codechefSource: IContestSource = {
  platform: 'codechef',

  async fetchUpcoming(): Promise<RawContest[]> {
    const res = await fetch('https://www.codechef.com/api/list/contests/all?sort_by=START&sorting_order=asc');
    if (!res.ok) {
      throw new Error(`CodeChef API returned status ${res.status}`);
    }

    const data = (await res.json()) as CodeChefApiResponse;
    const upcoming = [...data.future_contests, ...data.present_contests];

    return upcoming
      .filter((c) => Number(c.contest_duration) < MAX_CONTEST_DURATION_MINUTES)
      .map((c) => ({
        externalId: c.contest_code,
        name: c.contest_name,
        startTime: new Date(c.contest_start_date_iso),
        endTime: new Date(c.contest_end_date_iso),
        url: `https://www.codechef.com/${c.contest_code}`,
        durationMinutes: Number(c.contest_duration),
      }));
  },
};
