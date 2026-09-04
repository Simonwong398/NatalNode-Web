import type { LocationResolutionDiagnostics as LocationResolutionDiagnosticsState } from './location-resolution-diagnostics';

export interface LocationResolutionDiagnosticsProps {
  readonly diagnostics: LocationResolutionDiagnosticsState;
}

export default function LocationResolutionDiagnostics({
  diagnostics
}: LocationResolutionDiagnosticsProps) {
  const httpStatus =
    diagnostics.lastHttpStatus === null ? '—' : String(diagnostics.lastHttpStatus);
  const fetchExceptionName = diagnostics.fetchExceptionName ?? '—';
  const signalStateAtDispatch = diagnostics.signalStateAtDispatch ?? '—';
  const requestOrigin = diagnostics.requestOrigin ?? '—';
  const requestTarget = diagnostics.requestTarget ?? '—';

  return (
    <aside
      aria-label="Location diagnostics"
      className="mt-4 rounded border border-[color:var(--nn-border-subtle)] bg-[color:var(--nn-surface-muted)] p-3 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-[color:var(--nn-text-muted)]"
      data-location-client-stage={diagnostics.lastClientStage}
      data-location-diagnostic-state={diagnostics.resolutionState}
      data-location-error-kind={diagnostics.lastErrorKind}
      data-location-generation={diagnostics.requestGeneration}
      data-location-http-status={httpStatus}
      data-location-candidate-count={diagnostics.candidateCount}
      data-location-panel-mounted={diagnostics.panelMounted ? 'true' : 'false'}
      data-location-fetch-exception-name={fetchExceptionName}
      data-location-signal-state-at-dispatch={signalStateAtDispatch}
      data-location-request-origin={requestOrigin}
      data-location-request-target={requestTarget}
    >
      <p className="font-semibold text-[color:var(--nn-text-primary)]">LOCATION DIAGNOSTICS</p>
      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
        <div>
          <dt>State</dt>
          <dd className="mt-0.5 text-[color:var(--nn-text-primary)]">{diagnostics.resolutionState}</dd>
        </div>
        <div>
          <dt>Generation</dt>
          <dd className="mt-0.5 text-[color:var(--nn-text-primary)]">{diagnostics.requestGeneration}</dd>
        </div>
        <div>
          <dt>HTTP</dt>
          <dd className="mt-0.5 text-[color:var(--nn-text-primary)]">{httpStatus}</dd>
        </div>
        <div>
          <dt>Stage</dt>
          <dd className="mt-0.5 break-words text-[color:var(--nn-text-primary)]">{diagnostics.lastClientStage}</dd>
        </div>
        <div>
          <dt>Error</dt>
          <dd className="mt-0.5 break-words text-[color:var(--nn-text-primary)]">{diagnostics.lastErrorKind}</dd>
        </div>
        <div>
          <dt>Candidates</dt>
          <dd className="mt-0.5 text-[color:var(--nn-text-primary)]">{diagnostics.candidateCount}</dd>
        </div>
        <div>
          <dt>Panel mounted</dt>
          <dd className="mt-0.5 text-[color:var(--nn-text-primary)]">
            {diagnostics.panelMounted ? 'YES' : 'NO'}
          </dd>
        </div>
        <div>
          <dt>Fetch exception name</dt>
          <dd className="mt-0.5 break-words text-[color:var(--nn-text-primary)]">
            {fetchExceptionName}
          </dd>
        </div>
        <div>
          <dt>Signal at dispatch</dt>
          <dd className="mt-0.5 text-[color:var(--nn-text-primary)]">
            {signalStateAtDispatch}
          </dd>
        </div>
        <div>
          <dt>Request origin</dt>
          <dd className="mt-0.5 text-[color:var(--nn-text-primary)]">
            {requestOrigin}
          </dd>
        </div>
        <div>
          <dt>Request target</dt>
          <dd className="mt-0.5 text-[color:var(--nn-text-primary)]">
            {requestTarget}
          </dd>
        </div>
      </dl>
    </aside>
  );
}
