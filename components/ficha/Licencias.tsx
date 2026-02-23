export default function Licencias() {
    return <div className="space-y-4">
        <h2 className="text-xl font-bold text-[#6a3858] mb-4">Licencias Médicas</h2>
        <div className="flex flex-col gap-4 items-center mt-12">
            <button
                className="bg-[#ac9164] text-white px-8 py-4 rounded-lg font-bold text-lg shadow hover:bg-[#68563c] transition"
                onClick={() =>
                    window.open("https://wlme.medipass.cl/WebPublic/index.php", "_blank")
                }
                type="button"
            >
                📄 Medipas
            </button>
            <button
                className="bg-[#66754c] text-white px-8 py-4 rounded-lg font-bold text-lg shadow hover:bg-[#8e9b6d] transition"
                onClick={() =>
                    window.open("https://www.licencia.cl/sesiones/nueva/rol:profesional", "_blank")
                }
                type="button"
            >
                🏥 Aimed
            </button>
        </div>
    </div>
};