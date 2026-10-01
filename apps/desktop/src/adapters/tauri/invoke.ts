import { invoke } from "@tauri-apps/api/core"

import { mapTauriError } from "@/adapters/tauri/errors"

/** Keep direct Tauri IPC access inside this adapter boundary. */
export async function invokeTauri<TResponse, TArgs extends Record<string, unknown> = Record<string, never>>(
  command: string,
  args?: TArgs,
): Promise<TResponse> {
  try {
    return await invoke<TResponse>(command, args)
  } catch (error) {
    throw mapTauriError(error)
  }
}
