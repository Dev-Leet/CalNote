// apps/api/src/services/ashnaService.ts
// Ashna AI integration for contest prep note generation

import axios from 'axios';
import { config } from '../config/env';
import { ServiceUnavailableError } from '../middlewares/errorHandler';

interface AshnaNoteContext {
  contestName: string;
  platform: string;
  startTime: Date;
  duration: number;
  url: string;
  skillLevel: string;
  userPrompt?: string;
}

interface AshnaNoteResult {
  content: string;
  model: string;
}

function extractContent(payload: unknown): string | null {
  if (typeof payload === 'string' && payload.trim()) {
    return payload.trim();
  }

  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const directCandidates = [
    record.content,
    record.response,
    record.output,
    record.result,
    record.message,
  ];

  for (const candidate of directCandidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  if (record.data && typeof record.data === 'object') {
    return extractContent(record.data);
  }

  return null;
}

export async function callAshnaNotesAgent(context: AshnaNoteContext): Promise<AshnaNoteResult> {
  const apiKey = config.ai.ashnaKey?.trim();
  const notesAgentUrl = config.ai.ashnaNotesUrl?.trim();

  if (!apiKey || !notesAgentUrl) {
    throw new ServiceUnavailableError('Ashna AI is not configured');
  }

  const response = await axios.post(
    notesAgentUrl,
    {
      contest: {
        contestName: context.contestName,
        platform: context.platform,
        startTime: context.startTime.toISOString(),
        duration: context.duration,
        url: context.url,
      },
      prompt:
        context.userPrompt ||
        `Generate contest preparation notes for a ${context.skillLevel} competitive programmer.`,
      skillLevel: context.skillLevel,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }
  );

  const content = extractContent(response.data);
  if (!content) {
    throw new ServiceUnavailableError('Ashna AI returned an empty response');
  }

  const model =
    typeof response.data?.model === 'string' && response.data.model.trim()
      ? response.data.model.trim()
      : 'ashna-agent';

  return { content, model };
}
