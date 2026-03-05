import { create } from 'zustand'
import type { Settings, AuthStatus, ApiVerificationResult } from '@shared/types'
import { DEFAULT_SETTINGS } from '@shared/types'

interface SettingsState {
  settings: Settings
  authStatus: AuthStatus
  isLoaded: boolean

  loadSettings: () => Promise<void>
  updateSettings: (partial: Partial<Settings>) => Promise<void>
  loadAuthStatus: () => Promise<void>
  setApiKey: (key: string) => Promise<void>
  validateApiKey: (key: string) => Promise<{ valid: boolean; error?: string }>
  saveOAuthCredentials: (clientId: string, clientSecret: string) => Promise<{ success: boolean; error?: string }>
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>
  verifyApis: () => Promise<ApiVerificationResult>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  authStatus: { hasApiKey: false, gwsAuthenticated: false, gwsHasClientConfig: false },
  isLoaded: false,

  loadSettings: async () => {
    const settings = await window.orbit.getSettings()
    set({ settings, isLoaded: true })
  },

  updateSettings: async (partial) => {
    const settings = await window.orbit.setSettings(partial)
    set({ settings })
  },

  loadAuthStatus: async () => {
    const authStatus = await window.orbit.getAuthStatus()
    set({ authStatus })
  },

  setApiKey: async (key) => {
    await window.orbit.setApiKey(key)
    set((s) => ({ authStatus: { ...s.authStatus, hasApiKey: true } }))
  },

  validateApiKey: async (key) => {
    return window.orbit.validateApiKey(key)
  },

  saveOAuthCredentials: async (clientId, clientSecret) => {
    const result = await window.orbit.saveOAuthCredentials(clientId, clientSecret)
    if (result.success) {
      set((s) => ({ authStatus: { ...s.authStatus, gwsHasClientConfig: true } }))
    }
    return result
  },

  loginWithGoogle: async () => {
    const result = await window.orbit.loginWithGoogle()
    if (result.success) {
      await get().loadAuthStatus()
    }
    return result
  },

  verifyApis: async () => {
    return window.orbit.verifyApis()
  },
}))
