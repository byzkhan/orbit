import { nanoid } from 'nanoid'
import { getDb } from './database'
import { messages } from './schema'
import { eq, asc, and, lt, sql } from 'drizzle-orm'
import type { SerializedMessage } from '@shared/types'

export function create(
  sessionId: string,
  role: 'user' | 'assistant',
  content: string,
  toolCalls?: SerializedMessage['toolCalls']
): SerializedMessage {
  const db = getDb()
  const now = new Date().toISOString()
  const msg: SerializedMessage = {
    id: nanoid(),
    role,
    content,
    toolCalls,
    createdAt: now,
  }
  db.insert(messages)
    .values({
      id: msg.id,
      sessionId,
      role,
      content: JSON.stringify(msg),
      createdAt: now,
    })
    .run()
  return msg
}

export function listBySession(sessionId: string): SerializedMessage[] {
  const db = getDb()
  const rows = db
    .select()
    .from(messages)
    .where(eq(messages.sessionId, sessionId))
    .orderBy(asc(messages.createdAt))
    .all()
  return rows.map((r) => JSON.parse(r.content) as SerializedMessage)
}

export function listBySessionPaginated(
  sessionId: string,
  limit: number,
  beforeId?: string
): { messages: SerializedMessage[]; hasMore: boolean } {
  const db = getDb()

  let condition = eq(messages.sessionId, sessionId)

  if (beforeId) {
    // Get createdAt of the beforeId message
    const ref = db
      .select({ createdAt: messages.createdAt })
      .from(messages)
      .where(eq(messages.id, beforeId))
      .get()

    if (ref) {
      condition = and(condition, lt(messages.createdAt, ref.createdAt))!
    }
  }

  // Fetch limit+1 most recent messages to determine hasMore
  const rows = db
    .select()
    .from(messages)
    .where(condition)
    .orderBy(sql`${messages.createdAt} DESC`)
    .limit(limit + 1)
    .all()

  const hasMore = rows.length > limit
  const sliced = rows.slice(0, limit)

  // Reverse to get oldest→newest for display
  sliced.reverse()

  return {
    messages: sliced.map((r) => JSON.parse(r.content) as SerializedMessage),
    hasMore,
  }
}

export function countBySession(sessionId: string): number {
  const db = getDb()
  const result = db
    .select({ count: sql<number>`count(*)` })
    .from(messages)
    .where(eq(messages.sessionId, sessionId))
    .get()
  return result?.count ?? 0
}
