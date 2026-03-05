import { create } from 'zustand'
import type { AgentState, AgentEvent, Session, SerializedMessage } from '@shared/types'

interface ToolCallStatus {
  toolUseId: string
  toolName: string
  input: Record<string, unknown>
  status: 'running' | 'complete' | 'error'
  result?: string
  isError?: boolean
}

interface ConfirmationRequest {
  toolUseId: string
  toolName: string
  description: string
}

interface CacheEntry {
  messages: SerializedMessage[]
  hasMore: boolean
}

const MAX_CACHE_SIZE = 5

interface ChatState {
  sessions: Session[]
  activeSessionId: string | null
  messages: SerializedMessage[]
  hasMoreMessages: boolean
  loadingMore: boolean
  agentState: AgentState
  streamingText: string
  activeToolCalls: Map<string, ToolCallStatus>
  pendingConfirmation: ConfirmationRequest | null
  messageCache: Map<string, CacheEntry>

  // Actions
  loadSessions: () => Promise<void>
  createSession: () => Promise<string>
  selectSession: (sessionId: string) => Promise<void>
  deleteSession: (sessionId: string) => Promise<void>
  renameSession: (sessionId: string, title: string) => Promise<void>
  sendMessage: (text: string) => Promise<void>
  cancelAgent: () => void
  confirmToolCall: (toolUseId: string, approved: boolean) => void
  handleAgentEvent: (event: AgentEvent) => void
  flushStreamingText: (text: string) => void
  loadOlderMessages: () => Promise<void>
}

