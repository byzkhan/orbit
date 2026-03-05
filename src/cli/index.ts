#!/usr/bin/env node
import { createInterface } from 'readline'
import { join } from 'path'
import { homedir } from 'os'
import { execSync } from 'child_process'
import { setPlatform } from '../core/platform'
import type { AgentEvent } from '@shared/types'
import { getStoredApiKey, isOnboardingComplete, resetConfig } from './config'
import { c } from './ui'

// ── Platform setup ──────────────────────────────────────────────────────────

const ORBIT_DIR = process.env.ORBIT_DATA_DIR || join(homedir(), '.orbit')

function resolveGwsConfigDir(): string {
  if (process.platform === 'darwin') {
    return join(homedir(), 'Library', 'Application Support', 'gws')
  }
  return join(process.env.XDG_CONFIG_HOME || join(homedir(), '.config'), 'gws')
}

function openUrl(url: string): void {
  try {
    if (process.platform === 'darwin') {
      execSync(`open "${url}"`)
    } else if (process.platform === 'linux') {
      execSync(`xdg-open "${url}"`)
    } else {
      execSync(`start "${url}"`)
    }
  } catch {
    console.log(`\n  Open this URL in your browser:\n  ${url}\n`)
  }
}

setPlatform({
  userDataPath: ORBIT_DIR,
  gwsConfigDir: resolveGwsConfigDir(),
  getApiKey: () => process.env.ANTHROPIC_API_KEY || getStoredApiKey(),
  confirmDangerous: async (toolName: string, description: string, _toolUseId: string) => {
    return new Promise((resolve) => {
      const rl = createInterface({ input: process.stdin, output: process.stderr })
      process.stderr.write(`\n\x1b[33m⚠  Dangerous tool: ${toolName}\x1b[0m\n   ${description}\n   Allow? [y/N] `)
      rl.once('line', (answer) => {
        rl.close()
        resolve(answer.trim().toLowerCase() === 'y')
      })
    })
  },
  openExternal: openUrl,
})

// ── Import after platform is set ────────────────────────────────────────────

import '../main/tools/register-tools'
import { runAgentLoop, cancelAgent } from '../main/agent/agent-loop'
import { getApiKey } from '../main/auth/key-store'
import * as sessionRepo from '../main/db/session-repo'
import { getDb } from '../main/db/database'
import { checkGwsAuth } from '../main/auth/gws-auth'
import { runOnboarding } from './onboarding'

// ── CLI Agent Runner ────────────────────────────────────────────────────────

let currentText = ''

function emit(event: AgentEvent): void {
  switch (event.type) {
    case 'state_change':
      if (event.state === 'thinking') {
        process.stdout.write(`${c.dim}thinking...${c.reset}`)
      }
      break

    case 'text_delta':
      // Clear "thinking..." on first text
      if (currentText === '') {
        process.stdout.write('\r\x1b[K')
      }
      process.stdout.write(event.text)
      currentText += event.text
      break

    case 'tool_call_start':
      // Clear thinking indicator if still showing
      if (currentText === '') {
        process.stdout.write('\r\x1b[K')
      }
      process.stdout.write(
        `\n${c.cyan}┌ ${c.bold}${event.toolName}${c.reset}${c.dim} ${formatInput(event.input)}${c.reset}\n`
      )
      break

    case 'tool_call_result':
      if (event.isError) {
        process.stdout.write(`${c.red}└ error: ${truncate(event.result, 200)}${c.reset}\n`)
      } else {
        const preview = truncate(event.result, 300)
        process.stdout.write(`${c.green}└ ${c.reset}${c.dim}${preview}${c.reset}\n`)
      }
      break

    case 'confirmation_required':
      // Handled by platform.confirmDangerous via the confirmation gate
      break

    case 'message_complete':
      if (currentText === '') {
        // No streaming text was shown, print the full message
        process.stdout.write(event.message.content)
      }
      process.stdout.write('\n')
      currentText = ''
      break

    case 'error':
      process.stderr.write(`\n${c.red}Error: ${event.error}${c.reset}\n`)
      currentText = ''
      break

    case 'usage':
      process.stderr.write(
        `${c.dim}tokens: ${event.inputTokens} in / ${event.outputTokens} out${c.reset}\n`
      )
      break
  }
}

function formatInput(input: Record<string, unknown>): string {
  const str = JSON.stringify(input)
  return truncate(str, 120)
}

function truncate(str: string, max: number): string {
  const oneLine = str.replace(/\n/g, ' ')
  if (oneLine.length <= max) return oneLine
  return oneLine.slice(0, max - 3) + '...'
}

