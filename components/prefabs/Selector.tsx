import { UseFormRegisterReturn } from "react-hook-form";
import { useEffect, useContext, useCallback } from "react";
import Loader from "../Loader";
import { AutoSaveContext } from "../../context/AutoSaveContext";

type SelectorProps<T> = {
    options: T[];
    label?: string;
    placeholder?: string;
    getLabel: (item: T) => string | number;
    getValue: (item: T) => string | number;
    register: UseFormRegisterReturn;
    isLoading?: boolean;
    onChange?: (value: string | number) => void;
    disableAutoSelect?: boolean;
    // ✅ NUEVA prop para especificar el campo para auto-guardado
    autoSaveField?: string;
    autoSaveAsNumber?: boolean;  // ✅ Mantener esta prop para casos específicos
    autoSaveAsDate?: boolean;    // ✅ Nueva prop para fechas
};

export function Selector<T>({
    options,
    label,
    placeholder,
    getLabel,
    getValue,
    register,
    isLoading,
    onChange,
    disableAutoSelect = false,
    autoSaveField, // Nueva prop
    autoSaveAsNumber = false, // Nueva prop
    autoSaveAsDate = false,   // Nueva prop
}: SelectorProps<T>) {

    // ✅ Hook opcional para auto-guardado (sin error si no existe contexto)
    const autoSaveContext = useContext(AutoSaveContext);

    // ✅ Función helper para auto-guardado con useCallback apropiado
    const handleAutoSave = useCallback((value: string | number) => {
        if (autoSaveContext && autoSaveField) {
            let processedValue: string | number | Date = value;
            
            if (autoSaveAsNumber) {
                processedValue = value ? Number(value) : 0;
            } else if (autoSaveAsDate) {
                processedValue = value ? new Date(value).toISOString().split('T')[0] : "";
            }
            
            autoSaveContext.saveField(autoSaveField, processedValue);
        }
    }, [autoSaveContext, autoSaveField, autoSaveAsNumber, autoSaveAsDate]);

    // Seleccionar automáticamente si solo hay una opción
    useEffect(() => {
        if (options && options.length === 1 && !isLoading && !disableAutoSelect) {
            const singleValue = getValue(options[0]);
            const event = new Event('change', { bubbles: true });
            Object.defineProperty(event, 'target', {
                writable: false,
                value: { name: register.name, value: singleValue }
            });
            register.onChange(event);
            onChange?.(singleValue);
            
            // ✅ Auto-guardar cuando se auto-selecciona
            handleAutoSave(singleValue);
        }
    }, [options, isLoading, getValue, register, onChange, disableAutoSelect, handleAutoSave]);

    return (
        <div className="relative w-full">
            <label htmlFor="cliente" className="block text-sm font-medium text-gray-700">
                {label ?? "Seleccione..."}
            </label>
            <select
                {...register}
                onChange={e => {
                    register.onChange(e);
                    onChange?.(e.target.value);
                    
                    // ✅ Auto-guardar en cada cambio
                    handleAutoSave(e.target.value);
                }}
                disabled={isLoading}
                value={options && options.length === 1 && !isLoading && !disableAutoSelect ? getValue(options[0]) : undefined}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 sm:text-sm"
            >
                <option value="">{placeholder || `Seleccione${label ? " " + label : ""}...`}</option>
                {options?.map((item, idx) => (
                    <option key={idx} value={getValue(item)}>
                        {getLabel(item)}
                    </option>
                ))}
            </select>
            {isLoading && <div className="w-full absolute top-7 bg-white/80"><Loader texto=""/></div>}
        </div>
    );
}