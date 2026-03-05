import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { setPlatform } from '../core/platform'
import { waitForConfirmation } from './agent/confirmation-gate'
import { createWindow } from './window'
import { registerAllHandlers } from './ipc'
import './tools/register-tools'

// Initialize Electron platform before anything else
setPlatform({
  userDataPath: app.getPath('userData'),
  gwsConfigDir: join(app.getPath('appData'), 'gws'),
  getApiKey: () => null, // Electron uses safeStorage in key-store.ts
  confirmDangerous: async (_toolName, _description, toolUseId) => {
    // In Electron, the emit('confirmation_required') event already triggered the UI dialog.
    // Wait for the renderer to call resolveConfirmation(toolUseId, approved) via IPC.
    return waitForConfirmation(toolUseId)
  },
  openExternal: (url) => { shell.openExternal(url) },
})

let mainWindow: BrowserWindow | null = null

app.whenReady().then(() => {
  mainWindow = createWindow()
  registerAllHandlers(mainWindow)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow()
      registerAllHandlers(mainWindow)
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}
