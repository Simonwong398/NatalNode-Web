const viteEnvironment = import.meta.env;

/** Development-only UI surfaces must use Vite's build-time runtime flag. */
export const IS_DEVELOPMENT_RUNTIME = viteEnvironment?.DEV === true;
