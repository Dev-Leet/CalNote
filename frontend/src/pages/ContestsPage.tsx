
import { useContestsQuery } from '../queries/useContestsQuery';
import { ContestList } from '../components/contests/ContestList';
import { ContestVM } from '../components/contests/ContestCard';
import { ContestDto } from '../types/shared';

function toVM(dto: ContestDto): ContestVM {
  return {
    id: dto._id,
    platform: dto.platform,
    name: dto.name,
    startTime: dto.startTime,
    endTime: dto.endTime,
    url: dto.url,
    durationMinutes: dto.durationMinutes,
  };
}

export function ContestsPage() {
  // Previously this page had its own inline fetchContests + useQuery,
  // duplicating useContestsQuery (which itself already wraps contestsApi.list
  // with the correct ~25min staleTime). Now delegates to the shared hook.
  const { data: contestDtos = [], isLoading } = useContestsQuery();
  const contests = contestDtos.map(toVM);

  const handleScheduleAround = (contest: ContestVM) => {
    // Still a stub — pre-filling AiChatPanel's prompt from here needs a
    // shared "draftPrompt" store or router state, which wasn't in scope for
    // this refactor pass. Flagged previously; still open.
    console.log('Schedule around contest:', contest.name);
  };

  return (
    <div>
      <h1 style={{ color: 'var(--color-text-primary)', fontSize: '22px', marginBottom: '16px' }}>
        Upcoming Contests
      </h1>
      <ContestList contests={contests} isLoading={isLoading} onScheduleAround={handleScheduleAround} />
    </div>
  );
}

export default ContestsPage;