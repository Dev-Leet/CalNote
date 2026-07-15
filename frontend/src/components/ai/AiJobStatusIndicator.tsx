import { useEffect } from 'react';
import { useAiJobStatusQuery } from '../../queries/useAiJobStatusQuery';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface AiJobStatusIndicatorProps {
  jobId: string;
  onComplete?: () => void;
}

export function AiJobStatusIndicator({ jobId, onComplete }: AiJobStatusIndicatorProps) {
  const { data, isLoading } = useAiJobStatusQuery(jobId);

  useEffect(() => {
    if (data?.status === 'complete') {
      onComplete?.();
    }
  }, [data?.status, onComplete]);

  if (isLoading || !data || data.status === 'pending') {
    return <LoadingSpinner size={16} label="Still generating your schedule…" />;
  }

  if (data.status === 'failed') {
    return <p className="m-0 text-[13px] text-danger">{data.error ?? 'The AI request failed. Please try again.'}</p>;
  }

  return <p className="m-0 text-[13px] text-success">Schedule ready — check your calendar.</p>;
}

export default AiJobStatusIndicator;