import { getApiKey } from '../main/auth/key-store'
import { validateApiKey } from '../main/auth/validate-key'
import {
  getGwsAuthState,
  saveOAuthCredentials,
  loginWithGoogle,
  verifyApiAccess,
} from '../main/auth/gws-auth'
import { getPlatform } from '../core/platform'
import { saveApiKey, markOnboardingComplete } from './config'
import {
  c,
  box,
  stepHeader,
  progressBar,
  createSpinner,
  maskedInput,
  textInput,
  pressEnter,
  table,
  confirm,
} from './ui'

const API_LINKS = [
  { name: 'Gmail API', url: 'https://console.cloud.google.com/apis/library/gmail.googleapis.com' },
  { name: 'Calendar API', url: 'https://console.cloud.google.com/apis/library/calendar-json.googleapis.com' },
  { name: 'Drive API', url: 'https://console.cloud.google.com/apis/library/drive.googleapis.com' },
  { name: 'Sheets API', url: 'https://console.cloud.google.com/apis/library/sheets.googleapis.com' },
  { name: 'Docs API', url: 'https://console.cloud.google.com/apis/library/docs.googleapis.com' },
]

export async function runOnboarding(): Promise<boolean> {
  console.log()
  console.log(
    box([
      `${c.amber}${c.bold}\u25c9  O R B I T${c.reset}`,
      '',
      `${c.dim}Google Workspace AI Assistant${c.reset}`,
    ])
  )
  console.log()
  console.log(`   ${c.dim}Let's get you set up. This takes about 5 minutes.${c.reset}`)
  console.log()

  const ok1 = await step1ApiKey()
  if (!ok1) return false

  const ok2 = await step2GoogleCloud()
  if (!ok2) return false

  const ok3 = await step3EnableApis()
  if (!ok3) return false

  const ok4 = await step4SignInVerify()
  if (!ok4) return false

  // Completion
  markOnboardingComplete()
  console.log()
  console.log(
    box([
      `${c.green}${c.bold}Setup complete!${c.reset}`,
      '',
      `${c.dim}Try these to get started:${c.reset}`,
      '',
      `${c.amber}"Summarize my unread emails"${c.reset}`,
      `${c.amber}"What's on my calendar today?"${c.reset}`,
      `${c.amber}"Find the Q4 report in Drive"${c.reset}`,
    ])
  )
  console.log()

  return true
}

// ── Step 1: Anthropic API Key ──────────────────────────────────────────────

async function step1ApiKey(): Promise<boolean> {
  console.log(progressBar(1, 4))
  console.log(stepHeader(1, 4, 'Anthropic API Key'))
  console.log()

  // Check if already configured
  const existing = getApiKey()
  if (existing) {
    console.log(`   ${c.green}\u2713${c.reset} API key already configured`)
    console.log()
    return true
  }

  console.log(`   ${c.dim}Get your API key from:${c.reset}`)
  console.log(`   ${c.cyan}https://console.anthropic.com/settings/keys${c.reset}`)
  console.log()

  for (let attempt = 0; attempt < 3; attempt++) {
    const key = await maskedInput(`${c.amber}API Key:${c.reset} `)
    if (!key) {
      console.log(`   ${c.red}No key entered.${c.reset}`)
      continue
    }

    const spinner = createSpinner('Validating API key...')
    spinner.start()
    const result = await validateApiKey(key)

    if (result.valid) {
      spinner.stop('API key is valid')
      saveApiKey(key)
      console.log()
      return true
    } else {
      spinner.fail(result.error || 'Validation failed')
      if (attempt < 2) {
        console.log(`   ${c.dim}Please try again.${c.reset}`)
      }
    }
  }

  console.log(`   ${c.red}Could not validate API key after 3 attempts.${c.reset}`)
  return false
}

// ── Step 2: Google Cloud Setup ─────────────────────────────────────────────

