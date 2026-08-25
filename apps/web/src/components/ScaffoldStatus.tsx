import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function ScaffoldStatus() {
  const [showNote, setShowNote] = useState(false);

  return (
    <section
      className={cn(
        'mt-12 grid gap-4 rounded-xl border border-natal-border bg-natal-surface/80 p-4 sm:grid-cols-[1fr_auto] sm:items-center',
        showNote && 'shadow-xl shadow-black/10'
      )}
      aria-labelledby="island-title"
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-natal-accent" id="island-title">
          React island
        </p>
        <p className="mt-1 text-sm text-white">Connected</p>
      </div>
      <button
        className="cursor-pointer rounded-full border border-indigo-400/70 bg-natal-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-natal-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-natal-accent"
        type="button"
        aria-controls="island-note"
        aria-expanded={showNote}
        onClick={() => setShowNote((visible) => !visible)}
      >
        {showNote ? 'Hide note' : 'Show note'}
      </button>
      {showNote ? (
        <p className="col-span-full text-sm leading-6 text-slate-300" id="island-note">
          This small interactive island verifies that React is running inside Astro.
        </p>
      ) : null}
    </section>
  );
}
