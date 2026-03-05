import { useEffect } from 'react'
import { useChatStore } from '../../stores/chat-store'
import { SessionList } from './SessionList'
import { Button } from '../ui/Button'

interface SidebarProps {
  onOpenSettings: () => void
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ onOpenSettings, collapsed, onToggle }: SidebarProps) {
  const loadSessions = useChatStore((s) => s.loadSessions)
  const createSession = useChatStore((s) => s.createSession)

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  if (collapsed) {
    return (
      <div className="w-12 h-full bg-orbit-bg border-r border-orbit-border flex flex-col items-center py-3 shrink-0 transition-all duration-200">
        <button
          onClick={onToggle}
          className="text-orbit-text-secondary hover:text-orbit-text transition-colors p-1.5 rounded-lg hover:bg-orbit-surface"
          title="Expand sidebar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 3v18" />
          </svg>
        </button>

        <button
          onClick={() => createSession()}
          className="mt-4 text-orbit-text-secondary hover:text-orbit-text transition-colors p-1.5 rounded-lg hover:bg-orbit-surface"
          title="New chat"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>

        <div className="flex-1" />

        <button
          onClick={onOpenSettings}
          className="text-orbit-text-secondary hover:text-orbit-text transition-colors p-1.5 rounded-lg hover:bg-orbit-surface"
          title="Settings"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div className="w-64 h-full bg-orbit-bg border-r border-orbit-border flex flex-col shrink-0 transition-all duration-200">
      <div className="p-3 border-b border-orbit-border flex items-center gap-2">
        <button
          onClick={onToggle}
          className="text-orbit-text-secondary hover:text-orbit-text transition-colors p-1.5 rounded-lg hover:bg-orbit-surface"
          title="Collapse sidebar"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 3v18" />
          </svg>
        </button>
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          onClick={() => createSession()}
        >
          + New Chat
        </Button>
      </div>

      <SessionList />

      <div className="p-3 border-t border-orbit-border">
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2 text-sm text-orbit-text-secondary hover:text-orbit-text transition-colors w-full px-2 py-1.5 rounded-lg hover:bg-orbit-surface"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
          Settings
        </button>
      </div>
    </div>
  )
}
