import { FaCaretSquareRight } from "react-icons/fa";
import { IFichaForm } from "./types";
import { UseFormRegister, UseFormSetValue } from "react-hook-form";

export default function Operaciones({
    register,
    setValue,
    onChange
}: {
    register: UseFormRegister<IFichaForm>;
    setValue: UseFormSetValue<IFichaForm>;
    onChange: (field: string, value: any) => void;
}) {
    return <div className="bg-white rounded-lg p-4 border border-[#d5c7aa]">
        <details className="group">
            <summary className="cursor-pointer text-lg font-bold text-[#6a3858] flex items-center gap-2">
                <span className="group-open:rotate-90 transition-transform">
                    <FaCaretSquareRight size="1.2rem" />
                </span>
                Operaciones y/ó Lesiones
            </summary>
            <div className="mt-4">
                <textarea
                    className="w-full border border-[#d5c7aa] rounded px-3 py-2 bg-white h-24 focus:border-[#ac9164]"
                    onChange={(e) => onChange("operaciones", String(e.target.value))}
                    onBlur={(e) => onChange("operaciones", String(e.target.value))}
                    placeholder="Detalle de operaciones quirúrgicas y/o lesiones..."
                />
            </div>
        </details>
    </div>;
}