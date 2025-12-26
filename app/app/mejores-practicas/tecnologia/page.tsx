import Link from "next/link";
import QuoteCard from "../../../components/QuoteCard";

const principios = [
    {
        titulo: "Estructura Organizativa Plana",
        descripcion: "Eliminar capas de gestión innecesarias para fomentar velocidad y agilidad en la toma de decisiones.",
        cita: "Flatten the organization. Speed is everything.",
        autor: "Jensen Huang",
        empresa: "NVIDIA",
    },
    {
        titulo: "Transparencia Radical",
        descripcion: "Compartir información ampliamente en toda la organización, incluyendo a empleados junior, para asegurar que todos trabajan con el mismo contexto.",
        cita: "Information should be a public good within the company.",
        autor: "Jensen Huang",
        empresa: "NVIDIA",
    },
    {
        titulo: "Estrategia Dictada por Ejecución",
        descripcion: "En lugar de planes anuales rígidos, la estrategia emerge de la ejecución continua y la adaptación.",
        cita: "Strategy is dictated by execution, not the other way around.",
        autor: "Jensen Huang",
        empresa: "NVIDIA",
    },
    {
        titulo: "Pilot in Command (PIC)",
        descripcion: "Un solo individuo es responsable de cada proyecto clave, con accountability directa sobre los resultados.",
        cita: "One person owns the outcome. No committees, no shared responsibility.",
        autor: "Jensen Huang",
        empresa: "NVIDIA",
    },
    {
        titulo: "Workforce Híbrida Humano-IA",
        descripcion: "El futuro de la fuerza laboral combina empleados humanos con 'empleados digitales' (agentes IA) que serán gestionados por RRHH.",
        cita: "IT departments will become HR departments for digital workers.",
        autor: "Jensen Huang",
        empresa: "NVIDIA",
    },
    {
        titulo: "Liderazgo como Enseñanza",
        descripcion: "El líder actúa como maestro, utilizando métodos como pizarras para simplificar ideas complejas y asegurar alineación del equipo.",
        cita: "I see myself as a teacher, not a boss.",
        autor: "Jensen Huang",
        empresa: "NVIDIA",
    },
];

const citasAdicionales = [
    {
        quote: "La IA eliminará categorías enteras de trabajos, especialmente muchos roles de entrada. Pero abrirá oportunidades que hoy parecen imposibles.",
        author: "Sam Altman",
        title: "CEO",
        company: "OpenAI",
        sourceUrl: "https://www.weforum.org/",
    },
    {
        quote: "Todos podrán ser expertos en cualquier cosa porque tendrán un asistente de IA. Esto democratiza la expertise.",
        author: "Satya Nadella",
        title: "CEO",
        company: "Microsoft",
        sourceUrl: "https://www.microsoft.com/",
    },
    {
        quote: "La IA liberará a los programadores para enfocarse en la creatividad. Ya genera más del 30% del código de Google.",
        author: "Sundar Pichai",
        title: "CEO",
        company: "Google/Alphabet",
        sourceUrl: "https://dig.watch/",
    },
    {
        quote: "El 30-40% de las tareas en la economía podrían ser realizadas por IA en un futuro no muy lejano.",
        author: "Sam Altman",
        title: "CEO",
        company: "OpenAI",
        sourceUrl: "https://hbs.edu/",
    },
];

export default function TecnologiaPage() {
    return (
        <section className="py-20 px-4 bg-[--primary] text-[--foreground]">
            <div className="container mx-auto">
                {/* Breadcrumb */}
                <div className="mb-8">
                    <Link href="/mejores-practicas" className="text-[--accent] hover:underline">
                        ← Volver a Mejores Prácticas
                    </Link>
                </div>

                {/* Header */}
                <div className="text-center mb-16">
                    <div className="text-6xl mb-4">💻</div>
                    <h1 className="text-5xl font-extrabold mb-6">
                        Sector <span className="text-[--accent]">Tecnológico</span>
                    </h1>
                    <p className="text-xl max-w-3xl mx-auto text-gray-300">
                        Principios de gestión AI-native de los líderes más influyentes:
                        Jensen Huang (NVIDIA), Sam Altman (OpenAI), Satya Nadella (Microsoft) y Sundar Pichai (Google).
                    </p>
                </div>

                {/* Video Destacado */}
                <div className="mb-16 bg-[--dark-gray] rounded-xl p-8 text-center">
                    <h2 className="text-2xl font-bold text-[--accent] mb-4">📺 Fuente Principal</h2>
                    <p className="text-gray-300 mb-4">
                        Jensen Huang - Canal oficial con todas sus charlas sobre empresas AI-native
                    </p>
                    <a
                        href="https://www.youtube.com/@JensenNvidia"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg inline-flex items-center gap-2 transition-colors"
                    >
                        🎥 Ver Canal de Jensen Huang
                    </a>
                </div>

                {/* Principios de Jensen Huang */}
                <div className="mb-16">
                    <h2 className="text-3xl font-bold text-center mb-8">
                        Los 6 Principios de Jensen Huang
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {principios.map((principio, index) => (
                            <div
                                key={index}
                                className="bg-[--dark-gray] rounded-xl p-6 hover:shadow-xl transition-all duration-300"
                            >
                                <div className="text-3xl font-bold text-[--accent] mb-2">
                                    {String(index + 1).padStart(2, "0")}
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">
                                    {principio.titulo}
                                </h3>
                                <p className="text-gray-400 mb-4">{principio.descripcion}</p>
                                <blockquote className="text-sm italic text-[--accent] border-l-2 border-[--accent] pl-4">
                                    "{principio.cita}"
                                </blockquote>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Otras voces */}
                <div className="mb-16">
                    <h2 className="text-3xl font-bold text-center mb-8">
                        Otras Voces del Liderazgo Tech
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {citasAdicionales.map((cita, index) => (
                            <QuoteCard key={index} {...cita} />
                        ))}
                    </div>
                </div>

                {/* Resumen */}
                <div className="bg-gradient-to-r from-[--accent]/20 to-[--dark-gray] rounded-xl p-8 mb-16">
                    <h2 className="text-2xl font-bold text-[--accent] mb-4">
                        💡 Conclusión para Empresas Tecnológicas
                    </h2>
                    <ul className="space-y-3 text-gray-200">
                        <li>✓ <strong>Velocidad sobre jerarquía:</strong> Eliminar burocracia y capas de gestión.</li>
                        <li>✓ <strong>Información como bien público:</strong> Todos deben tener acceso al mismo contexto.</li>
                        <li>✓ <strong>Accountability individual:</strong> Un responsable por proyecto.</li>
                        <li>✓ <strong>Prepararse para workforce híbrida:</strong> Humanos + agentes IA trabajando juntos.</li>
                        <li>✓ <strong>Aprendizaje continuo:</strong> Las habilidades de hoy no serán suficientes mañana.</li>
                    </ul>
                </div>

                {/* CTA */}
                <div className="text-center">
                    <Link
                        href="/mejores-practicas"
                        className="bg-[--accent] hover:bg-[--accent]/90 text-[--primary] font-bold py-3 px-8 rounded-lg transition-colors inline-block"
                    >
                        Explorar Otros Sectores
                    </Link>
                </div>
            </div>
        </section>
    );
}
