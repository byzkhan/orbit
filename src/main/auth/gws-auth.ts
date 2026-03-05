import { spawn } from 'child_process'
import { createDecipheriv } from 'crypto'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'
import { resolveGwsPath } from '../tools/resolve-gws'

export interface ApiVerificationResult {
  gmail: { ok: boolean; error?: string }
  drive: { ok: boolean; error?: string }
  calendar: { ok: boolean; error?: string }
}

function gwsConfigDir(): string {
  return join(app.getPath('appData'), 'gws')
}

function clientSecretPath(): string {
  return join(gwsConfigDir(), 'client_secret.json')
}

function credentialsJsonPath(): string {
  return join(gwsConfigDir(), 'credentials.json')
}

/**
 * Decrypt credentials.enc → credentials.json so gws can find them via env var.
 * gws 0.4.x has a bug where it saves encrypted credentials but can't load them
 * for API calls without the GOOGLE_WORKSPACE_CLI_CREDENTIALS_FILE env var.
 */
function decryptCredentials(): boolean {
  const dir = gwsConfigDir()
  const encPath = join(dir, 'credentials.enc')
  const keyPath = join(dir, '.encryption_key')
  const outPath = credentialsJsonPath()

  if (!existsSync(encPath) || !existsSync(keyPath)) return false

  try {
    const key = Buffer.from(readFileSync(keyPath, 'utf-8').trim(), 'base64')
    const encrypted = readFileSync(encPath)
    // AES-256-GCM: nonce(12) + ciphertext + tag(16)
    const nonce = encrypted.subarray(0, 12)
    const tag = encrypted.subarray(encrypted.length - 16)
    const ciphertext = encrypted.subarray(12, encrypted.length - 16)
    const decipher = createDecipheriv('aes-256-gcm', key, nonce)
    decipher.setAuthTag(tag)
    let decrypted = decipher.update(ciphertext, undefined, 'utf-8')
    decrypted += decipher.final('utf-8')
    writeFileSync(outPath, decrypted, { mode: 0o600 })
    return true
  } catch {
    return false
  }
}

/**
 * Build the env object for gws child processes.
 * Sets GOOGLE_WORKSPACE_CLI_CREDENTIALS_FILE so gws can find credentials.
 */
export function gwsEnv(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env, NO_COLOR: '1' }
  const jsonPath = credentialsJsonPath()
  if (existsSync(jsonPath)) {
    env.GOOGLE_WORKSPACE_CLI_CREDENTIALS_FILE = jsonPath
  }
  return env
}

export interface GwsAuthState {
  hasClientConfig: boolean
  isAuthenticated: boolean
}

export async function checkGwsAuth(): Promise<boolean> {
  // Ensure decrypted credentials exist for API calls
  if (!existsSync(credentialsJsonPath())) {
    decryptCredentials()
  }
  const state = await getGwsAuthState()
  return state.isAuthenticated
}

export async function getGwsAuthState(): Promise<GwsAuthState> {
  const hasClientConfig = existsSync(clientSecretPath())

  return new Promise((resolve) => {
    try {
      const proc = spawn(resolveGwsPath(), ['auth', 'status'], {
        shell: false,
        timeout: 10_000,
        env: gwsEnv(),
      })

      let stdout = ''
      proc.stdout?.on('data', (d) => (stdout += d.toString()))
      proc.on('error', () => resolve({ hasClientConfig, isAuthenticated: false }))
      proc.on('close', () => {
        try {
          const status = JSON.parse(stdout)
          const isAuthenticated = status.storage !== 'none' && status.auth_method !== 'none'
          resolve({ hasClientConfig, isAuthenticated })
        } catch {
          resolve({ hasClientConfig, isAuthenticated: false })
        }
      })
    } catch {
      resolve({ hasClientConfig, isAuthenticated: false })
    }
  })
}

/**
 * Write a client_secret.json from a client ID + secret pair.
 * This is the standard Google OAuth Desktop client format.
 */
