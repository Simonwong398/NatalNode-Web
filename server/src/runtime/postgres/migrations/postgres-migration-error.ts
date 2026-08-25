export class PostgresMigrationError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'PostgresMigrationError';
  }
}
