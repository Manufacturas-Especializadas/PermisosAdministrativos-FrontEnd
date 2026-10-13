import Alert from './Alert'

interface ImportResultProps {
  processed: number
  created: number
  ignored: number
  errors: readonly string[]
}

export default function ImportResult({ processed, created, ignored, errors }: ImportResultProps) {
  const statistics = [
    { label: 'Procesados', value: processed },
    { label: 'Creados', value: created },
    { label: 'Ignorados', value: ignored },
    { label: 'Errores', value: errors.length },
  ]

  return (
    <div className="min-w-0 space-y-4">
      <Alert variant="success" title="Importación completada.">
        <dl className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {statistics.map(({ label, value }) => (
            <div key={label} className="min-w-0 rounded-lg border border-mesa-border bg-white p-4 text-mesa-text">
              <dt className="text-sm text-mesa-muted">{label}</dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums wrap-anywhere">{value}</dd>
            </div>
          ))}
        </dl>
      </Alert>
      {errors.length > 0 && (
        <Alert variant="warning" title="Se encontraron errores en algunas filas:">
          <ul className="list-disc space-y-2 pl-5">
            {errors.map((message, index) => (
              <li key={index} className="whitespace-pre-wrap wrap-anywhere">{message}</li>
            ))}
          </ul>
        </Alert>
      )}
    </div>
  )
}
