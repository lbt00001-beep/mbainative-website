export default function About() {
  return (
    <section className="py-20 px-4 bg-[--primary] text-white">
      <div className="container mx-auto text-center">
        <h1 className="text-5xl font-extrabold mb-8">Sobre <span className="text-[--accent]">MBAI Native</span></h1>
        <p className="text-xl max-w-3xl mx-auto mb-12">
          En MBAI Native, estamos comprometidos con la formación de la próxima generación de líderes en la era de la Inteligencia Artificial. Nuestra misión es dotar a profesionales y empresas con el conocimiento y las herramientas necesarias para innovar y prosperar en un mundo transformado por la IA.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          <div className="p-8 bg-[--dark-gray] rounded-lg shadow-lg">
            <h3 className="text-3xl font-bold text-[--accent] mb-4">Nuestra Misión</h3>
            <p className="text-gray-300">
              Empoderar a líderes y organizaciones para que naveguen y dominen el panorama empresarial impulsado por la IA, a través de educación de vanguardia y aplicación práctica.
            </p>
          </div>
          <div className="p-8 bg-[--dark-gray] rounded-lg shadow-lg">
            <h3 className="text-3xl font-bold text-[--accent] mb-4">Nuestra Visión</h3>
            <p className="text-gray-300">
              Ser el referente global en la creación de una doctrina sólida y un ecosistema de aprendizaje robusto para las empresas nativas en Inteligencia Artificial.
            </p>
          </div>
          <div className="p-8 bg-[--dark-gray] rounded-lg shadow-lg">
            <h3 className="text-3xl font-bold text-[--accent] mb-4">Nuestros Valores</h3>
            <ul className="text-gray-300 list-disc list-inside">
              <li>Innovación Constante</li>
              <li>Ética en IA</li>
              <li>Excelencia Educativa</li>
              <li>Impacto Transformador</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}