/** Runs tasks sharing a key one at a time, in invocation order. */
export type KeyedSerialQueue<TKey> = {
  run<T>(key: TKey, task: () => Promise<T>): Promise<T>
}

export function createKeyedSerialQueue<TKey>(): KeyedSerialQueue<TKey> {
  const tails = new Map<TKey, Promise<unknown>>()

  return {
    run(key, task) {
      const previous = tails.get(key) ?? Promise.resolve()
      // A failed task must not block the tasks queued behind it.
      const result = previous.then(task, task)
      const tail = result.catch(() => undefined)
      tails.set(key, tail)
      void tail.then(() => {
        if (tails.get(key) === tail) tails.delete(key)
      })
      return result
    },
  }
}
