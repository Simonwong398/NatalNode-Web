/// <reference types="astro/client" />

import type {
  LocalePathInfo,
  LocaleResolutionSource,
  SupportedLocale
} from './lib/localization';

declare global {
  namespace App {
    interface Locals {
      locale?: SupportedLocale;
      localeSource?: LocaleResolutionSource;
      localePath?: LocalePathInfo;
    }
  }
}

export {};
