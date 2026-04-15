'use client';

export default function CorrectorRAE() {
    return (
        <div className="w-full max-w-7xl mx-auto">
            <div className="relative w-full h-[920px] bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-800">
                <iframe
                    src="https://corrector-rae-mbai.web.app"
                    className="absolute top-0 left-0 w-full h-full border-0"
                    title="Corrector Ortotipográfico RAE"
                    allow="clipboard-read; clipboard-write"
                />
            </div>

            <div className="mt-8 p-6 bg-gray-800/40 rounded-lg border border-gray-700 space-y-4">
                <h3 className="text-xl font-bold text-[--accent]">Corrector Ortotipográfico RAE</h3>
                <p className="text-gray-300">
                    Corrección ortográfica, tipográfica y de estilo según las normas de la Real Academia Española.
                    Motor: LanguageTool API.
                </p>
                <p className="text-sm text-gray-400">
                    100% en tu navegador · Firebase Hosting · Sin servidor
                </p>
            </div>
        </div>
    );
}
