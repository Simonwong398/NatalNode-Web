import { useEffect, useState } from 'react';
import type { EngineClient } from '@natalnode/engine-client';
import { ChartRenderer } from '@/features/chart-renderer';
import { cn } from '@/lib/utils';
import { engineClient } from '@/lib/engine-client';

const developmentRequest = {
  birth: {
    localDate: '2000-01-01',
    localTime: null,
    locationLabel: 'UI development fixture',
    latitude: 0,
    longitude: 0,
    ianaTimeZone: 'UTC',
    resolvedUtcInstant: null,
    utcOffsetSeconds: null,
    timezoneDatabaseVersion: 'UI_DEVELOPMENT_ONLY',
    timezoneResolutionMethod: 'UI_DEVELOPMENT_ONLY',
    ambiguityStatus: 'UNKNOWN_TIME'
  },
  houseSystem: 'Placidus'
} satisfies Parameters<EngineClient['calculateChart']>[0];

type EngineResult = Awaited<ReturnType<EngineClient['calculateChart']>>;

export default function ScaffoldStatus() {
  const [result, setResult] = useState<EngineResult | null>(null);

  useEffect(() => {
    let cancelled = false;

    void engineClient.calculateChart(developmentRequest).then((chartResult) => {
      if (!cancelled) {
        setResult(chartResult);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const isReady = result !== null;

  return (
    <section
      className={cn(
        'mt-12 grid gap-4 rounded-xl border border-natal-border bg-natal-surface/80 p-4 sm:grid-cols-[1fr_auto] sm:items-center',
        isReady && 'shadow-xl shadow-black/10'
      )}
      aria-labelledby="island-title"
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-natal-accent" id="island-title">
          Engine Client
        </p>
        <p className="mt-1 text-sm text-white">
          {isReady ? 'Mock development connection active' : 'Connecting to mock development client…'}
        </p>
      </div>
      <dl className="grid gap-x-6 gap-y-1 text-right text-sm sm:min-w-64">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-slate-400">Bodies</dt>
          <dd className="font-medium text-white">{result?.bodies.length ?? '—'}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-slate-400">Calculation status</dt>
          <dd className="font-medium text-white">{result?.calculationStatus ?? 'Loading'}</dd>
        </div>
      </dl>
      <p className="col-span-full text-xs leading-5 text-slate-400">
        UI development proof only; values are displayed from the EngineClient result.
      </p>
      {result ? (
        <div className="col-span-full mt-2 rounded-lg border border-natal-border/70 bg-natal-night/50 p-2 sm:p-4">
          <ChartRenderer chart={result} />
        </div>
      ) : null}
    </section>
  );
}
