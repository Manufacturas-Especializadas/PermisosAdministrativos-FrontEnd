import type { HTMLAttributes } from 'react'

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'error' | 'warning' | 'success' | 'info'
  title?: string
}

const variants = {
  error: 'border-red-200 bg-red-50 text-mesa-error',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  success: 'border-green-200 bg-green-50 text-green-800',
  info: 'border-sky-200 bg-mesa-selection text-mesa-text',
}

const icons = {
  error: <><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6m0-6-6 6" /></>,
  warning: <><path d="m12 3 10 18H2L12 3Z" /><path d="M12 9v4m0 3h.01" /></>,
  success: <><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6m0-10h.01" /></>,
}

export default function Alert({ variant = 'error', title, role, className = '', children, ...props }: AlertProps) {
  return (
    <div
      {...props}
      role={role ?? (variant === 'error' || variant === 'warning' ? 'alert' : 'status')}
      className={`flex items-start gap-3 rounded-lg border p-4 text-sm leading-relaxed wrap-anywhere ${variants[variant]} ${className}`}
    >
      <svg aria-hidden="true" className="mt-0.5 size-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{icons[variant]}</svg>
      <div className="min-w-0 flex-1">
        {title && <p className="mb-1 font-semibold">{title}</p>}
        {children}
      </div>
    </div>
  )
}
