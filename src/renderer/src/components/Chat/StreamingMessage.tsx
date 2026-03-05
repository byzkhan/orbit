import { Spinner } from '../ui/Spinner'
import { getToolDescription } from '../../lib/tool-descriptions'
import type { AgentState } from '@shared/types'

interface ToolCallStatus {
  toolUseId: string
  toolName: string
  input: Record<string, unknown>
  status: 'running' | 'complete' | 'error'
  result?: string
  isError?: boolean
}

interface StreamingMessageProps {
  text: string
  agentState: AgentState
  toolCalls: Map<string, ToolCallStatus>
}

export function StreamingMessage({ text, agentState, toolCalls }: StreamingMessageProps) {
  const toolCallArray = Array.from(toolCalls.values())

  return (
    <div className="text-sm">
      {toolCallArray.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {toolCallArray.map((tc) => (
            <div key={tc.toolUseId} className="flex items-center gap-2 text-xs">
              {tc.status === 'running' ? (
                <>
                  <Spinner size={12} />
                  <span className="text-orbit-text-secondary">
                    {getToolDescription(tc.toolName)}
                  </span>
                </>
              ) : tc.status === 'error' || tc.isError ? (
                <>
                  <span className="text-orbit-error text-sm">✕</span>
                  <span className="text-orbit-error">
                    {tc.result || getToolDescription(tc.toolName, true)}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-orbit-success text-sm">✓</span>
                  <span className="text-orbit-text-secondary">
                    {getToolDescription(tc.toolName, true)}
                  </span>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {text ? (
        <div className="prose-orbit">
          <p className="whitespace-pre-wrap leading-relaxed">{text}</p>
          <span className="inline-block w-0.5 h-4 bg-orbit-accent animate-pulse" />
        </div>
      ) : agentState === 'thinking' ? (
        <div className="flex items-center gap-2 text-orbit-text-secondary">
          <Spinner size={14} />
          <span className="text-sm">Thinking...</span>
        </div>
      ) : null}
    </div>
  )
}
