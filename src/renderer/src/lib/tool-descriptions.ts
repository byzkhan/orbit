const toolDescriptions: Record<string, [string, string]> = {
  // Gmail [active, completed]
  gmail_messages_list: ['Checking your emails...', 'Checked your emails'],
  gmail_messages_get: ['Reading an email...', 'Read an email'],
  gmail_messages_send: ['Sending an email...', 'Sent an email'],
  gmail_messages_reply: ['Replying to an email...', 'Replied to an email'],
  gmail_messages_trash: ['Moving email to trash...', 'Moved email to trash'],
  gmail_messages_modify: ['Updating an email...', 'Updated an email'],
  gmail_drafts_create: ['Creating a draft...', 'Created a draft'],
  gmail_drafts_list: ['Checking your drafts...', 'Checked your drafts'],
  gmail_labels_list: ['Loading your labels...', 'Loaded your labels'],

  // Drive
  drive_files_list: ['Searching your Drive...', 'Searched your Drive'],
  drive_files_get: ['Getting a file...', 'Got a file'],
  drive_files_export: ['Exporting a file...', 'Exported a file'],
  drive_files_create: ['Creating a file...', 'Created a file'],
  drive_files_update: ['Updating a file...', 'Updated a file'],
  drive_files_copy: ['Copying a file...', 'Copied a file'],
  drive_files_delete: ['Deleting a file...', 'Deleted a file'],

  // Calendar
  calendar_events_list: ['Looking at your calendar...', 'Checked your calendar'],
  calendar_events_get: ['Getting an event...', 'Got event details'],
  calendar_events_create: ['Creating an event...', 'Created an event'],
  calendar_events_update: ['Updating an event...', 'Updated an event'],
  calendar_events_delete: ['Deleting an event...', 'Deleted an event'],
  calendar_freebusy_query: ['Checking availability...', 'Checked availability'],

  // Sheets
  sheets_spreadsheets_get: ['Opening a spreadsheet...', 'Opened a spreadsheet'],
  sheets_spreadsheets_create: ['Creating a spreadsheet...', 'Created a spreadsheet'],
  sheets_values_get: ['Reading spreadsheet data...', 'Read spreadsheet data'],
  sheets_values_update: ['Updating spreadsheet data...', 'Updated spreadsheet data'],
  sheets_values_append: ['Adding spreadsheet data...', 'Added spreadsheet data'],

  // Docs
  docs_documents_get: ['Opening a document...', 'Opened a document'],
  docs_documents_create: ['Creating a document...', 'Created a document'],
  docs_documents_batchUpdate: ['Editing a document...', 'Edited a document'],
  docs_documents_export: ['Exporting a document...', 'Exported a document'],

  // Chat
  chat_spaces_list: ['Loading your spaces...', 'Loaded your spaces'],
  chat_messages_list: ['Checking your chats...', 'Checked your chats'],
  chat_messages_create: ['Sending a message...', 'Sent a message'],
  chat_messages_delete: ['Deleting a message...', 'Deleted a message'],

  // Internal
  memory_store: ['Saving a note...', 'Saved a note'],
}

function formatToolNameFallback(name: string): string {
  const words = name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  return words
}

export function getToolDescription(toolName: string, completed = false): string {
  const entry = toolDescriptions[toolName]
  if (entry) return completed ? entry[1] : entry[0]
  const formatted = formatToolNameFallback(toolName)
  return completed ? `Done: ${formatted}` : `Running: ${formatted}...`
}
