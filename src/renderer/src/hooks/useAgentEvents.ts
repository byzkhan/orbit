import { useEffect, useRef } from 'react'
import { useChatStore } from '../stores/chat-store'
import type { AgentEvent } from '@shared/types'

export function useAgentEvents(): void {
  const handleAgentEvent = useChatStore((s) => s.handleAgentEvent)
  const flushStreamingText = useChatStore((s) => s.flushStreamingText)
  const textBuffer = useRef('')
  const rafId = useRef<number | null>(null)

  useEffect(() => {
    const unsubscribe = window.orbit.onAgentEvent((event: AgentEvent) => {
      if (event.type === 'text_delta') {
        textBuffer.current += event.text
        if (!rafId.current) {
          rafId.current = requestAnimationFrame(() => {
            flushStreamingText(textBuffer.current)
            rafId.current = null
          })
        }
      } else {
        // If we have buffered text and get a non-text event, flush first
        if (textBuffer.current) {
          flushStreamingText(textBuffer.current)
        }
        if (event.type === 'message_complete' || event.type === 'error' || (event.type === 'state_change' && event.state === 'idle')) {
          textBuffer.current = ''
        }
        handleAgentEvent(event)
      }
    })

    return () => {
      unsubscribe()
      if (rafId.current) {
        cancelAnimationFrame(rafId.current)
      }
    }
  }, [handleAgentEvent, flushStreamingText])
}
