/**
 * Central per-provider language identifier mapping. Our internal canonical
 * id (used by the frontend dropdown and Monaco's language prop) is the map
 * key; each provider needs its own dialect of identifier/version.
 *
 * VERIFICATION STATUS, stated honestly rather than presented as uniformly
 * certain:
 * - JDoodle's `language` + `versionIndex` pairs are confirmed against their
 *   public API docs' request shape, but versionIndex numbering has drifted
 *   over the service's lifetime as they add newer language versions at the
 *   same index slot historically used by an older one. Treat the indices
 *   below as a reasonable starting point, not a guarantee — verify against
 *   https://www.jdoodle.com/compiler-api/ (language reference table)
 *   before relying on this in production, and update here if execution
 *   fails with a "invalid language/versionIndex" error.
 * - OneCompiler's `language` slugs are confirmed via their documented
 *   request examples (python, java, etc. follow their own name, not
 *   Piston's) for the languages explicitly shown in their docs; the rest
 *   follow their same evident naming convention but aren't individually
 *   confirmed — verify against https://onecompiler.com/languages if a
 *   specific language 400s.
 * - CodeX's language identifiers are NOT independently verified — this
 *   provider's public documentation is thin. Treat these as placeholders;
 *   confirm the exact expected values from the RapidAPI console's
 *   auto-generated code snippet once subscribed, and update
 *   codex.provider.ts's request body shape to match exactly.
 */
export interface LanguageMapping {
  label: string;
  jdoodle?: { language: string; versionIndex: string };
  onecompiler?: { language: string };
  codex?: { language: string };
  monacoLanguage: string;
}

export const LANGUAGE_MAP: Record<string, LanguageMapping> = {
  python: {
    label: 'Python 3',
    jdoodle: { language: 'python3', versionIndex: '4' },
    onecompiler: { language: 'python' },
    codex: { language: 'python3' },
    monacoLanguage: 'python',
  },
  cpp: {
    label: 'C++ 17',
    jdoodle: { language: 'cpp17', versionIndex: '1' },
    onecompiler: { language: 'cpp' },
    codex: { language: 'cpp17' },
    monacoLanguage: 'cpp',
  },
  java: {
    label: 'Java',
    jdoodle: { language: 'java', versionIndex: '4' },
    onecompiler: { language: 'java' },
    codex: { language: 'java' },
    monacoLanguage: 'java',
  },
  javascript: {
    label: 'JavaScript (Node)',
    jdoodle: { language: 'nodejs', versionIndex: '4' },
    onecompiler: { language: 'javascript' },
    codex: { language: 'javascript' },
    monacoLanguage: 'javascript',
  },
  typescript: {
    label: 'TypeScript',
    onecompiler: { language: 'typescript' },
    codex: { language: 'typescript' },
    monacoLanguage: 'typescript',
    // No JDoodle entry: their platform doesn't offer a direct TypeScript
    // runtime as of their published language table — omitted rather than
    // guessed, so the orchestrator correctly skips JDoodle for this
    // language and moves to OneCompiler.
  },
  go: {
    label: 'Go',
    jdoodle: { language: 'go', versionIndex: '4' },
    onecompiler: { language: 'go' },
    codex: { language: 'go' },
    monacoLanguage: 'go',
  },
  rust: {
    label: 'Rust',
    jdoodle: { language: 'rust', versionIndex: '4' },
    onecompiler: { language: 'rust' },
    codex: { language: 'rust' },
    monacoLanguage: 'rust',
  },
  c: {
    label: 'C',
    jdoodle: { language: 'c', versionIndex: '5' },
    onecompiler: { language: 'c' },
    codex: { language: 'c' },
    monacoLanguage: 'c',
  },
};

export function isKnownLanguage(language: string): boolean {
  return language in LANGUAGE_MAP;
}