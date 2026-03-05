import { z } from 'zod'
import { commandRegistry } from '../command-registry'

const TIMEOUT = 30_000

commandRegistry.register({
  name: 'sheets_spreadsheets_get',
  service: 'sheets',
  resource: 'spreadsheets',
  method: 'get',
  description: 'Get metadata about a Google Spreadsheet (title, sheets, properties).',
  inputSchema: z.object({
    spreadsheetId: z.string().describe('The spreadsheet ID'),
  }),
  dangerous: false,
  timeout: TIMEOUT,
})

commandRegistry.register({
  name: 'sheets_spreadsheets_create',
  service: 'sheets',
  resource: 'spreadsheets',
  method: 'create',
  description: 'Create a new Google Spreadsheet.',
  inputSchema: z.object({
    title: z.string().describe('Spreadsheet title'),
  }),
  dangerous: false,
  timeout: TIMEOUT,
  buildArgs: (input) => ({
    params: {},
    json: { properties: { title: input.title } },
  }),
})

commandRegistry.register({
  name: 'sheets_values_get',
  service: 'sheets',
  resource: 'values',
  method: 'get',
  description: 'Read values from a spreadsheet range (e.g., "Sheet1!A1:D10").',
  inputSchema: z.object({
    spreadsheetId: z.string().describe('The spreadsheet ID'),
    range: z.string().describe('A1 notation range (e.g., "Sheet1!A1:D10")'),
  }),
  dangerous: false,
  timeout: TIMEOUT,
})

commandRegistry.register({
  name: 'sheets_values_update',
  service: 'sheets',
  resource: 'values',
  method: 'update',
  description: 'Update values in a spreadsheet range.',
  inputSchema: z.object({
    spreadsheetId: z.string().describe('The spreadsheet ID'),
    range: z.string().describe('A1 notation range to update'),
    values: z.array(z.array(z.unknown())).describe('2D array of values to write'),
  }),
  dangerous: false,
  timeout: TIMEOUT,
  buildArgs: (input) => ({
    params: { spreadsheetId: input.spreadsheetId, range: input.range, valueInputOption: 'USER_ENTERED' },
    json: { values: input.values },
  }),
})

commandRegistry.register({
  name: 'sheets_values_append',
  service: 'sheets',
  resource: 'values',
  method: 'append',
  description: 'Append rows to the end of a spreadsheet.',
  inputSchema: z.object({
    spreadsheetId: z.string().describe('The spreadsheet ID'),
    range: z.string().describe('A1 notation range (data appended after the last row in this range)'),
    values: z.array(z.array(z.unknown())).describe('2D array of values to append'),
  }),
  dangerous: false,
  timeout: TIMEOUT,
  buildArgs: (input) => ({
    params: { spreadsheetId: input.spreadsheetId, range: input.range, valueInputOption: 'USER_ENTERED' },
    json: { values: input.values },
  }),
})
