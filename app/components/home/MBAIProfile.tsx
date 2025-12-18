const ProfileCard = ({ number, title, children }: { number: string, title: string, children: React.ReactNode }) => (
  <div className="relative p-8 bg-[--dark-gray] rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
    <div className="absolute -top-4 -right-4 text-8xl font-extrabold text-gray-800 opacity-80 z-0">
      {number}
    </div>
    <div className="relative z-10">
      <h3 className="text-2xl font-semibold mb-2 text-[--accent-secondary]">
        {title}
      </h3>
      <p className="text-gray-400">
        {children}
      </p>
    </div>
  </div>
);

export default function MBAIProfile() {
  return (
    <section className="py-20 px-4 bg-[--primary] text-white">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold">
            El <span className="text-[--accent]">MBAI</span>: Liderando la Transformación AI-Native
          </h2>
          <p className="text-lg text-gray-400 mt-4 max-w-3xl mx-auto">
            Nuestro MBAI (Master in Business and Artificial Intelligence) está diseñado para forjar la próxima generación de líderes empresariales. Equipamos a profesionales para que no solo anticipen el futuro en un mundo impulsado por la IA, sino que lo construyan, transformando la incertidumbre en una ventaja estratégica.
          </p>
        </div>

        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold">
            Metodología <span className="text-[--accent]">LEAD</span>
          </h2>
          <p className="text-lg text-gray-400 mt-4 max-w-3xl mx-auto">
            El programa MBAI se estructura en torno a una metodología innovadora que asegura una inmersión completa y práctica en el ecosistema AI-Native.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <ProfileCard number="L" title="Learn (Aprender)">
            Flexibilidad para adquirir conocimientos de vanguardia en IA y negocios, con contenido actualizado y accesible.
          </ProfileCard>
          <ProfileCard number="E" title="Explore (Explorar)">
            Conectar la teoría con la práctica a través de simulaciones, proyectos y casos reales, incluyendo semanas de inmersión internacional.
          </ProfileCard>
          <ProfileCard number="A" title="Apply (Aplicar)">
            Transformar el conocimiento en acción, integrando la IA en desafíos estratégicos empresariales y proyectos de consultoría.
          </ProfileCard>
          <ProfileCard number="D" title="Drive (Impulsar)">
            Liderar la innovación con propósito, impulsando un impacto ético, sostenible y global en el ámbito de los negocios y la IA.
          </ProfileCard>
        </div>

        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold">
            Perfil del Egresado <span className="text-[--accent]">MBAI</span>
          </h2>
          <p className="text-lg text-gray-400 mt-4 max-w-3xl mx-auto">
            Formamos líderes capaces de construir y dirigir el futuro de los negocios con Inteligencia Artificial.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <ProfileCard number="01" title="Líder Estratégico">
            Capaz de diseñar y ejecutar estrategias de negocio que integren
            la IA como un pilar fundamental.
          </ProfileCard>
          <ProfileCard number="02" title="Innovador Tecnológico">
            Comprende las tecnologías de IA y sabe cómo aplicarlas para
            crear nuevos productos, servicios y modelos de negocio.
          </ProfileCard>
          <ProfileCard number="03" title="Gestor del Cambio">
            Lidera la transformación cultural de la organización hacia una
            mentalidad "AI-first".
          </ProfileCard>
          <ProfileCard number="04" title="Ético y Responsable">
            Aplica la IA de manera ética y responsable, considerando el
            impacto social y humano de sus decisiones.
          </ProfileCard>
        </div>
      </div>
    </section>
  );
}