import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ToastContext } from './useToast'

interface Toast { id: number; message: string }

function SuccessToast({ toast, dismiss }: { toast: Toast; dismiss: (id: number) => void }) {
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  useEffect(() => {
    if (hovered || focused) return
    const timer = window.setTimeout(() => dismiss(toast.id), 7000)
    return () => window.clearTimeout(timer)
  }, [toast.id, dismiss, hovered, focused])

  return (
    <div
      className="pointer-events-auto flex items-start gap-3 rounded-xl border border-green-200 bg-white p-4 text-sm text-mesa-text shadow-lg"
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false) }}
    >
      <svg aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-mesa-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></svg>
      <p className="min-w-0 flex-1 leading-relaxed wrap-anywhere">{toast.message}</p>
      <button type="button" className="mesa-focus -m-2 flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg text-mesa-muted hover:bg-mesa-canvas" aria-label="Cerrar notificación" onClick={() => dismiss(toast.id)}>
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 6 12 12M18 6 6 18" /></svg>
      </button>
    </div>
  )
}

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const sequence = useRef(0)
  const notify = useCallback((message: string) => {
    const id = ++sequence.current
    setToasts(current => [...current.slice(-2), { id, message }])
  }, [])
  const dismiss = useCallback((id: number) => setToasts(current => current.filter(toast => toast.id !== id)), [])

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div role="status" aria-live="polite" aria-relevant="additions" aria-label="Notificaciones" className="pointer-events-none fixed right-4 bottom-4 left-4 z-50 space-y-3 sm:left-auto sm:w-96">
        {toasts.map(toast => <SuccessToast key={toast.id} toast={toast} dismiss={dismiss} />)}
      </div>
    </ToastContext.Provider>
  )
}
