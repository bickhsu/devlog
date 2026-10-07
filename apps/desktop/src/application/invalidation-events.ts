import type { CaptureSurface } from "@devlog/core"

/**
 * Cross-window invalidation signals. After a native mutation commits, every
 * window receives the kinds of data that changed and reloads them through
 * its repositories. Payloads only identify what changed; they never carry
 * the new data, so a window cannot drift from what SQLite holds.
 *
 * Mirrors `apps/desktop/src-tauri/src/events.rs`; keep the event names and
 * payload fields in sync.
 */
export type InvalidationPayloads = {
  /** An entry was created (submit) or edited. */
  readonly "entries-changed": { readonly entryId: string }
  /** Contexts were created, renamed, or archived; `contextId` is the target. */
  readonly "contexts-changed": { readonly contextId: string }
  /** A surface's draft was saved, discarded, submitted, or lost its context to an archive. */
  readonly "capture-draft-changed": { readonly surface: CaptureSurface }
  /** The default context for new drafts changed (submit or archive). */
  readonly "app-state-changed": Readonly<Record<string, never>>
}

export type InvalidationEvent = keyof InvalidationPayloads

export const INVALIDATION_EVENTS = [
  "entries-changed",
  "contexts-changed",
  "capture-draft-changed",
  "app-state-changed",
] as const satisfies readonly InvalidationEvent[]

export type Unsubscribe = () => void

/**
 * Subscribes to invalidations from every window, including the one that ran
 * the mutation, so all views follow one reload path.
 */
export interface InvalidationEvents {
  subscribe<E extends InvalidationEvent>(
    event: E,
    handler: (payload: InvalidationPayloads[E]) => void,
  ): Unsubscribe
}
