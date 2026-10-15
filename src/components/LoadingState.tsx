import type { ReactNode } from 'react'

export function Spinner() {
  return (
    <svg aria-hidden="true" className="size-4 shrink-0 motion-safe:animate-spin" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
      <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

export default function LoadingState({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  return (
    <div role="status" className={compact
      ? 'flex items-center gap-2 py-2 text-sm text-mesa-muted'
      : 'mesa-card flex min-h-40 items-center justify-center gap-3 text-sm text-mesa-muted'}>
      <Spinner />
      <span>{children}</span>
    </div>
  )
}
