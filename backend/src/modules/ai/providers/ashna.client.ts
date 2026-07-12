/**
 * Thin wrapper around Ashna AI's OpenAI-compatible /chat/completions
 * endpoint, per the official API docs (Account -> API on app.ashna.ai).
 * Deliberately does NOT set response_format or any JSON-mode parameter —
 * the docs document no such field for this route, and sending an
 * undocumented param risks a 400 Bad Request ("Invalid request parameters").
 * JSON-shape enforcement is handled entirely via system-prompt instruction +
 * sharedEventResponseZodSchema validation downstream.
 */

export interface AshnaChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AshnaChatCompletionRequest {
  model: string;
  messages: AshnaChatMessage[];
  temperature?: number;
  max_tokens?: number;
}

export interface AshnaChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: { role: string; content: string };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface AshnaErrorBody {
  error?: { type?: string; message?: string; code?: string };
}

class AshnaClient {
  private readonly apiKey = process.env.ASHNA_API_KEY;
  private readonly baseUrl = process.env.ASHNA_API_BASE_URL ?? 'https://api.ashna.ai/v1/api';

  async chatCompletion(req: AshnaChatCompletionRequest): Promise<AshnaChatCompletionResponse> {
    if (!this.apiKey) {
      throw new Error('ASHNA_API_KEY environment variable is not defined');
    }

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req),
    });

    if (!res.ok) {
      let message = `Ashna AI returned status ${res.status}`;
      try {
        const body = (await res.json()) as AshnaErrorBody;
        if (body.error?.message) {
          message = `Ashna AI error (${body.error.code ?? res.status}): ${body.error.message}`;
        }
      } catch {
        // Response body wasn't JSON — fall back to the generic status message.
      }
      throw new Error(message);
    }

    return (await res.json()) as AshnaChatCompletionResponse;
  }
}

export const ashnaClient = new AshnaClient();