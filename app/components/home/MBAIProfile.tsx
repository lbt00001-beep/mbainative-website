import Link from "next/link";

const CompetenciaCard = ({ icon, title, description }: { icon: string, title: string, description: string }) => (
  <div className="relative p-6 bg-[--dark-gray] rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
    <div className="relative z-10">
      <span className="text-3xl mb-3 block">{icon}</span>
      <h3 className="text-xl font-semibold mb-2 text-[--accent-secondary]">
        {title}
      </h3>
      <p className="text-gray-400 text-sm">
        {description}
      </p>
    </div>
  </div>
);

const competenciasLider = [
  {
    icon: "🎚️",
    title: "Gestor de Autonomía",
    description: "Sabe calibrar cuánta autonomía dar a cada agente: qué decisiones requieren consulta y cuáles se supervisan después."
  },
  {
    icon: "🏗️",
    title: "Arquitecto de Tareas",
    description: "Diseña el nuevo organigrama por tareas, definiendo flujos de trabajo entre agentes y supervisores humanos."
  },
  {
    icon: "📊",
    title: "Supervisor de Dashboard",
    description: "Gestiona equipos de agentes desde el centro de mando, interpretando métricas y tomando decisiones en tiempo real."
  },
  {
    icon: "⚖️",
    title: "Director de Compliance Agéntico",
    description: "Supervisa agentes de cumplimiento normativo, asegurando que la empresa cumple con regulaciones de forma continua."
  },
  {
    icon: "🤝",
    title: "Gestor de Relaciones B2B Agénticas",
    description: "Configura y supervisa agentes que interactúan con proveedores, clientes y administración."
  },
  {
    icon: "🧠",
    title: "Curador de Conocimiento",
    description: "Mantiene la base de conocimiento institucional que alimenta a los agentes, asegurando calidad y actualización."
  },
  {
    icon: "🔧",
    title: "Entrenador de Agentes",
    description: "Define prompts, fine-tunes y feedback loops para mejorar continuamente el rendimiento de los agentes."
  },
  {
    icon: "🛡️",
    title: "Auditor de Seguridad AI",
    description: "Evalúa riesgos, revisa decisiones autónomas y asegura que los agentes operan dentro de parámetros seguros."
  }
];

export default function MBAIProfile() {
  return (
    <section className="py-20 px-4 bg-[--primary] text-white">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold">
            El Líder de la Empresa <span className="text-[--accent]">AI-Nativa</span>
          </h2>
          <p className="text-lg text-gray-400 mt-4 max-w-3xl mx-auto">
            Las competencias que definen al directivo que gestiona empresas con agentes de IA.
            No ejecuta: configura, supervisa y optimiza.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {competenciasLider.map((competencia, index) => (
            <CompetenciaCard key={index} {...competencia} />
          ))}
        </div>

        <div className="bg-gradient-to-r from-[--accent]/20 to-[--accent-secondary]/20 p-8 rounded-lg border border-[--accent]/30">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">
              El Cambio de Paradigma
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-gray-400 text-sm mb-2">Antes</p>
                <p className="text-xl font-semibold text-red-400">Ejecutar tareas</p>
              </div>
              <div className="flex items-center justify-center">
                <span className="text-3xl">→</span>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-2">Ahora</p>
                <p className="text-xl font-semibold text-[--accent]">Supervisar agentes</p>
              </div>
            </div>
            <p className="text-gray-400 mt-6 max-w-2xl mx-auto">
              El valor del líder empresarial ya no está en hacer, sino en diseñar cómo hacen los agentes,
              cuánta autonomía tienen, y cómo se mide su rendimiento.
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/mejores-practicas/gurus"
            className="inline-flex items-center gap-2 border-2 border-[--accent] text-[--accent] hover:bg-[--accent] hover:text-[--primary] font-bold py-3 px-8 rounded-full transition-all duration-300"
          >
            ¿Qué dicen los líderes tech? →
          </Link>
        </div>
      </div>
    </section>
  );
}