import Link from "next/link";
import QuoteCard from "../../components/QuoteCard";

const sectores = [
    {
        id: "tecnologia",
        nombre: "Tecnología",
        descripcion: "Líderes tech como Jensen Huang, Sundar Pichai y Sam Altman.",
        icono: "💻",
    },
    {
        id: "finanzas",
        nombre: "Finanzas",
        descripcion: "Transformación digital en banca y servicios financieros.",
        icono: "💰",
    },
    {
        id: "salud",
        nombre: "Salud",
        descripcion: "IA en diagnóstico, tratamiento y gestión sanitaria.",
        icono: "🏥",
    },
    {
        id: "retail",
        nombre: "Retail",
        descripcion: "Automatización y personalización en comercio.",
        icono: "🛒",
    },
    {
        id: "manufactura",
        nombre: "Manufactura",
        descripcion: "Robótica, mantenimiento predictivo y cadena de suministro.",
        icono: "🏭",
    },
];

const citasDestacadas = [
    {
        quote: "La IA eliminará categorías enteras de trabajos... pero abrirá oportunidades que hoy parecen imposibles.",
        author: "Sam Altman",
        title: "CEO",
        company: "OpenAI",
        sourceUrl: "https://www.weforum.org/",
    },
    {
        quote: "Habrá empleos, la cuestión es la forma de estos empleos. Todos podrán ser expertos en cualquier cosa porque tendrán un asistente de IA.",
        author: "Satya Nadella",
        title: "CEO",
        company: "Microsoft",
        sourceUrl: "https://www.microsoft.com/",
    },
    {
        quote: "Los departamentos de TI se convertirán en departamentos de RRHH... para empleados digitales.",
        author: "Jensen Huang",
        title: "CEO",
        company: "NVIDIA",
        videoUrl: "https://www.youtube.com/watch?v=dfnJFwcKiuI",
    },
    {
        quote: "La IA es la tecnología más profunda en la que la humanidad ha trabajado. Más profunda que la electricidad o el fuego.",
        author: "Sundar Pichai",
        title: "CEO",
        company: "Google/Alphabet",
        sourceUrl: "https://www.inc.com/",
    },
];

export default function MejoresPracticas() {
    return (
        <section className="py-20 px-4 bg-[--primary] text-[--foreground]">
            <div className="container mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-5xl font-extrabold mb-6">
                        Mejores Prácticas <span className="text-[--accent]">AI-Native</span>
                    </h1>
                    <p className="text-xl max-w-3xl mx-auto text-gray-300">
                        Doctrina y principios de gestión empresarial en la era de la Inteligencia Artificial,
                        extraídos de los líderes más influyentes de la industria.
                    </p>
                </div>

                {/* Citas Destacadas */}
                <div className="mb-20">
                    <h2 className="text-3xl font-bold text-center mb-8 text-[--accent]">
                        Voces del Liderazgo AI
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {citasDestacadas.map((cita, index) => (
                            <QuoteCard key={index} {...cita} />
                        ))}
                    </div>
                </div>

                {/* Sectores */}
                <div>
                    <h2 className="text-3xl font-bold text-center mb-8">
                        Explora por Sector
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sectores.map((sector) => (
                            <Link
                                key={sector.id}
                                href={`/mejores-practicas/${sector.id}`}
                                className="bg-[--dark-gray] p-8 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-center group"
                            >
                                <div className="text-5xl mb-4">{sector.icono}</div>
                                <h3 className="text-2xl font-bold text-[--accent] mb-2 group-hover:text-white transition-colors">
                                    {sector.nombre}
                                </h3>
                                <p className="text-gray-400">{sector.descripcion}</p>
                            </Link>
                        ))}
                        {/* Noticias IA */}
                        <Link
                            href="/mejores-practicas/noticias"
                            className="bg-gradient-to-br from-[--accent] to-[--accent-secondary] p-8 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-center group"
                        >
                            <div className="text-5xl mb-4">🔥</div>
                            <h3 className="text-2xl font-bold text-white mb-2">
                                Últimas Noticias IA
                            </h3>
                            <p className="text-white/80">Actualizado diariamente desde Google, Microsoft y NVIDIA.</p>
                        </Link>
                        {/* Gurús de la IA */}
                        <Link
                            href="/mejores-practicas/gurus"
                            className="bg-gradient-to-br from-purple-600 to-pink-500 p-8 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-center group"
                        >
                            <div className="text-5xl mb-4">🧠</div>
                            <h3 className="text-2xl font-bold text-white mb-2">
                                ¿Qué dicen los Gurús?
                            </h3>
                            <p className="text-white/80">14 líderes de IA: Hinton, LeCun, Altman, Hassabis y más.</p>
                        </Link>
                        {/* 10 Doctrinas */}
                        <Link
                            href="/mejores-practicas/doctrinas"
                            className="bg-gradient-to-br from-emerald-600 to-cyan-500 p-8 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-center group"
                        >
                            <div className="text-5xl mb-4">📜</div>
                            <h3 className="text-2xl font-bold text-white mb-2">
                                10 Doctrinas de la IA
                            </h3>
                            <p className="text-white/80">Tesis, impulsores y objeciones del debate actual.</p>
                        </Link>
                    </div>
                </div>

                {/* CTA */}
                <div className="mt-16 text-center">
                    <p className="text-gray-400 mb-4">
                        ¿Quieres profundizar en la gestión AI-native?
                    </p>
                    <Link
                        href="/services"
                        className="bg-[--accent] hover:bg-[--accent]/90 text-[--primary] font-bold py-3 px-8 rounded-lg transition-colors inline-block"
                    >
                        Conoce Nuestros Servicios
                    </Link>
                </div>
            </div>
        </section>
    );
}
