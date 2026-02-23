import { useCallback } from 'react';
import { UseFormRegisterReturn, FieldPath, FieldValues } from 'react-hook-form';
import { useAutoSaveContext } from '@/context/AutoSaveContext';

export function useFormFieldAutoSave<T extends FieldValues>(
    fieldPath: FieldPath<T>,
    registerResult: UseFormRegisterReturn
) {
    const { saveField } = useAutoSaveContext();

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        registerResult.onChange(e);
        saveField(fieldPath, e.target.value);
    }, [registerResult.onChange, saveField, fieldPath]);

    const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        registerResult.onBlur(e);
        saveField(fieldPath, e.target.value);
    }, [registerResult.onBlur, saveField, fieldPath]);

    return {
        ...registerResult,
        onChange: handleChange,
        onBlur: handleBlur
    };
}