import { z } from 'zod'
import { commandRegistry } from '../command-registry'

const TIMEOUT = 30_000

commandRegistry.register({
  name: 'docs_documents_get',
  service: 'docs',
  resource: 'documents',
  method: 'get',
  description: 'Get the content and metadata of a Google Doc.',
  inputSchema: z.object({
    documentId: z.string().describe('The document ID'),
  }),
  dangerous: false,
  timeout: TIMEOUT,
})

commandRegistry.register({
  name: 'docs_documents_create',
  service: 'docs',
  resource: 'documents',
  method: 'create',
  description: 'Create a new Google Doc.',
  inputSchema: z.object({
    title: z.string().describe('Document title'),
  }),
  dangerous: false,
  timeout: TIMEOUT,
  buildArgs: (input) => ({
    params: {},
    json: { title: input.title },
  }),
})

commandRegistry.register({
  name: 'docs_documents_batchUpdate',
  service: 'docs',
  resource: 'documents',
  method: 'batchUpdate',
  description: 'Apply batch updates to a Google Doc (insert text, delete content, format text, etc.).',
  inputSchema: z.object({
    documentId: z.string().describe('The document ID'),
    requests: z.array(z.record(z.unknown())).describe('Array of update request objects'),
  }),
  dangerous: false,
  timeout: TIMEOUT,
  buildArgs: (input) => ({
    params: { documentId: input.documentId },
    json: { requests: input.requests },
  }),
})

commandRegistry.register({
  name: 'docs_documents_export',
  service: 'docs',
  resource: 'documents',
  method: 'export',
  description: 'Export a Google Doc to a different format.',
  inputSchema: z.object({
    documentId: z.string().describe('The document ID to export'),
    mimeType: z.string().describe('Target MIME type (e.g., "text/plain", "application/pdf")'),
  }),
  dangerous: false,
  timeout: TIMEOUT,
})
