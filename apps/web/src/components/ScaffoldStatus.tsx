import { useState } from 'react';

export default function ScaffoldStatus() {
  const [showNote, setShowNote] = useState(false);

  return (
    <section className="island" aria-labelledby="island-title">
      <div>
        <p className="island-label" id="island-title">
          React island
        </p>
        <p className="island-state">Connected</p>
      </div>
      <button
        className="island-button"
        type="button"
        aria-controls="island-note"
        aria-expanded={showNote}
        onClick={() => setShowNote((visible) => !visible)}
      >
        {showNote ? 'Hide note' : 'Show note'}
      </button>
      {showNote ? (
        <p className="island-note" id="island-note">
          This small interactive island verifies that React is running inside Astro.
        </p>
      ) : null}
    </section>
  );
}
