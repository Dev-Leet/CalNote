import { ICodeExecutionProvider, CodeExecutionInput, CodeExecutionOutput } from './ICodeExecutionProvider';
import { LANGUAGE_MAP } from '../languageMap';
import { logger } from '../../../utils/logger';

/**
 * CodeX (RapidAPI listing) — the least publicly documented of the three
 * real providers. Implemented against RapidAPI's STANDARD auth pattern
 * (X-RapidAPI-Key + X-RapidAPI-Host headers, which every RapidAPI-hosted
 * endpoint uses identically regardless of the underlying API), and a
 * best-guess request/response body shape based on common conventions
 * across similar RapidAPI code-execution listings (language/code/input
 * field names). This is explicitly the LEAST verified adapter — if it
 * consistently fails, open the RapidAPI console for this API, copy its
 * auto-generated "Node.js Axios" code snippet, and correct the request
 * body field names and response parsing below to match exactly.
 */
interface CodeXResponse {
  output?: string;
  stdout?: string;
  stderr?: string;
  error?: string;
  statusCode?: number;
}

export class CodeXProvider implements ICodeExecutionProvider {
  readonly id = 'codex';
  private readonly apiKey = process.env.CODEX_RAPIDAPI_KEY;
  private readonly rapidApiHost = 'codex7.p.rapidapi.com';
  private readonly baseUrl = `https://${this.rapidApiHost}/run`;

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  supportsLanguage(language: string): boolean {
    return !!LANGUAGE_MAP[language]?.codex;
  }

  async run(input: CodeExecutionInput): Promise<CodeExecutionOutput> {
    const mapping = LANGUAGE_MAP[input.language]?.codex;
    if (!mapping) {
      throw new Error(`CodeX has no mapping for language: ${input.language}`);
    }

    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': this.apiKey as string,
        'X-RapidAPI-Host': this.rapidApiHost,
      },
      body: JSON.stringify({
        language: mapping.language,
        code: input.code,
        input: input.stdin ?? '',
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`CodeX returned status ${res.status}: ${text.slice(0, 200)}`);
    }

    const data = (await res.json()) as CodeXResponse;

    logger.info({ provider: 'codex', statusCode: data.statusCode }, 'CodeX execution completed');

    return {
      stdout: data.stdout ?? data.output ?? '',
      stderr: data.stderr ?? data.error ?? '',
      exitCode: data.error || data.stderr ? 1 : 0,
      timedOut: false,
      providerUsed: this.id,
    };
  }
}

export const codexProvider = new CodeXProvider();