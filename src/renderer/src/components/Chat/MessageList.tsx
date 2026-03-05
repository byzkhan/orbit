import { useCallback, useRef } from 'react'
import { useChatStore } from '../../stores/chat-store'
import { useAutoScroll } from '../../hooks/useAutoScroll'
import { Message } from './Message'
import { StreamingMessage } from './StreamingMessage'
import { ScrollArea } from '../ui/ScrollArea'
import { Spinner } from '../ui/Spinner'
import type { SerializedMessage } from '@shared/types'

interface MessageListProps {
  messages: SerializedMessage[]
}

export function MessageList({ messages }: MessageListProps) {
  const streamingText = useChatStore((s) => s.streamingText)
  const agentState = useChatStore((s) => s.agentState)
  const activeToolCalls = useChatStore((s) => s.activeToolCalls)
  const hasMoreMessages = useChatStore((s) => s.hasMoreMessages)
  const loadingMore = useChatStore((s) => s.loadingMore)
  const loadOlderMessages = useChatStore((s) => s.loadOlderMessages)

  const prevScrollHeightRef = useRef<number>(0)
  const { containerRef, handleScroll: autoScrollHandle } = useAutoScroll([messages, streamingText, activeToolCalls])

  const isActive = agentState !== 'idle'

  const handleScroll = useCallback(() => {
    autoScrollHandle()
    const el = containerRef.current
    if (!el) return
    if (el.scrollTop < 100 && hasMoreMessages && !loadingMore) {
      prevScrollHeightRef.current = el.scrollHeight
      loadOlderMessages().then(() => {
        // Preserve scroll position after prepending messages
        const newEl = containerRef.current
        if (newEl) {
          newEl.scrollTop = newEl.scrollHeight - prevScrollHeightRef.current
        }
      })
    }
  }, [autoScrollHandle, containerRef, hasMoreMessages, loadingMore, loadOlderMessages])

  return (
    <ScrollArea
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 px-6 py-4"
    >
      <div className="space-y-4">
        {loadingMore && (
          <div className="flex justify-center py-2">
            <Spinner size={16} />
          </div>
        )}
        {hasMoreMessages && !loadingMore && (
          <div className="flex justify-center">
            <button
              onClick={() => loadOlderMessages()}
              className="text-xs text-orbit-text-secondary hover:text-orbit-accent transition-colors"
            >
              Load older messages
            </button>
          </div>
        )}
        {messages.map((msg) => (
          <Message key={msg.id} message={msg} />
        ))}
        {isActive && (
          <StreamingMessage
            text={streamingText}
            agentState={agentState}
            toolCalls={activeToolCalls}
          />
        )}
      </div>
    </ScrollArea>
  )
}
