import Anthropic from '@anthropic-ai/sdk'
import { getApiKey } from '../auth/key-store'
import { getPlatform } from '../../core/platform'
import { commandRegistry } from '../tools/command-registry'
import { gwsExecutor } from '../tools/gws-executor'
import { handleInternalTool } from '../tools/internal-tools'
import { buildSystemPrompt } from './system-prompt'
import { resolveConfirmation as resolveConf } from './confirmation-gate'
import * as sessionRepo from '../db/session-repo'
import * as messageRepo from '../db/message-repo'
import * as toolExecRepo from '../db/tool-execution-repo'
import * as settingsRepo from '../db/settings-repo'
import type { AgentContext, EmitFn } from './types'
import type { AgentEvent, AgentState, SerializedToolCall } from '@shared/types'

const activeContexts = new Map<string, AgentContext>()

function transition(ctx: AgentContext, state: AgentState, emit: EmitFn): void {
  ctx.state = state
  emit({ type: 'state_change', state })
}

function extractTextContent(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
}

export async function runAgentLoop(
  sessionId: string,
  userMessage: string,
  emit: EmitFn
): Promise<void> {
  const apiKey = getApiKey()
  if (!apiKey) {
    emit({ type: 'error', error: 'No API key configured. Please set your Anthropic API key in settings.', recoverable: true })
    return
  }

  const settings = settingsRepo.getAll()
  const client = new Anthropic({ apiKey })

  const ctx: AgentContext = {
    sessionId,
    messages: [],
    state: 'idle',
    currentStep: 0,
    maxSteps: settings.maxSteps,
    abortController: null,
  }

  activeContexts.set(sessionId, ctx)

  // Load existing messages from DB for context
  const existingMessages = messageRepo.listBySession(sessionId)
  for (const msg of existingMessages) {
    if (msg.role === 'user') {
      ctx.messages.push({ role: 'user', content: msg.content })
    } else if (msg.role === 'assistant') {
      ctx.messages.push({ role: 'assistant', content: msg.content })
    }
  }

  // Add the new user message
  ctx.messages.push({ role: 'user', content: userMessage })
  messageRepo.create(sessionId, 'user', userMessage)
  sessionRepo.touch(sessionId)

  // Auto-title on first message
  if (existingMessages.length === 0) {
    const title = userMessage.length > 50 ? userMessage.slice(0, 47) + '...' : userMessage
    sessionRepo.rename(sessionId, title)
  }

  try {
    while (ctx.currentStep < ctx.maxSteps) {
      ctx.currentStep++
      transition(ctx, 'thinking', emit)

      ctx.abortController = new AbortController()

      const stream = client.messages.stream(
        {
          model: settings.model,
          max_tokens: 8192,
          system: buildSystemPrompt(sessionId),
          messages: ctx.messages,
          tools: commandRegistry.toAnthropicTools(),
        },
        { signal: ctx.abortController.signal }
      )

      // Forward text deltas
      stream.on('text', (text) => {
        emit({ type: 'text_delta', text })
      })

      const message = await stream.finalMessage()

      // Emit usage
      if (message.usage) {
        emit({
          type: 'usage',
          inputTokens: message.usage.input_tokens,
          outputTokens: message.usage.output_tokens,
        })
      }

      ctx.messages.push({ role: 'assistant', content: message.content })

      // If Claude is done (end_turn or max_tokens)
      if (message.stop_reason === 'end_turn' || message.stop_reason === 'max_tokens') {
        const textContent = extractTextContent(message.content)
        const serialized = messageRepo.create(sessionId, 'assistant', textContent)
        transition(ctx, 'responding', emit)
        emit({ type: 'message_complete', message: serialized })
        transition(ctx, 'idle', emit)
        activeContexts.delete(sessionId)
        return
      }

      // Process tool calls
      if (message.stop_reason === 'tool_use') {
        transition(ctx, 'tool_calling', emit)
        const toolUseBlocks = message.content.filter(
          (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
        )

        const toolResults: Anthropic.ToolResultBlockParam[] = []
        const serializedToolCalls: SerializedToolCall[] = []

        for (const block of toolUseBlocks) {
          const input = block.input as Record<string, unknown>
          emit({ type: 'tool_call_start', toolUseId: block.id, toolName: block.name, input })

          // Gate dangerous commands
          if (commandRegistry.isDangerous(block.name)) {
            const description = `Execute ${block.name} with params: ${JSON.stringify(input).slice(0, 200)}`

            emit({
              type: 'confirmation_required',
              toolUseId: block.id,
              toolName: block.name,
              description,
            })

            // Platform handles confirmation: CLI prompts stdin, Electron uses IPC dialog
            const approved = await getPlatform().confirmDangerous(block.name, description, block.id)
            if (!approved) {
              toolResults.push({
                type: 'tool_result',
                tool_use_id: block.id,
                content: 'User denied this action.',
                is_error: true,
              })
              emit({ type: 'tool_call_result', toolUseId: block.id, result: 'User denied this action.', isError: true })
              continue
            }
          }

          // Execute tool
          const startTime = Date.now()
          let result: { output: string; isError: boolean }

          if (block.name === 'memory_store') {
            result = handleInternalTool(block.name, input, sessionId)
          } else if (settings.dryRun) {
            result = { output: `[DRY RUN] Would execute: gws ${block.name.replace(/_/g, ' ')} --params '${JSON.stringify(input)}'`, isError: false }
          } else {
            result = await gwsExecutor.execute(block.name, input)
          }

          const durationMs = Date.now() - startTime

          emit({ type: 'tool_call_result', toolUseId: block.id, result: result.output, isError: result.isError })
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: result.output,
            is_error: result.isError,
          })

          serializedToolCalls.push({
            toolUseId: block.id,
            toolName: block.name,
            input,
            result: result.output,
            isError: result.isError,
            durationMs,
          })

          // Record in DB
          toolExecRepo.record({
            sessionId,
            toolName: block.name,
            input,
            output: result.output,
            isError: result.isError,
            durationMs,
          })
        }

        // Feed tool results back to Claude
        ctx.messages.push({ role: 'user', content: toolResults })
      }
    }

    // Max steps reached
    emit({ type: 'error', error: `Agent reached maximum steps (${ctx.maxSteps}). Try breaking your request into smaller parts.`, recoverable: true })
    transition(ctx, 'idle', emit)
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      transition(ctx, 'cancelled', emit)
      transition(ctx, 'idle', emit)
      return
    }
    const errorMessage = err instanceof Error ? err.message : String(err)
    emit({ type: 'error', error: errorMessage, recoverable: true })
    transition(ctx, 'error', emit)
    transition(ctx, 'idle', emit)
  } finally {
    activeContexts.delete(sessionId)
  }
}

export function cancelAgent(sessionId: string): void {
  const ctx = activeContexts.get(sessionId)
  if (ctx?.abortController) {
    ctx.abortController.abort()
  }
}

export { resolveConf as resolveConfirmation }
