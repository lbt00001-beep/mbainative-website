import CorrectorRAE from "@/components/aplicaciones/CorrectorRAE";

export default function CorrectorRAEPage() {
    return (
        <section className="py-20 px-4 bg-[--primary] text-[--foreground] min-h-screen">
            <div className="container mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
                        Corrector <span className="text-[--accent]">Ortotipográfico RAE</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Corrige tu texto siguiendo las normas de la Real Academia Española.
                        Comillas, mayúsculas, puntuación y más.
                    </p>
                </div>

                <CorrectorRAE />
            </div>
        </section>
    );
}
