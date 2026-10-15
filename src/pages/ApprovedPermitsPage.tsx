import { isAxiosError } from 'axios'
import { useRef, useState } from 'react'
import Alert from '../components/Alert'
import Button from '../components/Button'
import ConfirmationDialog from '../components/ConfirmationDialog'
import { useToast } from '../components/useToast'
import TableContainer from '../components/TableContainer'
import EmptyState from '../components/EmptyState'
import { Spinner } from '../components/LoadingState'
import { useApprovedPersonalPermits } from '../features/personalPermits/hooks/useApprovedPersonalPermits'
import { useCompletePersonalPermit } from '../features/personalPermits/hooks/useCompletePersonalPermit'
import { getPersonalPermitReviewError } from '../features/personalPermits/personalPermit.errors'
import { formatPermitDate, permitTypeLabels } from '../features/personalPermits/personalPermit.format'
import type { ApprovedPersonalPermit } from '../features/personalPermits/personalPermit.types'

export default function ApprovedPermitsPage() {
  const { data, isPending, isFetching, isError, error } = useApprovedPersonalPermits()
  const completePermit = useCompletePersonalPermit()
  const notify = useToast()
  const [selectedPermit, setSelectedPermit] = useState<ApprovedPersonalPermit | null>(null)
  const [processing, setProcessing] = useState<Partial<Record<number, boolean>>>({})
  const [completionErrors, setCompletionErrors] = useState<Partial<Record<number, string>>>({})
  // Mantiene el bloqueo por permiso incluso con varias peticiones simultáneas.
  const processingIds = useRef(new Set<number>())
  const sessionExpired = isAxiosError(error) && error.response?.status === 401

  async function registerExit(permit: ApprovedPersonalPermit) {
    if (processingIds.current.has(permit.id)) return false

    processingIds.current.add(permit.id)
    setProcessing((current) => ({ ...current, [permit.id]: true }))
    setCompletionErrors((current) => {
      const next = { ...current }
      delete next[permit.id]
      return next
    })

    try {
      await completePermit.mutateAsync(permit.id)
      notify('Salida registrada correctamente.')
      return true
    } catch (completionError) {
      const message = getPersonalPermitReviewError(completionError, 'complete')
      setCompletionErrors((current) => ({
        ...current,
        [permit.id]: `${permit.employeeName} (nómina ${permit.payrollNumber}): ${message}`,
      }))
      return false
    } finally {
      processingIds.current.delete(permit.id)
      setProcessing((current) => {
        const next = { ...current }
        delete next[permit.id]
        return next
      })
    }
  }

  const detachedErrors = Object.entries(completionErrors).filter(([permitId]) =>
    isPending || sessionExpired || !data?.some((permit) => permit.id === Number(permitId)),
  )

  return (
    <section aria-labelledby="approved-permits-title" className="min-w-0 space-y-6">
      <div className="mesa-page-header">
        <h1
          id="approved-permits-title"
          className="mesa-page-title"
        >
          Salidas autorizadas
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-mesa-muted">
          Consulta los permisos aprobados para registrar la salida del empleado.
        </p>
        <p className="mt-1 text-sm leading-relaxed text-mesa-muted">
          Se muestran únicamente los permisos aprobados para hoy.
        </p>
      </div>

      <section aria-labelledby="approved-results-title" className="min-w-0 space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:justify-between">
          <h2 id="approved-results-title" className="text-lg font-semibold text-mesa-text">Resultados</h2>
          <div
            className={isPending
              ? 'mesa-card flex min-h-40 w-full items-center justify-center gap-3 text-sm text-mesa-muted'
              : 'flex items-center gap-2 text-sm text-mesa-muted'}
            role="status"
            aria-live="polite"
          >
            {(isFetching || isPending) && <Spinner />}
            {isFetching
              ? isPending
                ? 'Cargando salidas autorizadas...'
                : 'Actualizando salidas autorizadas...'
              : isPending
                ? 'Esperando conexión para cargar las salidas autorizadas...'
                : null}
          </div>
        </div>

        {isError && (
          <Alert>
            {sessionExpired
              ? 'Tu sesión ha expirado. Vuelve a iniciar sesión para consultar las salidas autorizadas.'
              : 'No se pudieron cargar las salidas autorizadas. Inténtalo de nuevo más tarde.'}
          </Alert>
        )}

        {isPending ? null : !data || sessionExpired ? null : data.length === 0 ? (
          <EmptyState>
            No hay permisos aprobados para registrar salidas hoy.
          </EmptyState>
        ) : (
          <>
            <ul className="space-y-4 md:hidden" aria-label="Listado de salidas autorizadas" aria-busy={isFetching}>
              {data.map((permit) => (
                <li key={permit.id} className="min-w-0 space-y-4 rounded-xl border border-mesa-border bg-white p-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold wrap-anywhere text-mesa-text">{permit.employeeName}</h3>
                    <p className="text-sm wrap-anywhere text-mesa-muted">Nómina: <span className="tabular-nums">{permit.payrollNumber}</span></p>
                  </div>
                  <dl className="space-y-3 text-sm text-mesa-text">
                    <div>
                      <dt className="text-mesa-muted">Hora autorizada</dt>
                      <dd className="mt-1 text-xl font-semibold tabular-nums">{permit.exitTime.slice(0, 5)}</dd>
                    </div>
                    <div>
                      <dt className="text-mesa-muted">Tipo</dt>
                      <dd className="mt-1">{permitTypeLabels[permit.permitType]}</dd>
                    </div>
                    <div>
                      <dt className="text-mesa-muted">Motivo</dt>
                      <dd className="mt-1 leading-relaxed whitespace-pre-wrap wrap-anywhere">{permit.reason}</dd>
                    </div>
                    <div>
                      <dt className="text-mesa-muted">Fecha</dt>
                      <dd className="mt-1 tabular-nums">{formatPermitDate(permit.permitDate)}</dd>
                    </div>
                  </dl>
                  <Button
                    aria-label={`Registrar salida de ${permit.employeeName}`}
                    aria-describedby={completionErrors[permit.id] ? `exit-error-mobile-${permit.id}` : undefined}
                    loading={!!processing[permit.id]}
                    loadingText="Registrando..."
                    disabled={!!processing[permit.id]}
                    onClick={() => setSelectedPermit(permit)}
                    className="w-full"
                  >
                    Registrar salida
                  </Button>
                  {completionErrors[permit.id] && (
                    <Alert id={`exit-error-mobile-${permit.id}`}>{completionErrors[permit.id]}</Alert>
                  )}
                </li>
              ))}
            </ul>
            <TableContainer label="Listado de salidas autorizadas" busy={isFetching} className="hidden md:block">
              <table className="w-full min-w-240 table-fixed text-left text-sm">
                <caption className="sr-only">
                  Salidas autorizadas: empleado, nómina, fecha, hora autorizada, tipo, motivo y acción
                </caption>
                <colgroup>
                  <col className="w-[22%]" />
                  <col className="w-[16%]" />
                  <col className="w-[11%]" />
                  <col className="w-[31%]" />
                  <col className="w-[20%]" />
                </colgroup>
                <thead className="border-b border-mesa-border bg-mesa-canvas text-mesa-text">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">Empleado</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Horario autorizado</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Tipo</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Motivo</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Acción</th>
                  </tr>
                </thead>
                {data.map((permit) => (
                  <tbody key={permit.id} className="border-b border-mesa-border last:border-b-0">
                    <tr className="align-top">
                      <th scope="row" className="px-4 py-5 wrap-anywhere text-mesa-text">
                        <p className="text-base font-semibold">{permit.employeeName}</p>
                        <p className="mt-1 font-normal text-mesa-muted">Nómina: <span className="tabular-nums">{permit.payrollNumber}</span></p>
                      </th>
                      <td className="px-4 py-5 whitespace-nowrap tabular-nums">
                        <p className="text-lg font-semibold text-mesa-text">{permit.exitTime.slice(0, 5)}</p>
                        <p className="mt-1 text-mesa-muted">{formatPermitDate(permit.permitDate)}</p>
                      </td>
                      <td className="px-4 py-5 wrap-anywhere text-mesa-muted">{permitTypeLabels[permit.permitType]}</td>
                      <td className="px-4 py-5 leading-relaxed whitespace-pre-wrap wrap-anywhere text-mesa-text">{permit.reason}</td>
                      <td className="px-4 py-5">
                        <Button
                          aria-label={`Registrar salida de ${permit.employeeName}`}
                          aria-describedby={completionErrors[permit.id] ? `exit-error-table-${permit.id}` : undefined}
                          loading={!!processing[permit.id]}
                          loadingText="Registrando..."
                          disabled={!!processing[permit.id]}
                          onClick={() => setSelectedPermit(permit)}
                          className="whitespace-nowrap"
                        >
                          Registrar salida
                        </Button>
                      </td>
                    </tr>
                    {completionErrors[permit.id] && (
                      <tr>
                        <td colSpan={5} className="px-4 pb-5">
                          <Alert id={`exit-error-table-${permit.id}`}>{completionErrors[permit.id]}</Alert>
                        </td>
                      </tr>
                    )}
                  </tbody>
                ))}
              </table>
            </TableContainer>
          </>
        )}
      </section>

      {detachedErrors.length > 0 && (
        <section aria-labelledby="exit-incidents-title" className="min-w-0 space-y-3 rounded-xl border border-mesa-border bg-mesa-canvas p-4">
          <h2 id="exit-incidents-title" className="text-lg font-semibold text-mesa-text">Incidencias al registrar salidas</h2>
          {detachedErrors.map(([permitId, message]) => (
            <Alert key={permitId}>{message}</Alert>
          ))}
        </section>
      )}
      {selectedPermit && (
        <ConfirmationDialog
          title="¿Registrar salida?"
          description={<>Confirma que <strong>{selectedPermit.employeeName}</strong>, nómina {selectedPermit.payrollNumber}, está registrando su salida. Permiso del {formatPermitDate(selectedPermit.permitDate)} a las {selectedPermit.exitTime.slice(0, 5)}.</>}
          confirmText="Registrar salida"
          loadingText="Registrando..."
          onCancel={() => setSelectedPermit(null)}
          onConfirm={() => registerExit(selectedPermit)}
        >
          {completionErrors[selectedPermit.id] && <Alert>{completionErrors[selectedPermit.id]}</Alert>}
        </ConfirmationDialog>
      )}
    </section>
  )
}
