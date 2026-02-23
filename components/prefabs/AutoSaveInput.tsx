import { forwardRef } from 'react';
import { FieldPath, FieldValues, UseFormRegister } from 'react-hook-form';
import { useFormFieldAutoSave } from '@/hooks/useFormFielAutoSave';

interface AutoSaveInputProps<T extends FieldValues> {
    name: FieldPath<T>;
    register: UseFormRegister<T>;
    type?: string;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export const AutoSaveInput = forwardRef<
    HTMLInputElement,
    AutoSaveInputProps<FieldValues>
>(({ name, register, type = 'text', ...props }) => {
    const fieldProps = useFormFieldAutoSave(name, register(name));

    return (
        <input
            type={type}
            {...fieldProps}
            {...props}
        />
    );
});

AutoSaveInput.displayName = 'AutoSaveInput';