import { AiProvider, AiProviderId } from './IAiSchedulerProvider';
import { AshnaAiService } from './providers/AshnaAiService';
import { GeminiAiService } from './providers/GeminiAiService';
import { geminiClient } from './providers/gemini.client';

/**
 * Single resolution point for AI provider selection.
 * No other module — controller, queue worker, or frontend — should know
 * that "custom" currently maps to Gemini. That mapping lives here only,
 * satisfying SRS constraint 3.4.2.
 */
export class AiProviderFactory {
  private static ashnaInstance: AshnaAiService | null = null;
  private static geminiInstance: GeminiAiService | null = null;

  static resolve(providerFlag: AiProviderId): AiProvider {
    switch (providerFlag) {
      case 'ashna':
        if (!this.ashnaInstance) {
          this.ashnaInstance = new AshnaAiService();
        }
        return this.ashnaInstance;

      case 'custom':
        if (!this.geminiInstance) {
          this.geminiInstance = new GeminiAiService(geminiClient);
        }
        return this.geminiInstance;

      default: {
        // Exhaustiveness check — TypeScript strict mode flags this if a new
        // provider is added to the AiProviderId union without a case here.
        const _exhaustive: never = providerFlag;
        throw new Error(`Unsupported AI provider: ${String(_exhaustive)}`);
      }
    }
  }
}
