import { useMemo, useState } from 'react';
import { Search, HelpCircle } from 'lucide-react';
import { HELP_SECTIONS } from '../data/helpContent';
import { EmptyState } from '../components/common/EmptyState';

export function HelpPage() {
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const filteredSections = useMemo(() => {
    if (!search.trim()) return HELP_SECTIONS;
    const query = search.trim().toLowerCase();
    return HELP_SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => item.question.toLowerCase().includes(query) || item.answer.toLowerCase().includes(query),
      ),
    })).filter((section) => section.items.length > 0);
  }, [search]);

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col gap-6">
      <div>
        <h1 className="m-0 text-2xl text-text-primary">Help &amp; Guide</h1>
        <p className="mt-1 text-sm text-text-secondary">Everything you need to know to navigate CP Calendar Pro.</p>
      </div>

      <div className="flex items-center gap-2 rounded-pill bg-bg-elevated px-4 py-2.5">
        <Search size={16} className="text-text-secondary" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search for a topic, e.g. 'sleep window' or 'voice input'…"
          className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-secondary"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredSections.length === 0 && (
          <EmptyState icon={HelpCircle} title="No matching topics" description="Try a different search term." />
        )}

        <div className="flex flex-col gap-6">
          {filteredSections.map((section) => (
            <div key={section.id}>
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-text-secondary">{section.title}</h2>
              <div className="flex flex-col gap-2">
                {section.items.map((item) => {
                  const itemId = `${section.id}-${item.question}`;
                  const isOpen = openId === itemId;
                  return (
                    <div key={itemId} className="rounded-md bg-bg-surface">
                      <button
                        type="button"
                        onClick={() => setOpenId(isOpen ? null : itemId)}
                        aria-expanded={isOpen}
                        className="flex w-full items-center justify-between px-4 py-3 text-left"
                      >
                        <span className="text-[13px] font-medium text-text-primary">{item.question}</span>
                        <span className="text-text-secondary">{isOpen ? '−' : '+'}</span>
                      </button>
                      {isOpen && (
                        <p className="m-0 border-t border-border-subtle px-4 py-3 text-[13px] text-text-secondary">
                          {item.answer}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HelpPage;