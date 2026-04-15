'use client';

export default function FuturosMonitor() {
    return (
        <div className="w-full max-w-7xl mx-auto">
            <div className="relative w-full h-[920px] bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-800">
                <iframe
                    src="https://futuros-mbai.web.app"
                    className="absolute top-0 left-0 w-full h-full border-0"
                    title="Monitor de Futuros Liquidos"
                    allow="clipboard-read; clipboard-write"
                />
            </div>

            <div className="mt-8 p-6 bg-gray-800/40 rounded-lg border border-gray-700 space-y-4">
                <h3 className="text-xl font-bold text-[--accent]">Monitor de Futuros Líquidos</h3>
                <p className="text-gray-300">
                    Herramienta de observación y paper trading sobre futuros líquidos. Detecta movimientos atípicos,
                    genera señales de compra o venta, calcula fuerza de recomendación y simula operaciones sin dinero real.
                </p>
                <p className="text-sm text-gray-400">
                    100% en tu navegador · Firebase Hosting · Sin servidor
                </p>
            </div>
        </div>
    );
}
