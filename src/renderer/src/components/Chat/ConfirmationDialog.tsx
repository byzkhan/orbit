import { useChatStore } from '../../stores/chat-store'
import { Button } from '../ui/Button'
import { getToolDescription } from '../../lib/tool-descriptions'

export function ConfirmationDialog() {
  const pendingConfirmation = useChatStore((s) => s.pendingConfirmation)
  const confirmToolCall = useChatStore((s) => s.confirmToolCall)

  if (!pendingConfirmation) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative bg-orbit-bg border border-orbit-border rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
        <div className="flex items-start gap-3">
          <div className="text-orbit-accent text-2xl mt-0.5">&#9888;</div>
          <div className="flex-1">
            <h3 className="font-heading text-lg mb-1">Permission Required</h3>
            <p className="text-sm text-orbit-text-secondary mb-1">
              {pendingConfirmation.description}
            </p>
            <p className="text-xs font-mono text-orbit-text-secondary/60 mb-5">
              {getToolDescription(pendingConfirmation.toolName)}
            </p>
            <div className="flex gap-3">
              <Button
                variant="danger"
                size="md"
                className="flex-1"
                onClick={() => confirmToolCall(pendingConfirmation.toolUseId, false)}
              >
                Deny
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={() => confirmToolCall(pendingConfirmation.toolUseId, true)}
              >
                Allow
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
