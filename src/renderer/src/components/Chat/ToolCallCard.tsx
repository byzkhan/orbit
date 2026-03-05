import { useState, useCallback } from 'react'
import { Badge } from '../ui/Badge'
import { Spinner } from '../ui/Spinner'
import { cn } from '../../lib/utils'

interface ToolCallCardProps {
  toolName: string
  input: Record<string, unknown>
  result?: string
  isError?: boolean
  status: 'running' | 'complete' | 'error'
}

function formatToolName(name: string): string {
  return name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function ToolCallCard({ toolName, input, result, isError, status }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyOutput = useCallback(() => {
    if (!result) return
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [result])

  return (
    <div
      className={cn(
        'animate-in border rounded-lg overflow-hidden text-xs',
        status === 'error' || isError
          ? 'border-orbit-error/30 bg-orbit-error/5'
          : status === 'running'
            ? 'border-orbit-accent/30 bg-orbit-accent/5'
            : 'border-orbit-border bg-orbit-surface'
      )}
    >
      <button
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-orbit-surface/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {status === 'running' ? (
          <Spinner size={12} />
        ) : status === 'error' || isError ? (
          <span className="text-orbit-error">✕</span>
        ) : (
          <span className="text-orbit-success">✓</span>
        )}
        <span className="font-mono font-medium">{formatToolName(toolName)}</span>
        <Badge variant={status === 'error' || isError ? 'error' : status === 'running' ? 'accent' : 'success'}>
          {status === 'running' ? 'Running' : status === 'error' || isError ? 'Error' : 'Done'}
        </Badge>
        <svg
          className={cn('ml-auto transition-transform', expanded && 'rotate-180')}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {expanded && (
        <div className="px-3 pb-2 space-y-2 border-t border-orbit-border/50">
          <div className="mt-2">
            <div className="text-orbit-text-secondary mb-1">Input:</div>
            <pre className="text-xs bg-orbit-bg p-2 rounded overflow-x-auto">
              {JSON.stringify(input, null, 2)}
            </pre>
          </div>
          {result && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-orbit-text-secondary">Output:</span>
                <button
                  onClick={copyOutput}
                  className="text-orbit-text-secondary hover:text-orbit-text transition-colors px-1.5 py-0.5 rounded hover:bg-orbit-border/50"
                  title="Copy output"
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="text-xs bg-orbit-bg p-2 rounded overflow-x-auto max-h-48">
                {result.length > 2000 ? result.slice(0, 2000) + '\n... (truncated)' : result}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
