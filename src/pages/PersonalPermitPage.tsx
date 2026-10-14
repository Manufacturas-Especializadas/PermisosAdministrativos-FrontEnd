import { isAxiosError } from 'axios'
import { useState } from 'react'
import Alert from '../components/Alert'
import Button from '../components/Button'
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
            createPermit.isPending ||
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
            className="mx-auto min-w-0 max-w-3xl space-y-6 text-mesa-text"
        >
            <div>
                <h1
                    id="personal-permit-title"
                    className="text-2xl font-semibold tracking-tight text-mesa-text sm:text-3xl"
                >
                    Registrar permiso
                </h1>

                <p className="mt-2 text-base leading-relaxed text-mesa-muted">
                    Registra un permiso de salida para un empleado.
                </p>
            </div>

            <form
                onSubmit={(event) => {
                    event.preventDefault()
                    void handleSubmit()
                }}
                aria-busy={createPermit.isPending}
                className="min-w-0 rounded-xl border border-mesa-border bg-white p-4 shadow-sm sm:p-6"
            >
                <fieldset disabled={createPermit.isPending} className="min-w-0 space-y-5">
                    <legend className="sr-only">Datos del permiso personal</legend>
                    {/* Estos ajustes visuales afectan únicamente a esta instancia del selector. */}
                    <div className="min-w-0 w-full wrap-anywhere [&_label]:text-mesa-text [&_p]:text-mesa-muted [&_p.font-medium]:text-mesa-text [&_[role=alert]]:text-mesa-error [&_input]:min-h-12 [&_input]:min-w-0 [&_input]:max-w-full [&_input]:border-slate-400 [&_input]:text-base [&_input]:text-mesa-text [&_input]:placeholder:text-mesa-muted [&_input:focus]:border-mesa-primary [&_input:focus]:ring-0 [&_input:focus-visible]:outline-solid [&_input:focus-visible]:outline-2 [&_input:focus-visible]:outline-offset-2 [&_input:focus-visible]:outline-mesa-primary [&_button]:min-h-12 [&_button]:whitespace-normal [&_button]:focus-visible:relative [&_button]:focus-visible:outline-solid [&_button]:focus-visible:outline-2 [&_button]:focus-visible:outline-offset-2 [&_button]:focus-visible:outline-mesa-primary [&_button.shrink-0]:px-2 [&_button.shrink-0]:text-mesa-primary [&_button.shrink-0]:hover:text-mesa-hover [&_.overflow-hidden]:overflow-visible [&_.items-start]:flex-wrap sm:[&_.items-start]:flex-nowrap">
                        <EmployeeSelector
                            selectedEmployee={selectedEmployee}
                            onSelect={setSelectedEmployee}
                            onClear={() => setSelectedEmployee(null)}
                        />
                    </div>

                    <div className="min-w-0 space-y-2">
                        <label
                            htmlFor="permit-type"
                            className="block text-sm font-semibold text-mesa-text"
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
                            className="mesa-input min-w-0 max-w-full"
                        >
                            <option value="">Selecciona un tipo</option>

                            {Object.entries(permitTypeLabels).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid min-w-0 gap-5 sm:grid-cols-2">
                        <div className="min-w-0 space-y-2">
                            <label
                                htmlFor="permit-date"
                                className="block text-sm font-semibold text-mesa-text"
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
                                className="mesa-input min-w-0 max-w-full"
                            />
                        </div>

                        <div className="min-w-0 space-y-2">
                            <label
                                htmlFor="exit-time"
                                className="block text-sm font-semibold text-mesa-text"
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
                                className="mesa-input min-w-0 max-w-full"
                            />
                        </div>
                    </div>

                    <div className="min-w-0 space-y-2">
                        <label
                            htmlFor="permit-reason"
                            className="block text-sm font-semibold text-mesa-text"
                        >
                            Motivo
                        </label>

                        <textarea
                            id="permit-reason"
                            required
                            maxLength={500}
                            aria-describedby="permit-reason-help"
                            value={reason}
                            onChange={(event) => setReason(event.target.value)}
                            rows={4}
                            placeholder="Describe brevemente el motivo..."
                            className="mesa-input min-w-0 max-w-full resize-y leading-relaxed placeholder:text-mesa-muted"
                        />
                        <p id="permit-reason-help" className="text-sm text-mesa-muted">
                            Máximo 500 caracteres.
                        </p>
                    </div>

                    {createPermit.isSuccess && (
                        <Alert variant="success" role="status">
                            El permiso se registró correctamente y quedó pendiente
                            de aprobación por RH.
                        </Alert>
                    )}

                    {createPermit.isError && (
                        <Alert variant="error" role="alert">
                            {errorMessage}
                        </Alert>
                    )}

                    <div className="flex justify-end border-t border-mesa-border pt-5">
                        <Button
                            type="submit"
                            loading={createPermit.isPending}
                            loadingText="Registrando..."
                            disabled={
                                createPermit.isPending ||
                                !selectedEmployee ||
                                !permitDate ||
                                !exitTime ||
                                permitType === null ||
                                !reason.trim()
                            }
                            className="w-full sm:w-auto"
                        >
                            Registrar permiso
                        </Button>
                    </div>
                </fieldset>
            </form>
        </section>
    )
}
