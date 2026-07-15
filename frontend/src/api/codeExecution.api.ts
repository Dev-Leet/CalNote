import apiClient from './client';

export interface LanguageOption {
  language: string;
  label: string;
}

export interface RunCodePayload {
  language: string;
  code: string;
  stdin?: string;
}

export interface RunCodeResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut: boolean;
  providerUsed: string;
  isSimulated?: boolean;
}

export const codeExecutionApi = {
  async listRuntimes(): Promise<LanguageOption[]> {
    const { data } = await apiClient.get<{ languages: LanguageOption[] }>('/code-execution/runtimes');
    return data.languages;
  },

  async run(payload: RunCodePayload): Promise<RunCodeResult> {
    const { data } = await apiClient.post<RunCodeResult>('/code-execution/run', payload);
    return data;
  },
};