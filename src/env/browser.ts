/**
 * Environment / browser detection utilities.
 *
 * Every helper here is safe to call in any runtime — including Node.js during
 * a Next.js static export pass — and returns a deterministic value when there
 * is no `window` / `navigator` / `document`.
 */

export function inBrowser(): boolean {
  return (
    typeof globalThis !== "undefined" &&
    typeof (globalThis as { window?: unknown }).window !== "undefined" &&
    typeof (globalThis as { document?: unknown }).document !== "undefined"
  );
}

export function getWindow(): Window | null {
  return inBrowser() ? window : null;
}

export function getDocument(): Document | null {
  return inBrowser() ? document : null;
}

export function getNavigator(): Navigator | null {
  return inBrowser() && typeof navigator !== "undefined" ? navigator : null;
}

export function getUserAgent(): string {
  const nav = getNavigator();
  return nav?.userAgent ?? "";
}

export function isChrome(): boolean {
  // "Chrome" appears in Edge / Brave / Opera UAs too — that's fine for our
  // purposes; all are Chromium and behave the same for our checkers.
  return /Chrome\//.test(getUserAgent());
}

export function isFirefox(): boolean {
  return /Firefox\//.test(getUserAgent());
}

export function isSafari(): boolean {
  const ua = getUserAgent();
  return /Safari\//.test(ua) && !/Chrome\//.test(ua) && !/Chromium\//.test(ua);
}

export function isBrave(): boolean {
  const nav = getNavigator() as
    | (Navigator & { brave?: { isBrave?: () => Promise<boolean> } })
    | null;
  return Boolean(nav?.brave?.isBrave);
}
