import { useContext } from 'react';
import { AutoSaveContext } from '@/context/AutoSaveContext';

export function AutoSaveIndicator() {
    const context = useContext(AutoSaveContext);

    // ✅ Renderiza null si no hay contexto (sin error)
    if (!context) {
        return null;
    }

    const { isPending, isError, error } = context;

    if (isPending) {
        return (
            <div className="absolute top-2 right-4 bg-[#66754c] text-white px-3 py-1 rounded shadow animate-pulse z-20 text-sm">
                💾 Guardando...
            </div>
        );
    }

    if (isError && error) {
        return (
            <div className="absolute top-2 right-4 bg-red-500 text-white px-3 py-1 rounded shadow z-20 text-sm">
                ❌ Error al guardar
            </div>
        );
    }

    return null;
}