import Link from "next/link";
import QuoteCard from "../../../components/QuoteCard";

const principios = [
    {
        titulo: "Diagnóstico Asistido por IA",
        descripcion: "Algoritmos analizan imágenes médicas (radiografías, resonancias) para detectar enfermedades como cáncer con alta precisión.",
        aplicacion: "Detección temprana y mejores resultados clínicos",
    },
    {
        titulo: "Medicina Personalizada",
        descripcion: "IA analiza datos genéticos, historial médico y estilo de vida para crear planes de tratamiento individualizados.",
        aplicacion: "Tratamientos más efectivos en oncología y enfermedades crónicas",
    },
    {
        titulo: "Cirugía Robótica",
        descripcion: "Sistemas robóticos asistidos por IA ofrecen mayor precisión, procedimientos mínimamente invasivos y recuperación más rápida.",
        aplicacion: "Menor riesgo de complicaciones y hospitalizaciones",
    },
    {
        titulo: "Asistentes Virtuales de Salud",
        descripcion: "Chatbots 24/7 para citas, recordatorios de medicación, soporte mental y respuestas a consultas.",
        aplicacion: "Mejora de engagement del paciente y eficiencia operativa",
    },
    {
        titulo: "Analítica Predictiva",
        descripcion: "Monitorización de signos vitales para predecir deterioro de pacientes y anticipar brotes de enfermedades.",
        aplicacion: "Intervenciones proactivas que salvan vidas",
    },
    {
        titulo: "Automatización Administrativa",
        descripcion: "IA automatiza programación de citas, facturación, codificación médica y gestión de historiales electrónicos.",
        aplicacion: "Reducción de carga burocrática para profesionales sanitarios",
    },
];

const citasDestacadas = [
    {
        quote: "La IA debe usarse como herramienta asistencial o exploratoria, no para tomar decisiones autónomas.",
        author: "AMA",
        title: "Directrices",
        company: "American Medical Association",
        sourceUrl: "https://www.ama-assn.org/",
    },
    {
        quote: "La OMS enfatiza que los sistemas de IA en salud deben ser justos, transparentes y centrados en el paciente.",
        author: "WHO",
        title: "Guía Ética",
        company: "World Health Organization",
        sourceUrl: "https://www.who.int/",
    },
];

export default function SaludPage() {
    return (
        <section className="py-20 px-4 bg-[--primary] text-[--foreground]">
            <div className="container mx-auto">
                <div className="mb-8">
                    <Link href="/mejores-practicas" className="text-[--accent] hover:underline">
                        ← Volver a Mejores Prácticas
                    </Link>
                </div>

                <div className="text-center mb-16">
                    <div className="text-6xl mb-4">🏥</div>
                    <h1 className="text-5xl font-extrabold mb-6">
                        Sector <span className="text-[--accent]">Salud</span>
                    </h1>
                    <p className="text-xl max-w-3xl mx-auto text-gray-300">
                        IA en diagnóstico, tratamiento personalizado, cirugía robótica y gestión hospitalaria.
                    </p>
                </div>

                <div className="mb-16">
                    <h2 className="text-3xl font-bold text-center mb-8">
                        Mejores Prácticas IA en Salud
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
                    <h2 className="text-3xl font-bold text-center mb-8">Directrices Éticas</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {citasDestacadas.map((cita, index) => (
                            <QuoteCard key={index} {...cita} />
                        ))}
                    </div>
                </div>

                <div className="bg-gradient-to-r from-[--accent]/20 to-[--dark-gray] rounded-xl p-8 mb-16">
                    <h2 className="text-2xl font-bold text-[--accent] mb-4">
                        ⚕️ Consideraciones Éticas
                    </h2>
                    <ul className="space-y-3 text-gray-200">
                        <li>✓ <strong>Consentimiento informado:</strong> Pacientes deben saber cuándo se usa IA</li>
                        <li>✓ <strong>Privacidad de datos:</strong> Cumplimiento de HIPAA y GDPR</li>
                        <li>✓ <strong>Sesgo algorítmico:</strong> Validar modelos para evitar discriminación</li>
                        <li>✓ <strong>Supervisión humana:</strong> Médicos deben validar decisiones de IA</li>
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
