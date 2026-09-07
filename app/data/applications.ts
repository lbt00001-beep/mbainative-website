export const categorias = [
  {
    id: "finanzas",
    nombre: "Finanzas",
    icono: "📊",
    descripcion: "Herramientas de análisis financiero y estimación de inversiones",
    apps: [
      {
        nombre: "España vs UE — Dashboard",
        descripcion: "Comparativa macro y microeconómica de los 27 países de la Unión Europea. Evolución histórica de 25 años e índice ISCB.",
        url: "/aplicaciones/comparativa-ue",
        tipo: "interno",
        estado: "disponible"
      },
      {
        nombre: "Inversión con Fundamentales",
        descripcion: "Analiza los fundamentales de un ticker y estima su potencial de inversión.",
        url: "/aplicaciones/inversion-fundamentales",
        tipo: "interno",
        estado: "disponible"
      },
      {
        nombre: "TradingAlpha — Suite Inversiones Pro",
        descripcion: "Terminal institucional: velas interactivas, radar Snowflake de 5 ejes, DCF con margen de seguridad, DuPont, auditoría contable Piotroski/Altman Z, pulso de sentimiento de mercado y tesis con IA.",
        url: "/aplicaciones/tradingalpha",
        tipo: "interno",
        estado: "disponible"
      },
      {
        nombre: "Correlaciones Financieras",
        descripcion: "Analiza correlaciones entre activos financieros para optimizar carteras.",
        url: "https://correlaciones-finanzas-mbai.web.app",
        tipo: "externo",
        estado: "disponible"
      },
      {
        nombre: "Dashboard Economía España",
        descripcion: "Cuadro de mando integral con IA para analizar la economía en tiempo real (PIB, Paro, ESIOS).",
        url: "https://dashboard-economia-mbai.web.app",
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
        descripcion: "Monitor de cocina electoral del CIS. Compara Voto Directo, Estimación CIS y el modelo Aldabón-Gemini 3.0 para elecciones generales y autonómicas.",
        url: "https://cis-estimador-mbai.web.app",
        tipo: "externo",
        estado: "disponible"
      }
    ]
  },
  {
    id: "prensa",
    nombre: "Prensa & Opinión Pública",
    icono: "📰",
    descripcion: "Herramientas de inteligencia informativa, monitorización de opinión pública y análisis periodístico",
    apps: [
      {
        nombre: "OpinionPulse AI — Inteligencia de Opinión & Polarización",
        descripcion: "Monitor en tiempo real de sentimiento y controversia en Reddit, Prensa y Redes. Ponderación contextual bayesiana, detección de polarización bimodal e informes ejecutivos con IA.",
        url: "https://opinionpulse-ai.vercel.app",
        tipo: "externo",
        estado: "disponible"
      },
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
      },
      {
        nombre: "Comparador de Benchmarks de IA",
        descripcion: "Comparativa visual y detallada de rendimiento y costes de los modelos de IA en 2026, con resúmenes didácticos e informes descargables.",
        url: "/benchmarks-ia/index.html",
        tipo: "externo",
        estado: "disponible"
      }
    ]
  },
  {
    id: "aplicaciones-con-acreditacion",
    nombre: "Aplicaciones con acreditación",
    icono: "🏅",
    descripcion: "Aplicaciones con trazabilidad, controles y evidencias profesionales documentadas.",
    apps: [
      {
        nombre: "Aegis Security Intelligence",
        descripcion: "Dashboard profesional para analizar vulnerabilidades, superficie de ataque, configuración web e información interna autorizada, con evidencias y medidas de remediación.",
        url: "https://aegis.mbainative.com",
        tipo: "externo",
        estado: "disponible"
      }
    ]
  },
  {
    id: "ventas",
    nombre: "Ventas",
    icono: "🎯",
    descripcion: "Herramientas de coaching, entrenamiento comercial y análisis de llamadas B2B",
    apps: [
      {
        nombre: "Coach Comercial IA",
        descripcion: "Entrena comerciales con simulaciones guiadas por IA, analiza llamadas reales con scorecard automático (discovery, valor, objeciones, cierre) y haz seguimiento individual por vendedor.",
        url: "https://coach-comercial-ia-416251601036.europe-west1.run.app",
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
        nombre: "Generador Autónomo de Masterclass (MBAI Presenter)",
        descripcion: "Introduce un tema o sube un PDF y la IA investigará, redactará el guion y las notas del orador, buscará ilustraciones y generará una presentación visual interactiva. 100% en tu navegador.",
        url: "https://presentador-masterclass-mbai.web.app",
        tipo: "externo",
        estado: "disponible"
      },
      {
        nombre: "Analizador Profesional de Contenidos",
        descripcion: "Convierte videos de YouTube, PDFs, DOCX, articulos y libros en informes profesionales con ideas numeradas, visuales, conclusiones, aplicaciones derivadas y prompts listos para Codex, Claude o Gemini.",
        url: "https://analizador-de-temas-416251601036.europe-west1.run.app",
        tipo: "externo",
        estado: "disponible"
      },
      {
        nombre: "Detector de Textos IA (Doctrina MBAI)",
        descripcion: "Analiza cualquier fragmento de texto para determinar mediante 10 vectores lingüísticos si ha sido escrito por un humano o generado por Inteligencia Artificial.",
        url: "https://mbai-native-detector-2026.web.app",
        tipo: "externo",
        estado: "disponible"
      },
      {
        nombre: "QR Poster Studio",
        descripcion: "Genera carteles profesionales con código QR listos para imprimir. 6 estilos prediseñados, colores personalizables, logo drag & drop y exportación en PNG y PDF de alta resolución.",
        url: "https://qr-poster-mbai.web.app",
        tipo: "externo",
        estado: "disponible"
      },
      {
        nombre: "PlanPro Marketing",
        descripcion: "Crea un Plan de Marketing profesional con diagnóstico, buyer personas, estrategia omnicanal, objetivos SMART, presupuesto, simulación IA y documento final en DOCX o PDF.",
        url: "/plan-de-marketing/index.html",
        tipo: "interno",
        estado: "disponible"
      },
      {
        nombre: "MarkItDown",
        descripcion: "Conversor universal. Sube PDFs, documentos de Office, imágenes o audios y extrae su texto limpio en Markdown al instante de forma totalmente privada.",
        url: "https://markitdown-1zg1.vercel.app",
        tipo: "externo",
        estado: "disponible"
      }
    ]
  },
  {
    id: "ia-personal",
    nombre: "IA Personal",
    icono: "🧠",
    descripcion: "Clones virtuales y asistentes de IA personalizados que aprenden tu personalidad",
    apps: [
      {
        nombre: "Clonify — Clon Virtual Interactivo",
        descripcion: "Crea un clon virtual de tu personalidad que aprende de tus WhatsApp, Gmail y Calendar. Conversa por voz o texto con tu clon, que responde en tu estilo y con tu tono. 100% privado en tu navegador.",
        url: "https://clonify-dashboard.web.app",
        tipo: "externo",
        estado: "disponible"
      }
    ]
  }
];
