'use client';

export default function CorrectorRAE() {
    return (
        <div className="w-full max-w-6xl mx-auto">
            <div className="relative w-full h-[800px] bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-800">
                <iframe
                    src="https://correccion-ortotipografica-zpgqz3qwhrgqqcbnnlrndo.streamlit.app/?embed=true"
                    className="absolute top-0 left-0 w-full h-full border-0"
                    title="Corrector Ortotipográfico RAE"
                    allow="clipboard-read; clipboard-write"
                />
            </div>
            <div className="mt-8 p-6 bg-gray-800/40 rounded-lg border border-gray-700">
                <h3 className="text-xl font-bold mb-4 text-[--accent]">Cómo utilizar el corrector</h3>
                <ul className="space-y-2 text-gray-300">
                    <li className="flex items-start gap-2">
                        <span className="text-[--accent]">1.</span>
                        <span>Sube tu archivo <strong>.docx</strong> directamente en la aplicación superior.</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-[--accent]">2.</span>
                        <span>El sistema analizará el texto en busca de errores ortotipográficos y de estilo.</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-[--accent]">3.</span>
                        <span>Revisa las sugerencias y descarga el documento corregido con <strong>Control de Cambios</strong>.</span>
                    </li>
                </ul>
            </div>
        </div>
    );
}
