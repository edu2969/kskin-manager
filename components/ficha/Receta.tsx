export default function Receta({
    register
}: {
    register: any;
}) {
    return <div className="space-y-4">
        <h2 className="text-xl font-bold text-[#6a3858] mb-4">Receta</h2>
        <div>
            <label className="block text-sm font-semibold text-[#68563c] mb-1">
                Agregar medicamento
            </label>
            <div className="flex gap-2 mb-4">
                <div className="flex-1 relative">

                </div>
                <button
                    className="bg-[#66754c] text-white px-4 py-2 rounded font-semibold hover:bg-[#8e9b6d] transition"
                    type="button"
                >
                    Agregar
                </button>
            </div>
        </div>
    </div>;
}