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

export default function Alert({ variant = 'error', title, role, className = '', children, ...props }: AlertProps) {
  return (
    <div
      {...props}
      role={role ?? (variant === 'error' || variant === 'warning' ? 'alert' : 'status')}
      className={`rounded-xl border p-4 text-sm leading-relaxed wrap-anywhere ${variants[variant]} ${className}`}
    >
      {title && <p className="mb-1 font-semibold">{title}</p>}
      {children}
    </div>
  )
}
