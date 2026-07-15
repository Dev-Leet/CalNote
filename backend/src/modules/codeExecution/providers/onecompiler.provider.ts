import { ICodeExecutionProvider, CodeExecutionInput, CodeExecutionOutput } from './ICodeExecutionProvider';
import { LANGUAGE_MAP } from '../languageMap';
import { logger } from '../../../utils/logger';

interface OneCompilerResponse {
  status: string;
  exception: string | null;
  stdout: string | null;
  stderr: string | null;
  executionTime: number;
}

const FILE_NAME_BY_LANGUAGE: Record<string, string> = {
  python: 'main.py',
  cpp: 'main.cpp',
  java: 'Main.java',
  javascript: 'main.js',
  typescript: 'main.ts',
  go: 'main.go',
  rust: 'main.rs',
  c: 'main.c',
};

/**
 * OneCompiler's /v1/run endpoint (api.onecompiler.com, X-API-Key header —
 * their direct API, not the RapidAPI marketplace listing which uses a
 * different auth style). Confirmed against their published API docs.
 */
export class OneCompilerProvider implements ICodeExecutionProvider {
  readonly id = 'onecompiler';
  private readonly apiKey = process.env.ONECOMPILER_API_KEY;
  private readonly baseUrl = 'https://api.onecompiler.com/v1/run';

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  supportsLanguage(language: string): boolean {
    return !!LANGUAGE_MAP[language]?.onecompiler;
  }

  async run(input: CodeExecutionInput): Promise<CodeExecutionOutput> {
    const mapping = LANGUAGE_MAP[input.language]?.onecompiler;
    if (!mapping) {
      throw new Error(`OneCompiler has no mapping for language: ${input.language}`);
    }

    const fileName = FILE_NAME_BY_LANGUAGE[input.language] ?? 'main.txt';

    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey as string,
      },
      body: JSON.stringify({
        language: mapping.language,
        stdin: input.stdin ?? '',
        files: [{ name: fileName, content: input.code }],
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`OneCompiler returned status ${res.status}: ${text.slice(0, 200)}`);
    }

    const data = (await res.json()) as OneCompilerResponse;

    logger.info({ provider: 'onecompiler', executionTime: data.executionTime, status: data.status }, 'OneCompiler execution completed');

    return {
      stdout: data.stdout ?? '',
      stderr: data.stderr ?? data.exception ?? '',
      exitCode: data.status === 'success' ? 0 : 1,
      timedOut: false,
      providerUsed: this.id,
    };
  }
}

export const oneCompilerProvider = new OneCompilerProvider();