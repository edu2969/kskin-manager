import { Dialog } from "@headlessui/react";

export default function ModalAlertaAlergias({
    isOpen,
    onClose
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    return <Dialog open={isOpen} onClose={onClose} className="fixed z-50 inset-0 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/30" onClick={onClose} />
        <div className="bg-white rounded-lg p-6 shadow-xl border-2 border-red-500 max-w-md mx-4 relative z-10">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">!</span>
                </div>
                <h3 className="text-lg font-bold text-red-700">¡Atención!</h3>
            </div>

            <div className="mb-6">
                <h4 className="font-semibold text-red-600 mb-2">Alergias</h4>
                <p className="text-gray-700">
                    Esta información es importante. Por favor, complete el campo de alergias del paciente.
                </p>
            </div>

            <div className="flex justify-end gap-3">
                <button
                    onClick={onClose}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-medium transition"
                >
                    Entendido
                </button>
            </div>
        </div>
    </Dialog>;
}