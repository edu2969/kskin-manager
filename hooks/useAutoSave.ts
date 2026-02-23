import { useMutation } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';
import { debounce } from 'lodash';

interface UseAutoSaveOptions {
    fichaId?: string;
    pacienteId?: string;
    delay?: number;
    onSuccess?: () => void;
    onError?: (error: Error) => void;
}

export function useAutoSave({
    fichaId,
    pacienteId,
    delay = 1000,
    onSuccess,
    onError
}: UseAutoSaveOptions) {
    const pendingChanges = useRef<Map<string, any>>(new Map());

    const mutation = useMutation({
        mutationFn: async (changes: Record<string, any>) => {
            const response = await fetch('/api/profesional/actualizarFicha', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fichaId,
                    pacienteId,
                    changes
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error guardando cambios');
            }

            return response.json();
        },
        onSuccess: () => {
            pendingChanges.current.clear();
            onSuccess?.();
        },
        onError: (error: Error) => {
            onError?.(error);
        }
    });

    const debouncedSave = useCallback(
        debounce(() => {
            if (pendingChanges.current.size > 0) {
                const changes = Object.fromEntries(pendingChanges.current);
                mutation.mutate(changes);
            }
        }, delay),
        [mutation, delay]
    );

    const saveField = useCallback((fieldPath: string, value: any) => {
        pendingChanges.current.set(fieldPath, value);
        debouncedSave();
    }, [debouncedSave]);

    const saveBatch = useCallback((changes: Record<string, any>) => {
        Object.entries(changes).forEach(([key, value]) => {
            pendingChanges.current.set(key, value);
        });
        debouncedSave();
    }, [debouncedSave]);

    return {
        saveField,
        saveBatch,
        isPending: mutation.isPending,
        error: mutation.error,
        isError: mutation.isError
    };
}