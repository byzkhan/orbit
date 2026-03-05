import { app, BrowserWindow } from 'electron'
import { createWindow } from './window'
import { registerAllHandlers } from './ipc'
import './tools/register-tools'

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
