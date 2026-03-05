/**
 * Platform abstraction layer.
 * Both Electron (src/main) and CLI (src/cli) call setPlatform() at startup
 * to provide platform-specific paths and behaviors.
 */

export interface Platform {
  /** Directory for app data (DB, etc.) — e.g. Electron's userData or ~/.orbit */
  userDataPath: string
  /** Directory for gws config — e.g. ~/Library/Application Support/gws */
  gwsConfigDir: string
  /** Return the Anthropic API key, or null if not configured */
  getApiKey(): string | null
  /** Prompt user to confirm a dangerous action. Electron shows dialog, CLI prompts stdin. */
  confirmDangerous(toolName: string, description: string, toolUseId: string): Promise<boolean>
  /** Open a URL in the user's browser */
  openExternal(url: string): void
}

let _platform: Platform | null = null

export function setPlatform(p: Platform): void {
  _platform = p
}

export function getPlatform(): Platform {
  if (!_platform) throw new Error('Platform not initialized. Call setPlatform() at startup.')
  return _platform
}
