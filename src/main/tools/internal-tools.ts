import * as memoryRepo from '../db/memory-repo'

export function handleInternalTool(
  name: string,
  input: Record<string, unknown>,
  sessionId: string
): { output: string; isError: boolean } {
  if (name === 'memory_store') {
    const key = input.key as string
    const value = input.value as string
    if (!key || !value) {
      return { output: 'Both key and value are required.', isError: true }
    }
    memoryRepo.upsert(key, value, sessionId)
    return { output: `Remembered: ${key} = ${value}`, isError: false }
  }

  return { output: `Unknown internal tool: ${name}`, isError: true }
}
