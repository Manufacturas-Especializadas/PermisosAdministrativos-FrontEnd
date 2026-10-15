import { isAxiosError } from 'axios'
import { useRef, useState } from 'react'
import Alert from '../../../components/Alert'
import Button from '../../../components/Button'
import ImportResult from '../../../components/ImportResult'
import { useImportDepartments } from '../hooks/useImportDepartments'

function getImportError(error: unknown): string {
  if (isAxiosError<string | { title?: unknown }>(error)) {
    if (error.response?.status === 401) return 'Tu sesión ha expirado. Vuelve a iniciar sesión.'
    const data = error.response?.data
    const message = typeof data === 'string' ? data : data?.title
    if (error.response?.status === 400 && typeof message === 'string' && message.trim()) {
      return message.trim()
    }
  }
  return 'No se pudo importar el archivo. Inténtalo nuevamente.'
}

export default function ImportDepartments() {
  const importDepartments = useImportDepartments()
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)
  const importing = useRef(false)

  async function handleImport() {
    if (importing.current) return
    importDepartments.reset()
    const message = !file
      ? 'Selecciona un archivo Excel.'
      : !file.name.toLowerCase().endsWith('.xlsx')
        ? 'Solo se permiten archivos .xlsx.'
        : ''
    setFileError(message)
    if (message || !file) return

    importing.current = true
    try {
      await importDepartments.mutateAsync(file)
      setFile(null)
      if (fileInput.current) fileInput.current.value = ''
    } catch {
      // Conserva el archivo para reintentar; la mutation expone el error HTTP.
    } finally {
      importing.current = false
    }
  }

  return (
    <section aria-labelledby="import-departments-title" className="mesa-card space-y-4 text-mesa-text">
      <div>
        <h2 id="import-departments-title" className="text-lg font-semibold">Importar departamentos</h2>
        <p className="mt-1 text-sm text-mesa-muted">Importa departamentos desde un archivo Excel.</p>
      </div>
      <form onSubmit={(event) => { event.preventDefault(); void handleImport() }} aria-busy={importDepartments.isPending}>
        <fieldset disabled={importDepartments.isPending} className="min-w-0 space-y-4">
          <legend className="sr-only">Archivo de departamentos</legend>
          <div className="min-w-0 space-y-2">
            <label htmlFor="department-import-file" className="block text-sm font-medium">Archivo Excel</label>
            <input
              ref={fileInput}
              id="department-import-file"
              type="file"
              accept=".xlsx"
              disabled={importDepartments.isPending}
              aria-invalid={!!fileError}
              aria-describedby={`department-import-help${fileError ? ' department-import-error' : ''}`}
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null)
                setFileError('')
                importDepartments.reset()
              }}
              className="mesa-input min-w-0 max-w-full file:mr-3 file:rounded-md file:border-0 file:bg-mesa-canvas file:px-3 file:py-2 file:text-sm file:font-medium file:text-mesa-text"
            />
            <p id="department-import-help" className="text-sm wrap-anywhere text-mesa-muted">Archivo .xlsx de hasta 5 MB con una única columna: Departamento. Ejemplos: Calidad, Producción y Mantenimiento.</p>
            {file && <p className="text-sm wrap-anywhere text-mesa-muted">Archivo seleccionado: {file.name}</p>}
          </div>
          <Button type="submit" disabled={!file || importDepartments.isPending} loading={importDepartments.isPending} className="w-full md:w-auto">
            {importDepartments.isPending ? 'Importando...' : 'Importar departamentos'}
          </Button>
        </fieldset>
      </form>
      <p role="status" className="sr-only">{importDepartments.isPending ? 'Importando departamentos...' : ''}</p>
      {fileError && <Alert id="department-import-error">{fileError}</Alert>}
      {importDepartments.isError && <Alert>{getImportError(importDepartments.error)}</Alert>}
      {importDepartments.isSuccess && <ImportResult {...importDepartments.data} />}
    </section>
  )
}
