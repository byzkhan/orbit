import { useChatStore } from '../../stores/chat-store'
import { SessionItem } from './SessionItem'
import { ScrollArea } from '../ui/ScrollArea'

export function SessionList() {
  const sessions = useChatStore((s) => s.sessions)

  if (sessions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-sm text-orbit-text-secondary text-center">
          No conversations yet
        </p>
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1">
      <div className="p-2 space-y-0.5">
        {sessions.map((session) => (
          <SessionItem key={session.id} session={session} />
        ))}
      </div>
    </ScrollArea>
  )
}
