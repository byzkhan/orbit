import { useChatStore } from '../../stores/chat-store'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

const SUGGESTIONS: { label: string; prompt: string }[] = [
  { label: 'Unread emails', prompt: 'How many unread emails do I have? Summarize the important ones.' },
  { label: "Today's meetings", prompt: "What meetings do I have today? Include times and attendees." },
  { label: 'Recent documents', prompt: 'Show me the documents I edited most recently.' },
  { label: 'Shared with me', prompt: 'What files have been shared with me this week?' },
  { label: 'Draft an email', prompt: 'Help me draft an email.' },
  { label: 'Create an event', prompt: 'Help me create a new calendar event.' },
  { label: 'Search my Drive', prompt: 'Search my Google Drive for recent files.' },
  { label: 'Weekly summary', prompt: 'Give me a summary of my week — emails, meetings, and documents.' },
]

export function EmptyState() {
  const sendMessage = useChatStore((s) => s.sendMessage)

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-heading text-orbit-accent mb-2">{getGreeting()}</h1>
        <p className="text-orbit-text-secondary text-sm">
          What can I help you with?
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2 max-w-xl">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.label}
            onClick={() => sendMessage(s.prompt)}
            className="px-4 py-2 rounded-full border border-orbit-border text-sm text-orbit-text-secondary hover:text-orbit-text hover:border-orbit-accent/40 transition-colors"
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}
