import OpenAI from 'openai';

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
  private openai: OpenAI;
  private readonly modelId = process.env.ASHNA_MODEL_ID ?? '6a4e9b901b559fe5ca09a268';

  constructor() {
    // Initialize the OpenAI SDK with Ashna's base URL and your API key
    this.openai = new OpenAI({
      apiKey: process.env.ASHNA_API_KEY, 
      baseURL: process.env.ASHNA_API_BASE_URL ?? 'https://api.ashna.ai/v1/api',
    });
  }

  async schedule(req: AshnaScheduleRequest): Promise<AshnaRawResponse> {
    // Provide a system prompt to strictly enforce the expected JSON structure
    const systemPrompt = `You are an AI scheduling assistant. 
    Analyze the user's prompt, current time, and provided context (events, contests, and sleep window) to create an optimized schedule.
    Respond ONLY with valid JSON matching this exact structure:
    {
      "scheduledItems": [
        {
          "label": "string",
          "startsAt": "ISO date string",
          "endsAt": "ISO date string",
          "repeatRule": { "freq": "daily|weekly|custom", "interval": 1 },
          "note": "string",
          "linkedContestId": "string"
        }
      ],
      "explanation": "string"
    }`;

    // Use the OpenAI-compatible chat completions endpoint
    const response = await this.openai.chat.completions.create({
      model: this.modelId,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(req, null, 2) }
      ],
      // Enforce JSON output shape
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('Ashna AI returned an empty response');
    }

    // Parse and return the structured response
    return JSON.parse(content) as AshnaRawResponse;
  }
}

export const ashnaSdkClient = new AshnaSdkClient();