// ── CLI flags ───────────────────────────────────────────────────────────────

function printHelp(): void {
  console.log(`
${c.bold}${c.amber}Orbit${c.reset} ${c.dim}— Google Workspace AI Assistant${c.reset}

${c.bold}Usage:${c.reset}
  orbit              Start Orbit (runs setup on first launch)
  orbit --setup      Re-run onboarding (skips already-done steps)
  orbit --reset      Clear config and re-run onboarding
  orbit --version    Print version
  orbit --help       Show this help

${c.bold}Environment:${c.reset}
  ANTHROPIC_API_KEY  API key (overrides stored key)
  ORBIT_DATA_DIR     Data directory (default: ~/.orbit)
`)
}

function printVersion(): void {
  try {
    const pkg = require('../../package.json')
    console.log(`orbit ${pkg.version || '0.1.0'}`)
  } catch {
    console.log('orbit 0.1.0')
  }
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2)

  if (args.includes('--help') || args.includes('-h')) {
    printHelp()
    process.exit(0)
  }

  if (args.includes('--version') || args.includes('-v')) {
    printVersion()
    process.exit(0)
  }

  const forceSetup = args.includes('--setup')
  const forceReset = args.includes('--reset')

  if (forceReset) {
    resetConfig()
    console.log(`${c.dim}Config cleared.${c.reset}`)
  }

  // Non-interactive check: skip onboarding if stdin is not a TTY
  const isInteractive = process.stdin.isTTY

  // Determine if onboarding is needed
  const needsOnboarding = forceSetup || forceReset || !isOnboardingComplete()

  if (needsOnboarding) {
    if (!isInteractive) {
      console.warn(`${c.amber}Warning: Non-interactive mode detected. Skipping onboarding.${c.reset}`)
      console.warn(`${c.amber}Run 'orbit --setup' interactively to complete setup.${c.reset}\n`)
    } else {
      const ok = await runOnboarding()
      if (!ok) {
        console.error(`\n${c.red}Setup incomplete. Run 'orbit --setup' to try again.${c.reset}`)
        process.exit(1)
      }
    }
  }

  // Preflight checks
  const apiKey = getApiKey()
  if (!apiKey) {
    console.error(`${c.red}No API key found.${c.reset} Run 'orbit --setup' or set ANTHROPIC_API_KEY.`)
    process.exit(1)
  }

  console.log(`${c.bold}${c.amber}Orbit CLI${c.reset} ${c.dim}— Google Workspace AI Assistant${c.reset}`)
  console.log(`${c.dim}Type your message, or "exit" to quit.${c.reset}\n`)

  // Init DB (creates tables)
  getDb()

  const gwsOk = await checkGwsAuth()
  if (!gwsOk) {
    console.warn(`${c.amber}Warning: gws not authenticated. Run 'orbit --setup' for guided setup.${c.reset}\n`)
  }

  // Create a session for this CLI run
  const session = sessionRepo.create('CLI Session')

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `${c.amber}orbit>${c.reset} `,
  })

  // Handle Ctrl+C: first press cancels agent, second press exits
  let lastSigint = 0
  rl.on('SIGINT', () => {
    cancelAgent(session.id)
    const now = Date.now()
    if (now - lastSigint < 1000) {
      console.log(`\n${c.dim}Goodbye.${c.reset}`)
      process.exit(0)
    }
    lastSigint = now
    process.stdout.write(`\n${c.dim}Press Ctrl+C again to exit.${c.reset}\n`)
    rl.prompt()
  })

  rl.prompt()

  rl.on('line', async (line) => {
    const input = line.trim()
    if (!input) {
      rl.prompt()
      return
    }

    if (input === 'exit' || input === 'quit') {
      console.log(`${c.dim}Goodbye.${c.reset}`)
      rl.close()
      process.exit(0)
    }

    if (input === '/new') {
      const newSession = sessionRepo.create('CLI Session')
      ;(session as { id: string }).id = newSession.id
      console.log(`${c.dim}New session started.${c.reset}`)
      rl.prompt()
      return
    }

    // Pause readline while agent is running
    rl.pause()
    currentText = ''

    try {
      await runAgentLoop(session.id, input, emit)
    } catch (err) {
      console.error(`${c.red}Fatal: ${err instanceof Error ? err.message : err}${c.reset}`)
    }

    rl.prompt()
  })

  rl.on('close', () => {
    process.exit(0)
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
