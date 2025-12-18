import Image from "next/image";

const DoctrineItem = ({ icon, title, children }: { icon: string, title: string, children: React.ReactNode }) => (
  <div className="p-8 bg-[--dark-gray] rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
    <div className="mb-4">
      <Image src={icon} alt={title} width={48} height={48} />
    </div>
    <h3 className="text-2xl font-semibold mb-4 text-[--accent]">
      {title}
    </h3>
    <p className="text-gray-400">
      {children}
    </p>
  </div>
);

export default function Doctrine() {
  return (
    <section id="doctrine" className="py-20 px-4 bg-[--primary] text-white">
      <div className="container mx-auto text-center">
        <h2 className="text-4xl font-bold mb-12">
          Doctrina: Empresas <span className="text-[--accent]">Nativas en IA</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <DoctrineItem icon="/file.svg" title="01. Cultura de Datos">
            Las decisiones se basan en datos, no en intuiciones. La
            recopilación, el análisis y la interpretación de datos son
            fundamentales en todos los niveles de la organización.
          </DoctrineItem>
          <DoctrineItem icon="/window.svg" title="02. Automatización Inteligente">
            Los procesos se automatizan de forma inteligente, liberando a los
            humanos para que se centren en tareas de mayor valor añadido.
          </DoctrineItem>
          <DoctrineItem icon="/globe.svg" title="03. Agilidad y Experimentación">
            Se fomenta una cultura de experimentación y aprendizaje continuo.
            Los fracasos se ven como oportunidades de aprendizaje.
          </DoctrineItem>
          <DoctrineItem icon="/file.svg" title="04. Anticipación y Visión de Futuro">
            Las empresas nativas en IA no solo reaccionan al cambio, sino que lo anticipan, diseñando estrategias que les permiten moldear activamente el futuro del mercado.
          </DoctrineItem>
          <DoctrineItem icon="/window.svg" title="05. Transformación de la Incertidumbre">
            Utilizan la inteligencia artificial para convertir la incertidumbre en una ventaja competitiva, identificando patrones y oportunidades donde otros solo ven riesgo.
          </DoctrineItem>
          <DoctrineItem icon="/globe.svg" title="06. Cultura LEAD (Learn, Explore, Apply, Drive)">
            Promueven un ciclo constante de aprendizaje, exploración de nuevas tecnologías, aplicación de soluciones innovadoras y liderazgo impulsado por un propósito ético y sostenible.
          </DoctrineItem>
          <DoctrineItem icon="/file.svg" title="07. Impacto Ético y Sostenible">
            Integran consideraciones éticas y de sostenibilidad en el diseño e implementación de cada solución de IA, buscando un impacto positivo en la sociedad y el medio ambiente.
          </DoctrineItem>
        </div>
      </div>
    </section>
  );
}