import React from 'react';

export { default as CalculationDetails } from '../../dist/result-disclosure-characterization/features/calculation-details/CalculationDetails.js';
export { default as InterpretationPanel } from '../../dist/result-disclosure-characterization/features/interpretation/InterpretationPanel.js';

export function ChartRenderer() {
  return React.createElement('div', { 'data-testid': 'chart-renderer' }, 'Chart renderer');
}

export default function AstrologicalNotation() {
  return React.createElement(
    'div',
    { 'data-testid': 'astrological-notation' },
    'Astrological notation'
  );
}
