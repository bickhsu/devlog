import { DomainError, DomainErrorCode } from "@devlog/core"

const domainErrorCodes = new Set<string>(Object.values(DomainErrorCode))

/** Rust commands return a stable `{ code }` payload for expected domain errors. */
export function mapTauriError(error: unknown): Error {
  const payload = readErrorPayload(error)
  if (payload && typeof payload === "object" && "code" in payload) {
    const code = payload.code
    if (typeof code === "string" && domainErrorCodes.has(code)) {
      return new DomainError(code as DomainErrorCode)
    }
  }

  return new DomainError(DomainErrorCode.StorageUnavailable)
}

function readErrorPayload(error: unknown): unknown {
  if (typeof error !== "string") return error
  try {
    return JSON.parse(error) as unknown
  } catch {
    return null
  }
}
