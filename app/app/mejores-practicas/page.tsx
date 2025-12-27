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
        quote: "Los departamentos de TI se convertirán en departamentos de RRHH... para empleados digitales.",
        author: "Jensen Huang",
        title: "CEO",
        company: "NVIDIA",
        videoUrl: "https://www.youtube.com/watch?v=dfnJFwcKiuI",
    },
    {
        quote: "Habrá empleos, la cuestión es la forma de estos empleos. Todos podrán ser expertos en cualquier cosa porque tendrán un asistente de IA.",
        author: "Satya Nadella",
        title: "CEO",
        company: "Microsoft",
        sourceUrl: "https://www.microsoft.com/",
    },
    {
        quote: "La IA eliminará categorías enteras de trabajos... pero abrirá oportunidades que hoy parecen imposibles.",
        author: "Sam Altman",
        title: "CEO",
        company: "OpenAI",
        sourceUrl: "https://www.weforum.org/",
    },
    {
        quote: "En el futuro, no habrá trabajadores de cuello blanco ni cuello azul, solo trabajadores de cuello nuevo: humanos que trabajan con agentes.",
        author: "Mustafa Suleyman",
        title: "CEO",
        company: "Microsoft AI",
        sourceUrl: "https://www.microsoft.com/",
    },
];

const principiosDestacados = [
    {
        numero: "01",
        titulo: "Inteligencia Comprable",
        descripcion: "La inteligencia se compra en tokens. El coste marginal tiende a cero.",
        icono: "🪙",
    },
    {
        numero: "02",
        titulo: "Empleados de Silicio",
        descripcion: "Agentes de IA que ejecutan tareas cada vez más versátiles.",
        icono: "🤖",
    },
    {
        numero: "03",
        titulo: "Organización por Tareas",
        descripcion: "No hay puestos: hay tareas que ejecutan agentes y supervisan personas.",
        icono: "📋",
    },
    {
        numero: "04",
        titulo: "Autonomía Configurable",
        descripcion: "Los supervisores configuran cuánta autonomía dar a cada agente.",
        icono: "🎚️",
    },
];

export default function MejoresPracticas() {
    return (
        <section className="py-20 px-4 bg-[--primary] text-[--foreground]">
            <div className="container mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-5xl font-extrabold mb-6">
                        Doctrina de la Empresa <span className="text-[--accent]">AI-Nativa</span>
                    </h1>
                    <p className="text-xl max-w-3xl mx-auto text-gray-300">
                        Los principios que definen cómo organizar, dirigir y escalar empresas
                        en la era de los agentes de IA. 20 doctrinas, 14 gurús, 5 sectores.
                    </p>
                </div>

                {/* Principios Destacados */}
                <div className="mb-20">
                    <h2 className="text-3xl font-bold text-center mb-8 text-[--accent]">
                        Principios Fundamentales
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {principiosDestacados.map((principio) => (
                            <div
                                key={principio.numero}
                                className="bg-[--dark-gray] p-6 rounded-lg border border-gray-700 hover:border-[--accent] transition-colors"
                            >
                                <span className="text-3xl mb-3 block">{principio.icono}</span>
                                <span className="text-xs text-gray-500 font-mono">#{principio.numero}</span>
                                <h3 className="text-lg font-bold text-[--accent] mb-2">
                                    {principio.titulo}
                                </h3>
                                <p className="text-gray-400 text-sm">{principio.descripcion}</p>
                            </div>
                        ))}
                    </div>
                    <div className="text-center">
                        <Link
                            href="/mejores-practicas/doctrinas"
                            className="inline-flex items-center gap-2 bg-[--accent] text-[--primary] font-bold py-3 px-6 rounded-lg hover:bg-[--accent]/90 transition-colors"
                        >
                            Ver las 20 Doctrinas Completas →
                        </Link>
                    </div>
                </div>

                {/* Citas Destacadas */}
                <div className="mb-20">
                    <h2 className="text-3xl font-bold text-center mb-8">
                        Voces del Liderazgo sobre <span className="text-[--accent]">Agentes y Trabajo</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {citasDestacadas.map((cita, index) => (
                            <QuoteCard key={index} {...cita} />
                        ))}
                    </div>
                </div>

                {/* Secciones */}
                <div>
                    <h2 className="text-3xl font-bold text-center mb-8">
                        Explora por Sección
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* 20 Doctrinas */}
                        <Link
                            href="/mejores-practicas/doctrinas"
                            className="bg-gradient-to-br from-emerald-600 to-cyan-500 p-8 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-center group"
                        >
                            <div className="text-5xl mb-4">📜</div>
                            <h3 className="text-2xl font-bold text-white mb-2">
                                20 Doctrinas AI-Nativas
                            </h3>
                            <p className="text-white/80">Organización, tecnología y ética de la empresa con agentes.</p>
                        </Link>
                        {/* Gurús de la IA */}
                        <Link
                            href="/mejores-practicas/gurus"
                            className="bg-gradient-to-br from-purple-600 to-pink-500 p-8 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-center group"
                        >
                            <div className="text-5xl mb-4">🧠</div>
                            <h3 className="text-2xl font-bold text-white mb-2">
                                14 Gurús de la IA
                            </h3>
                            <p className="text-white/80">Hinton, LeCun, Altman, Hassabis... y sus visiones sobre el futuro.</p>
                        </Link>
                        {/* Noticias IA */}
                        <Link
                            href="/mejores-practicas/noticias"
                            className="bg-gradient-to-br from-[--accent] to-[--accent-secondary] p-8 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-center group"
                        >
                            <div className="text-5xl mb-4">🔥</div>
                            <h3 className="text-2xl font-bold text-white mb-2">
                                Noticias de IA
                            </h3>
                            <p className="text-white/80">Actualizado diariamente desde Google, Microsoft y NVIDIA.</p>
                        </Link>
                    </div>
                </div>

                {/* Sectores */}
                <div className="mt-16">
                    <h2 className="text-3xl font-bold text-center mb-8">
                        Explora por Sector
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {sectores.map((sector) => (
                            <Link
                                key={sector.id}
                                href={`/mejores-practicas/${sector.id}`}
                                className="bg-[--dark-gray] p-4 rounded-lg shadow hover:shadow-lg hover:scale-105 transition-all duration-300 text-center group"
                            >
                                <div className="text-3xl mb-2">{sector.icono}</div>
                                <h3 className="text-lg font-bold text-[--accent] group-hover:text-white transition-colors">
                                    {sector.nombre}
                                </h3>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <div className="mt-16 text-center">
                    <p className="text-gray-400 mb-4">
                        ¿Quieres practicar la gestión de una empresa AI-Nativa?
                    </p>
                    <Link
                        href="https://juego-empresa-ia-mbai-797037398090.europe-west1.run.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[--accent] hover:bg-[--accent]/90 text-[--primary] font-bold py-3 px-8 rounded-lg transition-colors inline-block"
                    >
                        🎮 Probar el Simulador Empresarial
                    </Link>
                </div>
            </div>
        </section>
    );
}
