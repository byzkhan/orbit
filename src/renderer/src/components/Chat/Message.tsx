import { useState } from 'react'
import { Markdown } from '../../lib/markdown'
import { ToolCallCard } from './ToolCallCard'
import { cn } from '../../lib/utils'
import type { SerializedMessage } from '@shared/types'

interface MessageProps {
  message: SerializedMessage
}

export function Message({ message }: MessageProps) {
  const [copied, setCopied] = useState(false)
  const [showTools, setShowTools] = useState(false)
  const isUser = message.role === 'user'

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const toolCount = message.toolCalls?.length ?? 0

  return (
    <div className={cn('group', isUser ? 'flex justify-end' : '')}>
      <div
        className={cn(
          'relative',
          isUser
            ? 'bg-orbit-surface border border-orbit-border rounded-2xl rounded-br-md px-4 py-2.5 max-w-[80%] text-sm'
            : 'max-w-full text-sm'
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <>
            <div className="prose-orbit">
              <Markdown content={message.content} />
            </div>
            {toolCount > 0 && (
              <div className="mt-2">
                <button
                  onClick={() => setShowTools(!showTools)}
                  className="text-xs text-orbit-text-secondary hover:text-orbit-accent transition-colors"
                >
                  {showTools ? 'Hide' : 'Show'} {toolCount} tool call{toolCount !== 1 ? 's' : ''}
                </button>
                {showTools && (
                  <div className="space-y-2 mt-2">
                    {message.toolCalls!.map((tc) => (
                      <ToolCallCard
                        key={tc.toolUseId}
                        toolName={tc.toolName}
                        input={tc.input}
                        result={tc.result}
                        isError={tc.isError}
                        status="complete"
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
            <button
              onClick={handleCopy}
              className="absolute -right-2 top-0 opacity-0 group-hover:opacity-100 transition-opacity text-orbit-text-secondary hover:text-orbit-text p-1"
              title="Copy"
            >
              {copied ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
