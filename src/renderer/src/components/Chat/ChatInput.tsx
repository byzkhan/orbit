import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { useChatStore } from '../../stores/chat-store'
import { cn } from '../../lib/utils'

export function ChatInput() {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const sendMessage = useChatStore((s) => s.sendMessage)
  const cancelAgent = useChatStore((s) => s.cancelAgent)
  const agentState = useChatStore((s) => s.agentState)

  const isProcessing = agentState !== 'idle'

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 200) + 'px'
    }
  }, [text])

  // Cmd+K to focus
  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        textareaRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleSubmit = () => {
    const trimmed = text.trim()
    if (!trimmed || isProcessing) return
    setText('')
    sendMessage(trimmed)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="px-6 py-4 border-t border-orbit-border">
      <div>
        <div className="flex items-end gap-2 bg-orbit-surface border border-orbit-border rounded-xl px-4 py-2 focus-within:border-orbit-accent transition-colors">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Orbit anything..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-orbit-text placeholder:text-orbit-text-secondary outline-none resize-none max-h-[200px]"
            disabled={isProcessing}
          />
          {isProcessing ? (
            <button
              onClick={cancelAgent}
              className="shrink-0 p-1.5 rounded-lg bg-orbit-error/10 text-orbit-error hover:bg-orbit-error/20 transition-colors"
              title="Stop"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!text.trim()}
              className={cn(
                'shrink-0 p-1.5 rounded-lg transition-colors',
                text.trim()
                  ? 'bg-orbit-accent text-orbit-bg hover:bg-orbit-accent-hover'
                  : 'bg-orbit-border text-orbit-text-secondary'
              )}
              title="Send"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          )}
        </div>
        <p className="text-xs text-orbit-text-secondary mt-1.5 text-center">
          Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
