import { listen } from "@tauri-apps/api/event"

import type {
  InvalidationEvent,
  InvalidationEvents,
  InvalidationPayloads,
} from "@/application/invalidation-events"

/** InvalidationEvents backed by Tauri's app-wide event bus. */
export class TauriInvalidationEvents implements InvalidationEvents {
  subscribe<E extends InvalidationEvent>(
    event: E,
    handler: (payload: InvalidationPayloads[E]) => void,
  ) {
    let unlisten: (() => void) | null = null
    let unsubscribed = false

    // `listen` registers asynchronously; an unsubscribe that arrives first
    // (e.g. a React effect cleanup) detaches as soon as registration lands.
    listen<InvalidationPayloads[E]>(event, ({ payload }) => {
      if (!unsubscribed) handler(payload)
    }).then(
      (detach) => {
        if (unsubscribed) detach()
        else unlisten = detach
      },
      (error: unknown) => {
        console.error(`[devlog] could not listen for ${event}`, error)
      },
    )

    return () => {
      unsubscribed = true
      unlisten?.()
      unlisten = null
    }
  }
}
