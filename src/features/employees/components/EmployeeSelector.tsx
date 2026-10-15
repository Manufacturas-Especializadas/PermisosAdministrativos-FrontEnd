import { useState } from 'react'
import type { Employee } from '../employees.types'
import Alert from '../../../components/Alert'
import LoadingState from '../../../components/LoadingState'
import EmptyState from '../../../components/EmptyState'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useEmployeeSearch } from '../hooks/useEmployeeSearch'

interface EmployeeSelectorProps {
    selectedEmployee: Employee | null
    onSelect: (employee: Employee) => void
    onClear: () => void
}

export function EmployeeSelector({
    selectedEmployee,
    onSelect,
    onClear,
}: EmployeeSelectorProps) {
    const [search, setSearch] = useState('')
    const debouncedSearch = useDebouncedValue(search, 350)

    const {
        data,
        isPending,
        isFetching,
        isError,
    } = useEmployeeSearch(debouncedSearch)

    if (selectedEmployee) {
        return (
            <div className="space-y-2">
                <p className="text-sm font-semibold text-mesa-text">
                    Empleado
                </p>

                <div className="rounded-lg border border-sky-200 bg-sky-50/50 p-4 wrap-anywhere">
                    <div className="flex flex-wrap items-start justify-between gap-3 sm:flex-nowrap">
                        <div className="min-w-0">
                            <p className="font-medium text-slate-900">
                                {selectedEmployee.fullName}
                            </p>

                            <p className="mt-1 text-sm text-slate-600">
                                Nómina: {selectedEmployee.payrollNumber}
                            </p>

                            <p className="text-sm text-slate-600">
                                Departamento: {selectedEmployee.departmentName}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={onClear}
                            className="mesa-button-secondary shrink-0"
                        >
                            Cambiar
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            <label
                htmlFor="employee-search"
                className="block text-sm font-semibold text-mesa-text"
            >
                Empleado
            </label>

            <input
                id="employee-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombre o número de nómina..."
                className="mesa-input"
            />

            {search.trim().length > 0 && search.trim().length < 2 && (
                <p className="text-sm text-mesa-muted">
                    Escribe al menos 2 caracteres.
                </p>
            )}

            {isPending && debouncedSearch.trim().length >= 2 && (
                <LoadingState compact>
                    Buscando empleados...
                </LoadingState>
            )}

            {isFetching && !isPending && (
                <LoadingState compact>
                    Actualizando resultados...
                </LoadingState>
            )}

            {isError && (
                <Alert>
                    No se pudieron buscar los empleados.
                </Alert>
            )}

            {data && data.items.length > 0 && (
                <div className="rounded-lg border border-mesa-border bg-white p-1">
                    {data.items.map((employee) => (
                        <button
                            key={employee.id}
                            type="button"
                            onClick={() => {
                                onSelect(employee)
                                setSearch('')
                            }}
                            className="mesa-focus relative block min-h-11 w-full cursor-pointer rounded-md border-b border-mesa-border px-3 py-3 text-left wrap-anywhere last:border-b-0 hover:bg-mesa-canvas focus-visible:z-10 focus-visible:bg-mesa-selection disabled:cursor-not-allowed"
                        >
                            <p className="font-medium text-slate-900">
                                {employee.fullName}
                            </p>

                            <p className="mt-1 text-sm text-slate-600">
                                Nómina: {employee.payrollNumber}
                            </p>

                            <p className="text-sm text-slate-600">
                                {employee.departmentName}
                            </p>
                        </button>
                    ))}
                </div>
            )}

            {data && data.items.length === 0 && debouncedSearch.trim().length >= 2 && (
                <EmptyState>
                    No se encontraron empleados activos.
                </EmptyState>
            )}
        </div>
    )
}
