const ServiceCard = ({ title, description }: { title: string, description: string }) => (
  <div className="bg-[--dark-gray] p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
    <h3 className="text-3xl font-bold text-[--accent] mb-4">{title}</h3>
    <p className="text-gray-300">{description}</p>
  </div>
);

export default function Services() {
  return (
    <section className="py-20 px-4 bg-[--primary] text-white">
      <div className="container mx-auto text-center">
        <h1 className="text-5xl font-extrabold mb-8">Nuestros Servicios</h1>
        <p className="text-xl max-w-3xl mx-auto mb-12">
          En MBAI Native, ofrecemos una gama de servicios diseñados para impulsar tu éxito en la era de la Inteligencia Artificial.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
          <ServiceCard
            title="MBAI Programa Ejecutivo"
            description="Nuestro programa insignia para formar líderes estratégicos con una profunda comprensión de la IA y su aplicación en los negocios."
          />
          <ServiceCard
            title="Consultoría en Estrategia IA"
            description="Asesoramos a empresas en la formulación e implementación de estrategias de Inteligencia Artificial para maximizar su impacto."
          />
          <ServiceCard
            title="Talleres y Capacitación Personalizada"
            description="Ofrecemos talleres a medida para equipos y ejecutivos, cubriendo desde los fundamentos de la IA hasta implementaciones avanzadas."
          />
          <ServiceCard
            title="Desarrollo de Soluciones IA"
            description="Ayudamos a diseñar y desarrollar soluciones de IA personalizadas para resolver desafíos empresariales específicos."
          />
          <ServiceCard
            title="Auditoría y Optimización de IA"
            description="Evaluamos tus sistemas y procesos de IA existentes para identificar oportunidades de mejora y optimización."
          />
          <ServiceCard
            title="Investigación y Análisis de Tendencias"
            description="Mantenemos a nuestros clientes al tanto de las últimas tendencias y avances en Inteligencia Artificial para una toma de decisiones informada."
          />
        </div>
      </div>
    </section>
  );
}