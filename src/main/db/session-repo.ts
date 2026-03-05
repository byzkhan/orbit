import { nanoid } from 'nanoid'
import { getDb } from './database'
import { sessions } from './schema'
import { eq, desc } from 'drizzle-orm'
import type { Session } from '@shared/types'

export function create(title?: string): Session {
  const db = getDb()
  const now = new Date().toISOString()
  const session = {
    id: nanoid(),
    title: title ?? 'New Chat',
    createdAt: now,
    updatedAt: now,
    archived: false,
  }
  db.insert(sessions).values(session).run()
  return session
}

export function list(): Session[] {
  const db = getDb()
  return db
    .select()
    .from(sessions)
    .where(eq(sessions.archived, false))
    .orderBy(desc(sessions.updatedAt))
    .all()
}

export function getById(id: string): Session | undefined {
  const db = getDb()
  return db.select().from(sessions).where(eq(sessions.id, id)).get()
}

export function rename(id: string, title: string): void {
  const db = getDb()
  db.update(sessions)
    .set({ title, updatedAt: new Date().toISOString() })
    .where(eq(sessions.id, id))
    .run()
}

export function touch(id: string): void {
  const db = getDb()
  db.update(sessions)
    .set({ updatedAt: new Date().toISOString() })
    .where(eq(sessions.id, id))
    .run()
}

export function remove(id: string): void {
  const db = getDb()
  db.delete(sessions).where(eq(sessions.id, id)).run()
}
