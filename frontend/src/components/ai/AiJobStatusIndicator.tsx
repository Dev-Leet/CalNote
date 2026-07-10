import React from 'react';
import { useAiJobStatusQuery } from '../../queries/useAiJobStatusQuery';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface AiJobStatusIndicatorProps {
  jobId: string;
  onComplete?: () => void;
}

/**
 * Renders live status for the async AI-schedule job queue path (Custom AI
 * Agent requests exceeding the sync timeout). Intended for use inside
 * AiChatPanel's message list when a 202 response is received — replaces the
 * static "This is taking a bit longer…" placeholder text with real polling.
 */
export function AiJobStatusIndicator({ jobId, onComplete }: AiJobStatusIndicatorProps) {
  const { data, isLoading } = useAiJobStatusQuery(jobId);

  React.useEffect(() => {
    if (data?.status === 'complete') {
      onComplete?.();
    }
  }, [data?.status, onComplete]);

  if (isLoading || !data || data.status === 'pending') {
    return <LoadingSpinner size={16} label="Still generating your schedule…" />;
  }

  if (data.status === 'failed') {
    return (
      <p style={{ fontSize: '13px', color: 'var(--color-danger)', margin: 0 }}>
        {data.error ?? 'The AI request failed. Please try again.'}
      </p>
    );
  }

  return (
    <p style={{ fontSize: '13px', color: 'var(--color-success)', margin: 0 }}>
      Schedule ready — check your calendar.
    </p>
  );
}

export default AiJobStatusIndicator;
