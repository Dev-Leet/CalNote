import { IContestSource } from '../contest.cron';

interface CodeforcesApiContest {
  id: number;
  name: string;
  phase: string;
  startTimeSeconds: number;
  durationSeconds: number;
}

export const codeforcesSource: IContestSource = {
  platform: 'codeforces',

  async fetchUpcoming() {
    const res = await fetch('https://codeforces.com/api/contest.list');
    if (!res.ok) {
      throw new Error(`Codeforces API returned status ${res.status}`);
    }
    const data = (await res.json()) as { status: string; result: CodeforcesApiContest[] };
    if (data.status !== 'OK') {
      throw new Error('Codeforces API returned non-OK status');
    }

    return data.result
      .filter((c) => c.phase === 'BEFORE')
      .map((c) => ({
        externalId: String(c.id),
        name: c.name,
        startTime: new Date(c.startTimeSeconds * 1000),
        endTime: new Date((c.startTimeSeconds + c.durationSeconds) * 1000),
        url: `https://codeforces.com/contest/${c.id}`,
        durationMinutes: Math.round(c.durationSeconds / 60),
      }));
  },
};
