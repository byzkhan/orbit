import { useState, useEffect } from 'react'
import { useSettingsStore } from '../../stores/settings-store'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Badge } from '../ui/Badge'
import { Spinner } from '../ui/Spinner'
import type { ApiVerificationResult } from '@shared/types'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const settings = useSettingsStore((s) => s.settings)
  const authStatus = useSettingsStore((s) => s.authStatus)
  const updateSettings = useSettingsStore((s) => s.updateSettings)
  const setApiKey = useSettingsStore((s) => s.setApiKey)
  const validateApiKey = useSettingsStore((s) => s.validateApiKey)
  const loadAuthStatus = useSettingsStore((s) => s.loadAuthStatus)
  const saveOAuthCredentials = useSettingsStore((s) => s.saveOAuthCredentials)
  const loginWithGoogle = useSettingsStore((s) => s.loginWithGoogle)
  const verifyApis = useSettingsStore((s) => s.verifyApis)

  const [apiKeyInput, setApiKeyInput] = useState('')
  const [apiKeyValidating, setApiKeyValidating] = useState(false)
  const [apiKeyError, setApiKeyError] = useState('')
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [gwsLoading, setGwsLoading] = useState(false)
  const [gwsError, setGwsError] = useState('')
  const [apiVerification, setApiVerification] = useState<ApiVerificationResult | null>(null)
  const [verifyLoading, setVerifyLoading] = useState(false)

  useEffect(() => {
    if (isOpen) loadAuthStatus()
  }, [isOpen, loadAuthStatus])

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) return
    setApiKeyValidating(true)
    setApiKeyError('')

    const result = await validateApiKey(apiKeyInput.trim())
    if (result.valid) {
      await setApiKey(apiKeyInput.trim())
      setApiKeyInput('')
    } else {
      setApiKeyError(result.error || 'Invalid API key')
    }
    setApiKeyValidating(false)
  }

  const handleGwsLogin = async () => {
    setGwsLoading(true)
    setGwsError('')

    // Save OAuth creds if needed
    if (!authStatus.gwsHasClientConfig && clientId.trim() && clientSecret.trim()) {
      const save = await saveOAuthCredentials(clientId.trim(), clientSecret.trim())
      if (!save.success) {
        setGwsError(save.error || 'Failed to save credentials')
        setGwsLoading(false)
        return
      }
    }

    const result = await loginWithGoogle()
    setGwsLoading(false)
    if (!result.success) {
      setGwsError(result.error || 'Login failed')
    }
  }

  const handleVerifyApis = async () => {
    setVerifyLoading(true)
    try {
      const result = await verifyApis()
      setApiVerification(result)
    } catch {
      setGwsError('Failed to verify APIs')
    } finally {
      setVerifyLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <div className="space-y-6">
        {/* API Key */}
        <section>
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            Anthropic API Key
            <Badge variant={authStatus.hasApiKey ? 'success' : 'error'}>
              {authStatus.hasApiKey ? 'Connected' : 'Not Set'}
            </Badge>
          </h3>
          <div className="flex gap-2">
            <Input
              type="password"
              placeholder="sk-ant-..."
              value={apiKeyInput}
              onChange={(e) => { setApiKeyInput(e.target.value); setApiKeyError('') }}
            />
            <Button size="sm" onClick={handleSaveApiKey} disabled={!apiKeyInput.trim() || apiKeyValidating}>
              {apiKeyValidating ? <Spinner size={14} /> : 'Save'}
            </Button>
          </div>
          {apiKeyError && <p className="text-xs text-orbit-error mt-1">{apiKeyError}</p>}
        </section>

        {/* GWS Auth */}
        <section>
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            Google Workspace
            <Badge variant={authStatus.gwsAuthenticated ? 'success' : 'error'}>
              {authStatus.gwsAuthenticated ? 'Connected' : 'Not Connected'}
            </Badge>
          </h3>
          <div className="space-y-3">
            {!authStatus.gwsHasClientConfig && (
              <div className="space-y-2">
                <p className="text-xs text-orbit-text-secondary">
                  Enter your Google OAuth Client ID and Secret from{' '}
                  <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-orbit-accent underline">
                    Cloud Console
                  </a>
                </p>
                <Input placeholder="Client ID" value={clientId} onChange={(e) => setClientId(e.target.value)} />
                <Input type="password" placeholder="Client Secret" value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} />
              </div>
            )}
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleGwsLogin}
                disabled={gwsLoading || authStatus.gwsAuthenticated || (!authStatus.gwsHasClientConfig && (!clientId.trim() || !clientSecret.trim()))}
              >
                {gwsLoading ? (
                  <span className="flex items-center gap-2"><Spinner size={14} /> Connecting...</span>
                ) : authStatus.gwsAuthenticated ? 'Connected' : 'Sign in with Google'}
              </Button>
              {authStatus.gwsAuthenticated && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleVerifyApis}
                  disabled={verifyLoading}
                >
                  {verifyLoading ? <Spinner size={14} /> : 'Verify APIs'}
                </Button>
              )}
            </div>
          </div>
          {gwsError && <p className="text-xs text-orbit-error mt-2">{gwsError}</p>}

          {apiVerification && (
            <div className="mt-3 rounded-lg border border-orbit-border overflow-hidden">
              {(['gmail', 'drive', 'calendar'] as const).map((key) => {
                const label = key === 'gmail' ? 'Gmail' : key === 'drive' ? 'Google Drive' : 'Google Calendar'
                const result = apiVerification[key]
                return (
                  <div key={key} className="flex items-center justify-between px-3 py-2 border-b border-orbit-border last:border-b-0 text-xs">
                    <span className="text-orbit-text">{label}</span>
                    {result.ok ? (
                      <span className="text-orbit-success font-medium">Connected</span>
                    ) : (
                      <span className="text-orbit-error" title={result.error}>Failed</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Model */}
        <section>
          <h3 className="text-sm font-semibold mb-2">Model</h3>
          <select
            value={settings.model}
            onChange={(e) => updateSettings({ model: e.target.value })}
            className="w-full px-3 py-2 bg-orbit-surface border border-orbit-border rounded-lg text-orbit-text text-sm focus:outline-none focus:border-orbit-accent"
          >
            <option value="claude-sonnet-4-5-20250929">Claude Sonnet 4.5</option>
            <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5</option>
          </select>
        </section>

        {/* Dry Run */}
        <section>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.dryRun}
              onChange={(e) => updateSettings({ dryRun: e.target.checked })}
              className="rounded border-orbit-border accent-orbit-accent"
            />
            <div>
              <span className="text-sm font-medium">Dry Run Mode</span>
              <p className="text-xs text-orbit-text-secondary">
                Preview tool commands without executing them
              </p>
            </div>
          </label>
        </section>
      </div>
    </Modal>
  )
}
