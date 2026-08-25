/** Provider-neutral construction boundary for browser magic-link URLs. */
export interface MagicLinkUrlBuilder {
  build(token: string): string;
}

/** Builds the fragment-based completion URL from a validated public origin. */
export class PublicWebOriginMagicLinkUrlBuilder implements MagicLinkUrlBuilder {
  constructor(private readonly publicWebOrigin: string) {}

  build(token: string): string {
    if (token.length === 0) {
      throw new Error('Magic-link token must not be empty.');
    }

    const url = new URL('/auth/complete', this.publicWebOrigin);
    url.hash = new URLSearchParams({ token }).toString();

    return url.toString();
  }
}
