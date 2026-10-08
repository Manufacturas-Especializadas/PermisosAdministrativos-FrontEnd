import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'danger-outline'
  loading?: boolean
  loadingText?: string
}

const variants = {
  primary: 'border-transparent bg-mesa-primary text-white hover:bg-mesa-hover',
  secondary: 'border-slate-300 bg-white text-mesa-text hover:bg-mesa-canvas',
  danger: 'border-transparent bg-mesa-error text-white hover:bg-red-800',
  'danger-outline': 'border-red-300 bg-white text-mesa-error hover:bg-red-50',
}

export default function Button({
  variant = 'primary', loading = false, loadingText, disabled, type = 'button',
  className = '', children, ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`mesa-focus inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold motion-safe:transition-colors enabled:cursor-pointer disabled:cursor-not-allowed disabled:border-mesa-border disabled:bg-mesa-border disabled:text-mesa-muted ${variants[variant]} ${className}`}
    >
      {loading && loadingText ? loadingText : children}
    </button>
  )
}
