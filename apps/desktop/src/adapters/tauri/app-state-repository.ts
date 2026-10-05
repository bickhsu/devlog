import {
  createKeyedSerialQueue,
  type AppStateRepository,
  type CaptureDraft,
  type CaptureSurface,
  type Entry,
  type SaveCaptureDraftInput,
  type SubmitEntryInput,
} from "@devlog/core"

import {
  captureDraftFromDto,
  entryFromDto,
  type CaptureDraftDto,
  type EntryDto,
} from "@/adapters/tauri/dto"
import { invokeTauri } from "@/adapters/tauri/invoke"

/**
 * AppStateRepository backed by the native capture commands. Validation and
 * the atomic submit happen in Rust; calls for the same surface reach Rust in
 * invocation order, so a save issued before a submit can never land after it.
 */
export class TauriAppStateRepository implements AppStateRepository {
  private readonly queue = createKeyedSerialQueue<CaptureSurface>()

  async getDefaultContextId(): Promise<string | null> {
    return invokeTauri<string | null>("get_default_context_id")
  }

  async getDraft(surface: CaptureSurface): Promise<CaptureDraft | null> {
    const dto = await this.queue.run(surface, () =>
      invokeTauri<CaptureDraftDto | null, { surface: CaptureSurface }>(
        "get_capture_draft",
        { surface },
      ),
    )
    return dto === null ? null : captureDraftFromDto(dto)
  }

  async saveDraft(input: SaveCaptureDraftInput): Promise<CaptureDraft> {
    const dto = await this.queue.run(input.surface, () =>
      invokeTauri<CaptureDraftDto, { input: SaveCaptureDraftInput }>(
        "save_capture_draft",
        { input },
      ),
    )
    return captureDraftFromDto(dto)
  }

  async discardDraft(surface: CaptureSurface): Promise<void> {
    await this.queue.run(surface, () =>
      invokeTauri<null, { surface: CaptureSurface }>("discard_capture_draft", { surface }),
    )
  }

  async submitEntry(input: SubmitEntryInput): Promise<Entry> {
    const dto = await this.queue.run(input.surface, () =>
      invokeTauri<EntryDto, { input: SubmitEntryInput }>("submit_capture_entry", { input }),
    )
    return entryFromDto(dto)
  }
}
