/**
 * Anti-noscript / disabled-JS fallback utilities.
 *
 * Provides two complementary strategies:
 *
 * 1. `createNoJsOverlay()` — injects a full-viewport CSS-only overlay that is
 *    displayed by default and removed by JS on load. Users with JS disabled
 *    see an opaque blocker that prevents content interaction.
 *
 * 2. `noscriptRedirectSnippet()` — returns an HTML string for a `<noscript>`
 *    tag containing a `<meta http-equiv="refresh">` redirect. Drop it into
 *    your `<head>` (Next.js `_document.tsx`, static HTML, etc.) to redirect
 *    no-JS visitors to a dedicated page.
 *
 * Both are safe to evaluate in SSR / static export contexts.
 */

import { getDocument, inBrowser } from "../env/browser";
import { removeNode } from "../env/dom";

const OVERLAY_ID = "gfd-nojs-overlay";

const OVERLAY_CSS = `
#${OVERLAY_ID} {
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 1.125rem;
  color: #333;
}
`;

export interface NoJsOverlayOptions {
  /** Message displayed in the overlay. Default: "Please enable JavaScript to continue." */
  message?: string;
  /** CSP nonce for the injected <style> tag. */
  styleNonce?: string;
  /**
   * Delay in ms before removing the overlay after JS loads. Allows paint to
   * settle. Default: 0.
   */
  removeDelay?: number;
}

export interface NoJsOverlay {
  /** Removes the overlay. Called automatically on load but exposed for manual control. */
  remove(): void;
}

/**
 * Creates a CSS-only overlay that blocks content until JS removes it.
 * Call this early in your app's client-side boot (e.g. layout component).
 */
export function createNoJsOverlay(
  options: NoJsOverlayOptions = {},
): NoJsOverlay {
  const message = options.message ?? "Please enable JavaScript to continue.";
  const removeDelay = options.removeDelay ?? 0;
  const styleNonce = options.styleNonce;

  let overlayEl: HTMLElement | null = null;
  let styleEl: HTMLStyleElement | null = null;

  function inject(): void {
    if (!inBrowser()) return;
    const doc = getDocument();
    if (!doc) return;

    // Style tag.
    styleEl = doc.createElement("style");
    if (styleNonce) styleEl.nonce = styleNonce;
    styleEl.textContent = OVERLAY_CSS;
    doc.head.appendChild(styleEl);

    // Overlay element.
    overlayEl = doc.createElement("div");
    overlayEl.id = OVERLAY_ID;
    overlayEl.textContent = message;
    doc.body.appendChild(overlayEl);
  }

  function remove(): void {
    removeNode(overlayEl);
    removeNode(styleEl);
    overlayEl = null;
    styleEl = null;
  }

  // Inject immediately — if JS is running, we'll remove it right after.
  inject();

  // Schedule removal (JS is clearly enabled if we got here).
  if (inBrowser()) {
    if (removeDelay > 0) {
      setTimeout(remove, removeDelay);
    } else {
      // Use microtask to let the initial paint happen first.
      Promise.resolve().then(remove);
    }
  }

  return { remove };
}

export interface NoscriptRedirectOptions {
  /** Path to redirect no-JS users to. */
  redirectPath: string;
  /** Delay in seconds before redirect. Default: 0. */
  delay?: number;
  /** Fallback message shown briefly before redirect. */
  message?: string;
}

/**
 * Returns an HTML string for a `<noscript>` block that redirects users with
 * JavaScript disabled. Insert into your document's `<head>`.
 *
 * Usage in Next.js `_document.tsx`:
 * ```tsx
 * <Head>
 *   <noscript dangerouslySetInnerHTML={{
 *     __html: noscriptRedirectSnippet({ redirectPath: '/no-js' })
 *   }} />
 * </Head>
 * ```
 */
export function noscriptRedirectSnippet(
  options: NoscriptRedirectOptions,
): string {
  const delay = options.delay ?? 0;
  const message = options.message ?? "";
  const redirect = `<meta http-equiv="refresh" content="${delay};url=${options.redirectPath}">`;
  const style = `<style>body{display:none !important}</style>`;

  if (message) {
    return `${redirect}${style}<div style="display:block!important;position:fixed;inset:0;background:#fff;z-index:2147483647;padding:2rem;font-family:system-ui,sans-serif">${message}</div>`;
  }

  return `${redirect}${style}`;
}
