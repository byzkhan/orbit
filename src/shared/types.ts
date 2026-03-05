// ── Agent Types ──────────────────────────────────────────────────────────────

export type AgentState = 'idle' | 'thinking' | 'tool_calling' | 'responding' | 'error' | 'cancelled'

export type AgentEvent =
  | { type: 'state_change'; state: AgentState }
  | { type: 'text_delta'; text: string }
  | { type: 'tool_call_start'; toolUseId: string; toolName: string; input: Record<string, unknown> }
  | { type: 'tool_call_result'; toolUseId: string; result: string; isError: boolean }
  | { type: 'confirmation_required'; toolUseId: string; toolName: string; description: string }
  | { type: 'message_complete'; message: SerializedMessage }
  | { type: 'error'; error: string; recoverable: boolean }
  | { type: 'usage'; inputTokens: number; outputTokens: number }

export interface SerializedMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  toolCalls?: SerializedToolCall[]
  createdAt: string
}

export interface SerializedToolCall {
  toolUseId: string
  toolName: string
  input: Record<string, unknown>
  result?: string
  isError?: boolean
  durationMs?: number
}

// ── Session Types ────────────────────────────────────────────────────────────

export interface Session {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  archived: boolean
}

export interface SessionWithMessages extends Session {
  messages: SerializedMessage[]
  hasMore?: boolean
}

export interface PaginatedMessages {
  messages: SerializedMessage[]
  hasMore: boolean
}

// ── Settings Types ───────────────────────────────────────────────────────────

export interface Settings {
  theme: 'dark' | 'light'
  model: string
  maxSteps: number
  dryRun: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  model: 'claude-sonnet-4-5-20250929',
  maxSteps: 10,
  dryRun: false,
}

// ── Auth Types ───────────────────────────────────────────────────────────────

export interface AuthStatus {
  hasApiKey: boolean
  gwsAuthenticated: boolean
  gwsHasClientConfig: boolean
}

export interface ApiVerificationResult {
  gmail: { ok: boolean; error?: string }
  drive: { ok: boolean; error?: string }
  calendar: { ok: boolean; error?: string }
}
