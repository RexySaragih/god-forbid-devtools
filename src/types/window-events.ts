/**
 * WindowEventMap augmentation for "devtoolschange".
 *
 * Importing this package (or any entry that re-exports it) automatically
 * extends the global WindowEventMap so consumers get full type safety:
 *
 *   window.addEventListener("devtoolschange", (e) => {
 *     e.detail.isOpen; // boolean, no cast needed
 *   });
 */

export interface DevtoolsChangeEventDetail {
  isOpen: boolean;
}

declare global {
  interface WindowEventMap {
    devtoolschange: CustomEvent<DevtoolsChangeEventDetail>;
  }
}

export {};
