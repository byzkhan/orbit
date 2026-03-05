import { ipcMain } from 'electron'
import * as settingsRepo from '../db/settings-repo'
import type { Settings } from '@shared/types'

export function registerSettingsHandlers(): void {
  ipcMain.handle('settings:get', async () => {
    return settingsRepo.getAll()
  })

  ipcMain.handle('settings:set', async (_e, partial: Partial<Settings>) => {
    return settingsRepo.update(partial)
  })
}
