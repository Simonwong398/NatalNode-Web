import { useEffect, useState } from 'react';
import { copyShareUrl, createSharePayload } from './share-actions';

type Props = {
  canonicalUrl: string;
  title: string;
  text: string;
  shareLabel: string;
  copyLabel: string;
  copiedLabel: string;
  copyFailedLabel: string;
  shareFailedLabel: string;
};

type ActionStatus = 'idle' | 'copied' | 'copy-failed' | 'share-failed';

export default function ShareCardActions({
  canonicalUrl,
  title,
  text,
  shareLabel,
  copyLabel,
  copiedLabel,
  copyFailedLabel,
  shareFailedLabel
}: Props) {
  const [nativeShareAvailable, setNativeShareAvailable] = useState(false);
  const [status, setStatus] = useState<ActionStatus>('idle');

  useEffect(() => {
    setNativeShareAvailable(
      typeof navigator !== 'undefined' && typeof navigator.share === 'function'
    );
  }, []);

  async function handleShare() {
    if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
      setStatus('share-failed');
      return;
    }

    try {
      await navigator.share(createSharePayload(title, text, canonicalUrl));
      setStatus('idle');
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'name' in error &&
        error.name === 'AbortError'
      ) {
        return;
      }

      setStatus('share-failed');
    }
  }

  async function handleCopy() {
    try {
      await copyShareUrl(canonicalUrl, {
        clipboard: typeof navigator !== 'undefined' ? navigator.clipboard : undefined,
        document: typeof document !== 'undefined' ? document : undefined
      });
      setStatus('copied');
    } catch {
      setStatus('copy-failed');
    }
  }

  const statusMessage = status === 'copied'
    ? copiedLabel
    : status === 'copy-failed'
      ? copyFailedLabel
      : status === 'share-failed'
        ? shareFailedLabel
        : '';

  return (
    <div className="flex min-w-0 flex-wrap items-center justify-end gap-2" data-share-actions>
      {nativeShareAvailable ? (
        <button className="nn-button nn-button--quiet" type="button" onClick={handleShare}>
          {shareLabel}
        </button>
      ) : null}
      <button className="nn-button nn-button--secondary" type="button" onClick={handleCopy}>
        {status === 'copied' ? copiedLabel : copyLabel}
      </button>
      <p className="sr-only" aria-live="polite" role="status">
        {statusMessage}
      </p>
    </div>
  );
}
