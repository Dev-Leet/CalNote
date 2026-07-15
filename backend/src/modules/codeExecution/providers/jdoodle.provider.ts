import { ICodeExecutionProvider, CodeExecutionInput, CodeExecutionOutput } from './ICodeExecutionProvider';
import { LANGUAGE_MAP } from '../languageMap';
import { logger } from '../../../utils/logger';

interface JDoodleResponse {
  output: string;
  statusCode: number;
  memory?: string;
  cpuTime?: string;
  error?: string | null;
  isExecutionSuccess?: boolean;
  isCompiled?: boolean;
}

export class JDoodleProvider implements ICodeExecutionProvider {
  readonly id = 'jdoodle';
  private readonly clientId = process.env.JDOODLE_CLIENT_ID;
  private readonly clientSecret = process.env.JDOODLE_CLIENT_SECRET;
  private readonly baseUrl = 'https://api.jdoodle.com/v1/execute';

  isConfigured(): boolean {
    return !!this.clientId && !!this.clientSecret;
  }

  supportsLanguage(language: string): boolean {
    return !!LANGUAGE_MAP[language]?.jdoodle;
  }

  async run(input: CodeExecutionInput): Promise<CodeExecutionOutput> {
    const mapping = LANGUAGE_MAP[input.language]?.jdoodle;
    if (!mapping) {
      throw new Error(`JDoodle has no mapping for language: ${input.language}`);
    }

    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: this.clientId,
        clientSecret: this.clientSecret,
        script: input.code,
        stdin: input.stdin ?? '',
        language: mapping.language,
        versionIndex: mapping.versionIndex,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`JDoodle returned status ${res.status}: ${text.slice(0, 200)}`);
    }

    const data = (await res.json()) as JDoodleResponse;

    if (data.statusCode !== 200 && data.isExecutionSuccess === false && !data.output) {
      throw new Error(`JDoodle execution failed: ${data.error ?? 'unknown error'}`);
    }

    logger.info({ provider: 'jdoodle', memory: data.memory, cpuTime: data.cpuTime }, 'JDoodle execution completed');

    const executionFailed = data.isExecutionSuccess === false;

    return {
      stdout: executionFailed ? '' : data.output,
      stderr: executionFailed ? data.output : '',
      exitCode: executionFailed ? 1 : 0,
      timedOut: false,
      providerUsed: this.id,
    };
  }
}

export const jdoodleProvider = new JDoodleProvider();