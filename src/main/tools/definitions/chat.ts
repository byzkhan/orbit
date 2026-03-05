import { z } from 'zod'
import { commandRegistry } from '../command-registry'

const TIMEOUT = 30_000

commandRegistry.register({
  name: 'chat_spaces_list',
  service: 'chat',
  resource: 'spaces',
  method: 'list',
  description: 'List Google Chat spaces (rooms and DMs) the user is a member of.',
  inputSchema: z.object({
    maxResults: z.number().optional().describe('Maximum spaces to return'),
  }),
  dangerous: false,
  timeout: TIMEOUT,
})

commandRegistry.register({
  name: 'chat_messages_list',
  service: 'chat',
  resource: 'messages',
  method: 'list',
  description: 'List messages in a Google Chat space.',
  inputSchema: z.object({
    spaceName: z.string().describe('The space resource name (e.g., "spaces/AAAA")'),
    maxResults: z.number().optional().describe('Maximum messages to return'),
  }),
  dangerous: false,
  timeout: TIMEOUT,
})

commandRegistry.register({
  name: 'chat_messages_create',
  service: 'chat',
  resource: 'messages',
  method: 'create',
  description: 'Send a message to a Google Chat space.',
  inputSchema: z.object({
    spaceName: z.string().describe('The space resource name (e.g., "spaces/AAAA")'),
    text: z.string().describe('Message text'),
  }),
  dangerous: false,
  timeout: TIMEOUT,
  buildArgs: (input) => ({
    params: { parent: input.spaceName },
    json: { text: input.text },
  }),
})

commandRegistry.register({
  name: 'chat_messages_delete',
  service: 'chat',
  resource: 'messages',
  method: 'delete',
  description: 'Delete a message from a Google Chat space.',
  inputSchema: z.object({
    messageName: z.string().describe('The message resource name (e.g., "spaces/AAAA/messages/BBBB")'),
  }),
  dangerous: true,
  timeout: TIMEOUT,
})
