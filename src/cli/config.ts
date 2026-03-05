import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

const CONFIG_DIR = join(homedir(), '.orbit')
const CONFIG_PATH = join(CONFIG_DIR, 'config.json')

interface OrbitConfig {
  anthropicApiKey?: string
  onboardingComplete?: boolean
}

function ensureDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true })
  }
}

export function loadConfig(): OrbitConfig {
  if (!existsSync(CONFIG_PATH)) return {}
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'))
  } catch {
    return {}
  }
}

export function saveConfig(config: OrbitConfig): void {
  ensureDir()
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), { mode: 0o600 })
}

export function updateConfig(partial: Partial<OrbitConfig>): void {
  const config = loadConfig()
  Object.assign(config, partial)
  saveConfig(config)
}

export function getStoredApiKey(): string | null {
  return loadConfig().anthropicApiKey || null
}

export function saveApiKey(key: string): void {
  updateConfig({ anthropicApiKey: key })
}

export function isOnboardingComplete(): boolean {
  return loadConfig().onboardingComplete === true
}

export function markOnboardingComplete(): void {
  updateConfig({ onboardingComplete: true })
}

export function resetConfig(): void {
  ensureDir()
  writeFileSync(CONFIG_PATH, JSON.stringify({}, null, 2), { mode: 0o600 })
}
