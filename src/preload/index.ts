import { contextBridge, ipcRenderer } from 'electron'
import type { OrbitAPI } from '@shared/electron'

const api: OrbitAPI = {
  // Agent
  sendMessage: (sessionId, message) =>
    ipcRenderer.invoke('agent:send', { sessionId, message }),
  cancelAgent: (sessionId) =>
    ipcRenderer.invoke('agent:cancel', { sessionId }),
  confirmToolCall: (toolUseId, approved) =>
    ipcRenderer.invoke('agent:confirm', { toolUseId, approved }),
  onAgentEvent: (callback) => {
    const handler = (_: Electron.IpcRendererEvent, data: unknown) => callback(data as Parameters<typeof callback>[0])
    ipcRenderer.on('agent:event', handler)
    return () => {
      ipcRenderer.removeListener('agent:event', handler)
    }
  },

  // Sessions
  createSession: (title?) =>
    ipcRenderer.invoke('session:create', { title }),
  listSessions: () =>
    ipcRenderer.invoke('session:list'),
  getSession: (id, opts?) =>
    ipcRenderer.invoke('session:get', { id, ...opts }),
  getMessages: (sessionId, opts?) =>
    ipcRenderer.invoke('session:messages', { sessionId, ...opts }),
  deleteSession: (id) =>
    ipcRenderer.invoke('session:delete', { id }),
  renameSession: (id, title) =>
    ipcRenderer.invoke('session:rename', { id, title }),

  // Settings
  getSettings: () =>
    ipcRenderer.invoke('settings:get'),
  setSettings: (settings) =>
    ipcRenderer.invoke('settings:set', settings),

  // Auth
  getAuthStatus: () =>
    ipcRenderer.invoke('auth:get-status'),
  setApiKey: (key) =>
    ipcRenderer.invoke('auth:set-api-key', { key }),
  saveOAuthCredentials: (clientId, clientSecret) =>
    ipcRenderer.invoke('auth:save-oauth-credentials', { clientId, clientSecret }),
  loginWithGoogle: () =>
    ipcRenderer.invoke('auth:login-google'),
  validateApiKey: (key) =>
    ipcRenderer.invoke('auth:validate-api-key', { key }),
  verifyApis: () =>
    ipcRenderer.invoke('auth:verify-apis'),

  // Window
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
}

contextBridge.exposeInMainWorld('orbit', api)
