import { useEffect, useEffectEvent } from "react"

import type { InvalidationEvent } from "@/application/invalidation-events"
import { useDesktopRepositories } from "@/application/use-desktop-repositories"

/**
 * Calls `onInvalidate` whenever any of `events` arrives, from this window
 * or another. Pass a stable list (e.g. a module constant); the callback may
 * change freely and always sees the latest render.
 */
export function useInvalidation(
  events: readonly InvalidationEvent[],
  onInvalidate: (event: InvalidationEvent) => void,
) {
  const { invalidation } = useDesktopRepositories()
  const handle = useEffectEvent(onInvalidate)

  useEffect(() => {
    const unsubscribes = events.map((event) =>
      invalidation.subscribe(event, () => handle(event)),
    )
    return () => {
      for (const unsubscribe of unsubscribes) unsubscribe()
    }
  }, [events, invalidation])
}
