import { nanoid } from 'nanoid'
import { getDb } from './database'
import { memory } from './schema'
import { eq } from 'drizzle-orm'

export interface MemoryEntry {
  id: string
  key: string
  value: string
  source: string | null
  confidence: number | null
  createdAt: string
  updatedAt: string
}

export function upsert(key: string, value: string, source?: string): void {
  const db = getDb()
  const now = new Date().toISOString()
  const existing = db.select().from(memory).where(eq(memory.key, key)).get()

  if (existing) {
    db.update(memory)
      .set({ value, updatedAt: now, source: source ?? existing.source })
      .where(eq(memory.key, key))
      .run()
  } else {
    db.insert(memory)
      .values({
        id: nanoid(),
        key,
        value,
        source: source ?? null,
        confidence: 1.0,
        createdAt: now,
        updatedAt: now,
      })
      .run()
  }
}

export function getAll(): MemoryEntry[] {
  const db = getDb()
  return db.select().from(memory).all() as MemoryEntry[]
}

export function getByKey(key: string): MemoryEntry | undefined {
  const db = getDb()
  return db.select().from(memory).where(eq(memory.key, key)).get() as MemoryEntry | undefined
}

export function remove(key: string): void {
  const db = getDb()
  db.delete(memory).where(eq(memory.key, key)).run()
}
