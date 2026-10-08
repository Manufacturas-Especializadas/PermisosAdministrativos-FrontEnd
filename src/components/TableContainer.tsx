import { useId, type ReactNode } from 'react'

interface TableContainerProps {
  label: string
  busy?: boolean
  children: ReactNode
  className?: string
}

export default function TableContainer({ label, busy, children, className = '' }: TableContainerProps) {
  const helpId = useId()

  return (
    <div className={`min-w-0 space-y-2 ${className}`}>
      <p id={helpId} className="flex items-center gap-2 text-sm text-mesa-muted">
        <span aria-hidden="true">↔</span>
        Si la tabla no cabe, desliza horizontalmente o enfoca el listado y usa las flechas.
      </p>
      <div
        role="region"
        aria-label={label}
        aria-describedby={helpId}
        aria-busy={busy}
        tabIndex={0}
        className="mesa-focus max-w-full overflow-x-auto rounded-xl border border-mesa-border bg-white"
      >
        {children}
      </div>
    </div>
  )
}
