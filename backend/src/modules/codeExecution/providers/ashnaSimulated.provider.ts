import { ICodeExecutionProvider, CodeExecutionInput, CodeExecutionOutput } from './ICodeExecutionProvider';
import { ashnaClient } from '../../ai/providers/ashna.client';
import { ASHNA_SIMULATED_EXECUTION_SYSTEM_PROMPT } from '../../ai/simulatedExecution.prompts';
import { z } from 'zod';
import { logger } from '../../../utils/logger';

const simulatedResponseSchema = z.object({
  stdout: z.string(),
  stderr: z.string(),
  exitCodeGuess: z.number(),
  explanation: z.string(),
});

/**
 * The 4th and final fallback tier. Uses ASHNA_NOTES_CODE_MODEL_ID (the same
 * underlying agent config as Notes/Code Q&A) but with a completely
 * different, isolated system prompt for this specific task — per explicit
 * instruction not to integrate this into the existing agent's behavior.
 * Always sets isSimulated: true so the UI can never present this as if a
 * real sandbox ran the code.
 */
export class AshnaSimulatedExecutionProvider implements ICodeExecutionProvider {
  readonly id = 'ashna-simulated';
  private readonly modelId = process.env.ASHNA_NOTES_CODE_MODEL_ID;

  isConfigured(): boolean {
    return !!this.modelId && !!process.env.ASHNA_API_KEY;
  }

  supportsLanguage(): boolean {
    return true; // last resort — attempt reasoning about any language
  }

  async run(input: CodeExecutionInput): Promise<CodeExecutionOutput> {
    const userPayload = JSON.stringify({
      language: input.language,
      code: input.code,
      stdin: input.stdin ?? '',
    });

    const response = await ashnaClient.chatCompletion({
      model: this.modelId as string,
      messages: [
        { role: 'system', content: ASHNA_SIMULATED_EXECUTION_SYSTEM_PROMPT },
        { role: 'user', content: userPayload },
      ],
      temperature: 0.2,
      max_tokens: 800,
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Ashna AI simulated execution returned an empty response');
    }

    const stripped = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = simulatedResponseSchema.safeParse(JSON.parse(stripped));

    if (!parsed.success) {
      logger.error({ issues: parsed.error.issues }, 'Ashna simulated execution response failed validation');
      throw new Error('Ashna AI simulated execution returned malformed output');
    }

    return {
      stdout: parsed.data.stdout,
      stderr: parsed.data.stderr ? `${parsed.data.stderr}\n\n[AI note: ${parsed.data.explanation}]` : `[AI note: ${parsed.data.explanation}]`,
      exitCode: parsed.data.exitCodeGuess,
      timedOut: false,
      providerUsed: this.id,
      isSimulated: true,
    };
  }
}

export const ashnaSimulatedExecutionProvider = new AshnaSimulatedExecutionProvider();