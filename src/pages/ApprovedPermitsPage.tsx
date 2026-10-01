import { isAxiosError } from 'axios'
import { useRef, useState } from 'react'
import { useApprovedPersonalPermits } from '../features/personalPermits/hooks/useApprovedPersonalPermits'
import { useCompletePersonalPermit } from '../features/personalPermits/hooks/useCompletePersonalPermit'
import { getPersonalPermitReviewError } from '../features/personalPermits/personalPermit.errors'
import { formatPermitDate, permitTypeLabels } from '../features/personalPermits/personalPermit.format'
import type { ApprovedPersonalPermit } from '../features/personalPermits/personalPermit.types'

export default function ApprovedPermitsPage() {
  const { data, isPending, isFetching, isError, error } = useApprovedPersonalPermits()
  const completePermit = useCompletePersonalPermit()
  const [processing, setProcessing] = useState<Partial<Record<number, boolean>>>({})
  const [completionErrors, setCompletionErrors] = useState<Partial<Record<number, string>>>({})
  // Mantiene el bloqueo por permiso incluso con varias peticiones simultáneas.
  const processingIds = useRef(new Set<number>())
  const sessionExpired = isAxiosError(error) && error.response?.status === 401

  async function registerExit(permit: ApprovedPersonalPermit) {
    if (processingIds.current.has(permit.id)) return

    processingIds.current.add(permit.id)
    setProcessing((current) => ({ ...current, [permit.id]: true }))
    setCompletionErrors((current) => {
      const next = { ...current }
      delete next[permit.id]
      return next
    })

    try {
      await completePermit.mutateAsync(permit.id)
    } catch (completionError) {
      const message = getPersonalPermitReviewError(completionError, 'complete')
      setCompletionErrors((current) => ({
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
    <section aria-labelledby="approved-permits-title" className="space-y-6">
      <div>
        <h1
          id="approved-permits-title"
          className="text-3xl font-semibold tracking-tight text-slate-950"
        >
          Salidas autorizadas
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Consulta los permisos aprobados para registrar la salida del empleado.
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Se muestran únicamente los permisos aprobados para hoy.
        </p>
      </div>

      <div className="min-h-6 text-sm text-slate-600" role="status" aria-live="polite">
        {isFetching
          ? isPending
            ? 'Cargando salidas autorizadas...'
            : 'Actualizando salidas autorizadas...'
          : isPending
            ? 'Esperando conexión para cargar las salidas autorizadas...'
            : null}
      </div>

      {Object.entries(completionErrors).map(([permitId, message]) => (
        <p key={permitId} role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {message}
        </p>
      ))}

      {isError && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {sessionExpired
            ? 'Tu sesión ha expirado. Vuelve a iniciar sesión para consultar las salidas autorizadas.'
            : 'No se pudieron cargar las salidas autorizadas. Inténtalo de nuevo más tarde.'}
        </p>
      )}

      {isPending ? (
        <div className="min-h-40 rounded-xl border border-slate-200 bg-white" aria-busy="true" />
      ) : !data || sessionExpired ? null : data.length === 0 ? (
        <p role="status" className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
          No hay permisos aprobados para registrar salidas hoy.
        </p>
      ) : (
        <div
          className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          role="region"
          aria-label="Listado de salidas autorizadas"
          aria-busy={isFetching}
          tabIndex={0}
        >
          <table className="w-full min-w-220 text-left text-sm">
            <caption className="sr-only">
              Salidas autorizadas: empleado, nómina, fecha, hora autorizada, tipo, motivo y acción
            </caption>
            <thead className="border-b border-slate-200 bg-slate-100 text-slate-700">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Empleado</th>
                <th scope="col" className="px-4 py-3 font-semibold">Nómina</th>
                <th scope="col" className="px-4 py-3 font-semibold">Fecha</th>
                <th scope="col" className="px-4 py-3 font-semibold">Hora autorizada</th>
                <th scope="col" className="px-4 py-3 font-semibold">Tipo</th>
                <th scope="col" className="px-4 py-3 font-semibold">Motivo</th>
                <th scope="col" className="px-4 py-3 font-semibold">Acción</th>
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
                    <button
                      type="button"
                      aria-label={`Registrar salida de ${permit.employeeName}`}
                      disabled={!!processing[permit.id]}
                      onClick={() => void registerExit(permit)}
                      className="min-h-11 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium whitespace-nowrap text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {processing[permit.id] ? 'Registrando...' : 'Registrar salida'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
