import { BrowserWindow, ipcMain } from 'electron'
import { registerAgentHandlers } from './agent-handlers'
import { registerSessionHandlers } from './session-handlers'
import { registerSettingsHandlers } from './settings-handlers'
import { registerAuthHandlers } from './auth-handlers'
import { registerWindowHandlers } from './window-handlers'

export function registerAllHandlers(mainWindow: BrowserWindow): void {
  registerAgentHandlers(mainWindow)
  registerSessionHandlers()
  registerSettingsHandlers()
  registerAuthHandlers()
  registerWindowHandlers()
}
