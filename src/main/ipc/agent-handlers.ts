import { BrowserWindow, ipcMain } from 'electron'
import { runAgentLoop, cancelAgent, resolveConfirmation } from '../agent/agent-loop'
import type { AgentEvent } from '@shared/types'

export function registerAgentHandlers(mainWindow: BrowserWindow): void {
  const emit = (event: AgentEvent) => {
    mainWindow.webContents.send('agent:event', event)
  }

  ipcMain.handle('agent:send', async (_e, { sessionId, message }: { sessionId: string; message: string }) => {
    // Fire-and-forget — events stream via agent:event
    runAgentLoop(sessionId, message, emit).catch((err) => {
      emit({ type: 'error', error: err.message ?? String(err), recoverable: true })
    })
  })

  ipcMain.handle('agent:cancel', async (_e, { sessionId }: { sessionId: string }) => {
    cancelAgent(sessionId)
  })

  ipcMain.handle('agent:confirm', async (_e, { toolUseId, approved }: { toolUseId: string; approved: boolean }) => {
    resolveConfirmation(toolUseId, approved)
  })
}
