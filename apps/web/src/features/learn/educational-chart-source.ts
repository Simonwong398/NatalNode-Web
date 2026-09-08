import { MockEngineClient } from '@natalnode/engine-client/mock';
import type { ChartRequest, ChartResult } from '@natalnode/contracts';
import {
  createChartPresentationPolicy,
  withChartPresentationMode,
  type ChartPresentationPolicy
} from '../../core/chart/chart-presentation-policy.js';

/**
 * This request only satisfies the existing EngineClient contract. The mock
 * client intentionally ignores it and returns WEB_UI_FIXTURE_V1; these values
 * are never displayed or used to derive chart facts.
 */
export const EDUCATIONAL_CHART_REQUEST: ChartRequest = Object.freeze({
  birth: Object.freeze({
    localDate: '1970-01-01',
    localTime: '00:00',
    locationLabel: 'EDUCATIONAL_CHART_FIXTURE',
    latitude: 0,
    longitude: 0,
    ianaTimeZone: 'Etc/UTC',
    resolvedUtcInstant: '1970-01-01T00:00:00.000Z',
    utcOffsetSeconds: 0,
    timezoneDatabaseVersion: 'EDUCATIONAL_CHART_FIXTURE',
    timezoneResolutionMethod: 'EDUCATIONAL_CHART_FIXTURE',
    ambiguityStatus: 'EXACT'
  }),
  houseSystem: 'Placidus'
});

const educationalEngineClient = new MockEngineClient();

export async function getEducationalChart(): Promise<ChartResult> {
  return educationalEngineClient.calculateChart(EDUCATIONAL_CHART_REQUEST);
}

export function getEducationalChartPresentationPolicy(): ChartPresentationPolicy {
  return withChartPresentationMode(
    createChartPresentationPolicy(EDUCATIONAL_CHART_REQUEST),
    'showcase'
  );
}
