import type { createApp } from '../../app/index.js';

export interface ServerBootstrap {
  readonly app: ReturnType<typeof createApp>;
  close(): Promise<void>;
}
