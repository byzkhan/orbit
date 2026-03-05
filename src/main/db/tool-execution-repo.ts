import { nanoid } from 'nanoid'
import { getDb } from './database'
import { toolExecutions } from './schema'

export function record(params: {
  messageId?: string
  sessionId: string
  toolName: string
  input: Record<string, unknown>
  output: string
  isError: boolean
  durationMs: number
}): void {
  const db = getDb()
  db.insert(toolExecutions)
    .values({
      id: nanoid(),
      messageId: params.messageId ?? null,
      sessionId: params.sessionId,
      toolName: params.toolName,
      input: JSON.stringify(params.input),
      output: params.output,
      isError: params.isError,
      durationMs: params.durationMs,
      createdAt: new Date().toISOString(),
    })
    .run()
}
