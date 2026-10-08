import { isAxiosError } from 'axios'
import { useRef, useState } from 'react'
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
    <section aria-labelledby="import-departments-title" className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 id="import-departments-title" className="text-lg font-semibold text-slate-900">Importar departamentos</h2>
        <p className="mt-1 text-sm text-slate-600">Importa departamentos desde un archivo Excel.</p>
      </div>
      <form onSubmit={(event) => { event.preventDefault(); void handleImport() }} aria-busy={importDepartments.isPending}>
        <fieldset disabled={importDepartments.isPending} className="min-w-0 space-y-4">
          <legend className="sr-only">Archivo de departamentos</legend>
          <div className="space-y-2">
            <label htmlFor="department-import-file" className="block text-sm font-medium text-slate-700">Archivo Excel</label>
            <input
              ref={fileInput}
              id="department-import-file"
              type="file"
              accept=".xlsx"
              disabled={importDepartments.isPending}
              aria-describedby="department-import-help"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null)
                setFileError('')
                importDepartments.reset()
              }}
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1 focus-visible:outline-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
            <p id="department-import-help" className="text-sm text-slate-500">Archivo .xlsx con una única columna: Departamento. Ejemplos: Calidad, Producción y Mantenimiento.</p>
            {file && <p className="text-sm wrap-anywhere text-slate-600">Archivo seleccionado: {file.name}</p>}
          </div>
          <button
            type="submit"
            disabled={!file || importDepartments.isPending}
            className="min-h-11 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {importDepartments.isPending ? 'Importando...' : 'Importar departamentos'}
          </button>
        </fieldset>
      </form>
      {fileError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{fileError}</p>}
      {importDepartments.isError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{getImportError(importDepartments.error)}</p>}
      {importDepartments.isSuccess && (
        <div className="space-y-3">
          <div role="status" className="space-y-1 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            <p className="font-medium">Importación completada.</p>
            <p>Procesados: {importDepartments.data.processed}</p>
            <p>Creados: {importDepartments.data.created}</p>
            <p>Ignorados: {importDepartments.data.ignored}</p>
            <p>Errores: {importDepartments.data.errors.length}</p>
          </div>
          {importDepartments.data.errors.length > 0 && (
            <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-medium">Se encontraron errores en algunas filas:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {importDepartments.data.errors.map((message, index) => <li key={index} className="wrap-anywhere">{message}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>

  )
}
