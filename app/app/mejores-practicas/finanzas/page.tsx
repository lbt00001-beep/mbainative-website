import { pageMetadata } from '@/lib/seo';
export const metadata = pageMetadata("/mejores-practicas/finanzas");
import Link from "next/link";
import QuoteCard from "../../../components/QuoteCard";

const principios = [
    {
        titulo: "Detección de Fraude en Tiempo Real",
        descripcion: "IA analiza patrones de transacciones en tiempo real para detectar actividades sospechosas más rápido que los métodos tradicionales.",
        aplicacion: "Reducción de pérdidas por fraude hasta un 50%",
    },
    {
        titulo: "Evaluación de Riesgo Crediticio",
        descripcion: "Algoritmos de ML analizan datos alternativos además de historial crediticio para evaluar riesgo de forma más precisa.",
        aplicacion: "Mejor inclusión financiera y reducción de impagos",
    },
    {
        titulo: "Asistentes Virtuales 24/7",
        descripcion: "Chatbots IA proveen soporte continuo para consultas sobre productos, pagos y transacciones.",
        aplicacion: "Reducción de tiempos de espera y costes de atención",
    },
    {
        titulo: "Automatización de Procesos Back-Office",
        descripcion: "RPA e IA automatizan aprobación de préstamos, gestión de documentos y cumplimiento normativo.",
        aplicacion: "Ahorro del 10% anual en costes operativos",
    },
    {
        titulo: "Workforce Híbrida: Upskilling",
        descripcion: "73% del tiempo de empleados bancarios puede ser impactado por IA generativa. Requiere reskilling continuo.",
        aplicacion: "Empleados pasan de tareas repetitivas a roles estratégicos",
    },
    {
        titulo: "Gobernanza y Cumplimiento IA",
        descripcion: "Establecer programas robustos de IA que definan uso aceptable, supervisen sistemas y aseguren cumplimiento regulatorio.",
        aplicacion: "Adaptación a EU AI Act y regulaciones emergentes",
    },
];

const citasDestacadas = [
    {
        quote: "La IA impactará casi todos los trabajos en un banco, requiriendo nuevas estrategias de desarrollo de talento.",
        author: "McKinsey",
        title: "Informe",
        company: "McKinsey & Company",
        sourceUrl: "https://www.mckinsey.com/",
    },
    {
        quote: "El éxito con IA depende más de la adopción humana que de la tecnología en sí.",
        author: "IBM",
        title: "Estudio",
        company: "IBM Institute for Business Value",
        sourceUrl: "https://www.ibm.com/",
    },
];

export default function FinanzasPage() {
    return (
        <section className="py-20 px-4 bg-[--primary] text-[--foreground]">
            <div className="container mx-auto">
                <div className="mb-8">
                    <Link href="/mejores-practicas" className="text-[--accent] hover:underline">
                        ← Volver a Mejores Prácticas
                    </Link>
                </div>

                <div className="text-center mb-16">
                    <div className="text-6xl mb-4">💰</div>
                    <h1 className="text-5xl font-extrabold mb-6">
                        Sector <span className="text-[--accent]">Financiero</span>
                    </h1>
                    <p className="text-xl max-w-3xl mx-auto text-gray-300">
                        Transformación digital en banca y servicios financieros: desde detección de fraude hasta gestión de riesgo con IA.
                    </p>
                </div>

                <div className="mb-16">
                    <h2 className="text-3xl font-bold text-center mb-8">
                        Mejores Prácticas IA en Finanzas
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
                    <h2 className="text-3xl font-bold text-center mb-8">Insights de la Industria</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {citasDestacadas.map((cita, index) => (
                            <QuoteCard key={index} {...cita} />
                        ))}
                    </div>
                </div>

                <div className="bg-gradient-to-r from-[--accent]/20 to-[--dark-gray] rounded-xl p-8 mb-16">
                    <h2 className="text-2xl font-bold text-[--accent] mb-4">
                        📊 Datos Clave del Sector (2024)
                    </h2>
                    <ul className="space-y-3 text-gray-200">
                        <li>✓ <strong>$4.9B</strong> inversión proyectada en IA bancaria</li>
                        <li>✓ <strong>90%+</strong> de bancos invirtiendo activamente en IA</li>
                        <li>✓ <strong>39%</strong> de tareas bancarias pueden automatizarse con IA generativa</li>
                        <li>✓ <strong>20-30%</strong> aumento de productividad con automatización IA</li>
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
