import { isAxiosError } from 'axios'
import { useState } from 'react'
import type { Employee } from '../features/employees/employees.types'
import { EmployeeSelector } from '../features/employees/components/EmployeeSelector'
import type { PersonalPermitType } from '../features/personalPermits/personalPermit.types'
import { useCreatePersonalPermit } from '../features/personalPermits/hooks/useCreatePersonalPermit'
import { permitTypeLabels } from '../features/personalPermits/personalPermit.format'

export default function PersonalPermitPage() {
    const [selectedEmployee, setSelectedEmployee] =
        useState<Employee | null>(null)

    const [permitDate, setPermitDate] = useState('')
    const [exitTime, setExitTime] = useState('')
    const [permitType, setPermitType] =
        useState<PersonalPermitType | null>(null)
    const [reason, setReason] = useState('')

    const createPermit = useCreatePersonalPermit()

    const errorMessage =
        isAxiosError(createPermit.error) &&
            createPermit.error.response?.status === 400
            ? 'Los datos del permiso no son válidos. Revisa la información e inténtalo nuevamente.'
            : 'No se pudo registrar el permiso. Inténtalo nuevamente.'

    const handleSubmit = async () => {
        if (
            !selectedEmployee ||
            !permitDate ||
            !exitTime ||
            permitType === null ||
            !reason.trim()
        ) {
            return
        }

        try {
            await createPermit.mutateAsync({
                employeeId: selectedEmployee.id,
                permitDate,
                exitTime: `${exitTime}:00`,
                permitType,
                reason: reason.trim(),
            })

            setSelectedEmployee(null)
            setExitTime('')
            setPermitType(null)
            setReason('')
        } catch {
            // El error queda disponible en createPermit.error
            // para mostrarlo en la interfaz.
        }
    }

    return (
        <section
            aria-labelledby="personal-permit-title"
            className="mx-auto max-w-3xl space-y-6"
        >
            <div>
                <h1
                    id="personal-permit-title"
                    className="text-3xl font-semibold tracking-tight text-slate-950"
                >
                    PERMISO PERSONAL
                </h1>

                <p className="mt-1 text-sm text-slate-600">
                    Registra un permiso de salida para un empleado.
                </p>
            </div>

            <form
                onSubmit={(event) => {
                    event.preventDefault()
                    void handleSubmit()
                }}
                className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
                <EmployeeSelector
                    selectedEmployee={selectedEmployee}
                    onSelect={setSelectedEmployee}
                    onClear={() => setSelectedEmployee(null)}
                />

                <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                        <label
                            htmlFor="permit-date"
                            className="block text-sm font-medium text-slate-700"
                        >
                            Fecha
                        </label>

                        <input
                            id="permit-date"
                            type="date"
                            required
                            value={permitDate}
                            onChange={(event) =>
                                setPermitDate(event.target.value)
                            }
                            className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="exit-time"
                            className="block text-sm font-medium text-slate-700"
                        >
                            Hora de salida
                        </label>

                        <input
                            id="exit-time"
                            type="time"
                            required
                            value={exitTime}
                            onChange={(event) =>
                                setExitTime(event.target.value)
                            }
                            className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label
                        htmlFor="permit-type"
                        className="block text-sm font-medium text-slate-700"
                    >
                        Tipo de permiso
                    </label>

                    <select
                        id="permit-type"
                        required
                        value={permitType ?? ''}
                        onChange={(event) => {
                            const value = event.target.value

                            setPermitType(
                                value === ''
                                    ? null
                                    : (Number(value) as PersonalPermitType),
                            )
                        }}
                        className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    >
                        <option value="">Selecciona un tipo</option>

                        {Object.entries(permitTypeLabels).map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label
                        htmlFor="permit-reason"
                        className="block text-sm font-medium text-slate-700"
                    >
                        Motivo
                    </label>

                    <textarea
                        id="permit-reason"
                        required
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                        rows={4}
                        placeholder="Describe brevemente el motivo..."
                        className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    />
                </div>

                {createPermit.isSuccess && (
                    <p
                        role="status"
                        className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
                    >
                        El permiso se registró correctamente y quedó pendiente
                        de aprobación por RH.
                    </p>
                )}

                {createPermit.isError && (
                    <p
                        role="alert"
                        className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                    >
                        {errorMessage}
                    </p>
                )}

                <div className="flex justify-end border-t border-slate-200 pt-5">
                    <button
                        type="submit"
                        disabled={
                            createPermit.isPending ||
                            !selectedEmployee ||
                            !permitDate ||
                            !exitTime ||
                            permitType === null ||
                            !reason.trim()
                        }
                        className="min-h-11 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                        {createPermit.isPending
                            ? 'Registrando...'
                            : 'Registrar permiso'}
                    </button>
                </div>
            </form>
        </section>
    )
}
