import type { AgentEvent, AuthStatus, ApiVerificationResult, PaginatedMessages, Session, SessionWithMessages, Settings } from './types'

export interface OrbitAPI {
  // Agent
  sendMessage: (sessionId: string, message: string) => Promise<void>
  cancelAgent: (sessionId: string) => Promise<void>
  confirmToolCall: (toolUseId: string, approved: boolean) => Promise<void>
  onAgentEvent: (callback: (event: AgentEvent) => void) => () => void

  // Sessions
  createSession: (title?: string) => Promise<Session>
  listSessions: () => Promise<Session[]>
  getSession: (id: string, opts?: { limit?: number; beforeId?: string }) => Promise<SessionWithMessages>
  getMessages: (sessionId: string, opts?: { limit?: number; beforeId?: string }) => Promise<PaginatedMessages>
  deleteSession: (id: string) => Promise<void>
  renameSession: (id: string, title: string) => Promise<void>

  // Settings
  getSettings: () => Promise<Settings>
  setSettings: (settings: Partial<Settings>) => Promise<Settings>

  // Auth
  getAuthStatus: () => Promise<AuthStatus>
  setApiKey: (key: string) => Promise<void>
  saveOAuthCredentials: (clientId: string, clientSecret: string) => Promise<{ success: boolean; error?: string }>
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>
  validateApiKey: (key: string) => Promise<{ valid: boolean; error?: string }>
  verifyApis: () => Promise<ApiVerificationResult>

  // Window
  minimizeWindow: () => void
  maximizeWindow: () => void
  closeWindow: () => void
}

declare global {
  interface Window {
    orbit: OrbitAPI
  }
}
