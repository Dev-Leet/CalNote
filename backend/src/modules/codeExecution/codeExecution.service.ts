import { ICodeExecutionProvider, CodeExecutionInput, CodeExecutionOutput } from './providers/ICodeExecutionProvider';
import { jdoodleProvider } from './providers/jdoodle.provider';
import { oneCompilerProvider } from './providers/onecompiler.provider';
import { codexProvider } from './providers/codex.provider';
import { ashnaSimulatedExecutionProvider } from './providers/ashnaSimulated.provider';
import { LANGUAGE_MAP, isKnownLanguage } from './languageMap';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';

const PROVIDER_CASCADE: ICodeExecutionProvider[] = [
  jdoodleProvider,
  oneCompilerProvider,
  codexProvider,
  ashnaSimulatedExecutionProvider,
];

export class CodeExecutionService {
  getSupportedLanguages(): { language: string; label: string }[] {
    return Object.entries(LANGUAGE_MAP).map(([language, mapping]) => ({ language, label: mapping.label }));
  }

  async runCode(input: CodeExecutionInput): Promise<CodeExecutionOutput> {
    if (!input.code.trim()) {
      throw new AppError('VALIDATION_ERROR', 400, 'code must not be empty');
    }
    if (!isKnownLanguage(input.language)) {
      throw new AppError('VALIDATION_ERROR', 400, `Unsupported language: ${input.language}`);
    }

    const attempts: { provider: string; error: string }[] = [];

    for (const provider of PROVIDER_CASCADE) {
      if (!provider.isConfigured()) continue;
      if (!provider.supportsLanguage(input.language)) continue;

      try {
        const result = await provider.run(input);
        if (attempts.length > 0) {
          logger.info({ succeededProvider: provider.id, priorFailures: attempts }, 'Code execution succeeded after fallback');
        }
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        attempts.push({ provider: provider.id, error: message });
        logger.warn({ provider: provider.id, error: message }, 'Code execution provider failed, trying next in cascade');
      }
    }

    throw new AppError(
      'AI_PROVIDER_ERROR',
      502,
      attempts.length === 0
        ? 'No code execution provider is configured for this language. Check JDOODLE/ONECOMPILER/CODEX env vars.'
        : `All code execution providers failed for this request. Attempts: ${attempts.map((a) => `${a.provider} (${a.error})`).join('; ')}`,
    );
  }
}

export const codeExecutionService = new CodeExecutionService();