import Anthropic from '@anthropic-ai/sdk'

export async function validateApiKey(key: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const client = new Anthropic({ apiKey: key })
    await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'hi' }],
    })
    return { valid: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('401') || message.includes('authentication') || message.includes('invalid')) {
      return { valid: false, error: 'Invalid API key. Please check and try again.' }
    }
    if (message.includes('429') || message.includes('rate')) {
      return { valid: false, error: 'Rate limited. The key is likely valid — try again in a moment.' }
    }
    return { valid: false, error: message }
  }
}
