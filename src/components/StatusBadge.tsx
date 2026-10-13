type StatusBadgeProps =
  | { isActive: boolean; label?: never; tone?: never }
  | { isActive?: never; label: string; tone: 'success' | 'neutral' | 'warning' | 'info' | 'error' }

const tones = {
  success: { badge: 'border-green-200 bg-green-50 text-mesa-success', dot: 'bg-mesa-success' },
  neutral: { badge: 'border-mesa-border bg-mesa-canvas text-mesa-muted', dot: 'bg-mesa-muted' },
  warning: { badge: 'border-amber-200 bg-amber-50 text-mesa-warning', dot: 'bg-mesa-warning' },
  info: { badge: 'border-sky-200 bg-mesa-selection text-mesa-primary', dot: 'bg-mesa-primary' },
  error: { badge: 'border-red-200 bg-red-50 text-mesa-error', dot: 'bg-mesa-error' },
}

export default function StatusBadge(props: StatusBadgeProps) {
  const tone = props.isActive !== undefined ? (props.isActive ? 'success' : 'neutral') : props.tone
  const label = props.isActive !== undefined ? (props.isActive ? 'Activo' : 'Inactivo') : props.label

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${tones[tone].badge}`}>
      <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${tones[tone].dot}`} />
      {label}
    </span>
  )
}
