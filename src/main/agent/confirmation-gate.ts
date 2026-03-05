const pendingConfirmations = new Map<string, {
  resolve: (approved: boolean) => void
  timer: ReturnType<typeof setTimeout>
}>()

export function waitForConfirmation(toolUseId: string, timeoutMs = 60_000): Promise<boolean> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      pendingConfirmations.delete(toolUseId)
      resolve(false) // Auto-deny on timeout
    }, timeoutMs)

    pendingConfirmations.set(toolUseId, { resolve, timer })
  })
}

export function resolveConfirmation(toolUseId: string, approved: boolean): void {
  const pending = pendingConfirmations.get(toolUseId)
  if (pending) {
    clearTimeout(pending.timer)
    pendingConfirmations.delete(toolUseId)
    pending.resolve(approved)
  }
}
