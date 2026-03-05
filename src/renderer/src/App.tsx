import { useState, useEffect } from 'react'
import { Titlebar } from './components/Titlebar'
import { Sidebar } from './components/Sidebar/Sidebar'
import { ChatView } from './components/Chat/ChatView'
import { SettingsModal } from './components/Settings/SettingsModal'
import { OnboardingFlow } from './components/Onboarding/OnboardingFlow'
import { useAgentEvents } from './hooks/useAgentEvents'
import { useOnboarding } from './hooks/useOnboarding'
import { useSettingsStore } from './stores/settings-store'
import { useChatStore } from './stores/chat-store'

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem('orbit:sidebar-collapsed')
    return stored ? stored === 'true' : true // default collapsed
  })
  const { showOnboarding, setShowOnboarding } = useOnboarding()
  const loadSettings = useSettingsStore((s) => s.loadSettings)
  const createSession = useChatStore((s) => s.createSession)
  const sessions = useChatStore((s) => s.sessions)

  // Subscribe to agent events
  useAgentEvents()

  // Load settings on mount
  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  // Auto-collapse if no sessions exist
  useEffect(() => {
    if (sessions.length === 0) {
      setSidebarCollapsed(true)
    }
  }, [sessions.length])

  // Persist sidebar state
  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      localStorage.setItem('orbit:sidebar-collapsed', String(!prev))
      return !prev
    })
  }

  // Cmd+N for new chat
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        createSession()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [createSession])

  if (showOnboarding) {
    return <OnboardingFlow onComplete={() => setShowOnboarding(false)} />
  }

  return (
    <div className="h-screen flex flex-col bg-orbit-bg">
      <Titlebar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          onOpenSettings={() => setSettingsOpen(true)}
          collapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
        />
        <main className="flex-1 flex flex-col overflow-hidden">
          <ChatView />
        </main>
      </div>
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