async function step2GoogleCloud(): Promise<boolean> {
  console.log(progressBar(2, 4))
  console.log(stepHeader(2, 4, 'Google Cloud OAuth'))
  console.log()

  const state = await getGwsAuthState()
  if (state.hasClientConfig) {
    console.log(`   ${c.dim}Existing OAuth credentials found.${c.reset}`)
    const keepExisting = await confirm('Keep existing OAuth config?')
    if (keepExisting) {
      console.log(`   ${c.green}\u2713${c.reset} Using existing OAuth credentials`)
      console.log()
      return true
    }
    console.log()
  }

  console.log(`   ${c.dim}Create a Google Cloud OAuth client:${c.reset}`)
  console.log()
  console.log(`   ${c.bold}1.${c.reset} Go to ${c.cyan}https://console.cloud.google.com${c.reset}`)
  console.log(`   ${c.bold}2.${c.reset} Create a new project (or select existing)`)
  console.log(`   ${c.bold}3.${c.reset} Go to ${c.bold}APIs & Services > OAuth consent screen${c.reset}`)
  console.log(`      - User type: ${c.bold}External${c.reset}, then click Create`)
  console.log(`      - Fill in app name, your email for support/developer email`)
  console.log(`      - Add scopes: Gmail, Calendar, Drive, Sheets, Docs`)
  console.log(`      - Add yourself as a test user`)
  console.log(`   ${c.bold}4.${c.reset} Go to ${c.bold}APIs & Services > Credentials${c.reset}`)
  console.log(`      - Create OAuth 2.0 Client ID (type: ${c.bold}Desktop app${c.reset})`)
  console.log()

  const shouldOpen = await confirm('Open Google Cloud Console in browser?')
  if (shouldOpen) {
    getPlatform().openExternal('https://console.cloud.google.com/apis/credentials')
  }
  console.log()

  for (let attempt = 0; attempt < 3; attempt++) {
    const clientId = await textInput(`${c.amber}Client ID:${c.reset} `)
    if (!clientId) {
      console.log(`   ${c.red}No Client ID entered.${c.reset}`)
      continue
    }

    const clientSecret = await textInput(`${c.amber}Client Secret:${c.reset} `)
    if (!clientSecret) {
      console.log(`   ${c.red}No Client Secret entered.${c.reset}`)
      continue
    }

    const result = saveOAuthCredentials(clientId, clientSecret)
    if (result.success) {
      console.log(`   ${c.green}\u2713${c.reset} OAuth credentials saved`)
      console.log()
      return true
    } else {
      console.log(`   ${c.red}\u2717${c.reset} ${result.error || 'Failed to save credentials'}`)
    }
  }

  console.log(`   ${c.red}Could not save OAuth credentials.${c.reset}`)
  return false
}

// ── Step 3: Enable APIs ────────────────────────────────────────────────────

async function step3EnableApis(): Promise<boolean> {
  console.log(progressBar(3, 4))
  console.log(stepHeader(3, 4, 'Enable Google APIs'))
  console.log()

  console.log(`   ${c.dim}Enable these 5 APIs in your Google Cloud project:${c.reset}`)
  console.log()

  for (const api of API_LINKS) {
    console.log(`   ${c.amber}\u2022${c.reset} ${api.name}`)
  }
  console.log()

  const shouldOpen = await confirm('Open all API pages in browser?')
  if (shouldOpen) {
    for (let i = 0; i < API_LINKS.length; i++) {
      if (i > 0) await sleep(800)
      getPlatform().openExternal(API_LINKS[i].url)
    }
    console.log(`   ${c.dim}Opened ${API_LINKS.length} tabs. Click "Enable" on each one.${c.reset}`)
  } else {
    console.log()
    for (const api of API_LINKS) {
      console.log(`   ${c.cyan}${api.url}${c.reset}`)
    }
  }

  console.log()
  await pressEnter('Press Enter when all APIs are enabled...')
  console.log(`   ${c.green}\u2713${c.reset} APIs enabled`)
  console.log()
  return true
}

// ── Step 4: Sign in & Verify ───────────────────────────────────────────────

async function step4SignInVerify(): Promise<boolean> {
  console.log(progressBar(4, 4))
  console.log(stepHeader(4, 4, 'Sign In & Verify'))
  console.log()

  const state = await getGwsAuthState()

  if (!state.isAuthenticated) {
    console.log(`   ${c.dim}Signing in with Google... A browser window will open.${c.reset}`)
    console.log()

    const spinner = createSpinner('Waiting for Google sign-in...')
    spinner.start()
    const loginResult = await loginWithGoogle()

    if (!loginResult.success) {
      spinner.fail(loginResult.error || 'Sign-in failed')
      const retry = await confirm('Try again?')
      if (retry) {
        const retryResult = await loginWithGoogle()
        if (!retryResult.success) {
          console.log(`   ${c.red}\u2717${c.reset} ${retryResult.error || 'Sign-in failed'}`)
          return false
        }
      } else {
        return false
      }
    } else {
      spinner.stop('Signed in with Google')
    }
  } else {
    console.log(`   ${c.green}\u2713${c.reset} Already signed in with Google`)
  }

  console.log()

  // Verify API access
  const verifySpinner = createSpinner('Verifying API access...')
  verifySpinner.start()
  const results = await verifyApiAccess()
  verifySpinner.stop('Verification complete')
  console.log()

  console.log(
    table([
      { label: 'Gmail', ok: results.gmail.ok, error: results.gmail.error },
      { label: 'Drive', ok: results.drive.ok, error: results.drive.error },
      { label: 'Calendar', ok: results.calendar.ok, error: results.calendar.error },
    ])
  )
  console.log()

  // Require at minimum Gmail
  if (!results.gmail.ok) {
    console.log(`   ${c.red}Gmail access is required for Orbit to work.${c.reset}`)
    const retry = await confirm('Retry verification?')
    if (retry) {
      const retryResults = await verifyApiAccess()
      if (!retryResults.gmail.ok) {
        console.log(`   ${c.red}\u2717${c.reset} Gmail still not accessible.`)
        return false
      }
      console.log(`   ${c.green}\u2713${c.reset} Verification passed on retry`)
    } else {
      return false
    }
  }

  return true
}

// ── Helpers ────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
