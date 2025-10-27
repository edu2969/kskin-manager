"use client";

import { useState, useRef } from 'react';
import { handleRutInput, cleanRut, isValidRutFormat } from '@/app/utils/rutFormatter';

export default function RutInput({ 
    value, 
    onChange, 
    placeholder = "Ej: 12.345.678-9", 
    className = "",
    disabled = false,
    ...props 
}) {
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef(null);

    const handleChange = (e) => {
        const newValue = e.target.value;
        const formattedValue = handleRutInput(newValue);
        onChange(formattedValue);
    };

    const handleKeyDown = (e) => {
        // Permitir teclas de navegación y edición
        const allowedKeys = [
            'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
            'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
            'Home', 'End'
        ];

        if (allowedKeys.includes(e.key)) return;

        // Permitir Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        if (e.ctrlKey && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) return;

        // Permitir solo números y K/k
        if (!/^[0-9kK]$/.test(e.key)) {
            e.preventDefault();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedText = e.clipboardData.getData('text');
        const formattedValue = handleRutInput(pastedText);
        onChange(formattedValue);
    };

    const isValid = value ? isValidRutFormat(value) : true;

    return (
        <div className="relative">
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={placeholder}
                disabled={disabled}
                className={`
                    ${className}
                    ${!isValid ? 'border-red-300 focus:border-red-500' : ''}
                    ${isFocused ? 'ring-2 ring-pink-200' : ''}
                    transition-all duration-200
                `}
                {...props}
            />
            {!isValid && (
                <div className="absolute -bottom-5 left-0 text-xs text-red-500">
                    RUT inválido
                </div>
            )}
        </div>
    );
}