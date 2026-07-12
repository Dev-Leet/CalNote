import React, { useMemo, useState } from 'react';
import Editor, { BeforeMount } from '@monaco-editor/react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Play, Terminal, Sparkles } from 'lucide-react';
import { codeExecutionApi } from '../../api/codeExecution.api';
import { notesAiApi } from '../../api/notesAi.api';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useThemeStore } from '../../stores/themeStore';

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

const registerCpThemes: BeforeMount = (monaco) => {
  monaco.editor.defineTheme('cp-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#171A23',
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
      'editor.background': '#FFFFFF',
      'editor.foreground': '#1A1D29',
      'editorLineNumber.foreground': '#6B7280',
      'editor.lineHighlightBackground': '#F1F2F5',
      'editorGutter.background': '#FFFFFF',
    },
  });
};

export function CodeExecutionPanel() {
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(DEFAULT_SNIPPETS.python);
  const [stdin, setStdin] = useState('');
  const [askAnswer, setAskAnswer] = useState<string | null>(null);
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

  // "Ask Ashna about this code" — reuses the Notes & Code Assistant agent
  // (Phase 1's ASHNA_NOTES_CODE_MODEL_ID) against the full editor buffer,
  // rather than requiring a text selection like NoteEditor's AiContextBox.
  const { mutate: askAshna, isPending: isAsking } = useMutation({
    mutationFn: () => notesAiApi.ask({ selectedText: code, instruction: 'explain', noteContext: `Language: ${language}` }),
    onSuccess: (data) => setAskAnswer(data.answer),
  });

  const featuredRuntimes = useMemo(() => runtimes.filter((r) => FEATURED_LANGUAGES.includes(r.language)), [runtimes]);
  const otherRuntimes = useMemo(() => runtimes.filter((r) => !FEATURED_LANGUAGES.includes(r.language)), [runtimes]);

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    if (!code.trim() || Object.values(DEFAULT_SNIPPETS).includes(code)) {
      setCode(DEFAULT_SNIPPETS[newLang] ?? `// Write your ${newLang} code here\n`);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-md bg-bg-surface">
      <div className="flex items-center justify-between border-b border-border-subtle px-3.5 py-2.5">
        {isLoadingRuntimes ? (
          <LoadingSpinner size={16} />
        ) : (
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="rounded-sm bg-bg-elevated px-2.5 py-1.5 text-[13px] text-text-primary"
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

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => askAshna()}
            disabled={isAsking || !code.trim()}
            title="Ask Ashna AI to explain this code"
            className={`flex items-center gap-1.5 rounded-pill bg-accent-ashna-tint px-3 py-1.5 text-xs font-semibold text-accent-ashna ${
              isAsking || !code.trim() ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
            }`}
          >
            <Sparkles size={13} />
            {isAsking ? 'Asking…' : 'Ask Ashna'}
          </button>

          <button
            type="button"
            onClick={() => run()}
            disabled={isPending}
            className={`flex items-center gap-1.5 rounded-pill bg-success px-4 py-1.5 text-[13px] font-semibold text-bg-primary ${
              isPending ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
            }`}
          >
            <Play size={14} />
            {isPending ? 'Running…' : 'Run Code'}
          </button>
        </div>
      </div>

      {askAnswer && (
        <div className="flex items-start gap-2 border-b border-border-subtle bg-accent-ashna-tint px-3.5 py-3">
          <Sparkles size={14} className="mt-0.5 flex-shrink-0 text-accent-ashna" />
          <div className="flex-1">
            <p className="m-0 whitespace-pre-wrap text-[13px] text-text-primary">{askAnswer}</p>
            <button
              type="button"
              onClick={() => setAskAnswer(null)}
              className="mt-1.5 p-0 text-xs text-accent-ashna"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="flex-[1_1_50%] min-h-[200px]">
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

      {/* Input section — made more prominent per explicit request: proper
          section header + border framing, rather than a bare unlabeled
          textarea easy to miss below the editor. */}
      <div className="border-t border-border-subtle bg-bg-elevated/30">
        <div className="flex items-center gap-1.5 px-3.5 pt-2.5">
          <Terminal size={12} className="text-text-secondary" />
          <label htmlFor="code-stdin" className="text-[11px] font-bold uppercase text-text-secondary">
            Program Input (stdin)
          </label>
        </div>
        <textarea
          id="code-stdin"
          value={stdin}
          onChange={(e) => setStdin(e.target.value)}
          rows={3}
          placeholder="Enter input your program will read from stdin, one value per line if needed…"
          className="box-border w-full resize-y bg-transparent px-3.5 py-2 font-mono text-xs text-text-primary outline-none placeholder:text-text-secondary/60"
        />
      </div>

      <div className="flex-[1_1_28%] min-h-[120px] overflow-y-auto border-t border-border-subtle px-3.5 py-2.5 font-mono text-xs">
        <div className="mb-2 flex items-center gap-1.5 text-text-secondary">
          <Terminal size={13} />
          <span className="text-[11px] font-bold uppercase">Output</span>
        </div>

        {isPending && <LoadingSpinner size={16} label="Executing…" />}

        {error && (
          <p className="m-0 whitespace-pre-wrap text-danger">
            Execution failed. Please try again.
          </p>
        )}

        {result && !isPending && (
          <div className="flex flex-col gap-2">
            {result.stdout && (
              <pre className="m-0 whitespace-pre-wrap break-words text-text-primary">{result.stdout}</pre>
            )}
            {result.stderr && (
              <pre className="m-0 whitespace-pre-wrap break-words text-danger">{result.stderr}</pre>
            )}
            {result.timedOut && <p className="m-0 text-warning">Execution timed out.</p>}
            <p className="m-0 text-[11px] text-text-secondary">
              Exit code {result.exitCode} · {result.language} {result.version}
            </p>
          </div>
        )}

        {!result && !isPending && !error && (
          <p className="m-0 text-text-secondary">Run your code to see output here.</p>
        )}
      </div>
    </div>
  );
}

export default CodeExecutionPanel;