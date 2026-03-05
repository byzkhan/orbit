import { ipcMain } from 'electron'
import * as sessionRepo from '../db/session-repo'
import * as messageRepo from '../db/message-repo'

export function registerSessionHandlers(): void {
  ipcMain.handle('session:create', async (_e, { title }: { title?: string } = {}) => {
    return sessionRepo.create(title)
  })

  ipcMain.handle('session:list', async () => {
    return sessionRepo.list()
  })

  ipcMain.handle(
    'session:get',
    async (_e, { id, limit, beforeId }: { id: string; limit?: number; beforeId?: string }) => {
      const session = sessionRepo.getById(id)
      if (!session) throw new Error(`Session not found: ${id}`)
      const pageLimit = limit ?? 50
      const { messages, hasMore } = messageRepo.listBySessionPaginated(id, pageLimit, beforeId)
      return { ...session, messages, hasMore }
    }
  )

  ipcMain.handle(
    'session:messages',
    async (_e, { sessionId, limit, beforeId }: { sessionId: string; limit?: number; beforeId?: string }) => {
      const pageLimit = limit ?? 50
      return messageRepo.listBySessionPaginated(sessionId, pageLimit, beforeId)
    }
  )

  ipcMain.handle('session:delete', async (_e, { id }: { id: string }) => {
    sessionRepo.remove(id)
  })

  ipcMain.handle('session:rename', async (_e, { id, title }: { id: string; title: string }) => {
    sessionRepo.rename(id, title)
  })
}
