import { useMutation, useQuery } from "@tanstack/react-query";

export default function Examenes({ register }: { register: any }) {
    const { data: examenes } = useQuery({
        queryKey: ["examenes"],
        queryFn: async () => {
            const res = await fetch("/api/examenes");
            if (!res.ok) {
                throw new Error("Error al cargar exámenes");
            }
            return res.json();
        }
    });

    const agregarExamenMutation = useMutation({
        mutationFn: async (examen: { codigo: string; nombre: string }) => {
            const res = await fetch("/api/fichas/examenes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(examen)
            });
            if (!res.ok) {
                throw new Error("Error al agregar examen");
            }
            return res.json();
        }
    })

    const handleAgregarExamen = (examen: { codigo: string; nombre: string }) => {
        agregarExamenMutation.mutate(examen);
    }

    return <div className="space-y-4">
        <h2 className="text-xl font-bold text-[#6a3858] mb-4">Exámenes</h2>
        <div>
            <label className="block text-sm font-semibold text-[#68563c] mb-1">
                Solicitud de exámenes
            </label>
            <div className="flex gap-2 mb-2">
                <div className="flex-1 relative">
                    <input
                        className="w-full border border-[#d5c7aa] rounded px-3 py-2 bg-white focus:border-[#ac9164] focus:ring-2 focus:ring-[#fad379]/20"
                        {...register("examenes")}
                        placeholder="Código o nombre de examen"
                    />
                    {examenes.length > 0 && (
                        <div className="absolute top-full left-0 right-0 bg-white border border-[#d5c7aa] rounded shadow z-10 mt-1">
                            {examenes.map((ex: { codigo: string; nombre: string }) => (
                                <div
                                    key={ex.codigo}
                                    className="px-3 py-2 hover:bg-[#fad379]/20 cursor-pointer"
                                    onClick={() => handleAgregarExamen(ex)}
                                >
                                    <span className="font-mono text-xs text-[#6a3858]">
                                        {ex.codigo}
                                    </span>{" "}
                                    {ex.nombre}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <button
                    className="bg-[#66754c] text-white px-4 py-2 rounded font-semibold hover:bg-[#8e9b6d] transition"
                    type="button"
                    onClick={() => {}}
                >
                    Agregar
                </button>
            </div>
            <div className="flex flex-wrap gap-2">
                {examenes.map((ex: { codigo: string; nombre: string }) => (
                    <span
                        key={ex.codigo}
                        className="bg-[#fad379]/30 text-[#68563c] px-3 py-1 rounded flex items-center gap-2 border border-[#fad379]"
                    >
                        <span className="font-mono text-xs">{ex.codigo}</span>
                        <span className="text-sm">{ex.nombre}</span>
                        <button
                            className="text-[#6a3858] hover:text-[#68563c] font-bold"
                            type="button"
                            onClick={() => {}}
                            title="Eliminar"
                        >
                            ×
                        </button>
                    </span>
                ))}
            </div>
        </div>
    </div>;
}