import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi, SleepScheduleResult } from '../api/events.api';

interface PendingRegeneration {
  futureCount: number;
}

export function useSleepScheduleSync() {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<PendingRegeneration | null>(null);
  const [lastResult, setLastResult] = useState<SleepScheduleResult | null>(null);

  const invalidateEvents = () => queryClient.invalidateQueries({ queryKey: ['events'] });

  const { mutate: generateMutate, isPending: isGenerating } = useMutation({
    mutationFn: eventsApi.generateSleepSchedule,
    onSuccess: (result) => {
      setLastResult(result);
      invalidateEvents();
    },
  });

  const { mutate: regenerateMutate, isPending: isRegenerating } = useMutation({
    mutationFn: eventsApi.regenerateSleepSchedule,
    onSuccess: (result) => {
      setLastResult(result);
      setPending(null);
      invalidateEvents();
    },
  });

  /**
   * Called after the user saves a sleep-window change in Settings. First
   * checks whether any future auto-sleep blocks already exist under the
   * OLD window — if none, it's safe to just generate fresh ones straight
   * away (this is the "automatic" 10-day seeding for a brand-new
   * preference). If some already exist, it stops and surfaces the count
   * for explicit confirmation instead of silently overwriting — this is
   * the "adjust after asking" requirement.
   */
  const syncAfterPreferenceChange = useCallback(async () => {
    const futureCount = await eventsApi.getFutureSleepBlockCount();
    if (futureCount === 0) {
      generateMutate();
    } else {
      setPending({ futureCount });
    }
  }, [generateMutate]);

  const confirmRegeneration = useCallback(() => {
    regenerateMutate();
  }, [regenerateMutate]);

  const cancelRegeneration = useCallback(() => setPending(null), []);

  return {
    syncAfterPreferenceChange,
    pending,
    confirmRegeneration,
    cancelRegeneration,
    isGenerating,
    isRegenerating,
    lastResult,
    dismissResult: () => setLastResult(null),
  };
}