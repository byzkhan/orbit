import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'
import type Anthropic from '@anthropic-ai/sdk'

export interface GWSCommandDef {
  name: string
  service: string
  resource: string
  subResource?: string
  method: string
  description: string
  inputSchema: z.ZodObject<z.ZodRawShape>
  dangerous: boolean
  timeout: number
  /** For commands that need --json body (e.g. gmail send). Returns { params, json } */
  buildArgs?: (input: Record<string, unknown>) => { params?: Record<string, unknown>; json?: Record<string, unknown> }
}

class CommandRegistry {
  private commands = new Map<string, GWSCommandDef>()

  register(def: GWSCommandDef): void {
    this.commands.set(def.name, def)
  }

  get(name: string): GWSCommandDef | undefined {
    return this.commands.get(name)
  }

  isDangerous(name: string): boolean {
    return this.commands.get(name)?.dangerous ?? false
  }

  toAnthropicTools(): Anthropic.Tool[] {
    const tools: Anthropic.Tool[] = []
    for (const cmd of this.commands.values()) {
      const jsonSchema = zodToJsonSchema(cmd.inputSchema, { target: 'openApi3' })
      tools.push({
        name: cmd.name,
        description: cmd.description,
        input_schema: jsonSchema as Anthropic.Tool['input_schema'],
      })
    }

    // Add internal tools
    tools.push({
      name: 'memory_store',
      description: 'Store a fact or preference about the user for future sessions. Use this when the user shares persistent information like their name, email, timezone, preferences, or common contacts.',
      input_schema: {
        type: 'object' as const,
        properties: {
          key: { type: 'string', description: 'A short descriptive key, e.g. "user_email", "timezone", "preferred_calendar"' },
          value: { type: 'string', description: 'The value to remember' },
        },
        required: ['key', 'value'],
      },
    })

    return tools
  }

  getServiceParts(name: string): { service: string; resource: string; subResource?: string; method: string } | undefined {
    const cmd = this.commands.get(name)
    if (!cmd) return undefined
    return { service: cmd.service, resource: cmd.resource, subResource: cmd.subResource, method: cmd.method }
  }

  allNames(): string[] {
    return Array.from(this.commands.keys())
  }
}

export const commandRegistry = new CommandRegistry()
