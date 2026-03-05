import { useState, useEffect } from 'react'
import { useSettingsStore } from '../stores/settings-store'

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const authStatus = useSettingsStore((s) => s.authStatus)
  const loadAuthStatus = useSettingsStore((s) => s.loadAuthStatus)
  const isLoaded = useSettingsStore((s) => s.isLoaded)

  useEffect(() => {
    loadAuthStatus()
  }, [loadAuthStatus])

  useEffect(() => {
    if (isLoaded && !authStatus.hasApiKey) {
      setShowOnboarding(true)
    }
  }, [isLoaded, authStatus.hasApiKey])

  return { showOnboarding, setShowOnboarding }
}
