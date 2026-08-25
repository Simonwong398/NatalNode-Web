import { WEB_UI_FIXTURE_V1 } from '@natalnode/test-fixtures';
import type { ChartRequest, ChartResult } from '@natalnode/contracts';
import type { EngineClient } from './index.js';

export class MockEngineClient implements EngineClient {
  async calculateChart(_request: ChartRequest): Promise<ChartResult> {
    return structuredClone(WEB_UI_FIXTURE_V1);
  }
}
