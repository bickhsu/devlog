import { describe, expect, test } from 'bun:test'

import { createKeyedSerialQueue } from './serial-queue'

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((settle) => { resolve = settle })
  return { promise, resolve }
}

describe('createKeyedSerialQueue', () => {
  test('runs tasks with the same key in invocation order', async () => {
    const queue = createKeyedSerialQueue<string>()
    const log: string[] = []
    const gate = deferred()

    const first = queue.run('main', async () => {
      log.push('first:start')
      await gate.promise
      log.push('first:end')
    })
    const second = queue.run('main', async () => { log.push('second') })

    await Promise.resolve()
    expect(log).toEqual(['first:start'])
    gate.resolve()
    await Promise.all([first, second])
    expect(log).toEqual(['first:start', 'first:end', 'second'])
  })

  test('does not block other keys', async () => {
    const queue = createKeyedSerialQueue<string>()
    const gate = deferred()
    const blocked = queue.run('main', () => gate.promise)

    expect(await queue.run('quick-capture', async () => 'done')).toBe('done')
    gate.resolve()
    await blocked
  })

  test('keeps running after a failed task', async () => {
    const queue = createKeyedSerialQueue<string>()
    const failed = queue.run('main', async () => { throw new Error('boom') })
    const next = queue.run('main', async () => 'next')

    await expect(failed).rejects.toThrow('boom')
    expect(await next).toBe('next')
  })
})
