import { describe, it, expect, vi } from 'vitest';

vi.mock('../../src/modules/ai/providers/gemini.client', () => ({
  geminiClient: {},
}));

vi.mock('../../src/modules/ai/providers/ashna.client', () => ({
  ashnaSdkClient: { schedule: vi.fn() },
}));

import { AiProviderFactory } from '../../src/modules/ai/AiProviderFactory';
import { AshnaAiService } from '../../src/modules/ai/providers/AshnaAiService';
import { GeminiAiService } from '../../src/modules/ai/providers/GeminiAiService';

describe('AiProviderFactory', () => {
  it('resolves "ashna" to an AshnaAiService instance', () => {
    const provider = AiProviderFactory.resolve('ashna');
    expect(provider).toBeInstanceOf(AshnaAiService);
    expect(provider.providerId).toBe('ashna');
  });

  it('resolves "custom" to a GeminiAiService instance', () => {
    const provider = AiProviderFactory.resolve('custom');
    expect(provider).toBeInstanceOf(GeminiAiService);
    expect(provider.providerId).toBe('custom');
  });

  it('returns the same singleton instance across repeated resolutions of the same provider', () => {
    const first = AiProviderFactory.resolve('ashna');
    const second = AiProviderFactory.resolve('ashna');
    expect(first).toBe(second);
  });

  it('throws for an unsupported provider flag', () => {
    // @ts-expect-error — intentionally passing an invalid value to test the exhaustiveness guard
    expect(() => AiProviderFactory.resolve('unsupported')).toThrow('Unsupported AI provider');
  });

  it('both providers satisfy the AiProvider contract shape (providerId + generateSchedule)', () => {
    const ashna = AiProviderFactory.resolve('ashna');
    const gemini = AiProviderFactory.resolve('custom');

    expect(typeof ashna.generateSchedule).toBe('function');
    expect(typeof gemini.generateSchedule).toBe('function');
    expect(['ashna', 'custom']).toContain(ashna.providerId);
    expect(['ashna', 'custom']).toContain(gemini.providerId);
  });
});
