import { useMemo, useState } from 'react';
import Editor, { BeforeMount } from '@monaco-editor/react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Play, Terminal } from 'lucide-react';
import { codeExecutionApi } from '../../api/codeExecution.api';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useThemeStore } from '../../stores/themeStore';

/**
 * Resolves the CSS custom properties tokens.css defines into raw hex/rgba
 * strings — Monaco's defineTheme API requires literal color values, it
 * cannot consume var(--...) references the way regular CSS/Tailwind can.
 * Read once at module load via getComputedStyle on <html>, which by then
 * already has tokens.css's :root block applied.
 */

//function resolveCssVar(name: string): string { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

const registerCpThemes: BeforeMount = (monaco) => {
  monaco.editor.defineTheme('cp-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#171A23', // --color-bg-surface, dark mode value
      'editor.foreground': '#E8E9ED',
      'editorLineNumber.foreground': '#8B93A7',
      'editor.lineHighlightBackground': '#1F2430',
      'editorGutter.background': '#171A23',
    },
  });

  monaco.editor.defineTheme('cp-light', {
    base: 'vs',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#FFFFFF', // --color-bg-surface, light mode value
      'editor.foreground': '#1A1D29',
      'editorLineNumber.foreground': '#6B7280',
      'editor.lineHighlightBackground': '#F1F2F5',
      'editorGutter.background': '#FFFFFF',
    },
  });
};

// A curated shortlist for the dropdown's top options — CP-relevant
// languages first. The full runtime list (60+) is still available via the
// "More languages" native <select>, this just avoids a wall of obscure
// options being the first thing a competitive programmer sees.
const FEATURED_LANGUAGES = ['python', 'cpp', 'java', 'javascript', 'typescript', 'go', 'rust'];

const MONACO_LANGUAGE_MAP: Record<string, string> = {
  python: 'python',
  cpp: 'cpp',
  java: 'java',
  javascript: 'javascript',
  typescript: 'typescript',
  go: 'go',
  rust: 'rust',
};

const DEFAULT_SNIPPETS: Record<string, string> = {
  python: '# Write your solution here\nprint("Hello, CP Calendar Pro!")\n',
  cpp: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    cout << "Hello, CP Calendar Pro!" << endl;\n    return 0;\n}\n',
  java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, CP Calendar Pro!");\n    }\n}\n',
  javascript: 'console.log("Hello, CP Calendar Pro!");\n',
};

export function CodeExecutionPanel() {
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(DEFAULT_SNIPPETS.python);
  const [stdin, setStdin] = useState('');
  const themeMode = useThemeStore((s) => s.mode);
  const monacoTheme = themeMode === 'light' ? 'cp-light' : 'cp-dark';

  const { data: runtimes = [], isLoading: isLoadingRuntimes } = useQuery({
    queryKey: ['code-runtimes'],
    queryFn: codeExecutionApi.listRuntimes,
    staleTime: 60 * 60 * 1000,
  });

  const { mutate: run, data: result, isPending, error } = useMutation({
    mutationFn: () => codeExecutionApi.run({ language, code, stdin: stdin || undefined }),
  });

  const featuredRuntimes = useMemo(
    () => runtimes.filter((r) => FEATURED_LANGUAGES.includes(r.language)),
    [runtimes],
  );
  const otherRuntimes = useMemo(
    () => runtimes.filter((r) => !FEATURED_LANGUAGES.includes(r.language)),
    [runtimes],
  );

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    // Only swap in a starter snippet if the editor still has the PREVIOUS
    // language's default (or is empty) — never clobber code the user
    // actually wrote by switching languages mid-edit.
    if (!code.trim() || Object.values(DEFAULT_SNIPPETS).includes(code)) {
      setCode(DEFAULT_SNIPPETS[newLang] ?? `// Write your ${newLang} code here\n`);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--color-bg-surface)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: '1px solid var(--color-bg-elevated)',
        }}
      >
        {isLoadingRuntimes ? (
          <LoadingSpinner size={16} />
        ) : (
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--color-bg-elevated)',
              color: 'var(--color-text-primary)',
              fontSize: '13px',
            }}
          >
            <optgroup label="Common">
              {featuredRuntimes.map((r) => (
                <option key={r.language} value={r.language}>
                  {r.language} ({r.version})
                </option>
              ))}
            </optgroup>
            <optgroup label="More languages">
              {otherRuntimes.map((r) => (
                <option key={r.language} value={r.language}>
                  {r.language} ({r.version})
                </option>
              ))}
            </optgroup>
          </select>
        )}

        <button
          type="button"
          onClick={() => run()}
          disabled={isPending}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 16px',
            borderRadius: '9999px',
            border: 'none',
            background: 'var(--color-success)',
            color: '#0B0F19',
            fontWeight: 600,
            fontSize: '13px',
            cursor: isPending ? 'not-allowed' : 'pointer',
            opacity: isPending ? 0.6 : 1,
          }}
        >
          <Play size={14} />
          {isPending ? 'Running…' : 'Run Code'}
        </button>
      </div>

      <div style={{ flex: '1 1 55%', minHeight: '200px' }}>
        <Editor
          height="100%"
          language={MONACO_LANGUAGE_MAP[language] ?? 'plaintext'}
          value={code}
          onChange={(value) => setCode(value ?? '')}
          theme={monacoTheme}
          beforeMount={registerCpThemes}
          options={{
            fontSize: 13,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </div>

      <div style={{ borderTop: '1px solid var(--color-bg-elevated)' }}>
        <label
          style={{
            display: 'block',
            padding: '8px 14px 0',
            fontSize: '11px',
            color: 'var(--color-text-secondary)',
          }}
        >
          stdin (optional)
        </label>
        <textarea
          value={stdin}
          onChange={(e) => setStdin(e.target.value)}
          rows={2}
          placeholder="Input passed to your program, if any"
          style={{
            width: '100%',
            padding: '8px 14px',
            border: 'none',
            background: 'transparent',
            color: 'var(--color-text-primary)',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div
        style={{
          flex: '1 1 30%',
          minHeight: '120px',
          borderTop: '1px solid var(--color-bg-elevated)',
          padding: '10px 14px',
          overflowY: 'auto',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
          <Terminal size={13} />
          <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Output</span>
        </div>

        {isPending && <LoadingSpinner size={16} label="Executing…" />}

        {error && (
          <p style={{ color: 'var(--color-danger)', margin: 0, whiteSpace: 'pre-wrap' }}>
            Execution failed. Please try again.
          </p>
        )}

        {result && !isPending && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {result.stdout && (
              <pre style={{ margin: 0, color: 'var(--color-text-primary)', whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}>
                {result.stdout}
              </pre>
            )}
            {result.stderr && (
              <pre style={{ margin: 0, color: 'var(--color-danger)', whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}>
                {result.stderr}
              </pre>
            )}
            {result.timedOut && (
              <p style={{ margin: 0, color: 'var(--color-warning)' }}>Execution timed out.</p>
            )}
            <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '11px' }}>
              Exit code {result.exitCode} · {result.language} {result.version}
            </p>
          </div>
        )}

        {!result && !isPending && !error && (
          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>Run your code to see output here.</p>
        )}
      </div>
    </div>
  );
}

export default CodeExecutionPanel;