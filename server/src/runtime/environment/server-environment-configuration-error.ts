export class ServerEnvironmentConfigurationError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'ServerEnvironmentConfigurationError';
  }
}
