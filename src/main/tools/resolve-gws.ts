import { execSync } from 'child_process'
import { existsSync } from 'fs'

let cachedPath: string | null = null

export function resolveGwsPath(): string {
  if (cachedPath) return cachedPath

  // 1. Explicit env var
  if (process.env.GWS_PATH && existsSync(process.env.GWS_PATH)) {
    cachedPath = process.env.GWS_PATH
    return cachedPath
  }

  // 2. Try to resolve via shell (picks up nvm, etc.)
  try {
    const resolved = execSync('which gws', {
      shell: '/bin/zsh',
      timeout: 5_000,
      env: {
        ...process.env,
        PATH: buildFullPath(),
      },
    })
      .toString()
      .trim()
    if (resolved && existsSync(resolved)) {
      cachedPath = resolved
      return cachedPath
    }
  } catch {
    // fall through
  }

  // 3. Check common locations
  const candidates = [
    `${process.env.HOME}/.nvm/versions/node/${process.version}/bin/gws`,
    '/usr/local/bin/gws',
    '/opt/homebrew/bin/gws',
    `${process.env.HOME}/.local/bin/gws`,
  ]
  for (const p of candidates) {
    if (existsSync(p)) {
      cachedPath = p
      return cachedPath
    }
  }

  // 4. Fallback — let spawn try bare 'gws'
  cachedPath = 'gws'
  return cachedPath
}

function buildFullPath(): string {
  const home = process.env.HOME || ''
  const existing = process.env.PATH || ''
  const extras = [
    `${home}/.nvm/versions/node/${process.version}/bin`,
    '/usr/local/bin',
    '/opt/homebrew/bin',
    `${home}/.local/bin`,
  ]
  return [...extras, existing].join(':')
}
