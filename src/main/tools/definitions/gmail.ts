import { z } from 'zod'
import { commandRegistry } from '../command-registry'

const TIMEOUT = 30_000

/** Build a base64url-encoded RFC 2822 message from user-friendly fields */
function buildRawEmail(input: Record<string, unknown>): string {
  const lines: string[] = []
  lines.push(`To: ${input.to}`)
  if (input.cc) lines.push(`Cc: ${input.cc}`)
  if (input.bcc) lines.push(`Bcc: ${input.bcc}`)
  lines.push(`Subject: ${input.subject}`)
  if (input.inReplyTo) lines.push(`In-Reply-To: ${input.inReplyTo}`)
  if (input.references) lines.push(`References: ${input.references}`)
  lines.push('Content-Type: text/plain; charset=utf-8')
  lines.push('')
  lines.push(String(input.body ?? ''))
  const raw = lines.join('\r\n')
  return Buffer.from(raw).toString('base64url')
}

commandRegistry.register({
  name: 'gmail_messages_list',
  service: 'gmail',
  resource: 'users',
  subResource: 'messages',
  method: 'list',
  description: 'List Gmail messages. Use q parameter for search queries like "is:unread", "from:user@example.com", "subject:meeting".',
  inputSchema: z.object({
    maxResults: z.number().optional().describe('Maximum number of messages to return (default 10, max 100)'),
    q: z.string().optional().describe('Gmail search query (same syntax as Gmail search bar)'),
    labelIds: z.array(z.string()).optional().describe('Filter by label IDs like INBOX, SENT, DRAFT'),
  }),
  dangerous: false,
  timeout: TIMEOUT,
})

commandRegistry.register({
  name: 'gmail_messages_get',
  service: 'gmail',
  resource: 'users',
  subResource: 'messages',
  method: 'get',
  description: 'Get a specific Gmail message by ID. Returns full message including body, headers, and attachments list.',
  inputSchema: z.object({
    id: z.string().describe('The message ID'),
    format: z.enum(['full', 'metadata', 'minimal', 'raw']).optional().describe('Response format (default: full)'),
  }),
  dangerous: false,
  timeout: TIMEOUT,
})

commandRegistry.register({
  name: 'gmail_messages_send',
  service: 'gmail',
  resource: 'users',
  subResource: 'messages',
  method: 'send',
  description: 'Send a new Gmail message.',
  inputSchema: z.object({
    to: z.string().describe('Recipient email address(es), comma-separated'),
    subject: z.string().describe('Email subject line'),
    body: z.string().describe('Email body (plain text)'),
    cc: z.string().optional().describe('CC recipients, comma-separated'),
    bcc: z.string().optional().describe('BCC recipients, comma-separated'),
  }),
  dangerous: false,
  timeout: TIMEOUT,
  buildArgs: (input) => ({
    params: {},
    json: { raw: buildRawEmail(input) },
  }),
})

commandRegistry.register({
  name: 'gmail_messages_reply',
  service: 'gmail',
  resource: 'users',
  subResource: 'messages',
  method: 'send',
  description: 'Reply to an existing Gmail message. First use gmail_messages_get to get the original message headers (Message-Id, Subject, From).',
  inputSchema: z.object({
    to: z.string().describe('Recipient email address to reply to'),
    subject: z.string().describe('Email subject (usually "Re: <original subject>")'),
    body: z.string().describe('Reply body text'),
    threadId: z.string().describe('The threadId of the original message (from gmail_messages_get)'),
    inReplyTo: z.string().optional().describe('Message-Id header of the message being replied to'),
    references: z.string().optional().describe('References header (Message-Id chain)'),
  }),
  dangerous: false,
  timeout: TIMEOUT,
  buildArgs: (input) => ({
    params: {},
    json: { raw: buildRawEmail(input), threadId: input.threadId },
  }),
})

commandRegistry.register({
  name: 'gmail_messages_trash',
  service: 'gmail',
  resource: 'users',
  subResource: 'messages',
  method: 'modify',
  description: 'Move a Gmail message to the trash.',
  inputSchema: z.object({
    id: z.string().describe('The message ID to trash'),
  }),
  dangerous: false,
  timeout: TIMEOUT,
  buildArgs: (input) => ({
    params: { id: input.id },
    json: { addLabelIds: ['TRASH'], removeLabelIds: ['INBOX'] },
  }),
})

commandRegistry.register({
  name: 'gmail_messages_modify',
  service: 'gmail',
  resource: 'users',
  subResource: 'messages',
  method: 'modify',
  description: 'Modify labels on a Gmail message. Use to mark as read/unread, star/unstar, archive, etc.',
  inputSchema: z.object({
    id: z.string().describe('The message ID to modify'),
    addLabelIds: z.array(z.string()).optional().describe('Label IDs to add (e.g., STARRED, IMPORTANT)'),
    removeLabelIds: z.array(z.string()).optional().describe('Label IDs to remove (e.g., UNREAD, INBOX)'),
  }),
  dangerous: false,
  timeout: TIMEOUT,
  buildArgs: (input) => ({
    params: { id: input.id },
    json: {
      ...(input.addLabelIds ? { addLabelIds: input.addLabelIds } : {}),
      ...(input.removeLabelIds ? { removeLabelIds: input.removeLabelIds } : {}),
    },
  }),
})

commandRegistry.register({
  name: 'gmail_drafts_create',
  service: 'gmail',
  resource: 'users',
  subResource: 'drafts',
  method: 'create',
  description: 'Create a new Gmail draft.',
  inputSchema: z.object({
    to: z.string().describe('Recipient email address(es)'),
    subject: z.string().describe('Email subject'),
    body: z.string().describe('Email body text'),
  }),
  dangerous: false,
  timeout: TIMEOUT,
  buildArgs: (input) => ({
    params: {},
    json: { message: { raw: buildRawEmail(input) } },
  }),
})

commandRegistry.register({
  name: 'gmail_drafts_list',
  service: 'gmail',
  resource: 'users',
  subResource: 'drafts',
  method: 'list',
  description: 'List Gmail drafts.',
  inputSchema: z.object({
    maxResults: z.number().optional().describe('Maximum number of drafts to return'),
  }),
  dangerous: false,
  timeout: TIMEOUT,
})

commandRegistry.register({
  name: 'gmail_labels_list',
  service: 'gmail',
  resource: 'users',
  subResource: 'labels',
  method: 'list',
  description: 'List all Gmail labels (folders/categories).',
  inputSchema: z.object({}),
  dangerous: false,
  timeout: TIMEOUT,
})
