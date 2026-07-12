
import { CodeExecutionPanel } from '../components/code/CodeExecutionPanel';

export function CodePage() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h1 style={{ color: 'var(--color-text-primary)', fontSize: '22px', margin: 0 }}>Code Execution</h1>
      <div style={{ flex: 1, minHeight: '600px' }}>
        <CodeExecutionPanel />
      </div>
    </div>
  );
}

export default CodePage;