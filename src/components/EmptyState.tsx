import type { ReactNode } from 'react'

export default function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div role="status" className="mesa-empty-state">
      <svg aria-hidden="true" className="mx-auto mb-3 size-9 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 8h8M8 12h8M8 16h4" />
      </svg>
      <p className="mx-auto max-w-xl">{children}</p>
    </div>
  )
}
