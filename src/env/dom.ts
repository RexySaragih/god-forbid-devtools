/**
 * Tiny DOM helpers that are safe to call when there is no `document`.
 * Each function returns a sensible no-op value rather than throwing.
 */

import { getDocument } from "./browser";

export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
): HTMLElementTagNameMap[K] | null {
  const doc = getDocument();
  if (!doc) return null;
  return doc.createElement(tag);
}

export function appendToBody(node: Node): void {
  const doc = getDocument();
  if (!doc?.body) return;
  doc.body.appendChild(node);
}

export function appendToHead(node: Node): void {
  const doc = getDocument();
  if (!doc?.head) return;
  doc.head.appendChild(node);
}

export function removeNode(node: Node | null | undefined): void {
  if (!node) return;
  const parent = (node as ChildNode).parentNode;
  if (parent) parent.removeChild(node);
}
