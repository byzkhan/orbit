import { useState } from 'react'
import { useSettingsStore } from '../../stores/settings-store'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Spinner } from '../ui/Spinner'
import type { ApiVerificationResult } from '@shared/types'

interface OnboardingFlowProps {
  onComplete: () => void
}

const TOTAL_STEPS = 4

// ── Icons ──────────────────────────────────────────────────────────────────

function CheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={className}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

function ExternalLinkIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline ml-1 opacity-60">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
    </svg>
  )
}

function XIcon({ className = '' }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={className}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}

// ── Step Indicator ─────────────────────────────────────────────────────────

function StepIndicator({ currentStep, completedSteps }: { currentStep: number; completedSteps: Set<number> }) {
  const labels = ['API Key', 'Cloud Setup', 'Enable APIs', 'Sign In']

  return (
    <div className="flex items-center justify-center gap-1 mb-6">
      {labels.map((label, i) => {
        const isCompleted = completedSteps.has(i)
        const isCurrent = i === currentStep
        const isPast = i < currentStep

        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-200 ${
                  isCompleted
                    ? 'bg-orbit-success/20 text-orbit-success border-2 border-orbit-success/40'
                    : isCurrent
                      ? 'bg-orbit-accent/20 text-orbit-accent border-2 border-orbit-accent'
                      : isPast
                        ? 'bg-orbit-surface text-orbit-text-secondary border-2 border-orbit-border'
                        : 'bg-orbit-surface text-orbit-text-secondary border-2 border-orbit-border'
                }`}
              >
                {isCompleted ? <CheckIcon className="text-orbit-success w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-[10px] mt-1 ${isCurrent ? 'text-orbit-text font-medium' : 'text-orbit-text-secondary'}`}>
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div
                className={`w-8 h-px mx-1 mb-4 transition-colors ${
                  isCompleted || (isPast && completedSteps.has(i)) ? 'bg-orbit-success/40' : 'bg-orbit-border'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Step 1: API Key ────────────────────────────────────────────────────────

function StepApiKey({
  onComplete,
}: {
  onComplete: () => void
}) {
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [validated, setValidated] = useState(false)

  const storeSetApiKey = useSettingsStore((s) => s.setApiKey)
  const validateApiKey = useSettingsStore((s) => s.validateApiKey)

  const handleValidate = async () => {
    if (!apiKey.trim()) return
    setLoading(true)
    setError('')

    try {
      const result = await validateApiKey(apiKey.trim())
      if (result.valid) {
        await storeSetApiKey(apiKey.trim())
        setValidated(true)
        // Brief delay so user sees the checkmark
        setTimeout(onComplete, 600)
      } else {
        setError(result.error || 'Invalid API key')
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-heading mb-1">Anthropic API Key</h2>
        <p className="text-sm text-orbit-text-secondary">
          Enter your Anthropic API key to power Orbit's AI assistant. Your key is encrypted and stored locally on your machine.
        </p>
      </div>

      <div>
        <p className="text-xs text-orbit-text-secondary mb-2">
          Get a key at{' '}
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-orbit-accent underline hover:text-orbit-accent-hover"
          >
            console.anthropic.com
            <ExternalLinkIcon />
          </a>
        </p>
        <Input
          type="password"
          placeholder="sk-ant-..."
          value={apiKey}
          onChange={(e) => { setApiKey(e.target.value); setError(''); setValidated(false) }}
          onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
          disabled={loading || validated}
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 text-orbit-error bg-orbit-error/5 border border-orbit-error/20 rounded-lg px-3 py-2">
          <XIcon className="text-orbit-error mt-0.5 shrink-0" />
          <p className="text-xs">{error}</p>
        </div>
      )}

      {validated && (
        <div className="flex items-center gap-2 text-orbit-success bg-orbit-success/5 border border-orbit-success/20 rounded-lg px-3 py-2">
          <CheckIcon className="text-orbit-success" />
          <span className="text-sm font-medium">API key validated</span>
        </div>
      )}

      <Button
        className="w-full"
        onClick={handleValidate}
        disabled={!apiKey.trim() || loading || validated}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Spinner size={14} className="text-orbit-bg" />
            Validating...
          </span>
        ) : validated ? (
          <span className="flex items-center gap-2">
            <CheckIcon className="w-4 h-4" />
            Validated
          </span>
        ) : (
          'Validate & Continue'
        )}
      </Button>
    </div>
  )
}

// ── Step 2: Google Cloud Setup ─────────────────────────────────────────────

function StepGoogleCloud({
  onComplete,
}: {
  onComplete: () => void
}) {
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const saveOAuthCredentials = useSettingsStore((s) => s.saveOAuthCredentials)

  const handleSave = async () => {
    if (!clientId.trim() || !clientSecret.trim()) return
    setLoading(true)
    setError('')

    const result = await saveOAuthCredentials(clientId.trim(), clientSecret.trim())
    setLoading(false)

    if (result.success) {
      onComplete()
    } else {
      setError(result.error || 'Failed to save credentials')
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-heading mb-1">Google Cloud Setup</h2>
        <p className="text-sm text-orbit-text-secondary">
          Orbit needs a Google Cloud OAuth client to access your Google Workspace. Follow these steps:
        </p>
      </div>

      <ol className="space-y-2.5 text-sm text-orbit-text-secondary">
        <li className="flex gap-2">
          <span className="text-orbit-accent font-semibold shrink-0">1.</span>
          <span>
            Go to{' '}
            <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-orbit-accent underline hover:text-orbit-accent-hover">
              console.cloud.google.com
              <ExternalLinkIcon />
            </a>
            {' '}and create a new project (or select an existing one)
          </span>
        </li>
        <li className="flex gap-2">
          <span className="text-orbit-accent font-semibold shrink-0">2.</span>
          <span>
            Go to{' '}
            <a href="https://console.cloud.google.com/apis/credentials/consent" target="_blank" rel="noopener noreferrer" className="text-orbit-accent underline hover:text-orbit-accent-hover">
              APIs & Services &rarr; OAuth consent screen
              <ExternalLinkIcon />
            </a>
            {' '}&rarr; Configure as External, and add your email as a test user
          </span>
        </li>
        <li className="flex gap-2">
          <span className="text-orbit-accent font-semibold shrink-0">3.</span>
          <span>
            Go to{' '}
            <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-orbit-accent underline hover:text-orbit-accent-hover">
              APIs & Services &rarr; Credentials
              <ExternalLinkIcon />
            </a>
            {' '}&rarr; Create OAuth Client ID &rarr; Application type: <strong>Desktop app</strong>
          </span>
        </li>
        <li className="flex gap-2">
          <span className="text-orbit-accent font-semibold shrink-0">4.</span>
          <span>Copy the <strong>Client ID</strong> and <strong>Client Secret</strong> and paste them below</span>
        </li>
      </ol>

      <div className="space-y-3 bg-orbit-bg rounded-lg p-3 border border-orbit-border">
        <Input
          placeholder="Client ID"
          value={clientId}
          onChange={(e) => { setClientId(e.target.value); setError('') }}
        />
        <Input
          type="password"
          placeholder="Client Secret"
          value={clientSecret}
          onChange={(e) => { setClientSecret(e.target.value); setError('') }}
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 text-orbit-error bg-orbit-error/5 border border-orbit-error/20 rounded-lg px-3 py-2">
          <XIcon className="text-orbit-error mt-0.5 shrink-0" />
          <p className="text-xs">{error}</p>
        </div>
      )}

      <Button
        className="w-full"
        onClick={handleSave}
        disabled={!clientId.trim() || !clientSecret.trim() || loading}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Spinner size={14} className="text-orbit-bg" />
            Saving...
          </span>
        ) : (
          'Save & Continue'
        )}
      </Button>
    </div>
  )
}

// ── Step 3: Enable APIs ────────────────────────────────────────────────────

const REQUIRED_APIS = [
  {
    name: 'Gmail API',
    url: 'https://console.cloud.google.com/apis/library/gmail.googleapis.com',
  },
  {
    name: 'Google Calendar API',
    url: 'https://console.cloud.google.com/apis/library/calendar-json.googleapis.com',
  },
  {
    name: 'Google Drive API',
    url: 'https://console.cloud.google.com/apis/library/drive.googleapis.com',
  },
  {
    name: 'Google Sheets API',
    url: 'https://console.cloud.google.com/apis/library/sheets.googleapis.com',
  },
  {
    name: 'Google Docs API',
    url: 'https://console.cloud.google.com/apis/library/docs.googleapis.com',
  },
]

function StepEnableApis({
  onComplete,
}: {
  onComplete: () => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-heading mb-1">Enable Google APIs</h2>
        <p className="text-sm text-orbit-text-secondary">
          Enable each of these APIs in your Google Cloud project. Click each link below and press "Enable" on the page.
        </p>
      </div>

      <div className="space-y-2">
        {REQUIRED_APIS.map((api) => (
          <a
            key={api.name}
            href={api.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-lg border border-orbit-border bg-orbit-bg hover:border-orbit-accent/50 hover:bg-orbit-accent/5 transition-all group"
          >
            <span className="text-sm text-orbit-text group-hover:text-orbit-accent transition-colors">
              {api.name}
            </span>
            <span className="text-xs text-orbit-text-secondary group-hover:text-orbit-accent transition-colors flex items-center">
              Enable
              <ExternalLinkIcon />
            </span>
          </a>
        ))}
      </div>

      <Button className="w-full" onClick={onComplete}>
        I've Enabled All APIs
      </Button>
    </div>
  )
}

// ── Step 4: Sign In & Verify ───────────────────────────────────────────────

function StepSignInVerify({
  onComplete,
}: {
  onComplete: () => void
}) {
  const [signInLoading, setSignInLoading] = useState(false)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
  const [error, setError] = useState('')
  const [verification, setVerification] = useState<ApiVerificationResult | null>(null)

  const loginWithGoogle = useSettingsStore((s) => s.loginWithGoogle)
  const verifyApis = useSettingsStore((s) => s.verifyApis)

  const handleSignIn = async () => {
    setSignInLoading(true)
    setError('')
    setVerification(null)

    const result = await loginWithGoogle()
    setSignInLoading(false)

    if (result.success) {
      setSignedIn(true)
      // Automatically verify APIs after sign-in
      setVerifyLoading(true)
      try {
        const v = await verifyApis()
        setVerification(v)
      } catch (err) {
        setError('Failed to verify API access: ' + String(err))
      } finally {
        setVerifyLoading(false)
      }
    } else {
      setError(result.error || 'Google sign-in failed')
    }
  }

  const handleRetryVerify = async () => {
    setVerifyLoading(true)
    setError('')
    try {
      const v = await verifyApis()
      setVerification(v)
    } catch (err) {
      setError('Failed to verify API access: ' + String(err))
    } finally {
      setVerifyLoading(false)
    }
  }

  const gmailOk = verification?.gmail?.ok ?? false
  const canProceed = signedIn && gmailOk

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-heading mb-1">Sign In & Verify</h2>
        <p className="text-sm text-orbit-text-secondary">
          Sign in with your Google account, then Orbit will verify that each API is working.
        </p>
      </div>

      {!signedIn && (
        <Button
          className="w-full"
          onClick={handleSignIn}
          disabled={signInLoading}
        >
          {signInLoading ? (
            <span className="flex items-center gap-2">
              <Spinner size={14} className="text-orbit-bg" />
              Waiting for Google sign-in...
            </span>
          ) : (
            'Sign in with Google'
          )}
        </Button>
      )}

      {signedIn && !verification && !verifyLoading && (
        <div className="flex items-center gap-2 text-orbit-success bg-orbit-success/5 border border-orbit-success/20 rounded-lg px-3 py-2">
          <CheckIcon className="text-orbit-success" />
          <span className="text-sm font-medium">Signed in successfully</span>
        </div>
      )}

      {verifyLoading && (
        <div className="flex items-center gap-3 text-orbit-text-secondary bg-orbit-surface border border-orbit-border rounded-lg px-4 py-3">
          <Spinner size={16} />
          <span className="text-sm">Verifying API access...</span>
        </div>
      )}

      {verification && (
        <div className="space-y-2">
          <p className="text-xs text-orbit-text-secondary font-medium uppercase tracking-wide">API Verification</p>
          <div className="rounded-lg border border-orbit-border overflow-hidden">
            <VerificationRow label="Gmail" result={verification.gmail} />
            <VerificationRow label="Google Drive" result={verification.drive} />
            <VerificationRow label="Google Calendar" result={verification.calendar} />
          </div>

          {(!verification.gmail.ok || !verification.drive.ok || !verification.calendar.ok) && (
            <div className="space-y-2">
              <p className="text-xs text-orbit-text-secondary">
                Some APIs failed. Make sure they are enabled in your Google Cloud project, then retry.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRetryVerify}
                disabled={verifyLoading}
              >
                Retry Verification
              </Button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 text-orbit-error bg-orbit-error/5 border border-orbit-error/20 rounded-lg px-3 py-2">
          <XIcon className="text-orbit-error mt-0.5 shrink-0" />
          <p className="text-xs">{error}</p>
        </div>
      )}

      <Button
        className="w-full"
        onClick={onComplete}
        disabled={!canProceed}
      >
        {canProceed ? 'Get Started' : 'Complete sign-in to continue'}
      </Button>
    </div>
  )
}

function VerificationRow({ label, result }: { label: string; result: { ok: boolean; error?: string } }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 border-b border-orbit-border last:border-b-0">
      <span className="text-sm text-orbit-text">{label}</span>
      {result.ok ? (
        <span className="flex items-center gap-1.5 text-orbit-success text-xs font-medium">
          <CheckIcon className="text-orbit-success w-4 h-4" />
          Connected
        </span>
      ) : (
        <span className="flex items-center gap-1.5 text-orbit-error text-xs" title={result.error}>
          <XIcon className="text-orbit-error" />
          Failed
        </span>
      )}
    </div>
  )
}

// ── Main Wizard ────────────────────────────────────────────────────────────

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  const markComplete = (stepNum: number) => {
    setCompletedSteps((prev) => new Set(prev).add(stepNum))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-orbit-bg">
      <div className="max-w-lg w-full mx-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-5xl font-heading text-orbit-accent mb-2">Orbit</h1>
          <p className="text-orbit-text-secondary text-sm">
            Your personal Google Workspace AI assistant
          </p>
        </div>

        {/* Step indicator */}
        <StepIndicator currentStep={step} completedSteps={completedSteps} />

        {/* Step content card */}
        <div className="bg-orbit-surface border border-orbit-border rounded-xl p-6">
          {step === 0 && (
            <StepApiKey
              onComplete={() => {
                markComplete(0)
                setStep(1)
              }}
            />
          )}

          {step === 1 && (
            <StepGoogleCloud
              onComplete={() => {
                markComplete(1)
                setStep(2)
              }}
            />
          )}

          {step === 2 && (
            <StepEnableApis
              onComplete={() => {
                markComplete(2)
                setStep(3)
              }}
            />
          )}

          {step === 3 && (
            <StepSignInVerify onComplete={onComplete} />
          )}
        </div>

        {/* Step counter */}
        <p className="text-center text-xs text-orbit-text-secondary mt-3">
          Step {step + 1} of {TOTAL_STEPS}
        </p>
      </div>
    </div>
  )
}
