const viteEnvironment = import.meta.env;

/**
 * Development-only UI surfaces must use an explicit build-time mode.
 *
 * The local integration build serves the same static artifact through the
 * local public edge as the browser-facing product, while keeping production
 * builds free of development UI at runtime.
 */
export const IS_DEVELOPMENT_RUNTIME =
  viteEnvironment?.DEV === true ||
  viteEnvironment?.MODE === 'local-integration';
