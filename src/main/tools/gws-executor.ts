import { spawn } from 'child_process'
import { commandRegistry } from './command-registry'
import { resolveGwsPath } from './resolve-gws'
import { gwsEnv } from '../auth/gws-auth'

const MAX_OUTPUT_SIZE = 15_000 // 15KB

class GWSExecutor {
  async execute(
    toolName: string,
    input: Record<string, unknown>
  ): Promise<{ output: string; isError: boolean }> {
    const parts = commandRegistry.getServiceParts(toolName)
    if (!parts) {
      return { output: `Unknown tool: ${toolName}`, isError: true }
    }

    const cmd = commandRegistry.get(toolName)!

    // Validate input with Zod
    const parsed = cmd.inputSchema.safeParse(input)
    if (!parsed.success) {
      return {
        output: `Invalid input: ${parsed.error.issues.map((i) => i.message).join(', ')}`,
        isError: true,
      }
    }

    const args = [parts.service, parts.resource]
    if (parts.subResource) {
      args.push(parts.subResource)
    }
    args.push(parts.method)

    if (cmd.buildArgs) {
      // Custom arg builder (e.g. gmail send needs --json with base64 RFC 2822)
      const built = cmd.buildArgs(parsed.data as Record<string, unknown>)
      const finalParams = parts.service === 'gmail'
        ? { userId: 'me', ...built.params }
        : built.params
      if (finalParams && Object.keys(finalParams).length > 0) {
        args.push('--params', JSON.stringify(finalParams))
      }
      if (built.json && Object.keys(built.json).length > 0) {
        args.push('--json', JSON.stringify(built.json))
      }
    } else {
      // Default: all input goes to --params
      const params =
        parts.service === 'gmail'
          ? { userId: 'me', ...parsed.data }
          : parsed.data

      if (Object.keys(params).length > 0) {
        args.push('--params', JSON.stringify(params))
      }
    }

    return new Promise((resolve) => {
      try {
        const proc = spawn(resolveGwsPath(), args, {
          shell: false,
          timeout: cmd.timeout,
          env: gwsEnv(),
        })

        let stdout = ''
        let stderr = ''

        proc.stdout?.on('data', (chunk) => {
          stdout += chunk.toString()
          if (stdout.length > MAX_OUTPUT_SIZE * 2) {
            stdout = stdout.slice(0, MAX_OUTPUT_SIZE)
          }
        })

        proc.stderr?.on('data', (chunk) => {
          stderr += chunk.toString()
        })

        proc.on('error', (err) => {
          resolve({ output: `Failed to execute gws: ${err.message}`, isError: true })
        })

        proc.on('close', (code) => {
          if (code !== 0) {
            resolve({
              output: stderr || `gws exited with code ${code}`,
              isError: true,
            })
            return
          }

          let output = stdout.trim()
          if (output.length > MAX_OUTPUT_SIZE) {
            output = output.slice(0, MAX_OUTPUT_SIZE) + '\n... (truncated)'
          }
          resolve({ output: output || '(no output)', isError: false })
        })
      } catch (err: unknown) {
        resolve({
          output: `Failed to spawn gws: ${err instanceof Error ? err.message : String(err)}`,
          isError: true,
        })
      }
    })
  }
}

export const gwsExecutor = new GWSExecutor()
