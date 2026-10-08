import { isAxiosError } from 'axios'
import Alert from '../components/Alert'
import Button from '../components/Button'
import TableContainer from '../components/TableContainer'
import { useEffect, useRef, useState } from 'react'
import { useApprovePersonalPermit } from '../features/personalPermits/hooks/useApprovePersonalPermit'
import { usePendingPersonalPermits } from '../features/personalPermits/hooks/usePendingPersonalPermits'
import { useRejectPersonalPermit } from '../features/personalPermits/hooks/useRejectPersonalPermit'
import { getPersonalPermitReviewError } from '../features/personalPermits/personalPermit.errors'
import { formatPermitDate, permitTypeLabels } from '../features/personalPermits/personalPermit.format'
import type { PendingPersonalPermit } from '../features/personalPermits/personalPermit.types'

export default function PendingPermitsPage() {
  const { data, isPending, isFetching, isError, error } = usePendingPersonalPermits()
  const approvePermit = useApprovePersonalPermit()
  const rejectPermit = useRejectPersonalPermit()
  const [selectedPermit, setSelectedPermit] = useState<PendingPersonalPermit | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [processing, setProcessing] = useState<Partial<Record<number, 'approve' | 'reject'>>>({})
  const [reviewErrors, setReviewErrors] = useState<Partial<Record<number, string>>>({})
  // Una mutation puede tener varias peticiones simultáneas; el bloqueo es por permiso.
  const processingIds = useRef(new Set<number>())
  const dialogRef = useRef<HTMLDialogElement>(null)
  const reasonRef = useRef<HTMLTextAreaElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const focusedPermitId = useRef<number | null>(null)
  const sessionExpired = isAxiosError(error) && error.response?.status === 401
  const isRejecting = selectedPermit !== null && processing[selectedPermit.id] === 'reject'

  // Recupera el foco solo si el registro enfocado desaparece; no interrumpe al usuario ni al dialogo.
  useEffect(() => {
    if (
      data && focusedPermitId.current !== null &&
      !data.some((permit) => permit.id === focusedPermitId.current) &&
      !dialogRef.current?.open && document.activeElement === document.body
    ) {
      titleRef.current?.focus()
      focusedPermitId.current = null
    }
  }, [data])

  useEffect(() => {
    const dialog = dialogRef.current
    const title = titleRef.current
    if (!selectedPermit || !dialog) return

    dialog.showModal()
    reasonRef.current?.focus()

    return () => {
      dialog.close()
      if (document.activeElement === document.body) title?.focus()
    }
  }, [selectedPermit])

  function clearReviewError(permitId: number) {
    setReviewErrors((current) => {
      const next = { ...current }
      delete next[permitId]
      return next
    })
  }

  function closeRejectionDialog() {
    if (selectedPermit && processingIds.current.has(selectedPermit.id)) return
    setSelectedPermit(null)
    setRejectionReason('')
    rejectPermit.reset()
  }

  async function reviewPermit(permit: PendingPersonalPermit, action: 'approve' | 'reject') {
    if (processingIds.current.has(permit.id)) return
    const reason = rejectionReason.trim()
    if (action === 'reject' && (!reason || rejectionReason.length > 500)) return

    processingIds.current.add(permit.id)
    setProcessing((current) => ({ ...current, [permit.id]: action }))
    clearReviewError(permit.id)

    try {
      if (action === 'approve') {
        await approvePermit.mutateAsync(permit.id)
      } else {
        await rejectPermit.mutateAsync({ permitId: permit.id, request: { reason } })
        setSelectedPermit(null)
        setRejectionReason('')
        rejectPermit.reset()
      }
    } catch (reviewError) {
      const message = getPersonalPermitReviewError(reviewError, action)
      setReviewErrors((current) => ({
        ...current,
        [permit.id]: `${permit.employeeName} (nómina ${permit.payrollNumber}): ${message}`,
      }))
    } finally {
      processingIds.current.delete(permit.id)
      setProcessing((current) => {
        const next = { ...current }
        delete next[permit.id]
        return next
      })
    }
  }

  function renderActions(permit: PendingPersonalPermit) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-1 md:gap-2">
        <Button
          aria-label={`Aprobar permiso de ${permit.employeeName}, nómina ${permit.payrollNumber}, solicitud ${permit.id}`}
          disabled={!!processing[permit.id]}
          loading={processing[permit.id] === 'approve'}
          loadingText="Aprobando..."
          onClick={() => void reviewPermit(permit, 'approve')}
        >
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m5 12 4 4L19 6" /></svg>
          Aprobar
        </Button>
        <Button
          variant="danger-outline"
          aria-label={`Rechazar permiso de ${permit.employeeName}, nómina ${permit.payrollNumber}, solicitud ${permit.id}`}
          disabled={!!processing[permit.id]}
          loading={processing[permit.id] === 'reject'}
          loadingText="Rechazando..."
          onClick={() => {
            clearReviewError(permit.id)
            setRejectionReason('')
            setSelectedPermit(permit)
          }}
        >
          Rechazar
        </Button>
      </div>
    )
  }

  return (
    <section
      aria-labelledby="pending-permits-title"
      className="min-w-0 space-y-5 text-mesa-text md:space-y-6"
      onFocusCapture={(event) => {
        const record = event.target.closest<HTMLElement>('[data-permit-id]')
        focusedPermitId.current = record ? Number(record.dataset.permitId) : null
      }}
    >
      <div className="space-y-2">
        <p className="text-sm font-semibold text-mesa-primary">Revisión de Recursos Humanos</p>
        <h1 id="pending-permits-title" ref={titleRef} tabIndex={-1} className="mesa-focus text-2xl font-semibold tracking-tight md:text-3xl">
          Permisos pendientes
        </h1>
        <p className="max-w-3xl text-base leading-relaxed text-mesa-muted">
          Revisa el empleado, la fecha y el motivo antes de aprobar o rechazar cada solicitud.
        </p>
      </div>

      <div className="min-h-6 text-sm text-mesa-muted" role="status" aria-live="polite" aria-atomic="true">
        {isFetching
          ? isPending
            ? 'Cargando permisos pendientes...'
            : 'Actualizando permisos pendientes...'
          : isPending
            ? 'Esperando conexión para cargar los permisos pendientes...'
            : data && !isError
              ? `${data.length} ${data.length === 1 ? 'solicitud pendiente de revisión' : 'solicitudes pendientes de revisión'}.`
              : null}
      </div>

      {Object.entries(reviewErrors).map(([permitId, message]) => (
        <Alert key={permitId} title="No se pudo completar la acción">{message}</Alert>
      ))}

      {isError && (
        <Alert
          variant={!sessionExpired && data ? 'warning' : 'error'}
          title={sessionExpired ? 'Sesión expirada' : data ? 'No se pudo actualizar la información' : 'No se pudieron cargar los permisos'}
        >
          {sessionExpired
            ? 'Tu sesión ha expirado. Vuelve a iniciar sesión para consultar los permisos pendientes.'
            : data
              ? 'Los datos mostrados corresponden a la última consulta correcta. Existe un problema actualizando la información.'
              : 'No se pudieron cargar los permisos pendientes. Inténtalo de nuevo más tarde.'}
        </Alert>
      )}

      {isPending ? (
        <div className="space-y-4 rounded-xl border border-mesa-border bg-white p-5 md:p-6" aria-busy="true">
          <div aria-hidden="true" className="space-y-4">
            <div className="h-5 w-2/5 rounded bg-slate-100" />
            <div className="h-4 w-3/4 rounded bg-slate-100" />
            <div className="h-4 w-1/2 rounded bg-slate-100" />
          </div>
        </div>
      ) : !data || sessionExpired ? null : data.length === 0 ? (
        <div role="status" className="space-y-2 rounded-xl border border-mesa-border bg-white p-6 md:p-8">
          <h2 className="text-lg font-semibold">{isError ? 'Sin solicitudes en la última consulta correcta' : 'No hay permisos pendientes de revisión.'}</h2>
          <p className="text-sm leading-relaxed text-mesa-muted">
            {isError ? 'No se ha podido comprobar si hay nuevas solicitudes.' : 'Las solicitudes pendientes se mostrarán aquí para que RH pueda revisarlas.'}
          </p>
        </div>
      ) : (
        <>
          <div className="md:hidden" role="region" aria-label="Solicitudes pendientes" aria-busy={isFetching}>
            <ul className="space-y-4">
              {data.map((permit) => (
                <li key={permit.id} data-permit-id={permit.id} className="min-w-0 rounded-xl border border-mesa-border bg-white p-4">
                  <article aria-labelledby={`permit-mobile-${permit.id}`} className="space-y-4">
                    <div className="sticky top-0 z-10 space-y-1 border-b border-mesa-border bg-white py-2">
                      <p className="text-sm text-mesa-muted">Solicitud #{permit.id}</p>
                      <h2 id={`permit-mobile-${permit.id}`} className="text-lg leading-snug font-semibold wrap-anywhere">{permit.employeeName}</h2>
                      <p className="text-sm wrap-anywhere text-mesa-muted">Nómina: <span className="font-medium text-mesa-text">{permit.payrollNumber}</span></p>
                    </div>
                    <dl className="space-y-2 rounded-lg bg-mesa-canvas p-3 text-sm">
                      <div className="flex flex-wrap justify-between gap-x-4 gap-y-1"><dt className="text-mesa-muted">Fecha</dt><dd className="font-medium">{formatPermitDate(permit.permitDate)}</dd></div>
                      <div className="flex flex-wrap justify-between gap-x-4 gap-y-1"><dt className="text-mesa-muted">Hora de salida</dt><dd className="font-medium">{permit.exitTime.slice(0, 5)}</dd></div>
                      <div className="flex flex-wrap justify-between gap-x-4 gap-y-1"><dt className="text-mesa-muted">Tipo</dt><dd className="font-medium">{permitTypeLabels[permit.permitType]}</dd></div>
                    </dl>
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold">Motivo</h3>
                      <p className="text-base leading-relaxed whitespace-pre-wrap wrap-anywhere text-mesa-muted">{permit.reason}</p>
                    </div>
                    <div className="border-t border-mesa-border pt-4">{renderActions(permit)}</div>
                  </article>
                </li>
              ))}
            </ul>
          </div>

          <TableContainer label="Listado de permisos pendientes" busy={isFetching} className="hidden md:block">
            <table className="w-full min-w-192 table-fixed text-left text-sm">
              <caption className="sr-only">Permisos pendientes: identidad del empleado, información del permiso, motivo y acciones</caption>
              <thead className="border-b border-mesa-border bg-mesa-canvas text-mesa-muted">
                <tr>
                  <th scope="col" className="w-[26%] px-4 py-4 font-semibold">Empleado</th>
                  <th scope="col" className="w-[21%] px-4 py-4 font-semibold">Permiso</th>
                  <th scope="col" className="w-[33%] px-4 py-4 font-semibold">Motivo</th>
                  <th scope="col" className="w-[20%] px-4 py-4 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mesa-border">
                {data.map((permit) => (
                  <tr key={permit.id} data-permit-id={permit.id} className="align-top">
                    <th scope="row" className="space-y-2 px-4 py-5 font-normal">
                      <p className="text-base leading-snug font-semibold wrap-anywhere">{permit.employeeName}</p>
                      <p className="wrap-anywhere text-mesa-muted">Nómina: <span className="font-medium text-mesa-text">{permit.payrollNumber}</span></p>
                    </th>
                    <td className="space-y-3 px-4 py-5">
                      <p className="text-mesa-muted">Solicitud #{permit.id}</p>
                      <dl className="space-y-2">
                        <div><dt className="text-mesa-muted">Fecha</dt><dd className="font-medium">{formatPermitDate(permit.permitDate)}</dd></div>
                        <div><dt className="text-mesa-muted">Hora de salida</dt><dd className="font-medium">{permit.exitTime.slice(0, 5)}</dd></div>
                        <div><dt className="text-mesa-muted">Tipo</dt><dd className="font-medium">{permitTypeLabels[permit.permitType]}</dd></div>
                      </dl>
                    </td>
                    <td className="px-4 py-5 text-base leading-relaxed whitespace-pre-wrap wrap-anywhere text-mesa-muted">{permit.reason}</td>
                    <td className="px-4 py-5">{renderActions(permit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableContainer>
        </>
      )}

      <dialog
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reject-permit-title"
        aria-describedby="reject-permit-description"
        onCancel={(event) => {
          event.preventDefault()
          closeRejectionDialog()
        }}
        className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto overscroll-contain rounded-2xl border border-mesa-border bg-white p-4 text-mesa-text shadow-xl backdrop:bg-slate-950/50 sm:p-6"
      >
        {selectedPermit && (
          <form
            className="space-y-5"
            aria-busy={isRejecting}
            onSubmit={(event) => {
              event.preventDefault()
              void reviewPermit(selectedPermit, 'reject')
            }}
          >
            <h2 id="reject-permit-title" className="text-xl font-semibold text-mesa-error">Rechazar permiso</h2>
            <p id="reject-permit-description" className="rounded-lg border border-mesa-border bg-mesa-canvas p-3 text-base leading-relaxed wrap-anywhere text-mesa-text">
              Permiso de <strong>{selectedPermit.employeeName}</strong>, nómina {selectedPermit.payrollNumber},
              {' '}del {formatPermitDate(selectedPermit.permitDate)} a las {selectedPermit.exitTime.slice(0, 5)}.
            </p>
            <div className="space-y-2">
              <label htmlFor="rejection-reason" className="block text-sm font-semibold text-mesa-text">
                Motivo del rechazo (obligatorio)
              </label>
              <textarea
                id="rejection-reason"
                ref={reasonRef}
                required
                maxLength={500}
                rows={4}
                value={rejectionReason}
                disabled={isRejecting}
                aria-describedby="rejection-reason-count"
                onChange={(event) => setRejectionReason(event.target.value)}
                className="mesa-input min-h-36 resize-y"
              />
              <p id="rejection-reason-count" className="text-sm text-mesa-muted">
                {rejectionReason.length}/500 caracteres
              </p>
            </div>
            {reviewErrors[selectedPermit.id] && (
              <Alert>{reviewErrors[selectedPermit.id]}</Alert>
            )}
            <div className="flex flex-col gap-3 border-t border-mesa-border pt-4 sm:flex-row sm:justify-end">
              <Button
                variant="secondary"
                type="button"
                disabled={isRejecting}
                onClick={closeRejectionDialog}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                type="submit"
                disabled={isRejecting || !rejectionReason.trim() || rejectionReason.length > 500}
              >
                {isRejecting ? 'Rechazando...' : 'Rechazar permiso'}
              </Button>
            </div>
          </form>
        )}
      </dialog>
    </section>
  )
}
