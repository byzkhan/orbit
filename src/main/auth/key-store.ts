import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs'
import { join } from 'path'
import { getPlatform } from '../../core/platform'

// Electron-specific imports (only available in Electron context)
let safeStorage: typeof import('electron').safeStorage | null = null
try {
  safeStorage = require('electron').safeStorage
} catch {
  // Running outside Electron (CLI mode) — safeStorage not available
}

function keyPath(): string {
  return join(getPlatform().userDataPath, '.orbit-key')
}

export function setApiKey(key: string): void {
  if (!safeStorage || !safeStorage.isEncryptionAvailable()) {
    throw new Error('Encryption not available (safeStorage requires Electron)')
  }
  const encrypted = safeStorage.encryptString(key)
  writeFileSync(keyPath(), encrypted)
}

export function getApiKey(): string | null {
  // First try platform-provided key (env var in CLI mode)
  const platformKey = getPlatform().getApiKey()
  if (platformKey) return platformKey

  // Fall back to encrypted storage (Electron)
  if (!safeStorage || !safeStorage.isEncryptionAvailable()) return null
  const p = keyPath()
  if (!existsSync(p)) return null
  try {
    const encrypted = readFileSync(p)
    return safeStorage.decryptString(encrypted)
  } catch {
    return null
  }
}

export function deleteApiKey(): void {
  const p = keyPath()
  if (existsSync(p)) {
    unlinkSync(p)
  }
}
