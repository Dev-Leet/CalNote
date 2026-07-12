import apiClient from './client';

export interface RuntimeOption {
  language: string;
  version: string;
}

export interface RunCodePayload {
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

export const codeExecutionApi = {
  async listRuntimes(): Promise<RuntimeOption[]> {
    const { data } = await apiClient.get<{ runtimes: RuntimeOption[] }>('/code-execution/runtimes');
    return data.runtimes;
  },

  async run(payload: RunCodePayload): Promise<RunCodeResult> {
    const { data } = await apiClient.post<RunCodeResult>('/code-execution/run', payload);
    return data;
  },
};