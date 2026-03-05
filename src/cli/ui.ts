import { createInterface } from 'readline'

// ── ANSI colors ────────────────────────────────────────────────────────────

export const c = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  amber: '\x1b[33m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  white: '\x1b[37m',
}

// ── Box drawing ────────────────────────────────────────────────────────────

export function box(lines: string[], padding = 2): string {
  // Strip ANSI for width calculation
  const strip = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, '')
  const maxLen = Math.max(...lines.map((l) => strip(l).length))
  const width = maxLen + padding * 2
  const pad = ' '.repeat(padding)

  const top = `   \u256d${'─'.repeat(width + 2)}\u256e`
  const bot = `   \u2570${'─'.repeat(width + 2)}\u256f`
  const empty = `   \u2502${' '.repeat(width + 2)}\u2502`

  const content = lines.map((line) => {
    const visible = strip(line).length
    const right = ' '.repeat(maxLen - visible)
    return `   \u2502${pad} ${line}${right} ${pad}\u2502`
  })

  return [top, empty, ...content, empty, bot].join('\n')
}

// ── Step header ────────────────────────────────────────────────────────────

export function stepHeader(step: number, total: number, title: string): string {
  const prefix = `${c.amber}Step ${step} of ${total}${c.reset} ${c.dim}\u2014${c.reset} ${c.bold}${title}${c.reset}`
  const line = `${c.dim}${'─'.repeat(40)}${c.reset}`
  return `\n${prefix}\n${line}`
}

// ── Progress bar ───────────────────────────────────────────────────────────

export function progressBar(step: number, total: number): string {
  const parts: string[] = []
  for (let i = 1; i <= total; i++) {
    if (i <= step) {
      parts.push(`${c.amber}\u25cf${c.reset}`)
    } else {
      parts.push(`${c.dim}\u25cb${c.reset}`)
    }
    if (i < total) {
      parts.push(i < step ? `${c.amber} \u2500 ${c.reset}` : `${c.dim} \u2500 ${c.reset}`)
    }
  }
  return `   ${parts.join('')}`
}

// ── Spinner ────────────────────────────────────────────────────────────────

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

export function createSpinner(msg: string) {
  let frame = 0
  let timer: ReturnType<typeof setInterval> | null = null

  return {
    start() {
      process.stderr.write(`   ${c.amber}${SPINNER_FRAMES[0]}${c.reset} ${msg}`)
      timer = setInterval(() => {
        frame = (frame + 1) % SPINNER_FRAMES.length
        process.stderr.write(`\r   ${c.amber}${SPINNER_FRAMES[frame]}${c.reset} ${msg}`)
      }, 80)
    },
    stop(text: string) {
      if (timer) clearInterval(timer)
      process.stderr.write(`\r   ${c.green}\u2713${c.reset} ${text}\x1b[K\n`)
    },
    fail(text: string) {
      if (timer) clearInterval(timer)
      process.stderr.write(`\r   ${c.red}\u2717${c.reset} ${text}\x1b[K\n`)
    },
  }
}

// ── Input helpers ──────────────────────────────────────────────────────────

export function maskedInput(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    rl.question(`   ${prompt}`, (answer) => {
      rl.close()
      // Move up one line, rewrite the prompt with masked value
      const masked = answer.length > 0 ? '\u2022'.repeat(Math.min(answer.length, 40)) : ''
      process.stdout.write(`\x1b[1A\r   ${prompt}${masked}\x1b[K\n`)
      resolve(answer.trim())
    })
  })
}

export function textInput(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    rl.question(`   ${prompt}`, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

export function confirm(msg: string): Promise<boolean> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    rl.question(`   ${msg} [y/N] `, (answer) => {
      rl.close()
      resolve(answer.trim().toLowerCase() === 'y')
    })
  })
}

export function pressEnter(msg = 'Press Enter to continue...'): Promise<void> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    rl.question(`   ${c.dim}${msg}${c.reset}`, () => {
      rl.close()
      resolve()
    })
  })
}

// ── Table ──────────────────────────────────────────────────────────────────

export function table(rows: Array<{ label: string; ok: boolean; error?: string }>): string {
  const lines = rows.map((row) => {
    const icon = row.ok ? `${c.green}\u2713${c.reset}` : `${c.red}\u2717${c.reset}`
    const detail = row.ok ? `${c.green}Connected${c.reset}` : `${c.red}${row.error || 'Failed'}${c.reset}`
    return `   ${icon}  ${row.label.padEnd(12)} ${detail}`
  })
  return lines.join('\n')
}
