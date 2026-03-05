import { safeStorage, app } from 'electron'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

function keyPath(): string {
  return join(app.getPath('userData'), '.orbit-key')
}

export function setApiKey(key: string): void {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Encryption not available on this system')
  }
  const encrypted = safeStorage.encryptString(key)
  writeFileSync(keyPath(), encrypted)
}

export function getApiKey(): string | null {
  const p = keyPath()
  if (!existsSync(p)) return null
  if (!safeStorage.isEncryptionAvailable()) return null
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
    const { unlinkSync } = require('fs')
    unlinkSync(p)
  }
}
