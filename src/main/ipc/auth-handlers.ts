import { ipcMain } from 'electron'
import Anthropic from '@anthropic-ai/sdk'
import { getApiKey, setApiKey } from '../auth/key-store'
import { getGwsAuthState, saveOAuthCredentials, loginWithGoogle, verifyApiAccess } from '../auth/gws-auth'

async function validateApiKey(key: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const client = new Anthropic({ apiKey: key })
    await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'hi' }],
    })
    return { valid: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('401') || message.includes('authentication') || message.includes('invalid')) {
      return { valid: false, error: 'Invalid API key. Please check and try again.' }
    }
    if (message.includes('429') || message.includes('rate')) {
      return { valid: false, error: 'Rate limited. The key is likely valid — try again in a moment.' }
    }
    return { valid: false, error: message }
  }
}

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
