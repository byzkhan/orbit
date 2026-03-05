// Import all tool definitions. Each file registers itself with commandRegistry as a side-effect.
// This file must be imported AFTER command-registry.ts is fully initialized.
import './definitions/gmail'
import './definitions/drive'
import './definitions/calendar'
import './definitions/sheets'
import './definitions/docs'
import './definitions/chat'
