import Link from "next/link";
import QuoteCard from "../../../components/QuoteCard";

const principios = [
    {
        titulo: "Mantenimiento Predictivo",
        descripcion: "IA analiza datos de sensores para predecir fallos de equipos antes de que ocurran, reduciendo paradas no planificadas.",
        aplicacion: "Reducción de downtime hasta 50% (Johnson & Johnson India)",
    },
    {
        titulo: "Control de Calidad con Visión IA",
        descripcion: "Algoritmos de computer vision identifican defectos y anomalías con mayor precisión y velocidad que inspección humana.",
        aplicacion: "Foxconn mejoró calidad integrando visión IA en producción",
    },
    {
        titulo: "Optimización de Procesos",
        descripcion: "IA analiza flujos de trabajo para identificar ineficiencias y optimizar producción.",
        aplicacion: "GE logró 45-60% mejora en efectividad de equipos",
    },
    {
        titulo: "Robots Colaborativos (Cobots)",
        descripcion: "Cobots trabajan junto a empleados humanos, mejorando productividad y seguridad gracias a sensores avanzados.",
        aplicacion: "Flexibilidad y fácil programación para tareas variadas",
    },
    {
        titulo: "Gemelos Digitales",
        descripcion: "Réplicas virtuales de activos y procesos para simular, analizar y optimizar operaciones antes de implementar cambios.",
        aplicacion: "Reducción de riesgos y tiempo de implementación",
    },
    {
        titulo: "Gestión de Cadena de Suministro",
        descripcion: "IA optimiza inventarios, predice fluctuaciones de demanda e identifica proveedores alternativos.",
        aplicacion: "Cadenas de suministro más resilientes y responsivas",
    },
];

const citasDestacadas = [
    {
        quote: "ASML logró 10x aumento en rendimiento del equipo de desarrollo y 40% mejora en time-to-market usando IA.",
        author: "ASML",
        title: "Caso de Estudio",
        company: "ASML + Google Cloud",
        sourceUrl: "https://cloud.google.com/",
    },
    {
        quote: "Siemens emplea IA para mantenimiento predictivo usando sensores IoT, reduciendo costes de mantenimiento.",
        author: "Siemens",
        title: "Implementación",
        company: "Siemens",
        sourceUrl: "https://www.siemens.com/",
    },
];

export default function ManufacturaPage() {
    return (
        <section className="py-20 px-4 bg-[--primary] text-[--foreground]">
            <div className="container mx-auto">
                <div className="mb-8">
                    <Link href="/mejores-practicas" className="text-[--accent] hover:underline">
                        ← Volver a Mejores Prácticas
                    </Link>
                </div>

                <div className="text-center mb-16">
                    <div className="text-6xl mb-4">🏭</div>
                    <h1 className="text-5xl font-extrabold mb-6">
                        Sector <span className="text-[--accent]">Manufactura</span>
                    </h1>
                    <p className="text-xl max-w-3xl mx-auto text-gray-300">
                        Industry 4.0: Robótica, mantenimiento predictivo, gemelos digitales y optimización de cadena de suministro.
                    </p>
                </div>

                <div className="mb-16">
                    <h2 className="text-3xl font-bold text-center mb-8">
                        Mejores Prácticas IA en Manufactura
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
                                <div className="text-sm text-[--accent] font-medium">
                                    ✓ {principio.aplicacion}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mb-16">
                    <h2 className="text-3xl font-bold text-center mb-8">Casos de Éxito</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {citasDestacadas.map((cita, index) => (
                            <QuoteCard key={index} {...cita} />
                        ))}
                    </div>
                </div>

                <div className="bg-gradient-to-r from-[--accent]/20 to-[--dark-gray] rounded-xl p-8 mb-16">
                    <h2 className="text-2xl font-bold text-[--accent] mb-4">
                        ⚙️ Roadmap de Implementación
                    </h2>
                    <ul className="space-y-3 text-gray-200">
                        <li>✓ <strong>Identificar oportunidades:</strong> Dónde IA puede optimizar diseño, eficiencia o producción</li>
                        <li>✓ <strong>Gestión de datos:</strong> Invertir en infraestructura de datos robusta</li>
                        <li>✓ <strong>Mejora continua:</strong> Usar feedback loops para refinar modelos</li>
                        <li>✓ <strong>Empoderar workforce:</strong> Herramientas y formación para operarios</li>
                    </ul>
                </div>

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
