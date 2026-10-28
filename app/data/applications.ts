export const categorias = [
  {
    id: "finanzas",
    nombre: "Finanzas",
    icono: "📊",
    descripcion: "Herramientas de análisis financiero y estimación de inversiones",
    apps: [
      {
        nombre: "Observatorio CCAA — España en perspectiva",
        descripcion: "Compara las 17 comunidades autónomas con fuentes oficiales: gasto por habitante, sanidad, educación, protección social, contexto territorial e Índice General con pesos editables. Incluye medias, series históricas, descargas y Ayuda detallada.",
        url: "/observatorio-ccaa/index.html",
        tipo: "interno",
        estado: "disponible"
      },
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
    descripcion: "Herramientas de auditoría demoscópica, análisis electoral y estimación reproducible de voto",
    apps: [
      {
        nombre: "Observatorio Electoral",
        descripcion: "Sondeos contrastados, estimación ponderada, evolución del voto, proyección provincial y simulaciones de escaños. Incluye datos directos del CIS, fuentes y ayuda detallada.",
        url: "/aplicaciones/observatorio-electoral/",
        tipo: "interno",
        estado: "disponible"
      },
      {
        nombre: "Voto 23J — Radiografía Electoral y Brújula Parlamentaria",
        descripcion: "Auditoría de programas, promesas cumplidas e incumplimientos de las elecciones de julio 2023. Test de afinidad de 21 preguntas con puntuación de 0 a 10 para los 11 partidos (incluyendo economía, modelo territorial, aborto y derechos), y 10 razones para votar a cada fuerza política.",
        url: "/aplicaciones/voto-23j",
        tipo: "interno",
        estado: "disponible"
      },
      {
        nombre: "CIS Abierto & Transparente — Auditoría Demoscópica y D'Hondt",
        descripcion: "Plataforma de auditoría sobre ficheros oficiales del CIS (multi_a.xlsx). Calibración por recuerdo válido 23J (BOE) con Factor K, matrices de transferencia empíricas (RV EG23), proyección D'Hondt de 350 escaños en las 52 circunscripciones con horquillas IC 95% y guía didáctica.",
        url: "/cis-transparente/index.html",
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
        nombre: "Escrutador de Artículos — Verificación y calidad periodística",
        descripcion: "Analiza un artículo por enlace, PDF (incluso escaneado) o texto: verifica sus hechos con fuentes externas y valora su calidad según su género, con nota de fiabilidad, nota de calidad y acciones editoriales para mejorarlo. Analiza lotes de artículos, compáralos y elige la IA por coste. Usa tu clave de OpenRouter.",
        url: "https://escrutador.mbainative.com",
        tipo: "externo",
        estado: "disponible"
      },
      {
        nombre: "OpinionPulse AI — Inteligencia de Opinión & Polarización",
        descripcion: "Monitor en tiempo real de sentimiento y controversia en Reddit, Prensa y Redes. Ponderación contextual bayesiana, detección de polarización bimodal e informes ejecutivos con IA.",
        url: "https://opinionpulse-ai.vercel.app",
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
        nombre: "FotoAI Studio — Fotos y clips de vídeo",
        descripcion: "Combina fotos y clips de vídeo, recorta las escenas, añade música y frases, y exporta tu montaje. Tus archivos se procesan en tu dispositivo.",
        url: "https://fotoai-studio-mbai.web.app",
        tipo: "externo",
        estado: "disponible"
      },
      {
        nombre: "Restaurador Super 8 — Películas de 8 mm",
        descripcion: "App gratuita para Windows que limpia polvo y rayas, estabiliza, corrige parpadeo y color, y mejora resolución y fluidez con IA las películas Super 8 y 8 mm digitalizadas. Funciona en tu ordenador, con o sin GPU.",
        url: "/restaurador-super8/index.html",
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
    id: "educacion",
    nombre: "Educación",
    icono: "🎒",
    descripcion: "Estudio en casa con IA a partir del libro del alumno, con seguimiento para la familia y el profesorado",
    apps: [
      {
        nombre: "Pupitre",
        descripcion: "Los deberes, de otra manera: sube el libro de cada asignatura y Pupitre mide el nivel del alumno, le enseña con lecciones, tests, tarjetas y juegos, le ayuda con los deberes sin darle la solución y envía un informe semanal al profesor.",
        url: "https://pupitre-416251601036.europe-west1.run.app",
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
        nombre: "Buscador Segunda Mano (Wallapop, Milanuncios y Vinted)",
        descripcion: "Búsqueda multitienda simultánea con coincidencia exacta (sin aproximaciones como 3060/3070 al buscar 3090), ordenación por precio, cercanía a Madrid y fecha del anuncio.",
        url: "/aplicaciones/buscador-segundamano",
        tipo: "interno",
        estado: "disponible"
      },
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