function evictCache(cache: Map<string, CacheEntry>, maxSize: number): Map<string, CacheEntry> {
  if (cache.size <= maxSize) return cache
  const newCache = new Map(cache)
  // Delete the oldest entry (first key in insertion order)
  const firstKey = newCache.keys().next().value
  if (firstKey) newCache.delete(firstKey)
  return newCache
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  messages: [],
  hasMoreMessages: false,
  loadingMore: false,
  agentState: 'idle',
  streamingText: '',
  activeToolCalls: new Map(),
  pendingConfirmation: null,
  messageCache: new Map(),

  loadSessions: async () => {
    const sessions = await window.orbit.listSessions()
    set({ sessions })
  },

  createSession: async () => {
    const session = await window.orbit.createSession()
    set((s) => ({
      sessions: [session, ...s.sessions],
      activeSessionId: session.id,
      messages: [],
      hasMoreMessages: false,
      streamingText: '',
      activeToolCalls: new Map(),
    }))
    return session.id
  },

  selectSession: async (sessionId: string) => {
    const { messageCache } = get()

    // Check cache first
    const cached = messageCache.get(sessionId)
    if (cached) {
      // Move to end of map (most recently used)
      const newCache = new Map(messageCache)
      newCache.delete(sessionId)
      newCache.set(sessionId, cached)
      set({
        activeSessionId: sessionId,
        messages: cached.messages,
        hasMoreMessages: cached.hasMore,
        streamingText: '',
        activeToolCalls: new Map(),
        agentState: 'idle',
        pendingConfirmation: null,
        messageCache: newCache,
      })
      return
    }

    // Cache miss — fetch from DB
    const data = await window.orbit.getSession(sessionId, { limit: 50 })
    const entry: CacheEntry = { messages: data.messages, hasMore: data.hasMore ?? false }

    const newCache = new Map(get().messageCache)
    newCache.set(sessionId, entry)

    set({
      activeSessionId: sessionId,
      messages: data.messages,
      hasMoreMessages: entry.hasMore,
      streamingText: '',
      activeToolCalls: new Map(),
      agentState: 'idle',
      pendingConfirmation: null,
      messageCache: evictCache(newCache, MAX_CACHE_SIZE),
    })
  },

  deleteSession: async (sessionId: string) => {
    await window.orbit.deleteSession(sessionId)
    const { activeSessionId, messageCache } = get()
    const newCache = new Map(messageCache)
    newCache.delete(sessionId)
    set((s) => ({
      sessions: s.sessions.filter((sess) => sess.id !== sessionId),
      messageCache: newCache,
      ...(activeSessionId === sessionId
        ? { activeSessionId: null, messages: [], hasMoreMessages: false, streamingText: '' }
        : {}),
    }))
  },

  renameSession: async (sessionId: string, title: string) => {
    await window.orbit.renameSession(sessionId, title)
    set((s) => ({
      sessions: s.sessions.map((sess) =>
        sess.id === sessionId ? { ...sess, title } : sess
      ),
    }))
  },

  sendMessage: async (text: string) => {
    let { activeSessionId } = get()
    if (!activeSessionId) {
      activeSessionId = await get().createSession()
    }

    const userMsg: SerializedMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    }
    set((s) => ({
      messages: [...s.messages, userMsg],
      streamingText: '',
      activeToolCalls: new Map(),
    }))

    await window.orbit.sendMessage(activeSessionId, text)
  },

  cancelAgent: () => {
    const { activeSessionId } = get()
    if (activeSessionId) {
      window.orbit.cancelAgent(activeSessionId)
    }
  },

  confirmToolCall: (toolUseId: string, approved: boolean) => {
    window.orbit.confirmToolCall(toolUseId, approved)
    set({ pendingConfirmation: null })
  },

  handleAgentEvent: (event: AgentEvent) => {
    switch (event.type) {
      case 'state_change':
        set({ agentState: event.state })
        break

      case 'tool_call_start':
        set((s) => {
          const calls = new Map(s.activeToolCalls)
          calls.set(event.toolUseId, {
            toolUseId: event.toolUseId,
            toolName: event.toolName,
            input: event.input,
            status: 'running',
          })
          return { activeToolCalls: calls }
        })
        break

      case 'tool_call_result':
        set((s) => {
          const calls = new Map(s.activeToolCalls)
          const existing = calls.get(event.toolUseId)
          if (existing) {
            calls.set(event.toolUseId, {
              ...existing,
              status: event.isError ? 'error' : 'complete',
              result: event.result,
              isError: event.isError,
            })
          }
          return { activeToolCalls: calls }
        })
        break

      case 'confirmation_required':
        set({
          pendingConfirmation: {
            toolUseId: event.toolUseId,
            toolName: event.toolName,
            description: event.description,
          },
        })
        break

      case 'message_complete': {
        const msg = event.message
        const toolCalls = Array.from(get().activeToolCalls.values()).map((tc) => ({
          toolUseId: tc.toolUseId,
          toolName: tc.toolName,
          input: tc.input,
          result: tc.result,
          isError: tc.isError,
        }))
        const finalMsg: SerializedMessage = {
          ...msg,
          toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        }
        const newMessages = [...get().messages, finalMsg]
        const { activeSessionId, messageCache, hasMoreMessages } = get()

        // Update cache for active session
        if (activeSessionId) {
          const newCache = new Map(messageCache)
          newCache.set(activeSessionId, { messages: newMessages, hasMore: hasMoreMessages })
          set({
            messages: newMessages,
            streamingText: '',
            activeToolCalls: new Map(),
            messageCache: newCache,
          })
        } else {
          set({
            messages: newMessages,
            streamingText: '',
            activeToolCalls: new Map(),
          })
        }

        get().loadSessions()
        break
      }

      case 'error':
        set({ agentState: 'error' })
        set((s) => ({
          messages: [
            ...s.messages,
            {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: `Error: ${event.error}`,
              createdAt: new Date().toISOString(),
            },
          ],
          streamingText: '',
        }))
        break
    }
  },

  flushStreamingText: (text: string) => {
    set({ streamingText: text })
  },

  loadOlderMessages: async () => {
    const { activeSessionId, messages, loadingMore, hasMoreMessages } = get()
    if (!activeSessionId || loadingMore || !hasMoreMessages || messages.length === 0) return

    set({ loadingMore: true })

    const beforeId = messages[0].id
    const data = await window.orbit.getMessages(activeSessionId, { limit: 50, beforeId })
    const newMessages = [...data.messages, ...get().messages]

    // Update cache
    const newCache = new Map(get().messageCache)
    newCache.set(activeSessionId, { messages: newMessages, hasMore: data.hasMore })

    set({
      messages: newMessages,
      hasMoreMessages: data.hasMore,
      loadingMore: false,
      messageCache: newCache,
    })
  },
}))
