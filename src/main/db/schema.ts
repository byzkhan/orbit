import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  title: text('title').notNull().default('New Chat'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
})

export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  role: text('role').notNull(),
  content: text('content').notNull(),
  tokenCount: integer('token_count'),
  createdAt: text('created_at').notNull(),
})

export const toolExecutions = sqliteTable('tool_executions', {
  id: text('id').primaryKey(),
  messageId: text('message_id').references(() => messages.id, { onDelete: 'cascade' }),
  sessionId: text('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  toolName: text('tool_name').notNull(),
  input: text('input').notNull(),
  output: text('output'),
  isError: integer('is_error', { mode: 'boolean' }).notNull().default(false),
  durationMs: integer('duration_ms'),
  createdAt: text('created_at').notNull(),
})

export const memory = sqliteTable('memory', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  source: text('source'),
  confidence: real('confidence').default(1.0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
})
