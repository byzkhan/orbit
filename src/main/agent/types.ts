import type Anthropic from '@anthropic-ai/sdk'
import type { AgentState, AgentEvent } from '@shared/types'

export interface AgentContext {
  sessionId: string
  messages: Anthropic.MessageParam[]
  state: AgentState
  currentStep: number
  maxSteps: number
  abortController: AbortController | null
}

export type EmitFn = (event: AgentEvent) => void
