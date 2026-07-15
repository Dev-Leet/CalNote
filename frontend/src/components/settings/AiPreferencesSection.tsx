import React, { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { useAiProviderStore } from '../../stores/aiProviderStore';
import { UserPreferencesDto } from '../../types/shared';

interface UpdatePreferencesPayload {
  defaultAiProvider?: 'ashna' | 'custom';
  customAiConfig?: { endpoint: string; apiKey: string; model: string };
}

async function savePreferences(payload: UpdatePreferencesPayload): Promise<UserPreferencesDto> {
  const { data } = await apiClient.patch<{ preferences: UserPreferencesDto }>('/users/me/preferences', payload);
  return data.preferences;
}

interface AiPreferencesSectionProps {
  preferences: UserPreferencesDto;
}

export function AiPreferencesSection({ preferences }: AiPreferencesSectionProps) {
  const queryClient = useQueryClient();
  const setGlobalProvider = useAiProviderStore((s) => s.setProvider);

  const [defaultProvider, setDefaultProvider] = useState<'ashna' | 'custom'>(preferences.defaultAiProvider);
  const [geminiEndpoint, setGeminiEndpoint] = useState(preferences.customAiConfig?.endpoint ?? '');
  const [geminiModel, setGeminiModel] = useState(preferences.customAiConfig?.model ?? 'gemini-2.5-flash');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    setDefaultProvider(preferences.defaultAiProvider);
    if (preferences.customAiConfig) {
      setGeminiEndpoint(preferences.customAiConfig.endpoint);
      setGeminiModel(preferences.customAiConfig.model);
    }
  }, [preferences]);

  const flashSaved = (message: string) => {
    setSavedMessage(message);
    setTimeout(() => setSavedMessage(null), 3000);
  };

  const { mutate: mutateDefaultProvider, isPending: isSavingProvider } = useMutation({
    mutationFn: savePreferences,
    onSuccess: (data) => {
      queryClient.setQueryData(['preferences'], data);
      setGlobalProvider(data.defaultAiProvider);
      flashSaved('Default AI provider saved');
    },
    onError: () => flashSaved('Failed to save — please try again'),
  });

  const { mutate: mutateGemini, isPending: isSavingGemini } = useMutation({
    mutationFn: savePreferences,
    onSuccess: (data) => {
      queryClient.setQueryData(['preferences'], data);
      setGeminiApiKey('');
      flashSaved('Custom AI Agent configuration saved');
    },
    onError: () => flashSaved('Failed to save — please try again'),
  });

  const handleSaveProvider = (e: React.FormEvent) => {
    e.preventDefault();
    mutateDefaultProvider({ defaultAiProvider: defaultProvider });
  };

  const handleSaveGemini = (e: React.FormEvent) => {
    e.preventDefault();
    if (!geminiApiKey.trim()) return;
    mutateGemini({ customAiConfig: { endpoint: geminiEndpoint, apiKey: geminiApiKey, model: geminiModel } });
  };

  return (
    <div className="flex flex-col gap-5">
      {savedMessage && (
        <div className="rounded-md bg-success px-3.5 py-2.5 text-[13px] text-bg-primary">{savedMessage}</div>
      )}

      <form onSubmit={handleSaveProvider} className="flex flex-col gap-4 rounded-lg bg-bg-surface p-5">
        <h2 className="m-0 text-base text-text-primary">Default AI Provider</h2>

        <label className="flex flex-col gap-1.5 text-[13px] text-text-secondary">
          Provider
          <select
            value={defaultProvider}
            onChange={(e) => setDefaultProvider(e.target.value as 'ashna' | 'custom')}
            className="w-full rounded-sm bg-bg-elevated px-3 py-2.5 text-sm text-text-primary"
          >
            <option value="ashna">Ashna AI</option>
            <option value="custom">Custom AI Agent</option>
          </select>
        </label>

        <button
          type="submit"
          disabled={isSavingProvider}
          className={`self-start rounded-pill bg-accent-ashna px-5 py-2.5 text-sm font-semibold text-bg-primary ${
            isSavingProvider ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
          }`}
        >
          {isSavingProvider ? 'Saving…' : 'Save Provider'}
        </button>
      </form>

      <form onSubmit={handleSaveGemini} className="flex flex-col gap-4 rounded-lg bg-bg-surface p-5">
        <h2 className="m-0 text-base text-text-primary">Custom AI Agent (Gemini) Configuration</h2>
        {preferences.customAiConfig?.hasApiKey && (
          <p className="m-0 text-xs text-success">
            An API key is currently configured. Submitting a new key below will replace it.
          </p>
        )}

        <label className="flex flex-col gap-1.5 text-[13px] text-text-secondary">
          Model
          <select
            value={geminiModel}
            onChange={(e) => setGeminiModel(e.target.value)}
            className="w-full rounded-sm bg-bg-elevated px-3 py-2.5 text-sm text-text-primary"
          >
            <option value="gemini-2.5-flash">gemini-2.5-flash (fast, default)</option>
            <option value="gemini-2.5-pro">gemini-2.5-pro (complex reasoning)</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-[13px] text-text-secondary">
          Endpoint
          <input
            type="url"
            placeholder="https://generativelanguage.googleapis.com"
            value={geminiEndpoint}
            onChange={(e) => setGeminiEndpoint(e.target.value)}
            className="w-full rounded-sm bg-bg-elevated px-3 py-2.5 text-sm text-text-primary"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-[13px] text-text-secondary">
          API Key
          <input
            type="password"
            placeholder="Enter to set or replace your Gemini API key"
            value={geminiApiKey}
            onChange={(e) => setGeminiApiKey(e.target.value)}
            autoComplete="off"
            className="w-full rounded-sm bg-bg-elevated px-3 py-2.5 text-sm text-text-primary"
          />
        </label>
        <p className="m-0 text-xs text-text-secondary">
          Your key is encrypted before storage and never displayed again — this field is write-only.
        </p>

        <button
          type="submit"
          disabled={isSavingGemini || !geminiApiKey.trim()}
          className={`self-start rounded-pill bg-accent-ashna px-5 py-2.5 text-sm font-semibold text-bg-primary ${
            isSavingGemini || !geminiApiKey.trim() ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
          }`}
        >
          {isSavingGemini ? 'Saving…' : 'Save Custom AI Config'}
        </button>
      </form>
    </div>
  );
}

export default AiPreferencesSection;