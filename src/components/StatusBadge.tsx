interface StatusBadgeProps {
  isActive: boolean
}

export default function StatusBadge({ isActive }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${isActive ? 'border-green-200 bg-green-50 text-mesa-success' : 'border-mesa-border bg-mesa-canvas text-mesa-muted'}`}>
      <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${isActive ? 'bg-mesa-success' : 'bg-mesa-muted'}`} />
      {isActive ? 'Activo' : 'Inactivo'}
    </span>
  )
}
