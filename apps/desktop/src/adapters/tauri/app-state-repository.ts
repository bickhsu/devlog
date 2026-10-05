import {
  createKeyedSerialQueue,
  type AppStateRepository,
  type CaptureSurface,
  type SaveCaptureDraftInput,
} from "@devlog/core"

import {
  captureDraftFromDto,
  entryFromDto,
  type CaptureDraftDto,
  type EntryDto,
} from "@/adapters/tauri/dto"
import { invokeTauri } from "@/adapters/tauri/invoke"

type SurfaceArgs = { readonly surface: CaptureSurface }
/** Saving and submitting share one payload shape on the native side. */
type InputArgs = { readonly input: SaveCaptureDraftInput }

/**
 * AppStateRepository backed by the native capture commands. Calls for the
 * same surface reach Rust in invocation order, so a save issued before a
 * submit can never land after it.
 */
export function createTauriAppStateRepository(): AppStateRepository {
  const queue = createKeyedSerialQueue<CaptureSurface>()

  return {
    getDefaultContextId() {
      return invokeTauri<string | null>("get_default_context_id")
    },

    async getDraft(surface) {
      const dto = await queue.run(surface, () =>
        invokeTauri<CaptureDraftDto | null, SurfaceArgs>("get_capture_draft", { surface }),
      )
      return dto === null ? null : captureDraftFromDto(dto)
    },

    async saveDraft(input) {
      const dto = await queue.run(input.surface, () =>
        invokeTauri<CaptureDraftDto, InputArgs>("save_capture_draft", { input }),
      )
      return captureDraftFromDto(dto)
    },

    async discardDraft(surface) {
      await queue.run(surface, () =>
        invokeTauri<null, SurfaceArgs>("discard_capture_draft", { surface }),
      )
    },

    async submitEntry(input) {
      const dto = await queue.run(input.surface, () =>
        invokeTauri<EntryDto, InputArgs>("submit_capture_entry", { input }),
      )
      return entryFromDto(dto)
    },
  }
}
