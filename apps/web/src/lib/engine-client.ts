import type { EngineClient } from '@natalnode/engine-client';
import { HttpEngineClient } from '@natalnode/engine-client/http';

export const engineClient: EngineClient = new HttpEngineClient();
