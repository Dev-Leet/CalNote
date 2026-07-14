import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';

const PISTON_BASE_URL = 'https://emkc.org/api/v2/piston';
const RUNTIMES_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour — runtime list changes rarely

export interface PistonRuntime {
  language: string;
  version: string;
  aliases: string[];
}

export interface RunCodeInput {
  language: string;
  code: string;
  stdin?: string;
}

export interface RunCodeResult {
  language: string;
  version: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut: boolean;
}

interface PistonExecuteResponse {
  language: string;
  version: string;
  run: {
    stdout: string;
    stderr: string;
    code: number;
    signal: string | null;
  };
  compile?: {
    stdout: string;
    stderr: string;
    code: number;
  };
}

export class CodeExecutionService {
  private runtimesCache: { data: PistonRuntime[]; fetchedAt: number } | null = null;

  /**
   * Fetches and caches Piston's supported runtime list, so the frontend's
   * language dropdown always reflects what's actually executable, and
   * runCode() can resolve "python" -> the correct exact version string
   * Piston requires, without either side hardcoding version numbers.
   */
  async getRuntimes(forceRefresh = false): Promise<PistonRuntime[]> {
    const now = Date.now();
    if (!forceRefresh && this.runtimesCache && now - this.runtimesCache.fetchedAt < RUNTIMES_CACHE_TTL_MS) {
      return this.runtimesCache.data;
    }

    try {
      const res = await fetch(`${PISTON_BASE_URL}/runtimes`);
      if (!res.ok) {
        throw new Error(`Piston runtimes endpoint returned status ${res.status}`);
      }
      const data = (await res.json()) as PistonRuntime[];
      this.runtimesCache = { data, fetchedAt: now };
      return data;
    } catch (err) {
      logger.error({ err }, 'Failed to fetch Piston runtimes');
      // Serve stale cache rather than failing outright, if we have one —
      // better a slightly outdated language list than a broken dropdown.
      if (this.runtimesCache) return this.runtimesCache.data;
      throw new AppError('AI_PROVIDER_ERROR', 502, 'Could not reach code execution service');
    }
  }

  async runCode(input: RunCodeInput): Promise<RunCodeResult> {
    if (!input.code.trim()) {
      throw new AppError('VALIDATION_ERROR', 400, 'code must not be empty');
    }

    let runtimes = await this.getRuntimes();
    let match = runtimes.find((r) => r.language === input.language || r.aliases.includes(input.language));

    if (!match) {
      throw new AppError('VALIDATION_ERROR', 400, `Unsupported language: ${input.language}`);
    }

    // First attempt uses the (possibly hour-stale) cached version string.
    // If Piston later rejects it as an unknown language/version pair
    // (their instance updates runtime versions periodically), force a fresh
    // fetch once and retry — cheaper than making every request pay a fresh
    // network round-trip, but self-healing when the cache genuinely drifts.
    const executeOnce = () =>
      fetch(`${PISTON_BASE_URL}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: match!.language,
          version: match!.version,
          files: [{ content: input.code }],
          stdin: input.stdin ?? '',
        }),
      });

    let response: Response;
    try {
      response = await executeOnce();
      if (response.status === 400) {
        runtimes = await this.getRuntimes(true);
        const refreshedMatch = runtimes.find((r) => r.language === input.language || r.aliases.includes(input.language));
        if (refreshedMatch && refreshedMatch.version !== match.version) {
          match = refreshedMatch;
          response = await executeOnce();
        }
      }
    } catch (err) {
      logger.error({ err }, 'Piston execute request failed to send');
      throw new AppError('AI_PROVIDER_ERROR', 502, 'Failed to reach code execution service');
    }
/* 
    //let response: Response;
    try {
      response = await fetch(`${PISTON_BASE_URL}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: match.language,
          version: match.version,
          files: [{ content: input.code }],
          stdin: input.stdin ?? '',
          // Piston's own defaults are already reasonable (10s CPU / wall
          // limits per run) — not overriding them here, just being explicit
          // that this app relies on Piston's own sandboxing/timeout, not a
          // second layer of enforcement on our side.
        }),
      });
    } catch (err) {
      logger.error({ err }, 'Piston execute request failed to send');
      throw new AppError('AI_PROVIDER_ERROR', 502, 'Failed to reach code execution service');
    }
 */
    if (!response.ok) {
      let message = `Code execution service returned status ${response.status}`;
      try {
        const body = (await response.json()) as { message?: string };
        if (body.message) message = body.message;
      } catch {
        // non-JSON error body — fall back to the generic status message
      }
      logger.error({ status: response.status, message, language: match.language, version: match.version }, 'Piston execute request failed');
      throw new AppError('AI_PROVIDER_ERROR', 502, message);
    }

    const data = (await response.json()) as PistonExecuteResponse;

    // A non-empty compile.stderr with a nonzero compile.code means it never
    // reached the run stage (e.g. a C++ syntax error) — surface that instead
    // of the (empty/misleading) run output.
    if (data.compile && data.compile.code !== 0) {
      return {
        language: data.language,
        version: data.version,
        stdout: data.compile.stdout,
        stderr: data.compile.stderr,
        exitCode: data.compile.code,
        timedOut: false,
      };
    }

    return {
      language: data.language,
      version: data.version,
      stdout: data.run.stdout,
      stderr: data.run.stderr,
      exitCode: data.run.code,
      timedOut: data.run.signal === 'SIGKILL',
    };
  }
}

export const codeExecutionService = new CodeExecutionService();