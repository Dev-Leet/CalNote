import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { eventsApi, CreateEventPayload } from '../api/events.api';
import { ConflictingEventSummary } from '../components/calendar/ConflictWarningModal';

interface ConflictErrorBody {
  code: 'CONFLICT_DETECTED';
  message: string;
  details?: { conflictingEventIds: string[] };
}

export function useCreateEventWithConflictCheck() {
  const queryClient = useQueryClient();
  const [pendingPayload, setPendingPayload] = useState<CreateEventPayload | null>(null);
  const [conflicts, setConflicts] = useState<ConflictingEventSummary[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  const { mutate: createMutate, isPending } = useMutation({
    mutationFn: (payload: CreateEventPayload) => eventsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setIsModalOpen(false);
      setPendingPayload(null);
    },
  });

  const attemptCreate = useCallback(
    (payload: CreateEventPayload) => {
      setAdjustError(null);
      createMutate(payload, {
        onError: (err) => {
          const axiosErr = err as AxiosError<ConflictErrorBody>;
          if (axiosErr.response?.status === 409 && axiosErr.response.data?.code === 'CONFLICT_DETECTED') {
            // We don't have full conflicting-event details from this
            // response shape (just IDs) — a fuller UX would fetch each
            // conflicting event's title/time to display; kept minimal
            // here since the modal's core job (offer the three choices)
            // doesn't strictly require it.
            const ids = axiosErr.response.data.details?.conflictingEventIds ?? [];
            setConflicts(ids.map((id) => ({ id, title: 'Existing event', startTime: '', endTime: '' })));
            setPendingPayload(payload);
            setIsModalOpen(true);
          }
        },
      });
    },
    [createMutate],
  );

  const cancel = useCallback(() => {
    setIsModalOpen(false);
    setPendingPayload(null);
    setAdjustError(null);
  }, []);

  const allowOverlap = useCallback(() => {
    if (!pendingPayload) return;
    createMutate({ ...pendingPayload, force: true });
  }, [pendingPayload, createMutate]);

  const adjustSchedule = useCallback(async () => {
    if (!pendingPayload) return;
    setIsAdjusting(true);
    setAdjustError(null);
    try {
      const suggestion = await eventsApi.suggestSlot(pendingPayload.startTime, pendingPayload.endTime);
      if (!suggestion.found) {
        setAdjustError('No free slot was found later that day. Try a different day, or allow the overlap.');
        return;
      }
      createMutate({ ...pendingPayload, startTime: suggestion.startTime, endTime: suggestion.endTime });
    } finally {
      setIsAdjusting(false);
    }
  }, [pendingPayload, createMutate]);

  return {
    attemptCreate,
    isModalOpen,
    conflicts,
    isPending,
    isAdjusting,
    adjustError,
    cancel,
    allowOverlap,
    adjustSchedule,
  };
}