import { useChatStore } from '../../stores/chat-store'
import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'
import { ConfirmationDialog } from './ConfirmationDialog'
import { EmptyState } from './EmptyState'

export function ChatView() {
  const activeSessionId = useChatStore((s) => s.activeSessionId)
  const messages = useChatStore((s) => s.messages)

  return (
    <>
      <div className="flex flex-col h-full">
        {activeSessionId ? <MessageList messages={messages} /> : <EmptyState />}
        <ChatInput />
      </div>
      <ConfirmationDialog />
    </>
  )
}
