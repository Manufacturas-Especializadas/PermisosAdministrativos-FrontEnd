import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from 'react'
import Button from './Button'

interface ConfirmationDialogProps {
  title: string
  description: ReactNode
  confirmText: string
  loadingText: string
  danger?: boolean
  confirmDisabled?: boolean
  initialFocusRef?: RefObject<HTMLElement | null>
  children?: ReactNode
  onCancel: () => void
  // La página conserva el manejo del error y devuelve false para permitir reintentar.
  onConfirm: () => Promise<boolean>
}

export default function ConfirmationDialog({
  title, description, confirmText, loadingText, danger = false,
  confirmDisabled = false, initialFocusRef, children, onCancel, onConfirm,
}: ConfirmationDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const inFlight = useRef(false)
  const [submitting, setSubmitting] = useState(false)
  const id = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    dialog.showModal()
    document.body.style.overflow = 'hidden'
    const initialFocus = initialFocusRef?.current ?? cancelRef.current
    initialFocus?.focus()
    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
      if (trigger?.isConnected && !trigger.matches(':disabled')) trigger.focus()
      else document.querySelector<HTMLElement>('#main-content')?.focus()
    }
  }, [initialFocusRef])

  function cancel() {
    if (!inFlight.current) onCancel()
  }

  async function confirm() {
    if (inFlight.current || confirmDisabled) return
    inFlight.current = true
    setSubmitting(true)
    let completed = false
    try {
      completed = await onConfirm()
      if (completed) onCancel()
    } finally {
      // Mantiene el bloqueo tras el éxito hasta desmontar el diálogo.
      if (!completed) {
        inFlight.current = false
        setSubmitting(false)
      }
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-modal="true"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      onCancel={(event) => { event.preventDefault(); cancel() }}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href], [tabindex="0"]'))
        const first = controls[0]
        const last = controls.at(-1)
        if (!first) { event.preventDefault(); dialogRef.current?.focus(); return }
        if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
          event.preventDefault(); last?.focus()
        } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialogRef.current)) {
          event.preventDefault(); first.focus()
        }
      }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto overscroll-contain rounded-xl border border-mesa-border bg-white p-5 text-mesa-text shadow-lg backdrop:bg-slate-950/40 sm:p-6"
    >
      <form className="space-y-5" aria-busy={submitting} onSubmit={(event) => { event.preventDefault(); void confirm() }}>
        <h2 id={`${id}-title`} className="text-xl font-semibold">{title}</h2>
        <p id={`${id}-description`} className="text-sm leading-relaxed wrap-anywhere text-mesa-muted">{description}</p>
        {children && (
          <fieldset disabled={submitting} className="min-w-0 space-y-4">
            {children}
          </fieldset>
        )}
        <div className="flex flex-col-reverse gap-3 border-t border-mesa-border pt-4 sm:flex-row sm:justify-end">
          <button ref={cancelRef} type="button" className="mesa-button-secondary" disabled={submitting} onClick={cancel}>Cancelar</button>
          <Button type="submit" variant={danger ? 'danger' : 'primary'} disabled={confirmDisabled || submitting} loading={submitting} loadingText={loadingText}>{confirmText}</Button>
        </div>
      </form>
    </dialog>
  )
}
