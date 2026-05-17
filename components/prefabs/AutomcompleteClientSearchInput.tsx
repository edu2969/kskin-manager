"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createPortal } from "react-dom"

export interface IPacienteSearchResult {
  id: string;
  nombre: string;
  rut: string;
}

interface AutocompleteClientSearchInputProps {
  className?: string;
  placeholder?: string;
  onSelected?: (paciente: IPacienteSearchResult) => void;
}

export const AutocompleteClientSearchInput = ({
  className = "",
  placeholder = "Buscar paciente...",
  onSelected,
}: AutocompleteClientSearchInputProps) => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({
    top: 0,
    left: 0,
    width: 0,
  })

  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as Node;

    const clickedInput =
      containerRef.current?.contains(target);

    const clickedDropdown =
      dropdownRef.current?.contains(target);

    if (!clickedInput && !clickedDropdown) {
      setOpen(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener(
      "mousedown",
      handleClickOutside
    );
  };
}, []);

  // Debounce
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
    }, 800);

    return () => clearTimeout(timeout);
  }, [search]);

  // Query
  const { data, isFetching } = useQuery({
    queryKey: ["pacientes-search", debouncedSearch],
    enabled: debouncedSearch.trim().length >= 4,
    queryFn: async (): Promise<IPacienteSearchResult[]> => {
      const response = await fetch(
        `/api/paciente/search?search=${encodeURIComponent(
          debouncedSearch
        )}`
      );

      if (!response.ok) {
        throw new Error("Error buscando pacientes");
      }

      return response.json();
    },
  });  

  useEffect(() => {
    if (!open || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()

    setDropdownStyle({
      top: rect.bottom + window.scrollY + 8,
      left: rect.left + window.scrollX,
      width: rect.width,
    })
  }, [open, search])

  const resultados = useMemo(() => data ?? [], [data]);

  const handleSelect = (paciente: IPacienteSearchResult) => {
    setSearch(`${paciente.nombre} - ${paciente.rut}`);
    setOpen(false);
    onSelected?.(paciente);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
    >
      <input
        type="text"
        value={search}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setSearch(e.target.value);
          setOpen(true);
        }}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200 relative z-0"
      />

      {open &&
        debouncedSearch.length >= 4 &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "absolute",
              top: dropdownStyle.top,
              left: dropdownStyle.left,
              width: dropdownStyle.width,
              zIndex: 999999,
            }}
            className="max-h-80 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            {isFetching && (
              <div className="px-4 py-3 text-sm text-slate-500">
                Buscando...
              </div>
            )}

            {!isFetching && resultados.length === 0 && (
              <div className="px-4 py-3 text-sm text-slate-500">
                Sin resultados
              </div>
            )}

            {!isFetching &&
              resultados.map((paciente) => (
                <button                  
                  key={paciente.id}
                  type="button"
                  onClick={() => handleSelect(paciente)}
                  className="flex w-full flex-col border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 last:border-b-0"
                >
                  <span className="text-sm font-semibold text-slate-800">
                    {paciente.nombre}
                  </span>

                  <span className="text-xs text-slate-500">
                    {paciente.rut}
                  </span>
                </button>
              ))}
          </div>,
          document.body
        )}
    </div>
  );
};