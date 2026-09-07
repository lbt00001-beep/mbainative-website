import Link from "next/link";

const DoctrineItem = ({ icon, title, description, number }: { icon: string, title: string, description: string, number: number }) => (
  <div className="p-6 bg-[--dark-gray] rounded-lg shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group">
    <div className="flex items-start gap-4">
      <span className="text-3xl">{icon}</span>
      <div>
        <span className="text-xs text-gray-500 font-mono">#{String(number).padStart(2, '0')}</span>
        <h3 className="text-xl font-semibold mb-2 text-[--accent] group-hover:text-white transition-colors">
          {title}
        </h3>
        <p className="text-gray-400 text-sm leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  </div>
);

// Los 8 principios fundamentales del usuario (resumen para la home)
const principiosFundamentales = [
  {
    number: 1,
    icon: "🪙",
    title: "El talento artificial se compra",
    description: "El talento personal se contrata, el talento artificial se compra. Google, OpenAI, Anthropic... venden la inteligencia de sus modelos en tokens."
  },
  {
    number: 2,
    icon: "🤖",
    title: "Empleados de Silicio",
    description: "Los agentes de IA son trabajadores digitales que ejecutan tareas cada vez más versátiles."
  },
  {
    number: 3,
    icon: "📋",
    title: "Organización por Tareas",
    description: "No hay puestos de trabajo: hay tareas que ejecutan agentes y supervisan personas."
  },
  {
    number: 4,
    icon: "🏗️",
    title: "El Nuevo Organigrama",
    description: "Diseñar la estructura de tareas es una nueva ciencia de eficiencia empresarial."
  },
  {
    number: 5,
    icon: "↔️",
    title: "Información Horizontal",
    description: "La información fluye horizontalmente, disponible para todos: humanos y agentes."
  },
  {
    number: 6,
    icon: "🎚️",
    title: "Autonomía Configurable",
    description: "Los supervisores configuran cuánta autonomía dar a cada agente: consulta previa o revisión posterior."
  },
  {
    number: 7,
    icon: "🤝",
    title: "Relaciones Externas Agénticas",
    description: "Agentes que negocian con proveedores, bancos y administración. Primero con humanos, luego entre agentes."
  },
  {
    number: 8,
    icon: "⚖️",
    title: "Compliance Automatizado",
    description: "Agentes supervisados que gestionan el cumplimiento legal y regulatorio de forma continua."
  }
];

export default function Doctrine() {
  return (
    <section id="doctrine" className="py-20 px-4 bg-[--primary] text-white">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            8 Principios de la Empresa <span className="text-[--accent]">AI-Nativa</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            Los fundamentos de la empresa AI-nativa. Cómo organizar, dirigir y escalar
            una empresa donde la inteligencia se compra y los agentes ejecutan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {principiosFundamentales.map((principio) => (
            <DoctrineItem key={principio.number} {...principio} />
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/mejores-practicas/doctrinas"
            className="inline-flex items-center gap-2 bg-[--accent] hover:bg-[--accent]/90 text-[--primary] font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition-transform duration-300"
          >
            Ver los 20 Principios Completos
            <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
