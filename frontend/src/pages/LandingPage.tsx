import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, StickyNote, Code2, Sparkles } from 'lucide-react';
import { AppLogo } from '../components/common/AppLogo';
import { ThemeToggle } from '../components/common/ThemeToggle';

const PILLARS = [
  {
    number: 1,
    title: 'Scheduling',
    icon: Calendar,
    description:
      'AI-powered calendar that automatically routes your sleep, study, and practice blocks around real upcoming contests — never overlapping a round again.',
  },
  {
    number: 2,
    title: 'Notes & AI',
    icon: StickyNote,
    description:
      'Reflect on any event with rich-text notes, then highlight code or text to ask Ashna AI targeted questions right where you wrote it.',
  },
  {
    number: 3,
    title: 'Coding IDE',
    icon: Code2,
    description:
      'Run and test solutions in 60+ languages without leaving the app, with Ashna AI ready to explain, review, or optimise your code.',
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <header className="flex items-center justify-between border-b border-border-subtle px-8 py-4">
        <AppLogo />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            to="/auth"
            className="rounded-pill border border-border-subtle px-4 py-2 text-sm text-text-primary no-underline"
          >
            Sign In
          </Link>
          <Link
            to="/auth"
            className="rounded-pill bg-accent-ashna px-4 py-2 text-sm font-semibold text-bg-primary no-underline"
          >
            Register
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-8 py-20 text-center">
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-pill bg-accent-ashna-tint px-3 py-1 text-xs font-semibold text-accent-ashna">
          <Sparkles size={12} /> Built for competitive programmers
        </div>

        <h1 className="mb-4 text-4xl font-bold text-text-primary sm:text-5xl">
          CP Calendar Pro: Your Unified Intelligent Workspace.
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-lg text-text-secondary">
          Scheduling. Notes. Code. Seamlessly integrated for modern competitive programming.
        </p>

        <div className="mb-16 flex justify-center gap-4">
          <Link
            to="/auth"
            className="rounded-pill bg-accent-ashna px-8 py-3 text-sm font-semibold text-bg-primary no-underline"
          >
            Get Started Free
          </Link>
        </div>

        <div className="grid gap-6 text-left sm:grid-cols-3">
          {PILLARS.map(({ number, title, icon: Icon, description }) => (
            <div key={number} className="rounded-lg bg-bg-surface p-6">
              <div className="mb-3 flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-bg-elevated text-xs font-bold text-text-primary">
                  {number}
                </span>
                <Icon size={18} className="text-accent-ashna" />
                <h2 className="m-0 text-base font-semibold text-text-primary">{title}</h2>
              </div>
              <p className="m-0 text-sm text-text-secondary">{description}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-border-subtle px-8 py-6 text-center text-xs text-text-secondary">
        © {new Date().getFullYear()} CP Calendar Pro. Built for the competitive programming community.
      </footer>
    </div>
  );
}

export default LandingPage;