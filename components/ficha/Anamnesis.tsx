export default function Anamnesis({
    register
}: {
    register: any;
}) {
    return <div className="space-y-4">
        <h2 className="text-xl font-bold text-[#6a3858] mb-4">Anamnesis / Exámen Físico</h2>
        <div>
            <label className="block text-sm font-semibold text-[#68563c] mb-1">
                Descripción clínica
            </label>
            <textarea
                className="w-full border border-[#d5c7aa] rounded px-3 py-2 bg-white h-32 focus:border-[#ac9164] focus:ring-2 focus:ring-[#fad379]/20"
                value={anamnesis}
                onChange={handleAnamnesisChange}
                onBlur={handleAnamnesisBlur}
                placeholder="Describa la anamnesis y hallazgos del examen físico..."
            />
        </div>
    </div>;
}