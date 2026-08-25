import type { Clock } from '../app/creation-boundaries.js';

export class SystemClock implements Clock {
  public now(): string {
    return new Date().toISOString();
  }
}
