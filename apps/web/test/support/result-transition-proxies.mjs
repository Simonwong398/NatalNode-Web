import React from 'react';

export const TEST_SELECTION = {
  resolution: {
    localDate: '1990-05-15',
    localTime: '07:05',
    locationLabel: 'Fixture City',
    latitude: 34.0522,
    longitude: -118.2437,
    ianaTimeZone: 'America/Los_Angeles',
    resolvedUtcInstant: '1990-05-15T14:05:00.000Z',
    utcOffsetSeconds: -25200,
    timezoneDatabaseVersion: 'fixture-tzdb',
    timezoneResolutionMethod: 'FIXTURE',
    ambiguityStatus: 'EXACT'
  },
  houseSystem: 'PLACIDUS'
};

const calculationQueue = [];

export const calculationCalls = [];

export function resetResultTransitionProxies() {
  calculationQueue.length = 0;
  calculationCalls.length = 0;
}

export function queueCalculation(calculation) {
  calculationQueue.push(calculation);
}

export const engineClient = {
  calculateChart(request) {
    calculationCalls.push(request);
    const calculation = calculationQueue.shift();

    if (!calculation) {
      throw new Error('No calculation result was queued for the test.');
    }

    return calculation;
  }
};

export function BirthInputForm({ isCalculationPending, onResolvedInput }) {
  return React.createElement(
    'button',
    {
      disabled: isCalculationPending,
      onClick: () => {
        void onResolvedInput(TEST_SELECTION);
      },
      type: 'button'
    },
    isCalculationPending ? 'Calculating chart…' : 'Calculate Chart'
  );
}

export function ChartWorkspace({ resultTargetRef, snapshot }) {
  const headingId = React.useId();
  const [activeMode, setActiveMode] = React.useState('chart');
  const [isFactsOpen, setIsFactsOpen] = React.useState(false);
  const [isSaveOpen, setIsSaveOpen] = React.useState(false);

  return React.createElement(
    'section',
    {
      'aria-labelledby': headingId,
      'data-testid': 'result-target',
      ref: resultTargetRef,
      tabIndex: resultTargetRef ? -1 : undefined
    },
    React.createElement('h2', { id: headingId }, 'Natal Chart'),
    React.createElement('output', { 'data-testid': 'active-mode' }, activeMode),
    React.createElement('output', { 'data-testid': 'schema-version' }, snapshot.result.schemaVersion),
    ...['chart', 'interpretation', 'details'].map((mode) =>
      React.createElement(
        'button',
        {
          key: mode,
          onClick: () => setActiveMode(mode),
          type: 'button'
        },
        mode === 'chart' ? 'Chart' : `${mode[0].toUpperCase()}${mode.slice(1)}`
      )
    ),
    React.createElement(
      'button',
      {
        'aria-expanded': isFactsOpen,
        onClick: () => setIsFactsOpen((current) => !current),
        type: 'button'
      },
      'Complete chart facts'
    ),
    React.createElement(
      'button',
      {
        'aria-expanded': isSaveOpen,
        onClick: () => setIsSaveOpen((current) => !current),
        type: 'button'
      },
      'Save chart'
    )
  );
}
