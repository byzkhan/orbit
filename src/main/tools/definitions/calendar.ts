import { z } from 'zod'
import { commandRegistry } from '../command-registry'

const TIMEOUT = 30_000

commandRegistry.register({
  name: 'calendar_events_list',
  service: 'calendar',
  resource: 'events',
  method: 'list',
  description: 'List calendar events. Defaults to upcoming events from the primary calendar.',
  inputSchema: z.object({
    calendarId: z.string().optional().describe('Calendar ID (default: "primary")'),
    timeMin: z.string().optional().describe('Start of time range (ISO 8601 datetime)'),
    timeMax: z.string().optional().describe('End of time range (ISO 8601 datetime)'),
    maxResults: z.number().optional().describe('Maximum events to return'),
    q: z.string().optional().describe('Free text search query'),
  }),
  dangerous: false,
  timeout: TIMEOUT,
})

commandRegistry.register({
  name: 'calendar_events_get',
  service: 'calendar',
  resource: 'events',
  method: 'get',
  description: 'Get details of a specific calendar event.',
  inputSchema: z.object({
    calendarId: z.string().optional().describe('Calendar ID (default: "primary")'),
    eventId: z.string().describe('The event ID'),
  }),
  dangerous: false,
  timeout: TIMEOUT,
})

commandRegistry.register({
  name: 'calendar_events_create',
  service: 'calendar',
  resource: 'events',
  method: 'insert',
  description: 'Create a new calendar event.',
  inputSchema: z.object({
    calendarId: z.string().optional().describe('Calendar ID (default: "primary")'),
    summary: z.string().describe('Event title'),
    start: z.string().describe('Start datetime (ISO 8601)'),
    end: z.string().describe('End datetime (ISO 8601)'),
    description: z.string().optional().describe('Event description'),
    location: z.string().optional().describe('Event location'),
    attendees: z.array(z.string()).optional().describe('Attendee email addresses'),
  }),
  dangerous: false,
  timeout: TIMEOUT,
  buildArgs: (input) => ({
    params: { calendarId: (input.calendarId as string) || 'primary' },
    json: {
      summary: input.summary,
      start: { dateTime: input.start },
      end: { dateTime: input.end },
      ...(input.description ? { description: input.description } : {}),
      ...(input.location ? { location: input.location } : {}),
      ...(input.attendees ? { attendees: (input.attendees as string[]).map(e => ({ email: e })) } : {}),
    },
  }),
})

commandRegistry.register({
  name: 'calendar_events_update',
  service: 'calendar',
  resource: 'events',
  method: 'patch',
  description: 'Update an existing calendar event.',
  inputSchema: z.object({
    calendarId: z.string().optional().describe('Calendar ID (default: "primary")'),
    eventId: z.string().describe('The event ID to update'),
    summary: z.string().optional().describe('New event title'),
    start: z.string().optional().describe('New start datetime (ISO 8601)'),
    end: z.string().optional().describe('New end datetime (ISO 8601)'),
    description: z.string().optional().describe('New description'),
    location: z.string().optional().describe('New location'),
  }),
  dangerous: false,
  timeout: TIMEOUT,
  buildArgs: (input) => {
    const json: Record<string, unknown> = {}
    if (input.summary) json.summary = input.summary
    if (input.start) json.start = { dateTime: input.start }
    if (input.end) json.end = { dateTime: input.end }
    if (input.description) json.description = input.description
    if (input.location) json.location = input.location
    return {
      params: { calendarId: (input.calendarId as string) || 'primary', eventId: input.eventId },
      json,
    }
  },
})

commandRegistry.register({
  name: 'calendar_events_delete',
  service: 'calendar',
  resource: 'events',
  method: 'delete',
  description: 'Delete a calendar event.',
  inputSchema: z.object({
    calendarId: z.string().optional().describe('Calendar ID (default: "primary")'),
    eventId: z.string().describe('The event ID to delete'),
  }),
  dangerous: true,
  timeout: TIMEOUT,
})

commandRegistry.register({
  name: 'calendar_freebusy_query',
  service: 'calendar',
  resource: 'freebusy',
  method: 'query',
  description: 'Query free/busy information for calendars.',
  inputSchema: z.object({
    timeMin: z.string().describe('Start of time range (ISO 8601)'),
    timeMax: z.string().describe('End of time range (ISO 8601)'),
    items: z.array(z.string()).optional().describe('Calendar IDs to check (default: primary)'),
  }),
  dangerous: false,
  timeout: TIMEOUT,
  buildArgs: (input) => ({
    params: {},
    json: {
      timeMin: input.timeMin,
      timeMax: input.timeMax,
      items: ((input.items as string[]) || ['primary']).map(id => ({ id })),
    },
  }),
})
