import { useState } from 'react'
import type { Employee } from '../employees.types'
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
                <label className="block text-sm font-medium text-slate-700">
                    Empleado
                </label>

                <div className="rounded-lg border border-slate-300 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-4">
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
                            className="shrink-0 text-sm font-medium text-blue-700 hover:text-blue-900"
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
                className="block text-sm font-medium text-slate-700"
            >
                Empleado
            </label>

            <input
                id="employee-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombre o número de nómina..."
                className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />

            {search.trim().length > 0 && search.trim().length < 2 && (
                <p className="text-sm text-slate-500">
                    Escribe al menos 2 caracteres.
                </p>
            )}

            {isPending && debouncedSearch.trim().length >= 2 && (
                <p className="text-sm text-slate-500">
                    Buscando empleados...
                </p>
            )}

            {isFetching && !isPending && (
                <p className="text-sm text-slate-500">
                    Actualizando resultados...
                </p>
            )}

            {isError && (
                <p role="alert" className="text-sm text-red-700">
                    No se pudieron buscar los empleados.
                </p>
            )}

            {data && data.items.length > 0 && (
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                    {data.items.map((employee) => (
                        <button
                            key={employee.id}
                            type="button"
                            onClick={() => {
                                onSelect(employee)
                                setSearch('')
                            }}
                            className="block w-full border-b border-slate-100 px-4 py-3 text-left last:border-b-0 hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none"
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
                <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    No se encontraron empleados activos.
                </p>
            )}
        </div>
    )
}