import { ipcMain } from 'electron'
import { getApiKey, setApiKey } from '../auth/key-store'
import { validateApiKey } from '../auth/validate-key'
import { getGwsAuthState, saveOAuthCredentials, loginWithGoogle, verifyApiAccess } from '../auth/gws-auth'

export function registerAuthHandlers(): void {
  ipcMain.handle('auth:get-status', async () => {
    if (process.env.ORBIT_SKIP_ONBOARDING === '1') {
      return { hasApiKey: true, gwsAuthenticated: true, gwsHasClientConfig: true }
    }
    const hasApiKey = !!getApiKey()
    const gwsState = await getGwsAuthState()
    return {
      hasApiKey,
      gwsAuthenticated: gwsState.isAuthenticated,
      gwsHasClientConfig: gwsState.hasClientConfig,
    }
  })

  ipcMain.handle('auth:set-api-key', async (_e, { key }: { key: string }) => {
    setApiKey(key)
  })

  ipcMain.handle('auth:save-oauth-credentials', async (_e, { clientId, clientSecret }: { clientId: string; clientSecret: string }) => {
    return saveOAuthCredentials(clientId, clientSecret)
  })

  ipcMain.handle('auth:login-google', async () => {
    return loginWithGoogle()
  })

  ipcMain.handle('auth:validate-api-key', async (_e, { key }: { key: string }) => {
    return validateApiKey(key)
  })

  ipcMain.handle('auth:verify-apis', async () => {
    return verifyApiAccess()
  })
}
