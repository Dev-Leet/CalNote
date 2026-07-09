/**
 * Contract every platform-specific contest adapter must implement.
 * contest.service.ts consumes only this interface — it never knows about
 * platform-specific fetch mechanics (REST vs GraphQL, auth, response shape).
 */
export interface RawContest {
  externalId: string;      // platform's native contest ID/slug
  name: string;
  startTime: Date;         // UTC
  endTime: Date;           // UTC
  url: string;
  durationMinutes: number;
}

export interface IContestSource {
  readonly platform: string;
  fetchUpcoming(): Promise<RawContest[]>;
}
