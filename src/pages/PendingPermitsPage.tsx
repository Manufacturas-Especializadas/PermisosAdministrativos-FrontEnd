import { isAxiosError } from 'axios'
import { useEffect, useRef, useState } from 'react'
import { useApprovePersonalPermit } from '../features/personalPermits/hooks/useApprovePersonalPermit'
import { usePendingPersonalPermits } from '../features/personalPermits/hooks/usePendingPersonalPermits'
import { useRejectPersonalPermit } from '../features/personalPermits/hooks/useRejectPersonalPermit'
import { getPersonalPermitReviewError } from '../features/personalPermits/personalPermit.errors'
import type { PendingPersonalPermit, PersonalPermitType } from '../features/personalPermits/personalPermit.types'

const permitTypeLabels: Record<PersonalPermitType, string> = {
  1: 'Salir',
  2: 'Personal',
  3: 'Comer',
  4: 'IMSS',
  5: 'Banco',
}

function formatPermitDate(permitDate: string): string {
  const [year, month, day] = permitDate.split('-')
  return `${day}/${month}/${year}`
}

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
  const sessionExpired = isAxiosError(error) && error.response?.status === 401
  const isRejecting = selectedPermit !== null && processing[selectedPermit.id] === 'reject'

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

  return (
    <section aria-labelledby="pending-permits-title" className="space-y-6">
      <div>
        <h1
          id="pending-permits-title"
          ref={titleRef}
          tabIndex={-1}
          className="text-3xl font-semibold tracking-tight text-slate-950"
        >
          Permisos pendientes
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Consulta los permisos personales pendientes de revisión por Recursos Humanos.
        </p>
      </div>

      <div className="min-h-6 text-sm text-slate-600" role="status" aria-live="polite">
        {isFetching
          ? isPending
            ? 'Cargando permisos pendientes...'
            : 'Actualizando permisos pendientes...'
          : isPending
            ? 'Esperando conexión para cargar los permisos pendientes...'
            : null}
      </div>

      {Object.entries(reviewErrors).map(([permitId, message]) => (
        <p key={permitId} role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {message}
        </p>
      ))}

      {isError && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {sessionExpired
            ? 'Tu sesión ha expirado. Vuelve a iniciar sesión para consultar los permisos pendientes.'
            : 'No se pudieron cargar los permisos pendientes. Inténtalo de nuevo más tarde.'}
        </p>
      )}

      {isPending ? (
        <div className="min-h-40 rounded-xl border border-slate-200 bg-white" aria-busy="true" />
      ) : !data || sessionExpired ? null : data.length === 0 ? (
        <p role="status" className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
          No hay permisos pendientes de revisión.
        </p>
      ) : (
        <div
          className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          role="region"
          aria-label="Listado de permisos pendientes"
          aria-busy={isFetching}
          tabIndex={0}
        >
          <table className="w-full min-w-220 text-left text-sm">
            <caption className="sr-only">
              Permisos pendientes: empleado, nómina, fecha, hora, tipo, motivo y acciones
            </caption>
            <thead className="border-b border-slate-200 bg-slate-100 text-slate-700">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Empleado</th>
                <th scope="col" className="px-4 py-3 font-semibold">Nómina</th>
                <th scope="col" className="px-4 py-3 font-semibold">Fecha</th>
                <th scope="col" className="px-4 py-3 font-semibold">Hora</th>
                <th scope="col" className="px-4 py-3 font-semibold">Tipo</th>
                <th scope="col" className="px-4 py-3 font-semibold">Motivo</th>
                <th scope="col" className="px-4 py-3 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.map((permit) => (
                <tr key={permit.id}>
                  <th scope="row" className="px-4 py-3 font-medium wrap-anywhere text-slate-900">
                    {permit.employeeName}
                  </th>
                  <td className="px-4 py-3 wrap-anywhere text-slate-600">{permit.payrollNumber}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                    {formatPermitDate(permit.permitDate)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                    {permit.exitTime.slice(0, 5)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{permitTypeLabels[permit.permitType]}</td>
                  <td className="px-4 py-3 whitespace-pre-wrap wrap-anywhere text-slate-600">{permit.reason}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        aria-label={`Aprobar permiso de ${permit.employeeName}`}
                        disabled={!!processing[permit.id]}
                        onClick={() => void reviewPermit(permit, 'approve')}
                        className="min-h-11 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        {processing[permit.id] === 'approve' ? 'Aprobando...' : 'Aprobar'}
                      </button>
                      <button
                        type="button"
                        aria-label={`Rechazar permiso de ${permit.employeeName}`}
                        disabled={!!processing[permit.id]}
                        onClick={() => {
                          clearReviewError(permit.id)
                          setRejectionReason('')
                          setSelectedPermit(permit)
                        }}
                        className="min-h-11 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {processing[permit.id] === 'reject' ? 'Rechazando...' : 'Rechazar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
        className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl backdrop:bg-slate-950/50"
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
            <h2 id="reject-permit-title" className="text-xl font-semibold">Rechazar permiso</h2>
            <p id="reject-permit-description" className="text-sm wrap-anywhere text-slate-600">
              Permiso de <strong>{selectedPermit.employeeName}</strong>, nómina {selectedPermit.payrollNumber},
              {' '}del {formatPermitDate(selectedPermit.permitDate)} a las {selectedPermit.exitTime.slice(0, 5)}.
            </p>
            <div className="space-y-2">
              <label htmlFor="rejection-reason" className="block text-sm font-medium text-slate-700">
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
                className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-100 disabled:bg-slate-100"
              />
              <p id="rejection-reason-count" className="text-sm text-slate-500">
                {rejectionReason.length}/500 caracteres
              </p>
            </div>
            {reviewErrors[selectedPermit.id] && (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {reviewErrors[selectedPermit.id]}
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                disabled={isRejecting}
                onClick={closeRejectionDialog}
                className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isRejecting || !rejectionReason.trim() || rejectionReason.length > 500}
                className="min-h-11 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isRejecting ? 'Rechazando...' : 'Rechazar permiso'}
              </button>
            </div>
          </form>
        )}
      </dialog>
    </section>
  )
}
