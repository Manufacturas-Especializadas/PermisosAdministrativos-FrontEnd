import type { ButtonHTMLAttributes } from 'react'
import { Spinner } from './LoadingState'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'danger-outline'
  loading?: boolean
  loadingText?: string
}

const variants = {
  primary: 'border-transparent bg-mesa-primary text-white enabled:hover:bg-mesa-hover',
  secondary: 'border-slate-300 bg-white text-mesa-text enabled:hover:border-slate-400 enabled:hover:bg-mesa-canvas',
  danger: 'border-transparent bg-mesa-error text-white enabled:hover:bg-red-800',
  'danger-outline': 'border-red-300 bg-white text-mesa-error enabled:hover:bg-red-50',
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
      className={`mesa-focus inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm leading-5 font-semibold motion-safe:transition-colors enabled:cursor-pointer disabled:cursor-not-allowed disabled:border-mesa-border disabled:bg-mesa-canvas disabled:text-mesa-muted ${variants[variant]} ${className}`}
    >
      {loading && <Spinner />}
      {loading && loadingText ? loadingText : children}
    </button>
  )
}
