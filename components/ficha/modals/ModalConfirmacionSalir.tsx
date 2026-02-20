import { Dialog } from "@headlessui/react";
import { CiPower } from "react-icons/ci";

export default function ModalConfirmacionSalir({
    isOpen,
    onClose,
    terminarAtencion
}: {
    isOpen: boolean;
    onClose: () => void;
    terminarAtencion: () => void;
}) {
    return (<Dialog open={isOpen} onClose={onClose} className="fixed z-50 inset-0 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/30" onClick={onClose} />
        <div className="bg-white rounded-lg p-6 shadow-xl border-2 border-[#ac9164] max-w-md mx-4 relative z-10">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-[#ac9164] rounded-full flex items-center justify-center">
                    <CiPower className="text-white text-lg" />
                </div>
                <h3 className="text-lg font-bold text-[#68563c]">Finalizar Sesión</h3>
            </div>

            <div className="mb-6">
                <p className="text-gray-700">
                    ¿Seguro desea terminar la sesión?
                </p>
            </div>

            <div className="flex justify-end gap-3">
                <button
                    onClick={onClose}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded font-medium transition"
                >
                    Cancelar
                </button>
                <button
                    onClick={() => {
                        terminarAtencion();
                    }}
                    className="bg-[#ac9164] hover:bg-[#8e7a4f] text-white px-4 py-2 rounded font-medium transition"
                >
                    Finalizar
                </button>
            </div>
        </div>
    </Dialog>);
}