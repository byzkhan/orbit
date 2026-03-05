import { getDb } from './database'
import { settings } from './schema'
import { eq } from 'drizzle-orm'
import { DEFAULT_SETTINGS, type Settings } from '@shared/types'

export function getAll(): Settings {
  const db = getDb()
  const rows = db.select().from(settings).all()
  const result = { ...DEFAULT_SETTINGS }
  for (const row of rows) {
    if (row.key in result) {
      try {
        ;(result as Record<string, unknown>)[row.key] = JSON.parse(row.value)
      } catch {
        ;(result as Record<string, unknown>)[row.key] = row.value
      }
    }
  }
  return result
}

export function update(partial: Partial<Settings>): Settings {
  const db = getDb()
  for (const [key, value] of Object.entries(partial)) {
    const serialized = JSON.stringify(value)
    const existing = db.select().from(settings).where(eq(settings.key, key)).get()
    if (existing) {
      db.update(settings).set({ value: serialized }).where(eq(settings.key, key)).run()
    } else {
      db.insert(settings).values({ key, value: serialized }).run()
    }
  }
  return getAll()
}
