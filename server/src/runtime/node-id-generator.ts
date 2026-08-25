import { randomUUID } from 'node:crypto';
import type { IdGenerator } from '../app/creation-boundaries.js';

export class NodeIdGenerator implements IdGenerator {
  public generate(): string {
    return randomUUID();
  }
}
