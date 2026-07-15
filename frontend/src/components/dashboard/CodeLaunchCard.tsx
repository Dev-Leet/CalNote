
import { Code2 } from 'lucide-react';
import { DashboardCard } from './DashboardCard';

export function CodeLaunchCard() {
  return (
    <DashboardCard title="Code Execution" icon={Code2} viewAllHref="/code" viewAllLabel="Open editor">
      <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
        <Code2 size={28} className="text-text-secondary" strokeWidth={1.5} />
        <p className="m-0 text-[13px] text-text-secondary">
          Run and test code snippets in 60+ languages, right from your notes or scratch.
        </p>
      </div>
    </DashboardCard>
  );
}

export default CodeLaunchCard;