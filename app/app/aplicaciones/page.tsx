import Link from "next/link";

// Definición de categorías y apps
const categorias = [
  {
    id: "finanzas",
    nombre: "Finanzas",
    icono: "📊",
    descripcion: "Herramientas de análisis financiero y estimación de inversiones",
    apps: [
      {
        nombre: "Inversión con Fundamentales",
        descripcion: "Analiza los fundamentales de un ticker y estima su potencial de inversión.",
        url: "/aplicaciones/inversion-fundamentales",
        tipo: "interno",
        estado: "disponible"
      },
      {
        nombre: "Correlaciones Financieras",
        descripcion: "Analiza correlaciones entre activos financieros para optimizar carteras.",
        url: "https://aplicaciones-correlaciones-finanzas.streamlit.app/",
        tipo: "externo",
        estado: "disponible"
      },
      {
        nombre: "Dashboard Economía España",
        descripcion: "Cuadro de mando integral con IA para analizar la economía en tiempo real (PIB, Paro, ESIOS).",
        url: "https://dashboard-economia-espana.streamlit.app/",
        tipo: "externo",
        estado: "disponible"
      }
    ]
  },
  {
    id: "lengua",
    nombre: "Lengua",
    icono: "📝",
    descripcion: "Herramientas de corrección y análisis lingüístico",
    apps: [
      {
        nombre: "Corrector Ortotipográfico RAE",
        descripcion: "Corrige documentos Word (.docx) siguiendo las normas de la Real Academia Española.",
        url: "/aplicaciones/corrector-rae",
        tipo: "interno",
        estado: "disponible"
      }
    ]
  },
  {
    id: "sondeos",
    nombre: "Sondeos",
    icono: "🗳️",
    descripcion: "Herramientas de análisis electoral y estimación de voto",
    apps: [
      {
        nombre: "Estimador CIS",
        descripcion: "Estimación de voto en elecciones generales usando datos del CIS sin sesgos.",
        url: "#",
        tipo: "interno",
        estado: "proximamente"
      }
    ]
  },
  {
    id: "prensa",
    nombre: "Prensa",
    icono: "📰",
    descripcion: "Herramientas de generación de contenido periodístico",
    apps: [
      {
        nombre: "Generador de Artículos",
        descripcion: "Genera artículos periodísticos de calidad usando inteligencia artificial.",
        url: "#",
        tipo: "interno",
        estado: "proximamente"
      }
    ]
  },
  {
    id: "video-audio",
    nombre: "Video/Audio",
    icono: "🎬",
    descripcion: "Herramientas de creación de contenido audiovisual con IA",
    apps: [
      {
        nombre: "Generador de Guiones",
        descripcion: "Crea guiones profesionales para vídeos usando IA.",
        url: "#",
        tipo: "interno",
        estado: "proximamente"
      },
      {
        nombre: "Generador de Vídeos IA",
        descripcion: "Genera vídeos completos automáticamente con inteligencia artificial.",
        url: "#",
        tipo: "interno",
        estado: "proximamente"
      }
    ]
  }
];

export default function Aplicaciones() {
  return (
    <section className="py-20 px-4 bg-[--primary] text-[--foreground] min-h-screen">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-extrabold mb-6">
            <span className="text-[--accent]">Aplicaciones</span> MBAI Native
          </h1>
          <p className="text-xl max-w-3xl mx-auto text-gray-300">
            Herramientas desarrolladas con inteligencia artificial para potenciar tu productividad
            en finanzas, lengua, sondeos, prensa y contenido audiovisual.
          </p>
        </div>

        {/* Categorías */}
        <div className="space-y-16">
          {categorias.map((categoria) => (
            <div key={categoria.id} id={categoria.id} className="scroll-mt-24">
              {/* Header de categoría */}
              <div className="flex items-center gap-4 mb-8 pb-4 border-b border-gray-700">
                <span className="text-4xl">{categoria.icono}</span>
                <div>
                  <h2 className="text-3xl font-bold text-[--accent]">{categoria.nombre}</h2>
                  <p className="text-gray-400">{categoria.descripcion}</p>
                </div>
              </div>

              {/* Grid de apps */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoria.apps.map((app, index) => (
                  <div
                    key={index}
                    className={`bg-[--dark-gray] p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 ${app.estado === "proximamente" ? "opacity-70" : "hover:scale-105"
                      }`}
                  >
                    {/* Badge de estado */}
                    {app.estado === "proximamente" && (
                      <span className="inline-block bg-yellow-600 text-white text-xs font-bold px-2 py-1 rounded mb-3">
                        🚧 Próximamente
                      </span>
                    )}

                    <h3 className="text-xl font-bold text-white mb-3">{app.nombre}</h3>
                    <p className="text-gray-400 text-sm mb-4">{app.descripcion}</p>

                    {app.estado === "disponible" ? (
                      app.tipo === "interno" ? (
                        <Link
                          href={app.url}
                          className="bg-[--accent] hover:bg-[--accent]/90 text-[--primary] font-bold py-2 px-4 rounded-md transition-colors inline-block"
                        >
                          Abrir Aplicación
                        </Link>
                      ) : (
                        <a
                          href={app.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-[--accent] hover:bg-[--accent]/90 text-[--primary] font-bold py-2 px-4 rounded-md transition-colors inline-block"
                        >
                          Abrir Aplicación ↗
                        </a>
                      )
                    ) : (
                      <button
                        disabled
                        className="bg-gray-600 text-gray-400 font-bold py-2 px-4 rounded-md cursor-not-allowed inline-block"
                      >
                        Disponible pronto
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA final */}
        <div className="text-center mt-20 pt-12 border-t border-gray-700">
          <p className="text-gray-400 mb-4">¿Tienes una idea para una nueva aplicación?</p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-transparent border-2 border-[--accent] text-[--accent] hover:bg-[--accent] hover:text-[--primary] font-bold py-3 px-6 rounded-full transition-all"
          >
            Contáctanos
          </Link>
        </div>
      </div>
    </section>
  );
}
