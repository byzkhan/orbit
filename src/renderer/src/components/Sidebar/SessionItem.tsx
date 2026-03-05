import { useState } from 'react'
import { useChatStore } from '../../stores/chat-store'
import { cn, formatRelativeTime, truncate } from '../../lib/utils'
import type { Session } from '@shared/types'

interface SessionItemProps {
  session: Session
}

export function SessionItem({ session }: SessionItemProps) {
  const activeSessionId = useChatStore((s) => s.activeSessionId)
  const selectSession = useChatStore((s) => s.selectSession)
  const deleteSession = useChatStore((s) => s.deleteSession)
  const [showDelete, setShowDelete] = useState(false)
  const isActive = activeSessionId === session.id

  return (
    <div
      className={cn(
        'group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm',
        isActive
          ? 'bg-orbit-surface text-orbit-text'
          : 'text-orbit-text-secondary hover:bg-orbit-surface/50 hover:text-orbit-text'
      )}
      onClick={() => selectSession(session.id)}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <div className="flex-1 min-w-0">
        <div className="truncate">{truncate(session.title, 30)}</div>
        <div className="text-xs text-orbit-text-secondary mt-0.5">
          {formatRelativeTime(session.updatedAt)}
        </div>
      </div>
      {showDelete && (
        <button
          className="text-orbit-text-secondary hover:text-orbit-error transition-colors shrink-0"
          onClick={(e) => {
            e.stopPropagation()
            deleteSession(session.id)
          }}
          title="Delete conversation"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
          </svg>
        </button>
      )}
    </div>
  )
}
