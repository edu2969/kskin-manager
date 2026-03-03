import { useMutation } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';
import { debounce } from 'lodash';

interface UseAutoSaveOptions {
    fichaId?: string;
    pacienteId?: string;
    delay?: number;
    onSuccess?: (changes: Record<string, any>) => void;
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
            console.log('🔄 Enviando auto-save request con:', changes);
            
            const response = await fetch('/api/profesional/actualizarFicha', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fichaId,
                    pacienteId,
                    changes
                })
            });

            console.log('📡 Response status:', response.status, 'ok:', response.ok);

            if (!response.ok) {
                const error = await response.json();
                console.error('❌ Response error:', error);
                throw new Error(error.message || 'Error guardando cambios');
            }

            const result = await response.json();
            console.log('✅ Response success:', result);
            return result;
        },
        onSuccess: (data, variables) => {
            console.log('🎉 MUTATION onSuccess ejecutado! Data:', data, 'Variables:', variables);
            pendingChanges.current.clear();
            
            // Ejecutar callback de éxito con los cambios guardados
            onSuccess?.(variables);
        },
        onError: (error: Error, variables) => {
            console.error('💥 MUTATION onError ejecutado! Error:', error, 'Variables:', variables);
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