/**
 * Placeholder Ashna AI SDK client wrapper. Replace the internals of `schedule()`
 * with the actual Ashna SDK call once credentials/SDK are available — the shape
 * of AshnaRawResponse below is what AshnaAiService.mapAshnaResponse() expects.
 */

export interface AshnaScheduleRequest {
  prompt: string;
  currentDateTimeIST: string;
  context: {
    events: { title: string; start: string; end: string }[];
    contests: { name: string; platform: string; start: string; end: string }[];
    sleepWindow: { start: string; end: string };
  };
}

export interface AshnaRawResponse {
  scheduledItems: {
    label: string;
    startsAt: string;
    endsAt: string;
    repeatRule?: {
      freq: 'daily' | 'weekly' | 'custom';
      interval: number;
      byDay?: string[];
      until?: string | null;
    } | null;
    note?: string | null;
    linkedContestId?: string | null;
  }[];
  explanation: string;
}

class AshnaSdkClient {
  private readonly apiKey = process.env.ASHNA_API_KEY;
  private readonly baseUrl = process.env.ASHNA_API_BASE_URL ?? 'https://api.ashna.ai/v1';

  async schedule(req: AshnaScheduleRequest): Promise<AshnaRawResponse> {
    if (!this.apiKey) {
      throw new Error('ASHNA_API_KEY environment variable is not defined');
    }

    const res = await fetch(`${this.baseUrl}/schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(req),
    });

    if (!res.ok) {
      throw new Error(`Ashna AI SDK returned status ${res.status}`);
    }

    return (await res.json()) as AshnaRawResponse;
  }
}

export const ashnaSdkClient = new AshnaSdkClient();
