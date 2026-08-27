import {
  SKY_EVENTS_FIXTURE_V1,
  SKY_FIXTURE_AT_UTC,
  SKY_FIXTURE_END_UTC,
  SKY_FIXTURE_START_UTC,
  SKY_SNAPSHOT_FIXTURE_V1,
  WEB_UI_FIXTURE_V1
} from '@natalnode/test-fixtures';
import type {
  ChartRequest,
  ChartResult,
  SkyEventsRequest,
  SkyEventsResult,
  SkySnapshotRequest,
  SkySnapshotResult
} from '@natalnode/contracts';
import type { EngineClient } from './index.js';

const SKY_CALCULATION_FAILURE_MESSAGE = 'Sky calculation request failed.';

export class MockEngineClient implements EngineClient {
  async calculateChart(_request: ChartRequest): Promise<ChartResult> {
    return structuredClone(WEB_UI_FIXTURE_V1);
  }

  async getSkySnapshot(
    request: SkySnapshotRequest
  ): Promise<SkySnapshotResult> {
    if (request.atUtc !== SKY_FIXTURE_AT_UTC) {
      throw new Error(SKY_CALCULATION_FAILURE_MESSAGE);
    }

    return structuredClone(SKY_SNAPSHOT_FIXTURE_V1);
  }

  async getSkyEvents(request: SkyEventsRequest): Promise<SkyEventsResult> {
    if (
      request.startUtc !== SKY_FIXTURE_START_UTC ||
      request.endUtc !== SKY_FIXTURE_END_UTC
    ) {
      throw new Error(SKY_CALCULATION_FAILURE_MESSAGE);
    }

    return structuredClone(SKY_EVENTS_FIXTURE_V1);
  }
}
