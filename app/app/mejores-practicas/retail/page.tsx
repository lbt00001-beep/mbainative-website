import Link from "next/link";
import QuoteCard from "../../../components/QuoteCard";

const principios = [
    {
        titulo: "Chatbots y Atención 24/7",
        descripcion: "Asistentes virtuales IA manejan consultas rutinarias sobre productos, envíos y pagos, liberando agentes humanos para casos complejos.",
        aplicacion: "Reducción de tiempos de respuesta y costes de soporte",
    },
    {
        titulo: "Hiper-Personalización",
        descripcion: "IA analiza comportamiento, preferencias e historial de compras para ofrecer recomendaciones y ofertas personalizadas.",
        aplicacion: "Aumento de conversiones y satisfacción del cliente",
    },
    {
        titulo: "Gestión Inteligente de Inventario",
        descripcion: "Algoritmos predicen demanda, optimizan stock y reducen tanto sobrestock como roturas de inventario.",
        aplicacion: "Mejora de márgenes y reducción de pérdidas",
    },
    {
        titulo: "Experiencia Omnicanal",
        descripcion: "IA facilita un viaje del cliente coherente entre canales digitales y tiendas físicas.",
        aplicacion: "Integración de CRM, probadores virtuales y espejos inteligentes",
    },
    {
        titulo: "Análisis de Sentimiento",
        descripcion: "IA analiza feedback de clientes y reconoce emociones en interacciones de voz para adaptar respuestas.",
        aplicacion: "Resolución proactiva de problemas y mayor fidelización",
    },
    {
        titulo: "Búsqueda Generativa",
        descripcion: "Herramientas de IA generativa ayudan a consumidores a encontrar productos y ofertas más eficientemente.",
        aplicacion: "Mayor tráfico desde búsquedas impulsadas por IA",
    },
];

const citasDestacadas = [
    {
        quote: "En 2024, la IA pasó de ser una tendencia emergente a un componente esencial de la innovación retail.",
        author: "Forbes",
        title: "Análisis",
        company: "Forbes",
        sourceUrl: "https://www.forbes.com/",
    },
];

export default function RetailPage() {
    return (
        <section className="py-20 px-4 bg-[--primary] text-[--foreground]">
            <div className="container mx-auto">
                <div className="mb-8">
                    <Link href="/mejores-practicas" className="text-[--accent] hover:underline">
                        ← Volver a Mejores Prácticas
                    </Link>
                </div>

                <div className="text-center mb-16">
                    <div className="text-6xl mb-4">🛒</div>
                    <h1 className="text-5xl font-extrabold mb-6">
                        Sector <span className="text-[--accent]">Retail</span>
                    </h1>
                    <p className="text-xl max-w-3xl mx-auto text-gray-300">
                        Automatización y personalización en comercio: desde chatbots hasta experiencias omnicanal.
                    </p>
                </div>

                <div className="mb-16">
                    <h2 className="text-3xl font-bold text-center mb-8">
                        Mejores Prácticas IA en Retail
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
                    <h2 className="text-3xl font-bold text-center mb-8">Insights del Sector</h2>
                    <div className="max-w-2xl mx-auto">
                        {citasDestacadas.map((cita, index) => (
                            <QuoteCard key={index} {...cita} />
                        ))}
                    </div>
                </div>

                <div className="bg-gradient-to-r from-[--accent]/20 to-[--dark-gray] rounded-xl p-8 mb-16">
                    <h2 className="text-2xl font-bold text-[--accent] mb-4">
                        🎯 Claves para el Éxito
                    </h2>
                    <ul className="space-y-3 text-gray-200">
                        <li>✓ <strong>Objetivos claros:</strong> Definir KPIs antes de implementar IA</li>
                        <li>✓ <strong>Datos de calidad:</strong> La IA es tan buena como sus datos</li>
                        <li>✓ <strong>Transparencia:</strong> Informar a clientes sobre uso de IA</li>
                        <li>✓ <strong>Balance humano-IA:</strong> Reservar casos complejos para agentes humanos</li>
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
