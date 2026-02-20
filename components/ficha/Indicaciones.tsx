export default function Indicaciones({
    register
}: {
    register: any;
}) {
    const handleIndicacionesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        register("indicaciones", { value: e.target.value });
    }
    return <div className="space-y-4">
        <h2 className="text-xl font-bold text-[#6a3858] mb-4">Indicaciones</h2>
        <div>
            <label className="block text-sm font-semibold text-[#68563c] mb-1">
                Indicaciones para el paciente
            </label>
            <textarea
                className="w-full border border-[#d5c7aa] rounded px-3 py-2 bg-white h-40 focus:border-[#ac9164] focus:ring-2 focus:ring-[#fad379]/20"
                onChange={handleIndicacionesChange}
                onBlur={handleIndicacionesChange}
                placeholder="Indicaciones para el paciente..."
            />
        </div>
    </div>;
}