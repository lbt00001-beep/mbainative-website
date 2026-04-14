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
        url: "https://correlaciones-finanzas-416251601036.europe-west1.run.app",
        tipo: "externo",
        estado: "disponible"
      },
      {
        nombre: "Dashboard Economía España",
        descripcion: "Cuadro de mando integral con IA para analizar la economía en tiempo real (PIB, Paro, ESIOS).",
        url: "https://dashboard-economia-416251601036.europe-west1.run.app",
        tipo: "externo",
        estado: "disponible"
      },
      {
        nombre: "Monitor de Futuros Líquidos",
        descripcion: "Observa futuros de índices, bonos, materias primas y divisas. Detecta anomalías, genera señales y simula operaciones en tiempo real.",
        url: "/aplicaciones/futuros",
        tipo: "interno",
        estado: "disponible"
      },
      {
        nombre: "CasaCalc — Comprar vs Alquilar",
        descripcion: "Dashboard interactivo para analizar el coste real de comprar vivienda en España: hipoteca, impuestos, coste de oportunidad frente a inversiones alternativas, simulador de reventa y análisis de inversión para alquilar.",
        url: "https://casacalc-mbai.web.app",
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
        descripcion: "Estimación de voto en elecciones generales y regionales usando el motor Aldabón-Gemini 2.6.",
        url: "https://cis-estimador-416251601036.europe-west1.run.app",
        tipo: "externo",
        estado: "disponible"
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
        nombre: "Radar de Calidad Periodística",
        descripcion: "Sube un PDF, selecciona un modelo de IA y obtén un diagnóstico profesional con puntuación 0-100. Funciona 100% en tu navegador.",
        url: "https://radar-prensa-mbai.web.app",
        tipo: "externo",
        estado: "disponible"
      },
      {
        nombre: "Prensa Resumen MBAI",
        descripcion: "Unidad de inteligencia que escanea 50 medios internacionales en tiempo real, filtra noticias por tema y genera informes estratégicos con análisis de narrativa, sesgos y silencios.",
        url: "https://prensa-resumen-mbai-2266.web.app/",
        tipo: "externo",
        estado: "disponible"
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
        nombre: "FotoAI Slides — Presentaciones con IA",
        descripcion: "Sube tus fotos, elige música y efectos cinematográficos, y genera presentaciones animadas con frases personalizadas. Exporta como vídeo MP4.",
        url: "https://fotos.mbainative.com",
        tipo: "externo",
        estado: "disponible"
      },
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
  },
  {
    id: "simulaciones",
    nombre: "Simulaciones",
    icono: "🌍",
    descripcion: "Simuladores interactivos de historia, demografía y ciencia",
    apps: [
      {
        nombre: "Evolución Demográfica Humana",
        descripcion: "Visualiza 300.000 años de historia: de 2 humanos a 8.100 millones, con migraciones, genética y crecimiento poblacional.",
        url: "/evolucion/index.html",
        tipo: "externo",
        estado: "disponible"
      },
      {
        nombre: "Análisis Político",
        descripcion: "Simulador de inteligencia que modela situaciones políticas nacionales e internacionales como juegos estratégicos, calculando los escenarios más probables con Teoría de Nash e IA.",
        url: "https://analisis-politico.vercel.app/",
        tipo: "externo",
        estado: "disponible"
      }
    ]
  },
  {
    id: "investigacion-ia",
    nombre: "Investigación IA",
    icono: "🔬",
    descripcion: "Monitorización y análisis de las últimas investigaciones de los principales laboratorios de inteligencia artificial",
    apps: [
      {
        nombre: "AI Research Radar",
        descripcion: "Dashboards interactivos con las investigaciones más recientes de Anthropic, OpenAI, Google y Microsoft. Vista detallada de artículos en español con gráficos y análisis.",
        url: "https://ai-research-radar-mbai.web.app/",
        tipo: "externo",
        estado: "disponible"
      }
    ]
  },
  {
    id: "product-multi",
    nombre: "Aplicaciones que multiplican tu productividad",
    icono: "🚀",
    descripcion: "Soluciones avanzadas de inteligencia artificial para optimizar tus procesos de revisión, análisis y trabajo diario.",
    apps: [
      {
        nombre: "Generador Autónoma de Masterclass (MBAI Presenter)",
        descripcion: "Sube un tema o un documento PDF y el orquestador IA investigará, redactará el guion y las notas, preservará los gráficos matemáticos originales, ensamblará el PowerPoint y locutará al presentador en múltiples idiomas automáticamente.",
        url: "https://presentador-masterclass-416251601036.europe-west1.run.app",
        tipo: "externo",
        estado: "disponible"
      },
      {
        nombre: "Detector de Textos IA (Doctrina MBAI)",
        descripcion: "Analiza cualquier fragmento de texto para determinar mediante 10 vectores lingüísticos si ha sido escrito por un humano o generado por Inteligencia Artificial.",
        url: "https://mbai-native-detector-2026.web.app",
        tipo: "externo",
        estado: "disponible"
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
