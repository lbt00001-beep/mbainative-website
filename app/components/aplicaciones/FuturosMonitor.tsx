'use client';

export default function FuturosMonitor() {
    return (
        <div className="w-full max-w-7xl mx-auto">
            <div className="relative w-full h-[920px] bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-800">
                <iframe
                    src="https://futuros-n2tk7m74xcznbbhdenrgiz.streamlit.app/?embed=true"
                    className="absolute top-0 left-0 w-full h-full border-0"
                    title="Monitor de Futuros Liquidos"
                    allow="clipboard-read; clipboard-write"
                />
            </div>

            <div className="mt-8 p-6 bg-gray-800/40 rounded-lg border border-gray-700 space-y-4">
                <h3 className="text-xl font-bold text-[--accent]">Monitor de Futuros Liquidos</h3>
                <p className="text-gray-300">
                    Herramienta de observacion y paper trading sobre futuros liquidos. Detecta movimientos atipicos,
                    genera senales de compra o venta, calcula fuerza de recomendacion y simula operaciones sin dinero real.
                </p>
                <ul className="space-y-2 text-gray-300">
                    <li className="flex items-start gap-2">
                        <span className="text-[--accent]">1.</span>
                        <span>Revisa las recomendaciones en tiempo real y el umbral de fuerza para activar operaciones simuladas.</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-[--accent]">2.</span>
                        <span>Consulta el paper trading, el PnL abierto y realizado, y la curva de equity.</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-[--accent]">3.</span>
                        <span>Usa Ayuda y Peligro dentro de la app para entender el modelo y sus limites legales.</span>
                    </li>
                </ul>
                <p className="text-sm text-gray-400">
                    Esta integracion muestra una app externa de Streamlit dentro de MBAI Native. Su finalidad es analitica y educativa.
                </p>
            </div>
        </div>
    );
}
