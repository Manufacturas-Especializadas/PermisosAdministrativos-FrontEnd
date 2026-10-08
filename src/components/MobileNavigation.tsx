import { useEffect, useRef, type ReactNode } from 'react'
import AppNavigation, { type NavigationItem } from './AppNavigation'
import BrandLogo from './BrandLogo'

interface MobileNavigationProps {
  open: boolean
  onClose: () => void
  items: NavigationItem[]
  children: ReactNode
}

export default function MobileNavigation({ open, onClose, items, children }: MobileNavigationProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!open || !dialog) return

    dialog.showModal()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const desktop = window.matchMedia('(min-width: 80rem)')
    const handleResize = () => { if (desktop.matches) onClose() }
    desktop.addEventListener('change', handleResize)
    handleResize()

    return () => {
      desktop.removeEventListener('change', handleResize)
      document.body.style.overflow = previousOverflow
      dialog.close()
    }
  }, [open, onClose])

  return (
    <dialog
      ref={dialogRef}
      id="mobile-navigation"
      aria-labelledby="mobile-navigation-title"
      aria-modal="true"
      className="mesa-drawer"
      onCancel={(event) => { event.preventDefault(); onClose() }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose() }}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)'))
        const first = controls[0]
        const last = controls.at(-1)
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }}
    >
      <div className="mesa-drawer-panel flex h-full min-w-0 flex-col overflow-y-auto overscroll-contain bg-white p-4 text-mesa-text">
        <div className="mb-5 flex items-center justify-between gap-3">
          <BrandLogo />
          <button type="button" className="mesa-button-secondary" onClick={onClose} autoFocus>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 6 12 12M18 6 6 18" /></svg>
            Cerrar
          </button>
        </div>
        <p id="mobile-navigation-title" className="mb-4 text-lg font-semibold">Permisos Administrativos</p>
        <AppNavigation items={items} onNavigate={onClose} />
        <div className="mt-auto border-t border-mesa-border pt-4">
          {children}
        </div>
      </div>
    </dialog>
  )
}