export function saveOAuthCredentials(clientId: string, clientSecret: string): { success: boolean; error?: string } {
  try {
    const dir = gwsConfigDir()
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }

    const config = {
      installed: {
        client_id: clientId,
        client_secret: clientSecret,
        project_id: 'orbit-desktop',
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        redirect_uris: ['http://localhost'],
      },
    }

    writeFileSync(clientSecretPath(), JSON.stringify(config, null, 2))
    return { success: true }
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export async function loginWithGoogle(): Promise<{ success: boolean; error?: string }> {
  if (!existsSync(clientSecretPath())) {
    return {
      success: false,
      error: 'OAuth client not configured. Please enter your Google Client ID and Secret first.',
    }
  }

  // Import shell here to avoid top-level Electron import issues
  const { shell } = await import('electron')

  return new Promise((resolve) => {
    try {
      const proc = spawn(resolveGwsPath(), ['auth', 'login'], {
        shell: false,
        timeout: 120_000,
        env: gwsEnv(),
      })

      let stdout = ''
      let stderr = ''
      let urlOpened = false

      proc.stdout?.on('data', (d) => {
        stdout += d.toString()
        // gws prints "Open this URL in your browser to authenticate:\n\n  https://..."
        // Capture and auto-open the URL
        if (!urlOpened) {
          const urlMatch = stdout.match(/https:\/\/accounts\.google\.com\S+/)
          if (urlMatch) {
            urlOpened = true
            shell.openExternal(urlMatch[0])
          }
        }
      })

      proc.stderr?.on('data', (d) => {
        stderr += d.toString()
        // gws may also print the URL to stderr
        if (!urlOpened) {
          const urlMatch = stderr.match(/https:\/\/accounts\.google\.com\S+/)
          if (urlMatch) {
            urlOpened = true
            shell.openExternal(urlMatch[0])
          }
        }
      })

      proc.on('error', (err) => resolve({ success: false, error: err.message }))
      proc.on('close', (code) => {
        if (code === 0) {
          // Decrypt credentials.enc → credentials.json for API calls
          decryptCredentials()
          resolve({ success: true })
        } else {
          let errorMsg = stderr
          try {
            const parsed = JSON.parse(stdout)
            if (parsed.error?.message) errorMsg = parsed.error.message
          } catch { /* use stderr */ }
          resolve({ success: false, error: errorMsg || `gws auth login exited with code ${code}` })
        }
      })
    } catch (err: unknown) {
      resolve({ success: false, error: String(err) })
    }
  })
}

/**
 * Run a quick test command for a single Google API service.
 * Returns { ok: true } on success, or { ok: false, error: string } on failure.
 */
function testGwsCommand(args: string[]): Promise<{ ok: boolean; error?: string }> {
  return new Promise((resolve) => {
    try {
      const proc = spawn(resolveGwsPath(), args, {
        shell: false,
        timeout: 15_000,
        env: gwsEnv(),
      })

      let stdout = ''
      let stderr = ''
      proc.stdout?.on('data', (d) => (stdout += d.toString()))
      proc.stderr?.on('data', (d) => (stderr += d.toString()))
      proc.on('error', (err) => resolve({ ok: false, error: err.message }))
      proc.on('close', (code) => {
        if (code === 0) {
          resolve({ ok: true })
        } else {
          let errorMsg = stderr.trim()
          try {
            const parsed = JSON.parse(stdout)
            if (parsed.error?.message) errorMsg = parsed.error.message
          } catch { /* use stderr */ }
          // Simplify common error messages
          if (errorMsg.includes('has not been used in project') || errorMsg.includes('it is disabled')) {
            errorMsg = 'API not enabled. Please enable it in Google Cloud Console.'
          } else if (errorMsg.includes('Request had insufficient authentication scopes') || errorMsg.includes('PERMISSION_DENIED')) {
            errorMsg = 'Insufficient permissions. Try signing out and back in.'
          }
          resolve({ ok: false, error: errorMsg || `Command failed with code ${code}` })
        }
      })
    } catch (err: unknown) {
      resolve({ ok: false, error: String(err) })
    }
  })
}

/**
 * Verify access to each Google API by running a minimal test command.
 */
export async function verifyApiAccess(): Promise<ApiVerificationResult> {
  const [gmail, drive, calendar] = await Promise.all([
    testGwsCommand(['gmail', 'users', 'messages', 'list', '--params', '{"userId":"me","maxResults":1}']),
    testGwsCommand(['drive', 'files', 'list', '--params', '{"pageSize":1}']),
    testGwsCommand(['calendar', 'events', 'list', '--params', '{"calendarId":"primary","maxResults":1}']),
  ])

  return { gmail, drive, calendar }
}
