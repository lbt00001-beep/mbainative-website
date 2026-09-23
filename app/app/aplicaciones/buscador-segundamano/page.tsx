import { pageMetadata } from '@/lib/seo';
export const metadata = pageMetadata("/aplicaciones/buscador-segundamano");
import BuscadorSegundamano from "@/components/aplicaciones/BuscadorSegundamano";

export default function BuscadorSegundamanoPage() {
    return (
        <section className="py-16 md:py-20 px-4 bg-[--primary] text-[--foreground] min-h-screen">
            <div className="container mx-auto max-w-7xl">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-xs font-semibold mb-4">
                        <span>Wallapop • Milanuncios • Vinted</span>
                        <span>•</span>
                        <span>Coincidencia Exacta</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight">
                        Buscador <span className="text-[--accent]">Segunda Mano Multitienda</span>
                    </h1>
                    <p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto">
                        Encuentra exactamente lo que buscas sin aproximaciones no deseadas, con ordenación inmediata por precio, cercanía a Madrid y fecha.
                    </p>
                </div>

                <BuscadorSegundamano />
            </div>
        </section>
    );
}
