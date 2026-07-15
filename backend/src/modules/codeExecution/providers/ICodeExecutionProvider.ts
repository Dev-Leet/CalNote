export interface CodeExecutionInput {
  language: string; // our internal canonical language id, e.g. "python", "cpp"
  code: string;
  stdin?: string;
}

export interface CodeExecutionOutput {
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut: boolean;
  providerUsed: string;
  /** Set only by the Ashna AI simulated-execution fallback — every real
   *  provider leaves this undefined. The frontend uses this to render a
   *  clear "simulated, not real execution" disclaimer rather than
   *  presenting AI-guessed output as if a sandbox actually ran it. */
  isSimulated?: boolean;
}

/**
 * Strategy interface for the code-execution provider cascade. Each
 * implementation is tried in order (see codeExecution.service.ts); a
 * provider that isn't configured (missing API key) or fails at runtime is
 * skipped in favor of the next one, rather than failing the whole request.
 */
export interface ICodeExecutionProvider {
  readonly id: string;
  isConfigured(): boolean;
  supportsLanguage(language: string): boolean;
  run(input: CodeExecutionInput): Promise<CodeExecutionOutput>;
}