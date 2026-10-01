import { isAxiosError } from 'axios'
import { usePendingPersonalPermits } from '../features/personalPermits/hooks/usePendingPersonalPermits'
import type { PersonalPermitType } from '../features/personalPermits/personalPermit.types'

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
  const sessionExpired = isAxiosError(error) && error.response?.status === 401

  return (
    <section aria-labelledby="pending-permits-title" className="space-y-6">
      <div>
        <h1
          id="pending-permits-title"
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

      {isPending ? (
        <div className="min-h-40 rounded-xl border border-slate-200 bg-white" aria-busy="true" />
      ) : isError ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {sessionExpired
            ? 'Tu sesión ha expirado. Vuelve a iniciar sesión para consultar los permisos pendientes.'
            : 'No se pudieron cargar los permisos pendientes. Inténtalo de nuevo más tarde.'}
        </p>
      ) : data.length === 0 ? (
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
          <table className="w-full min-w-180 text-left text-sm">
            <caption className="sr-only">
              Permisos pendientes: empleado, nómina, fecha, hora, tipo y motivo
            </caption>
            <thead className="border-b border-slate-200 bg-slate-100 text-slate-700">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Empleado</th>
                <th scope="col" className="px-4 py-3 font-semibold">Nómina</th>
                <th scope="col" className="px-4 py-3 font-semibold">Fecha</th>
                <th scope="col" className="px-4 py-3 font-semibold">Hora</th>
                <th scope="col" className="px-4 py-3 font-semibold">Tipo</th>
                <th scope="col" className="px-4 py-3 font-semibold">Motivo</th>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
