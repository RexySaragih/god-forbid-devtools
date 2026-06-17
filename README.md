# god-forbid-devtools

Tree-shakable, browser-only anti-tamper toolkit. Drop-in replacement for the archived
[`devtools-detect`](https://github.com/sindresorhus/devtools-detect) plus a matching
context-menu guard. Works with any Next.js app (App Router, Pages Router, static export)
and any browser-based frontend framework.

## Features

1. **DevTools detector** — multi-checker pipeline (window-size, custom formatters,
   `console.table` perf probe, eruda, console-log trap, optional `debugger`).
2. **Context-menu guard** — suppresses the native right-click menu and renders a themed
   replacement menu with **Refresh / Copy / Cut**, with correct behaviour inside
   `<input>`, `<textarea>`, and `contenteditable`.
3. **Keyboard shortcut guard** — blocks F12, Ctrl+Shift+I/J/C, Cmd+Option+I/J/C from
   opening DevTools.
4. **Protection orchestrator** — ties detector + context-menu + keyboard guard + redirect
   into a single `createProtection()` call.
5. **No-JS fallback** — CSS-only overlay removed by JS on load, plus a `<noscript>`
   redirect snippet for static exports.
6. **Source-map stripping** — Webpack plugin + Next.js wrapper to remove `.map` files and
   `sourceMappingURL` comments in production builds.
7. **Full type safety** — `WindowEventMap` augmentation for `"devtoolschange"` eliminates
   cast boilerplate.

## Installation

```bash
# Bun
bun add @rexymayderio/god-forbid-devtools

# npm / pnpm / yarn
npm install @rexymayderio/god-forbid-devtools
```

`prepare` runs `tsup` automatically on install so consumers get a built `dist/`.

## Quick start — Protection orchestrator

The simplest way to enable everything in one call:

```ts
"use client";

import { useEffect } from "react";
import { createProtection } from "@rexymayderio/god-forbid-devtools";

export function SecurityGuard() {
  useEffect(() => {
    const protection = createProtection({
      redirectPath: "/security-violation",
      onViolation: ({ type, info }) => {
        // type: "devtools" | "keyboard"
        console.warn(`Violation: ${type}`, info);
      },
    });
    protection.start();
    return () => protection.stop();
  }, []);

  return null;
}
```

### Protection options

```ts
createProtection({
  enabled: true, // master kill-switch
  redirectPath: "/blocked", // null to disable redirect
  onViolation: (detail) => {}, // fires on devtools detection or shortcut block
  detector: { pollIntervalMs: 500 },
  contextMenu: { theme: "light" },
  keyboard: {},
  features: {
    detector: true,
    contextMenu: true,
    keyboard: true,
  },
});
```

## Quick start — DevTools detector

```ts
"use client";

import { useEffect } from "react";
import detector from "@rexymayderio/god-forbid-devtools";

export function DevtoolsWatcher() {
  useEffect(() => {
    detector.start();
    const off = detector.addListener((isOpen) => {
      if (isOpen) {
        // redirect, ping a webhook, etc.
      }
    });
    return () => {
      off();
      detector.stop();
    };
  }, []);

  return null;
}
```

### `onDetected` callback

Fires exactly once on the first positive detection — covers both "already open at start"
and "opened later". No need to wire `addEventListener` + check `isOpen` separately:

```ts
const detector = createDetector({
  onDetected: (detail) => {
    console.warn("DevTools detected via:", detail.checkerName);
    window.location.href = "/blocked";
  },
});
detector.start();
```

### Type-safe window events

The package augments `WindowEventMap` so you get full IntelliSense without casting:

```ts
window.addEventListener("devtoolschange", (e) => {
  e.detail.isOpen; // boolean — no cast needed
});
```

## Quick start — Context-menu guard

```ts
"use client";

import { useEffect } from "react";
import { createContextMenuGuard } from "@rexymayderio/god-forbid-devtools";

export function MenuGuard() {
  useEffect(() => {
    const guard = createContextMenuGuard({
      theme: "light",
      onOpen: ({ targetTag }) => {
        console.debug("ctx-menu opened on", targetTag);
      },
    });
    guard.start();
    return () => guard.stop();
  }, []);

  return null;
}
```

### Themes

The context menu ships with 4 built-in themes:

| Theme      | Description                                                           |
| ---------- | --------------------------------------------------------------------- |
| `"system"` | Adapts to OS light/dark preference with subtle translucency (default) |
| `"light"`  | Clean opaque white with neutral shadows — blends with any light UI    |
| `"dark"`   | Solid dark surface, high contrast text                                |
| `"coffee"` | Warm cream/brown tones — cozy, grounded feel                          |

```ts
createContextMenuGuard({ theme: "coffee" });
```

Each theme also has a dark-mode variant that activates via `prefers-color-scheme: dark`.

### Context-menu options

```ts
createContextMenuGuard({
  enabled: true,
  items: ["refresh", "copy", "cut"],
  labels: { refresh: "Reload", copy: "Salin", cut: "Potong" },
  theme: "system",
  zIndex: 2_147_483_000,
  styleNonce: "<csp-nonce>",
  shouldHandle: (event) => true,
  onOpen: ({ x, y, targetTag }) => {},
  onAction: (id) => {},
});
```

## Keyboard shortcut guard

Standalone usage when you only need shortcut blocking:

```ts
import { createKeyboardGuard } from "@rexymayderio/god-forbid-devtools";

const guard = createKeyboardGuard({
  onBlock: ({ combo, event }) => {
    console.warn(`Blocked: ${combo}`);
  },
});
guard.start();
```

Blocked shortcuts: `F12`, `Ctrl+Shift+I`, `Ctrl+Shift+J`, `Ctrl+Shift+C`,
`Cmd+Option+I`, `Cmd+Option+J`, `Cmd+Option+C`.

## No-JS fallback

For users with JavaScript disabled:

```ts
import {
  createNoJsOverlay,
  noscriptRedirectSnippet,
} from "@rexymayderio/god-forbid-devtools";
```

### CSS overlay (client-side)

Creates a full-page overlay that blocks content. JS removes it on load:

```ts
// Call early in your app's client boot
createNoJsOverlay({
  message: "Please enable JavaScript to continue.",
  styleNonce: "<csp-nonce>",
});
```

### Noscript redirect (SSR / static HTML)

Returns an HTML string for your document's `<head>`:

```tsx
// In Next.js _document.tsx
import { noscriptRedirectSnippet } from "@rexymayderio/god-forbid-devtools";

<Head>
  <noscript
    dangerouslySetInnerHTML={{
      __html: noscriptRedirectSnippet({ redirectPath: "/no-js" }),
    }}
  />
</Head>;
```

## Source-map stripping

Removes source maps from production builds to weaken reverse-engineering:

### Next.js

```js
// next.config.js
const { withSourceMapStrip } = require("@rexymayderio/god-forbid-devtools");

module.exports = withSourceMapStrip({
  // ... your Next.js config
});
```

### Webpack (standalone)

```js
const { SourceMapStripPlugin } = require("@rexymayderio/god-forbid-devtools");

module.exports = {
  plugins: [new SourceMapStripPlugin()],
};
```

### Options

```ts
new SourceMapStripPlugin({
  productionOnly: true, // only strip when NODE_ENV=production
  removeMapFiles: true, // delete .map files from output
  removeSourceMappingURLs: true, // strip //# sourceMappingURL comments
  exclude: ["vendor.*.js"], // glob patterns to skip
});
```

## Detector configuration

```ts
import {
  createDetector,
  windowSizeChecker,
  performanceChecker,
} from "@rexymayderio/god-forbid-devtools";

const detector = createDetector({
  checkers: [windowSizeChecker, performanceChecker],
  pollIntervalMs: 500,
  confirmationPolls: 2,
  emitWindowEvent: true,
  onDetected: (detail) => {
    // fires once on first positive
  },
});
```

### Available checkers

| Checker                     | Default | Notes                                                          |
| --------------------------- | ------- | -------------------------------------------------------------- |
| `windowSizeChecker`         | yes     | Cheap, sync. False positives on multi-monitor — debounce.      |
| `devtoolsFormattersChecker` | yes     | Chromium only.                                                 |
| `erudaChecker`              | yes     | Detects mobile in-page console.                                |
| `consoleLogTrapChecker`     | yes     | Passive cross-check via getter.                                |
| `performanceChecker`        | yes     | Heavy. Gated to run only after a cheap checker hints positive. |
| `debuggerChecker`           | opt-in  | Freezes tab when DevTools open. Requires CSP `'unsafe-eval'`.  |

## Migrating from `devtools-detect`

```diff
- import devtoolsDetect from "devtools-detect";
- import type { DevToolsEvent } from "devtools-detect";
+ import { createProtection } from "@rexymayderio/god-forbid-devtools";

  useEffect(() => {
-   const handleContextMenu = (e: MouseEvent) => e.preventDefault();
-   window.addEventListener("contextmenu", handleContextMenu, true);
-   if (devtoolsDetect.isOpen) handleDevtoolOpen();
-   window.addEventListener("devtoolschange", handleDevtoolsChange);
+   const protection = createProtection({
+     redirectPath: "/security-violation",
+     onViolation: ({ type }) => console.warn("violation:", type),
+   });
+   protection.start();

    return () => {
-     window.removeEventListener("contextmenu", handleContextMenu, true);
-     window.removeEventListener("devtoolschange", handleDevtoolsChange);
+     protection.stop();
    };
  }, []);
```

## Static-export notes

- All public APIs are **opt-in**. Importing the package does not touch `window`,
  `document`, or `console`.
- Consumers must call `start()` from a `"use client"` boundary inside `useEffect`.
- The package has zero runtime dependencies and ships ESM + CJS + `.d.ts`.

## Development

```bash
bun install
bun run typecheck
bun run test
bun run build
```

Tests follow a behavioural-testing approach: file names describe behaviours
(`DetectOnDevtoolsOpen.test.ts`, `CutActionCutsFromTextarea.test.ts`, …), mocks are
limited to I/O boundaries (`window`, `document`, `navigator.clipboard`,
`document.execCommand`).

## Changelog

### 0.1.2

- **Fix**: Right-clicking a link (e.g. "Open in new tab") no longer triggers a false-positive devtools detection. The `console-log-trap` and `devtools-formatters` checkers previously latched their `triggered` flag permanently after any one-off getter invocation. They now reset before each probe so only synchronous triggers during the active `console.log` call count.

### 0.1.1

- Initial release.

## License

MIT © Rexy Mayderio
