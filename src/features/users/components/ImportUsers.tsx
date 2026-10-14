import { isAxiosError } from 'axios'
import { useRef, useState } from 'react'
import Alert from '../../../components/Alert'
import Button from '../../../components/Button'
import ImportResult from '../../../components/ImportResult'
import { useImportUsers } from '../hooks/useImportUsers'

const maxFileSize = 5 * 1024 * 1024

function getImportErrors(error: unknown): string[] {
  if (isAxiosError<string | { detail?: unknown; title?: unknown; errors?: unknown }>(error)) {
    const status = error.response?.status
    if (status === 401) return ['Tu sesión ha expirado. Vuelve a iniciar sesión.']
    if (status === 403) return ['No tienes permisos para importar usuarios.']

    if (status === 400) {
      const data = error.response?.data
      if (typeof data === 'string' && data.trim()) return [data.trim()]
      if (data && typeof data === 'object') {
        const fieldErrors = data.errors && typeof data.errors === 'object'
          ? Object.values(data.errors).flat()
          : []
        const messages = [data.detail, ...fieldErrors]
          .filter((message): message is string => typeof message === 'string' && !!message.trim())
        if (messages.length > 0) return messages
        if (typeof data.title === 'string' && data.title.trim()) return [data.title.trim()]
      }
      return ['No se pudo procesar el archivo. Revisa el formato e inténtalo nuevamente.']
    }
  }
  return ['No se pudo completar la importación. Inténtalo nuevamente.']
}

function formatFileSize(size: number): string {
  if (size < 1024) return size.toLocaleString('es-MX') + ' bytes'
  const unit = size < 1024 * 1024 ? 1024 : 1024 * 1024
  return (size / unit).toLocaleString('es-MX', { maximumFractionDigits: 2 })
    + (unit === 1024 ? ' KB' : ' MB')
}

export default function ImportUsers() {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState('')
  const importUsers = useImportUsers()
  const fileInput = useRef<HTMLInputElement>(null)
  const importing = useRef(false)

  function closePanel() {
    if (importing.current) return
    setOpen(false)
    setFile(null)
    setFileError('')
    importUsers.reset()
    if (fileInput.current) fileInput.current.value = ''
    document.getElementById('user-import-action')?.focus()
  }

  async function handleImport() {
    if (importing.current) return
    importUsers.reset()
    const message = !file
      ? 'Selecciona un archivo Excel.'
      : !file.name.toLowerCase().endsWith('.xlsx')
        ? 'Solo se permiten archivos .xlsx.'
        : file.size === 0
          ? 'El archivo está vacío.'
          : file.size > maxFileSize
            ? 'El archivo no puede superar los 5 MB.'
            : ''
    setFileError(message)
    if (message || !file) return

    importing.current = true
    try {
      await importUsers.mutateAsync(file)
      setFile(null)
      if (fileInput.current) fileInput.current.value = ''
    } catch {
      // Conserva el archivo para reintentar; la mutation expone el error HTTP.
    } finally {
      importing.current = false
    }
  }

  return (
    <div className="min-w-0 space-y-4">
      <Button
        id="user-import-action"
        variant="secondary"
        aria-expanded={open}
        aria-controls="import-users-panel"
        disabled={importUsers.isPending}
        onClick={() => { if (open) closePanel(); else setOpen(true) }}
        className="w-full md:w-auto"
      >
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
          <path d={open ? 'm6 15 6-6 6 6' : 'm6 9 6 6 6-6'} />
        </svg>
        Importar usuarios
      </Button>

      <section
        id="import-users-panel"
        hidden={!open}
        aria-labelledby="import-users-title"
        className="min-w-0 space-y-4 rounded-xl border border-mesa-border bg-white p-4 text-mesa-text md:p-6"
      >
        <div>
          <h2 id="import-users-title" className="text-lg font-semibold">Importar usuarios</h2>
          <p className="mt-1 text-sm text-mesa-muted">Selecciona un Excel con las columnas NumeroNomina y Rol.</p>
        </div>
        <form noValidate onSubmit={(event) => { event.preventDefault(); void handleImport() }} aria-busy={importUsers.isPending}>
          <fieldset disabled={importUsers.isPending} className="min-w-0 space-y-4">
            <legend className="sr-only">Archivo de usuarios</legend>
            <div className="min-w-0 space-y-2">
              <label htmlFor="user-import-file" className="block text-sm font-medium">Archivo Excel</label>
              <input
                ref={fileInput}
                id="user-import-file"
                type="file"
                accept=".xlsx"
                disabled={importUsers.isPending}
                aria-invalid={!!fileError}
                aria-describedby={'user-import-help' + (fileError ? ' user-import-error' : '')}
                onChange={(event) => {
                  setFile(event.target.files?.[0] ?? null)
                  setFileError('')
                  importUsers.reset()
                }}
                className="mesa-input min-w-0 max-w-full file:mr-3 file:rounded-md file:border-0 file:bg-mesa-canvas file:px-3 file:py-2 file:text-sm file:font-medium file:text-mesa-text"
              />
              <p id="user-import-help" className="text-sm text-mesa-muted">Archivo .xlsx de hasta 5 MB. No incluyas contraseñas.</p>
              {file && (
                <dl className="space-y-1 text-sm wrap-anywhere text-mesa-muted">
                  <div><dt className="inline font-medium">Archivo: </dt><dd className="inline">{file.name}</dd></div>
                  <div><dt className="inline font-medium">Tamaño: </dt><dd className="inline">{formatFileSize(file.size)}</dd></div>
                </dl>
              )}
            </div>
            <div className="flex flex-col gap-3 md:flex-row">
              <Button type="submit" disabled={!file || importUsers.isPending} loading={importUsers.isPending} className="w-full md:w-auto">
                {importUsers.isPending ? 'Importando...' : 'Importar'}
              </Button>
              <Button variant="secondary" disabled={importUsers.isPending} onClick={closePanel} className="w-full md:w-auto">
                {importUsers.isSuccess ? 'Cerrar' : 'Cancelar'}
              </Button>
            </div>
          </fieldset>
        </form>
        <p role="status" className="sr-only">{importUsers.isPending ? 'Importando usuarios...' : ''}</p>
        {fileError && <Alert id="user-import-error">{fileError}</Alert>}
        {importUsers.isError && (
          <Alert title="No se completó la importación">
            <ul className="list-disc space-y-1 pl-5">
              {getImportErrors(importUsers.error).map((message, index) => (
                <li key={index} className="whitespace-pre-wrap wrap-anywhere">{message}</li>
              ))}
            </ul>
          </Alert>
        )}
        {importUsers.isSuccess && <ImportResult {...importUsers.data} />}
      </section>
    </div>
  )
}
