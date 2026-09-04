export interface SharePayload {
  readonly title: string;
  readonly text: string;
  readonly url: string;
}

export function createSharePayload(
  title: string,
  text: string,
  url: string
): SharePayload {
  return Object.freeze({ title, text, url });
}

export interface ShareCopyEnvironment {
  readonly clipboard?: Pick<Clipboard, 'writeText'>;
  readonly document?: Document;
}

/**
 * Copy through the modern API first, then use a deterministic DOM fallback.
 * The function rejects when neither path confirms a copy, so callers cannot
 * announce success that did not occur.
 */
export async function copyShareUrl(
  value: string,
  environment: ShareCopyEnvironment
): Promise<void> {
  if (environment.clipboard !== undefined) {
    try {
      await environment.clipboard.writeText(value);
      return;
    } catch {
      // Permission or browser support failures may still allow the DOM path.
    }
  }

  const document = environment.document;
  if (document?.body === undefined) {
    throw new Error('Clipboard copy is unavailable');
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  textarea.style.pointerEvents = 'none';
  document.body.appendChild(textarea);

  let copied = false;
  try {
    textarea.focus();
    textarea.select();
    const executeCopy = Reflect.get(document, 'execCommand');
    copied = typeof executeCopy === 'function'
      ? (executeCopy as (commandId: string) => boolean).call(document, 'copy')
      : false;
  } finally {
    textarea.remove();
  }

  if (!copied) {
    throw new Error('Clipboard copy was not confirmed');
  }
}
