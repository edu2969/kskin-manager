import { useState, useRef, useEffect, KeyboardEvent } from "react";

interface AutocompleteItem {
    key: string | number;
    value: string;
}

interface AutocompleteInputProps {
    items: AutocompleteItem[];
    onSelect: (item: AutocompleteItem) => void;
    placeholder?: string;
    className?: string;
}

export default function AutocompleteInput({ 
    items = [], 
    onSelect, 
    placeholder = "Escribir para buscar...",
    className = ""
}: AutocompleteInputProps) {
    const [inputValue, setInputValue] = useState("");
    const [filteredItems, setFilteredItems] = useState<AutocompleteItem[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (inputValue.trim() === "") {
            setFilteredItems([]);
            setShowDropdown(false);
            return;
        }

        const filtered = items.filter(item =>
            item.value.toLowerCase().includes(inputValue.toLowerCase())
        );
        setFilteredItems(filtered);
        setShowDropdown(filtered.length > 0);
        setSelectedIndex(-1);
    }, [inputValue, items]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const handleSelect = (item: AutocompleteItem) => {
        onSelect(item);
        setInputValue("");
        setShowDropdown(false);
        setSelectedIndex(-1);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex(prev => 
                prev < filteredItems.length - 1 ? prev + 1 : prev
            );
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (selectedIndex >= 0 && selectedIndex < filteredItems.length) {
                handleSelect(filteredItems[selectedIndex]);
            } else if (filteredItems.length === 1) {
                handleSelect(filteredItems[0]);
            }
        } else if (e.key === "Escape") {
            setShowDropdown(false);
            setSelectedIndex(-1);
        }
    };

    const handleAgregarClick = () => {
        if (filteredItems.length > 0) {
            const itemToSelect = selectedIndex >= 0 ? filteredItems[selectedIndex] : filteredItems[0];
            handleSelect(itemToSelect);
        }
    };

    // Cerrar dropdown al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
                setSelectedIndex(-1);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <div className="flex gap-2">
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className={`flex-1 border border-[#d5c7aa] rounded px-3 py-2 bg-white focus:border-[#ac9164] focus:outline-none ${className}`}
                />
                <button
                    type="button"
                    onClick={handleAgregarClick}
                    disabled={filteredItems.length === 0}
                    className="bg-[#66754c] text-white px-3 py-2 rounded text-sm hover:bg-[#8e9b6d] disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                    Agregar
                </button>
            </div>

            {/* Dropdown */}
            {showDropdown && filteredItems.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-[#d5c7aa] rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredItems.map((item, index) => (
                        <div
                            key={item.key}
                            onClick={() => handleSelect(item)}
                            className={`px-3 py-2 cursor-pointer hover:bg-[#f6eedb] ${
                                index === selectedIndex ? 'bg-[#f6eedb]' : ''
                            }`}
                        >
                            {item.value}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}