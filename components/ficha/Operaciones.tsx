import { FaCaretSquareRight } from "react-icons/fa";
import { IFichaForm } from "./types";
import { UseFormRegister } from "react-hook-form";

export default function Operaciones({
    register
}: {
    register: UseFormRegister<IFichaForm>;
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
                    {...register("paciente.operaciones")}
                    className="w-full border border-[#d5c7aa] rounded px-3 py-2 bg-white h-24 focus:border-[#ac9164]"
                    placeholder="Detalle de operaciones quirúrgicas y/o lesiones..."
                />
            </div>
        </details>
    </div>;
}