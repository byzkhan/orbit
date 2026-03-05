import { z } from 'zod'
import { commandRegistry } from '../command-registry'

const TIMEOUT = 30_000

commandRegistry.register({
  name: 'drive_files_list',
  service: 'drive',
  resource: 'files',
  method: 'list',
  description: 'List files in Google Drive. Supports search queries.',
  inputSchema: z.object({
    q: z.string().optional().describe("Drive search query (e.g., \"name contains 'report'\", \"mimeType='application/pdf'\")"),
    maxResults: z.number().optional().describe('Maximum results to return'),
    orderBy: z.string().optional().describe('Sort order (e.g., "modifiedTime desc")'),
  }),
  dangerous: false,
  timeout: TIMEOUT,
})

commandRegistry.register({
  name: 'drive_files_get',
  service: 'drive',
  resource: 'files',
  method: 'get',
  description: 'Get metadata for a specific file in Google Drive.',
  inputSchema: z.object({
    fileId: z.string().describe('The file ID'),
  }),
  dangerous: false,
  timeout: TIMEOUT,
})

commandRegistry.register({
  name: 'drive_files_export',
  service: 'drive',
  resource: 'files',
  method: 'export',
  description: 'Export a Google Workspace document to a specific format (e.g., Google Doc to PDF).',
  inputSchema: z.object({
    fileId: z.string().describe('The file ID to export'),
    mimeType: z.string().describe('Target MIME type (e.g., "application/pdf", "text/plain")'),
  }),
  dangerous: false,
  timeout: TIMEOUT,
})

commandRegistry.register({
  name: 'drive_files_create',
  service: 'drive',
  resource: 'files',
  method: 'create',
  description: 'Create a new file in Google Drive.',
  inputSchema: z.object({
    name: z.string().describe('File name'),
    mimeType: z.string().optional().describe('MIME type of the file'),
    parents: z.array(z.string()).optional().describe('Parent folder IDs'),
  }),
  dangerous: false,
  timeout: TIMEOUT,
  buildArgs: (input) => ({
    params: {},
    json: {
      name: input.name,
      ...(input.mimeType ? { mimeType: input.mimeType } : {}),
      ...(input.parents ? { parents: input.parents } : {}),
    },
  }),
})

commandRegistry.register({
  name: 'drive_files_update',
  service: 'drive',
  resource: 'files',
  method: 'update',
  description: 'Update file metadata in Google Drive.',
  inputSchema: z.object({
    fileId: z.string().describe('The file ID to update'),
    name: z.string().optional().describe('New file name'),
  }),
  dangerous: false,
  timeout: TIMEOUT,
  buildArgs: (input) => ({
    params: { fileId: input.fileId },
    json: {
      ...(input.name ? { name: input.name } : {}),
    },
  }),
})

commandRegistry.register({
  name: 'drive_files_copy',
  service: 'drive',
  resource: 'files',
  method: 'copy',
  description: 'Create a copy of a file in Google Drive.',
  inputSchema: z.object({
    fileId: z.string().describe('The file ID to copy'),
    name: z.string().optional().describe('Name for the copy'),
  }),
  dangerous: false,
  timeout: TIMEOUT,
  buildArgs: (input) => ({
    params: { fileId: input.fileId },
    json: {
      ...(input.name ? { name: input.name } : {}),
    },
  }),
})

commandRegistry.register({
  name: 'drive_files_delete',
  service: 'drive',
  resource: 'files',
  method: 'delete',
  description: 'Permanently delete a file from Google Drive.',
  inputSchema: z.object({
    fileId: z.string().describe('The file ID to delete'),
  }),
  dangerous: true,
  timeout: TIMEOUT,
})
