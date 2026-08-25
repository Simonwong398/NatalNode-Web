export interface ProcessShutdownRuntime {
  close(): Promise<void>;
}

export function waitForProcessShutdown(
  runtime: ProcessShutdownRuntime
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const onSignal = (): void => {
      process.off('SIGINT', onSignal);
      process.off('SIGTERM', onSignal);

      let closePromise: Promise<void>;

      try {
        closePromise = runtime.close();
      } catch (error) {
        reject(error);
        return;
      }

      void closePromise.then(resolve, reject);
    };

    process.once('SIGINT', onSignal);
    process.once('SIGTERM', onSignal);
  });
}
