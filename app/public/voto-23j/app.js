// =========================================================================
// VOTO-23J: BASE DE DATOS Y LÓGICA DE LA APLICACIÓN
// Elecciones Generales de España (23 de Julio de 2023) - XV Legislatura
// =========================================================================

const PARTIES_DATA = {
  pp: {
    id: 'pp',
    name: 'Partido Popular',
    shortName: 'PP',
    seats: 137,
    votes: '33.05%',
    leader: 'Alberto Núñez Feijóo',
    color: '#0bb2ff',
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-300',
    ideology: 'Centro-derecha / Conservadurismo liberal / Democristiano',
    block: 'Líder de la oposición',
    summary: 'Ganador en votos y escaños el 23J sin alcanzar la mayoría absoluta con Vox. Defiende el constitucionalismo liberal, rebajas tributarias, consolidación institucional y relevo del gobierno sanchista.',
    program_summary: 'Bajo el lema "Un proyecto para la mayoría", el PP articuló un programa centrado en la derogación del "sanchismo", la rebaja fiscal del IRPF para clases medias (rentas inferiores a 40.000€), la auditoría de las cuentas públicas, la defensa de la independencia judicial mediante la elección corporativa del CGPJ, la prolongación de la vida útil de las centrales nucleares y la recentralización de estándares educativos.',
    key_proposals: [
      'Rebaja temporal del IRPF para rentas inferiores a 40.000 euros para compensar el impacto inflacionario.',
      'Reforma de la Ley Orgánica del Poder Judicial para que los 12 vocales judiciales del CGPJ sean elegidos directamente por jueces.',
      'Derogación de la Ley de Memoria Democrática, sustituyéndola por una Ley de Concordia, y derogación/revisión de la Ley Trans.',
      'Frenar el desmantelamiento programado del parque nuclear y apostar por la neutralidad tecnológica.',
      'Plan de choque de vivienda enfocado en seguridad jurídica: desalojo exprés de ocupaciones ilegales en 24-48 horas y movilización de suelo.'
    ],
    fulfilled_promises: [
      'Oposición parlamentaria y jurídica frontal a la Ley de Amnistía: presentación de recursos ante el TC, movilizaciones masivas y ofensiva en la UE.',
      'Pacto para la renovación del CGPJ (junio 2024) con mediación de la Comisión Europea, forzando el mandato expreso para reformar el modelo de elección corporativa judicial.',
      'Rebajas fiscales en las CC.AA. gobernadas por el PP: supresión/bonificación del Impuesto de Sucesiones y Donaciones (Madrid, Andalucía, C. Valenciana, Aragón, Baleares).',
      'Apoyo institucional y defensa del incremento del presupuesto de Defensa hacia el 2% del PIB comprometido con la OTAN.'
    ],
    broken_promises: [
      'Lema de "que gobierne la lista más votada": En campaña Feijóo insistió en que debía gobernar la fuerza más votada, pero pactó coaliciones con VOX en múltiples autonomías y ayuntamientos donde el PSOE fue primera fuerza (Extremadura, Valladolid, Burgos, Toledo).',
      'Contradicciones sobre la relación con el soberanismo catalán: Pese al discurso de dureza máxima, se revelaron reuniones secretas y contactos del PP con Junts en agosto de 2023 donde incluso se estudió un posible indulto condicionado a Puigdemont durante 24 horas antes de descartarlo.',
      'Asunción de postulados de Vox: Tras prometer moderación y centrismo, firmó pactos autonómicos que diluyeron conceptos de violencia machista bajo la etiqueta de "violencia intrafamiliar" y modificaron leyes de concordia que alarmaron a relatores de la ONU.',
      'Apoyo ambiguo a ciertas reformas del Gobierno: Votó favorablemente a la reforma constitucional del artículo 49 y convalidó decretos anticrisis pese a denunciar la ilegitimidad del Ejecutivo.'
    ],
    answers: [-1, -2, -2, -2, -1, -2, -2, +2, +2, -2, -2, +2, -2, -1, -2, +2, +2, -1, +2, +1],
    reasons: [
      {
        title: 'Centralidad institucional y moderación constitucional',
        desc: 'Representa la principal fuerza de contrapeso frente a los pactos de gobierno con formaciones independentistas, blindando el orden constitucional del 78, la separación de poderes y la unidad nacional.',
        cat: 'Institucional'
      },
      {
        title: 'Alivio fiscal y dinamización económica para clases medias',
        desc: 'Defensa de rebajas inmediatas en el IRPF para rentas medias y bajas, eliminación del impuesto a grandes fortunas y deflactación de tarifas frente a la presión fiscal acumulada.',
        cat: 'Economía'
      },
      {
        title: 'Seguridad jurídica y protección del derecho de propiedad',
        desc: 'Tolerancia cero contra la ocupación ilegal mediante leyes de desalojo exprés en 24-48 horas, eliminando las trabas y protecciones que generan desincentivos a los propietarios de vivienda.',
        cat: 'Vivienda'
      },
      {
        title: 'Despolitización real del Consejo General del Poder Judicial',
        desc: 'Compromiso firme con los estándares del Consejo de Europa para que los jueces elijan democráticamente a sus representantes en el CGPJ sin reparto de cuotas partidistas.',
        cat: 'Justicia'
      },
      {
        title: 'Soberanía energética y pragmatismo sin dogmatismos',
        desc: 'Mantenimiento de las centrales nucleares como energía de respaldo libre de emisiones para abaratar la factura eléctrica y proteger la competitividad de la industria española.',
        cat: 'Energía'
      },
      {
        title: 'Gobernanza predecible y gestión presupuestaria rigurosa',
        desc: 'Aval de gestión técnica demostrada en gobiernos autonómicos consolidados (Madrid, Andalucía, Galicia), priorizando la reducción del déficit y el fin del gasto público clientelar.',
        cat: 'Gestión'
      },
      {
        title: 'Libertad educativa y defensa de la escuela concertada',
        desc: 'Garantía del derecho constitucional de las familias a elegir el modelo educativo de sus hijos, protegiendo los conciertos escolares frente al monopolio de la red pública laica.',
        cat: 'Educación'
      },
      {
        title: 'Lealtad atlántica y peso geopolítico europeo',
        desc: 'Alineamiento incuestionable con la OTAN, cumplimiento del objetivo del 2% del PIB en defensa y defensa de un papel protagonista en las instituciones de la Unión Europea.',
        cat: 'Exterior'
      },
      {
        title: 'Superación de las trincheras ideológicas',
        desc: 'Sustitución de las leyes de memoria democrática divisivas por leyes de concordia que recojan el espíritu fraterno y reconciliador de la Transición Española de 1978.',
        cat: 'Sociedad'
      },
      {
        title: 'Alternativa real de gobierno frente a la fragmentación',
        desc: 'Constituye la única fuerza parlamentaria con músculo y estructura nacional capaz de conformar una alternativa de gobierno sólida sin depender de chantajes periféricos.',
        cat: 'Estrategia'
      }
    ]
  },

  psoe: {
    id: 'psoe',
    name: 'Partido Socialista Obrero Español',
    shortName: 'PSOE',
    seats: 121,
    votes: '31.68%',
    leader: 'Pedro Sánchez',
    color: '#ef1c27',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
    ideology: 'Centro-izquierda / Socialdemocracia / Progresismo federalista',
    block: 'Gobierno de coalición',
    summary: 'Consiguió revalidar el Gobierno mediante una investidura apoyada en una heterogénea mayoría plurinacional (Sumar, ERC, Junts, Bildu, PNV, BNG, CC). Defiende el escudo social, la transición ecológica y la normalización territorial.',
    program_summary: 'Bajo el lema "Adelante", el PSOE defendió la consolidación de los avances sociales y laborales de la legislatura anterior: subidas periódicas del Salario Mínimo Interprofesional hasta el 60% del salario medio, blindaje de las pensiones con el IPC real, despliegue masivo de los fondos europeos Next Generation, gratuidad de transporte público y refuerzo del escudo social frente a los recortes conservadores.',
    key_proposals: [
      'Blindaje de la revalorización de las pensiones conforme al IPC real y dotación del Fondo de Reserva.',
      'Incremento sostenido del SMI en el marco del diálogo social hasta alcanzar el 60% del salario medio.',
      'Aprobación de una Ley de Paridad para garantizar la representatividad 50/50 en órganos de decisión políticos y económicos.',
      'Reconocimiento formal de la soberanía del Estado de Palestina en política exterior.',
      'Desarrollo e implementación coordinada de la Ley Estatal de Vivienda para limitar precios en zonas tensionadas.'
    ],
    fulfilled_promises: [
      'Nueva subida del Salario Mínimo Interprofesional en 2024 hasta los 1.134 euros mensuales en 14 pagas.',
      'Revalorización de todas las pensiones contributivas conforme a la inflación media registrada, cumpliendo la reforma de pensiones pactada con la UE.',
      'Reconocimiento formal e histórico del Estado de Palestina por parte de España (mayo de 2024), liderando la iniciativa en Europa.',
      'Aprobación y entrada en vigor de la Ley de Paridad en órganos de dirección públicos y privados.',
      'Renovación del Consejo General del Poder Judicial tras más de 5 años y medio de parálisis institucional.'
    ],
    broken_promises: [
      'El viraje radical de la Ley de Amnistía: Pedro Sánchez y sus ministros (Félix Bolaños, Fernando Grande-Marlaska) repitieron categóricamente durante la campaña electoral que la amnistía era inconstitucional y no cabía en el ordenamiento español. Fue concedida como condición inexcusable para obtener los 7 votos de Junts.',
      'Compromiso de solidaridad fiscal interterritorial: El acuerdo firmado con ERC en el verano de 2024 para investir a Salvador Illa aceptó una "financiación singular" (cupo catalán con recaudación del 100% de tributos), contradiciendo el principio de multilateralidad y equidad defendido históricamente por el PSOE.',
      'Promesa de no depender de fuerzas soberanistas radicales: Pedro Sánchez afirmó en el pasado que nunca pactaría la gobernabilidad con formaciones como EH Bildu o los herederos del 1-O, convertidos hoy en socios estructurales del bloque de investidura.',
      'Parálisis presupuestaria y debilidad legislativa: Prometió una legislatura de estabilidad progresista de cuatro años, pero el Gobierno tuvo que renunciar a presentar los Presupuestos Generales del Estado de 2024 por falta de apoyos parlamentarios estables.'
    ],
    answers: [+1, +2, +1, +1, +2, +1, -1, -2, -1, +1, +2, +1, +2, +2, +2, -1, -1, +2, -1, -1],
    reasons: [
      {
        title: 'Escudo social y redistribución de la riqueza',
        desc: 'Protección continuada de las capas más vulnerables y clases trabajadoras mediante subidas históricas del SMI, el Ingreso Mínimo Vital y becas educativas de cuantía récord.',
        cat: 'Social'
      },
      {
        title: 'Dignidad y garantía del poder adquisitivo de las pensiones',
        desc: 'Revalorización obligatoria de las pensiones vinculada por ley al IPC real, desterrando el factor de sostenibilidad del 0,25% que aplicaba el Partido Popular.',
        cat: 'Pensiones'
      },
      {
        title: 'Liderazgo en empleo y crecimiento económico en la UE',
        desc: 'España encabeza las tasas de crecimiento económico de las principales potencias de la eurozona con cifras récord de más de 21 millones de afiliados a la Seguridad Social.',
        cat: 'Economía'
      },
      {
        title: 'Pacificador territorial y normalización de la convivencia',
        desc: 'Desactivación de la fractura social y territorial en Cataluña a través del diálogo, los indultos y la amnistía, logrando una Cataluña integrada y con el PSC al frente de la Generalitat.',
        cat: 'Territorial'
      },
      {
        title: 'Vanguardia internacional en derechos civiles y feminismo',
        desc: 'Impulso decidido a la Ley de Paridad, protección integral de los derechos LGTBI, lucha activa contra la violencia machista y ampliación de permisos parentales.',
        cat: 'Derechos'
      },
      {
        title: 'Dignidad de la Memoria Democrática',
        desc: 'Cumplimiento del deber cívico de exhumación de fosas comunes del franquismo, retirada de honores a golpistas y resignificación de espacios como Cuelgamuros.',
        cat: 'Memoria'
      },
      {
        title: 'Valiente diplomacia internacional de paz y multilateralismo',
        desc: 'Reconocimiento histórico del Estado de Palestina frente a la barbarie en Gaza, coherencia con el Derecho Internacional Humanitario y liderazgo respetado en la UE.',
        cat: 'Exterior'
      },
      {
        title: 'Transición ecológica justa y potencia renovable',
        desc: 'Apuesta decidida por las energías solar y eólica, descarbonización industrial progresiva y liderazgo en la captación de fondos verdes Next Generation EU.',
        cat: 'Medioambiente'
      },
      {
        title: 'Inversión en transporte público y movilidad accesible',
        desc: 'Bonificaciones y gratuidad masiva en abonos de Renfe Cercanías y Media Distancia, aliviando la economía familiar e incentivando la sostenibilidad.',
        cat: 'Movilidad'
      },
      {
        title: 'Dique de contención democrático contra la ultraderecha',
        desc: 'Capacidad de articular una mayoría plurinacional amplia para impedir que la extrema derecha involucionista de VOX acceda a los ministerios del Gobierno de España.',
        cat: 'Estrategia'
      }
    ]
  },

  vox: {
    id: 'vox',
    name: 'VOX',
    shortName: 'VOX',
    seats: 33,
    votes: '12.38%',
    leader: 'Santiago Abascal',
    color: '#63be21',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    ideology: 'Derecha identitaria / Nacionalismo español / Conservadurismo social',
    block: 'Oposición frontal',
    summary: 'Tercera fuerza en el Congreso. Defiende la recentralización del Estado, la soberanía nacional frente al globalismo, la derogación de las leyes ideológicas de género y el cierre de fronteras ante la inmigración ilegal.',
    program_summary: 'Bajo el documento "100 medidas para la España Viva" y el lema "Vota lo que importa", VOX propuso la liquidación del Estado de las Autonomías, la reducción radical del IRPF a dos tipos únicos (15% y 25%), la expulsión inmediata de todos los inmigrantes en situación irregular, la derogación de la Ley de Violencia de Género y la salida de España de la Agenda 2030.',
    key_proposals: [
      'Supresión inmediata del Estado de las Autonomías y recentralización de Sanidad, Educación, Interior y Justicia.',
      'Rebaja fiscal drástica: tipo único del 15% para rentas de hasta 70.000 euros y 25% para superiores, con exención para rentas más bajas.',
      'Derogación total de las leyes de Violencia de Género, Memoria Democrática, Aborto, Eutanasia y Ley Trans.',
      'Cierre inmediato de fronteras, bloqueo naval si es preciso y expulsión de todos los inmigrantes ilegales y delincuentes extranjeros.',
      'Derogación de la Ley de Cambio Climático y abandono de los compromisos de la Agenda 2030 y el Pacto Verde Europeo.'
    ],
    fulfilled_promises: [
      'Oposición sin fisuras al sanchismo: rechazo frontal absoluto a cualquier acuerdo con el PSOE y presentación sistemática de querellas en los tribunales contra la amnistía.',
      'Impulso de Leyes de Concordia y reducción de subvenciones a patronal y sindicatos en los gobiernos autonómicos donde participó (C. Valenciana, Castilla y León, Aragón).',
      'Cumplimiento radical de su línea roja migratoria: ruptura simultánea de todos sus gobiernos de coalición autonómica con el PP en julio de 2024 tras la acogida de 347 menores migrantes no acompañados.'
    ],
    broken_promises: [
      'Inestabilidad y abandono del poder institucional: Dejó sin representación de gobierno a sus propios votantes al dimitir de 5 gobiernos autonómicos por una orden cupular de Abascal, evidenciando escasa cultura de pacto de gestión.',
      'Crisis interna y purga de liberales: La salida forzada o abandono de figuras emblemáticas del ala liberal-económica (Iván Espinosa de los Monteros, Víctor Sánchez del Real, Rubén Manso) consolidó un viraje nacionalpopulista estatista.',
      'Incapacidad de materializar ninguna propuesta legislativa en el Congreso debido a su total aislamiento parlamentario.'
    ],
    answers: [-2, -2, -2, -2, -1, -2, -2, +2, +2, -2, -2, +2, -2, -2, -2, +2, +2, -1, +2, -2],
    reasons: [
      {
        title: 'Defensa innegociable de la soberanía e indisoluble unidad de España',
        desc: 'Firmeza absoluta contra cualquier tipo de concesión al separatismo, promoviendo la ilegalización de partidos que atenten contra la integridad territorial nacional.',
        cat: 'Nacional'
      },
      {
        title: 'Fin del despilfarro autonómico y recentralización',
        desc: 'Eliminación del sistema de 17 autonomías para abaratar el coste del Estado, evitar duplicidades burocráticas y garantizar la igualdad de derechos en todo el territorio.',
        cat: 'Estado'
      },
      {
        title: 'Control estricto de fronteras y defensa de la seguridad ciudadana',
        desc: 'Prioridad absoluta al freno de la inmigración ilegal masiva, fin del efecto llamada y expulsión de delincuentes extranjeros reincidentes para devolver la paz a los barrios.',
        cat: 'Fronteras'
      },
      {
        title: 'Rebelión contra el globalismo y la Agenda 2030',
        desc: 'Protección de la soberanía industrial, agrícola y ganadera española frente a las directivas impuestas por burócratas de Bruselas y el ecologismo radical del Pacto Verde.',
        cat: 'Soberanía'
      },
      {
        title: 'Revolución fiscal y rebaja de impuestos histórica',
        desc: 'Sustitución de la maraña tributaria por un tipo único reducido de IRPF, eliminación de impuestos sobre sucesiones y patrimonio y máxima protección del ahorro familiar.',
        cat: 'Fiscal'
      },
      {
        title: 'Derogación del adoctrinamiento ideológico en las aulas',
        desc: 'Implantación del pin parental y protección de la inocencia infantil, erradicando los contenidos ideológicos y afectivo-sexuales ajenos a la patria potestad familiar.',
        cat: 'Educación'
      },
      {
        title: 'Defensa innegociable de la vida del no nacido y familia tradicional',
        desc: 'Oposición frontal a la cultura de la muerte y al aborto. Defensa irrenunciable del derecho a la vida desde la concepción hasta la muerte natural, protocolos provida de apoyo a la maternidad y protección integral de la familia.',
        cat: 'Vida y Familia'
      },
      {
        title: 'Soberanía energética y orgullo del sector primario',
        desc: 'Defensa de las presas, del regadío, del campo tradicional y del mantenimiento de la energía nuclear frente al cierre acelerado y desindustrializador.',
        cat: 'Energía'
      },
      {
        title: 'Coherencia probada y rechazo a las componendas políticas',
        desc: 'Demostración práctica de que sus convicciones no están en venta: renunciaron a vicepresidencias y consejerías autonómicas antes que tragar con el reparto de MENAs.',
        cat: 'Coherencia'
      },
      {
        title: 'Reivindicación orgullosa de la historia y tradiciones de España',
        desc: 'Defensa de la identidad cultural española, su legado histórico universal, el mundo rural y festividades populares frente a la leyenda negra autodestructiva.',
        cat: 'Cultura'
      }
    ]
  },

  sumar: {
    id: 'sumar',
    name: 'SUMAR',
    shortName: 'SUMAR',
    seats: 31,
    votes: '12.33%',
    leader: 'Yolanda Díaz',
    color: '#e51c55',
    badgeClass: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300',
    ideology: 'Izquierda transformadora / Ecosocialismo / Laborismo / Plurinacionalismo',
    block: 'Socio menor del Gobierno',
    summary: 'Coalición que aglutinó el espacio a la izquierda del PSOE. Impulsa la reducción de jornada laboral, la fiscalidad verde a grandes corporaciones, la intervención de la vivienda y la transición climática.',
    program_summary: 'Bajo el lema "Es por ti", Sumar propuso la reducción obligatoria de la jornada laboral de 40 a 37,5 horas semanales (con horizonte en 32h) sin merma de sueldo, la creación de una herencia universal de 20.000 euros para jóvenes financiada con tributos patrimoniales, la banca pública mediante CaixaBank y la bajada por decreto del precio de los alquileres.',
    key_proposals: [
      'Reducción de la jornada laboral por ley a 37,5 horas semanales de forma inmediata sin reducción salarial.',
      'Herencia universal de 20.000 euros a todos los jóvenes al cumplir los 18 años.',
      'Control estricto de los precios del alquiler y prohibición de compras de vivienda con fines especulativos.',
      'Reforma fiscal verde e impuestos permanentes a las grandes fortunas, entidades financieras y eléctricas.',
      'Plan de transición energética con prohibición de vuelos domésticos con alternativa en tren de menos de 2,5 horas.'
    ],
    fulfilled_promises: [
      'Subida continuada del Salario Mínimo Interprofesional hasta 1.134 euros y endurecimiento de las inspecciones laborales de trabajo.',
      'Mantenimiento de la presión y negociación activa de la reducción de jornada a 37,5 horas en la mesa de diálogo social.',
      'Impulso incansable para el reconocimiento del Estado de Palestina y denuncia internacional del gobierno de Netanyahu.',
      'Defensa activa de la ampliación de permisos retribuidos para cuidados y conciliación familiar.'
    ],
    broken_promises: [
      'Fractura y desintegración del grupo parlamentario: En diciembre de 2023, los 5 diputados de Podemos rompieron con Sumar y pasaron al Grupo Mixto, dinamitando la unidad proclamada.',
      'Abandono de la "Herencia Universal": Quedó completamente orillada y sin partida presupuestaria en el acuerdo de coalición con el PSOE.',
      'Ley de Vivienda ineficaz: No consiguieron frenar la escalada histórica de los precios del alquiler ni obligar a las comunidades a declarar zonas tensionadas.',
      'Crisis de liderazgo: Tras los pésimos resultados en las elecciones europeas de junio de 2024, Yolanda Díaz renunció a la coordinación de Sumar; además, la crisis provocada por el caso Errejón dañó seriamente la credibilidad ética del proyecto.'
    ],
    answers: [+1, +2, +2, +2, +2, +2, +2, -2, -2, +2, +2, -2, +2, +2, +2, -2, -2, +2, -2, -2],
    reasons: [
      {
        title: 'El tiempo para vivir: Reducción de la jornada laboral sin bajar sueldos',
        desc: 'Defensa prioritaria de la jornada de 37,5 horas como derecho laboral irrenunciable para equilibrar el empleo con la vida personal y familiar en el siglo XXI.',
        cat: 'Laboral'
      },
      {
        title: 'Justicia fiscal: que paguen más quienes más tienen',
        desc: 'Compromiso indiscutible para que bancos, energéticas y megaricos aporten lo que les corresponde mediante impuestos permanentes para blindar los servicios públicos.',
        cat: 'Fiscal'
      },
      {
        title: 'La vivienda como derecho, no como negocio especulativo',
        desc: 'Intervención decidida de los precios del alquiler, freno a los fondos buitre y ampliación urgente del parque público de alquiler social.',
        cat: 'Vivienda'
      },
      {
        title: 'Laborismo eficaz y subida sin freno de los salarios mínimos',
        desc: 'Aval de la gestión sindical y laboral de Yolanda Díaz, que ha elevado el SMI más de un 54% protegiendo a los trabajadores más vulnerables de la precariedad.',
        cat: 'Empleo'
      },
      {
        title: 'Transición ecológica justa y contra el colapso climático',
        desc: 'Lucha frontal contra la crisis climática penalizando el consumo de combustibles fósiles y democratizando las comunidades energéticas renovables.',
        cat: 'Ecología'
      },
      {
        title: 'Feminismo interseccional de las mayorías sociales',
        desc: 'Políticas para la conciliación corresponsable, igualación real de retribuciones salariales y combate integral contra cualquier forma de violencia machista.',
        cat: 'Igualdad'
      },
      {
        title: 'Modelo territorial plurinacional, fraterno y pactado',
        desc: 'Defensa de una España diversa de pueblos y lenguas, donde los conflictos territoriales se resuelvan con democracia, empatía y fraternidad.',
        cat: 'Plurinacional'
      },
      {
        title: 'Paz, desarme y solidaridad internacional sin dobles raseros',
        desc: 'Posicionamiento valiente contra el genocidio palestino, cese inmediato de la venta de armas y rechazo al seguidismo belicista y militarista de la OTAN.',
        cat: 'Exterior'
      },
      {
        title: 'Salud mental y bucodental en la cartera de la Sanidad Pública',
        desc: 'Ampliación urgente de la cobertura sanitaria pública para que la terapia psicológica, el dentista y las gafas no dependan del código postal ni de la cuenta bancaria.',
        cat: 'Sanidad'
      },
      {
        title: 'Tracción transformadora dentro del Consejo de Ministros',
        desc: 'El voto indispensable para empujar al PSOE hacia la izquierda real, impidiendo que los socialistas cedan ante los intereses de las grandes corporaciones.',
        cat: 'Estrategia'
      }
    ]
  },

  erc: {
    id: 'erc',
    name: 'Esquerra Republicana de Catalunya',
    shortName: 'ERC',
    seats: 7,
    votes: '1.89%',
    leader: 'Gabriel Rufián / Oriol Junqueras',
    color: '#ffb232',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    ideology: 'Izquierda independentista / Socialdemocracia republicana / Federalismo catalán',
    block: 'Socio de investidura',
    summary: 'Fuerza independentista de izquierdas que ha apostado por la vía de la negociación pragmática con el Gobierno de España para obtener contrapartidas tangibles: amnistía, traspaso de Rodalies y financiación singular.',
    program_summary: 'Bajo el lema "Defensa Catalunya", ERC situó como condiciones clave el cese de la represión judicial a través de una amnistía completa, el derecho a la autodeterminación mediante un referéndum pactado, el traspaso integral de Rodalies y la soberanía fiscal mediante un concierto económico solidario.',
    key_proposals: [
      'Aprobación de una Ley de Amnistía para todas las causas judiciales derivadas del proceso independentista.',
      'Apertura de la mesa de negociación para fijar las condiciones de un referéndum de autodeterminación.',
      'Traspaso integral de la red de Rodalies (infraestructura, vías y material rodante) a la Generalitat de Catalunya.',
      'Financiación singular para Cataluña mediante la recaudación y gestión del 100% de los tributos por la Agencia Tributaria catalana.',
      'Condonación del 20% de la deuda contraída con el Fondo de Liquidez Autonómica (FLA).'
    ],
    fulfilled_promises: [
      'Logró la aprobación formal de la Ley de Amnistía en las Cortes Generales tras meses de duras negociaciones.',
      'Firmó el pacto para la condonación de hasta 15.000 millones de euros de deuda de Cataluña con el FLA.',
      'Selló el acuerdo de inicio de transferencia del servicio y gestión de las Cercanías ferroviarias (Rodalies).',
      'Pactó en verano de 2024 con el PSOE el compromiso de la "financiación singular" para Cataluña a cambio de investir al presidente Salvador Illa.'
    ],
    broken_promises: [
      'El referéndum de autodeterminación quedó completamente aparcado en la práctica de la legislatura nacional y catalana.',
      'Pérdida de la mayoría independentista en Cataluña: La estrategia de pactos con Pedro Sánchez provocó una severa debacle electoral en mayo de 2024 (de 33 a 20 escaños en el Parlament), forzando a investir a un socialista (Illa).',
      'Fractura orgánica interna feroz entre los sectores de Oriol Junqueras y Marta Rovira por el control del partido tras los malos resultados.',
      'La aplicación de la amnistía para Oriol Junqueras por malversación fue rechazada por el Tribunal Supremo, dejando su inhabilitación en pie.'
    ],
    answers: [+2, +2, +2, +2, +1, +2, +2, -2, -2, +2, +2, -2, +2, +2, +2, -2, -2, +2, -2, -2],
    reasons: [
      {
        title: 'Independentismo pragmático y útil con resultados medibles',
        desc: 'Demostración de que la negociación política constante arranca concesiones históricas al Estado central: indultos, reforma del Código Penal y la Ley de Amnistía.',
        cat: 'Nacional'
      },
      {
        title: 'Soberanía fiscal y concierto económico para Cataluña',
        desc: 'Defensa de la recaudación y gestión del 100% de los impuestos por la Generalitat para acabar con el déficit fiscal crónico que perjudica a los catalanes.',
        cat: 'Economía'
      },
      {
        title: 'Izquierda republicana con 93 años de historia limpia',
        desc: 'Tradición de servicio público libre de corrupción sistémica, combinando el patriotismo cívico con la justicia redistributiva socialdemócrata.',
        cat: 'Identidad'
      },
      {
        title: 'Control efectivo de los servicios diarios: Rodalies catalanas',
        desc: 'Compromiso firme por gestionar de forma directa las infraestructuras de trenes para solucionar el caos diario de averías y retrasos del servicio estatal.',
        cat: 'Transporte'
      },
      {
        title: 'Condonación de 15.000 millones de euros de deuda del FLA',
        desc: 'Alivio directo de las cuentas públicas catalanas que permite destinar recursos al gasto sanitario, educativo y social en lugar de pagar intereses a Madrid.',
        cat: 'Finanzas'
      },
      {
        title: 'Defensa irreductible de la lengua y cultura catalana',
        desc: 'Blindaje del catalán en la escuela, impulso del uso oficial de las lenguas cooficiales en el Congreso de los Diputados y exigencia de oficialidad en la UE.',
        cat: 'Lengua'
      },
      {
        title: 'Vía democrática y pacífica hacia la República Catalana',
        desc: 'Rechazo de vías unilaterales estériles y apuesta por ensanchar la base social y convencer a la comunidad internacional mediante referéndum pactado.',
        cat: 'Estrategia'
      },
      {
        title: 'Solidaridad internacional y defensa del pueblo palestino',
        desc: 'Apoyo sin ambages a las causas humanitarias en el mundo, autodeterminación de los pueblos y combate contra el colonialismo.',
        cat: 'Exterior'
      },
      {
        title: 'Feminismo y derechos civiles transversales',
        desc: 'Creación de consejerías de Igualdad y Feminismos, impulso a la gratuidad del curso escolar infantil de 2 años y distribución gratuita de productos menstruales.',
        cat: 'Social'
      },
      {
        title: 'Punto de equilibrio progresista y de gobernanza real',
        desc: 'Capacidad demostrada de ejercer de bisagra constructiva para frenar a las derechas sin renunciar al horizonte republicano de soberanía nacional.',
        cat: 'Gobernanza'
      }
    ]
  },

  junts: {
    id: 'junts',
    name: 'Junts per Catalunya',
    shortName: 'JUNTS',
    seats: 7,
    votes: '1.60%',
    leader: 'Míriam Nogueras / Carles Puigdemont',
    color: '#00c3b2',
    badgeClass: 'bg-teal-100 text-teal-800 border-teal-300',
    ideology: 'Independentismo catalán / Centroderecha liberal / Soberanismo intransigente',
    block: 'Apoyo condicionado voto a voto',
    summary: 'Partido clave en la aritmética del Congreso. Trasladó la negociación con el PSOE a Ginebra con verificador internacional y aplica una doctrina de exigencia implacable sin cheques en blanco a Pedro Sánchez.',
    program_summary: 'Con el lema "Ja n\'hi ha prou" (Basta ya), Junts se presentó como la fuerza dispuesta a bloquear la gobernabilidad de España si no se reconocía el mandato del 1 de Octubre, exigiendo una amnistía integral, un mediador internacional y el fin del expolio fiscal catalán sin concesiones autonómicas menores.',
    key_proposals: [
      'Aprobación de una Ley de Amnistía blindada para todos los encausados sin excepciones por terrorismo o traición.',
      'Mesa de negociación política fuera de España con verificación internacional (mediador extranjero).',
      'Reconocimiento del derecho a la autodeterminación y consulta vinculante en Cataluña.',
      'Cesión de las competencias integrales de Inmigración a la Generalitat de Catalunya.',
      'Defensa de la fiscalidad moderada para pymes y autónomos catalanes frente al intervencionismo de la izquierda.'
    ],
    fulfilled_promises: [
      'Negociación implacable voto a voto: Tumbaron en enero de 2024 la primera versión de la Ley de Amnistía por considerarla incompleta, forzando al PSOE a modificar el texto para blindar a Puigdemont.',
      'Obligaron al PSOE a sentarse periódicamente en Ginebra (Suiza) ante un mediador internacional neutral.',
      'Hicieron caer votaciones clave del Gobierno (como la senda de estabilidad presupuestaria y límites de déficit en 2024), demostrando que Sánchez no puede dar por asegurada la mayoría.',
      'Lograron que el catalán sea lengua de uso reglamentario pleno en el Congreso de los Diputados.'
    ],
    broken_promises: [
      'Promesa de bloquear la investidura si no había referéndum: Durante la campaña insistieron en que "ni un solo voto iría para investir a un presidente español" sin autodeterminación, pero acabaron invistiendo a Pedro Sánchez a cambio de la amnistía y acuerdos procesales.',
      'La promesa de Carles Puigdemont de volver para quedarse: Aseguró que regresaría para el debate de investidura en el Parlament en agosto de 2024; apareció fugazmente en Barcelona para dar un discurso de 5 minutos y huyó de nuevo al extranjero sin pisar la cámara legislativa.',
      'Incapacidad de impedir que el PSC de Salvador Illa se hiciera con la Generalitat de Catalunya y la alcaldía de Barcelona.'
    ],
    answers: [+2, -1, -2, -1, -1, +2, +2, +1, +1, -1, +1, +1, +1, +1, +1, +1, +1, +2, +1, -2],
    reasons: [
      {
        title: 'Firmeza e intransigencia negociadora ante el Estado español',
        desc: 'Demostración de que la única manera de doblegar a los gobiernos de Madrid es cobrar por adelantado y no regalar ni un solo voto sin garantías verificadas.',
        cat: 'Nacional'
      },
      {
        title: 'Mesa de negociación internacional con mediador neutral',
        desc: 'Internacionalización formal del conflicto catalán sentando al Gobierno de España en Ginebra con verificadores diplomáticos independientes.',
        cat: 'Diplomacia'
      },
      {
        title: 'Defensa de la legitimidad histórica del 1 de Octubre',
        desc: 'Mantenimiento del hilo conductor democrático de las urnas del referéndum de 2017 y rechazo a la claudicación o al olvido institucional.',
        cat: 'Soberanía'
      },
      {
        title: 'Modelo socioeconómico de apoyo a pymes, empresas y autónomos',
        desc: 'Línea económica liberal y sensata frente a la asfixia tributaria de la izquierda española, protegiendo el tejido empresarial e industrial de Cataluña.',
        cat: 'Economía'
      },
      {
        title: 'Cesión integral de competencias en Inmigración',
        desc: 'Exigencia para que Cataluña gestione sus propios flujos migratorios, integración cívica y permisos de residencia conforme a la realidad de su sociedad.',
        cat: 'Inmigración'
      },
      {
        title: 'Uso y oficialidad plena del catalán en el Congreso y Europa',
        desc: 'Conquista del derecho a intervenir en lengua catalana en la tribuna del Congreso de los Diputados y batalla por su reconocimiento en la UE.',
        cat: 'Lengua'
      },
      {
        title: 'Capacidad de veto y bloqueo real en el Congreso',
        desc: 'Son la única fuerza que demuestra con hechos no tener ataduras con Sánchez, tumbando decretos gubernamentales cuando se ignoran los intereses de Cataluña.',
        cat: 'Estrategia'
      },
      {
        title: 'Defensa de la propiedad privada y combate contra la ocupación',
        desc: 'Posición firme a favor de reformar la legislación civil y procesal para expulsar a los ocupas ilegales y devolver la seguridad jurídica a los barrios.',
        cat: 'Seguridad'
      },
      {
        title: 'Liderazgo moral y resistencia frente a la persecución judicial',
        desc: 'Respaldo a la figura del President Carles Puigdemont como símbolo vivo del exilio y de la resistencia política ante las cúpulas judiciales españolas.',
        cat: 'Liderazgo'
      },
      {
        title: 'Poder de decisión sin subordinación a partidos estatales',
        desc: 'Ausencia total de dependencia respecto a sucursales o direcciones políticas con sede en Madrid; lealtad exclusiva a los intereses de Cataluña.',
        cat: 'Independencia'
      }
    ]
  },

  bildu: {
    id: 'bildu',
    name: 'EH Bildu',
    shortName: 'EH BILDU',
    seats: 6,
    votes: '1.36%',
    leader: 'Mertxe Aizpurua / Arnaldo Otegi',
    color: '#00b093',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    ideology: 'Izquierda soberanista vasca / Abertzale / Progresismo social',
    block: 'Socio preferente del Gobierno',
    summary: 'Fuerza clave del bloque progresista. Priorizó cerrarle el paso al PP y Vox a nivel nacional mientras consolidaba su crecimiento electoral en Euskadi y Navarra combinando discurso social y soberanista.',
    program_summary: 'Con la consigna de "Frenar a las derechas y avanzar en derechos sociales", Bildu centró su programa en el reconocimiento nacional de Euskal Herria, el derecho a decidir, la protección de los trabajadores vascos mediante convenios laborales autonómicos, el refuerzo de la sanidad pública y el fin de la excepcionalidad penal penitenciaria.',
    key_proposals: [
      'Prevalencia de los convenios colectivos autonómicos sobre los estatales en el Estatuto de los Trabajadores.',
      'Reconocimiento plurinacional del Estado y derecho a la autodeterminación para Euskal Herria.',
      'Blindaje de las pensiones y aumento de la presión fiscal sobre el capital y grandes patrimonios.',
      'Fin definitivo de las medidas de excepción penitenciaria aplicadas a presos de ETA.',
      'Regulación estricta del mercado de la vivienda para garantizar el acceso juvenil.'
    ],
    fulfilled_promises: [
      'Consiguió por ley la prevalencia de los convenios colectivos autonómicos sobre los convenios sectoriales estatales.',
      'Logró la moción de censura en el Ayuntamiento de Pamplona (diciembre 2023), asumiendo la alcaldía Joseba Asiron con el voto favorable del PSN.',
      'Voto unánime y disciplinado para cerrar el paso a un gobierno de PP y Vox en España.',
      'Empate histórico a 27 escaños con el PNV en las elecciones al Parlamento Vasco de abril de 2024.'
    ],
    broken_promises: [
      'Pérdida de perfil rupturista: De fuerza antisistema independentista ha pasado a ser el socio parlamentario más cómodo y predecible del Gobierno español, sin plantear exigencias soberanistas inmediatas que incomoden al PSOE.',
      'Ambigüedad no resuelta sobre la condena a ETA: En la campaña vasca de 2024, su candidato Pello Otxandiano se negó reiteradamente a calificar a ETA como organización terrorista, calificándola de "grupo armado" y suscitando repulsa pública.',
      'Aceptación de la gobernabilidad española: Avala la prórroga de presupuestos y mandatos estatales pese a su histórica vocación de desconexión del Estado.'
    ],
    answers: [+2, +2, +2, +2, +2, +2, +2, -2, -2, +2, +2, -2, +2, +2, +2, -2, -2, +2, -2, -2],
    reasons: [
      {
        title: 'Defensa implacable de la clase trabajadora vasca',
        desc: 'Conquista histórica de la primacía de los convenios laborales autonómicos sobre los estatales para garantizar mejores condiciones y salarios a los trabajadores de Euskadi.',
        cat: 'Laboral'
      },
      {
        title: 'El muro más firme contra la ultraderecha',
        desc: 'Compromiso inquebrantable de cerrar el paso a cualquier intento de acceso al poder del Partido Popular y de Vox tanto en Madrid como en Navarra y Euskadi.',
        cat: 'Estrategia'
      },
      {
        title: 'Soberanismo social: la patria es el bienestar de su gente',
        desc: 'Unión indisociable entre la defensa de la identidad nacional de Euskal Herria y el fortalecimiento de la sanidad pública, educación y vivienda social.',
        cat: 'Social'
      },
      {
        title: 'Recuperación de la alcaldía de Pamplona/Iruña',
        desc: 'Capacidad de sumar mayorías progresistas para arrebatar las instituciones clave al conservadurismo rancio de UPN y poner la ciudad al servicio de los vecinos.',
        cat: 'Navarra'
      },
      {
        title: 'Impulso decisivo a la intervención del alquiler',
        desc: 'Presión constante para aplicar topes al precio de los pisos de alquiler y penalizar la vivienda vacía en manos de fondos y grandes tenedores.',
        cat: 'Vivienda'
      },
      {
        title: 'Defensa activa del euskera y de la identidad vasca',
        desc: 'Normalización y fomento del euskera en todos los ámbitos de la vida pública y laboral, protegiendo los derechos lingüísticos frente a la ofensiva judicial.',
        cat: 'Cultura'
      },
      {
        title: 'Crecimiento electoral histórico y renovación generacional',
        desc: 'Espacio político con el mayor empuje juvenil de Euskadi, liderando las encuestas y rompiendo el monopolio hegemónico de décadas del PNV.',
        cat: 'Futuro'
      },
      {
        title: 'Compromiso inequívoco con la paz y la reconciliación',
        desc: 'Aportación imprescindible al nuevo tiempo de paz sin violencia, facilitando pasos hacia la reparación integral de todas las víctimas de todas las violencias.',
        cat: 'Paz'
      },
      {
        title: 'Coherencia en política internacional y antiimperialismo',
        desc: 'Condena categórica del genocidio palestino, apoyo al Sahara Occidental y rechazo frontal a las escaladas bélicas y de rearme impuestas por la OTAN.',
        cat: 'Exterior'
      },
      {
        title: 'Lealtad parlamentaria y rigor presupuestario social',
        desc: 'Uso de sus 6 diputados exclusivamente para arrancar partidas para pensionistas, mejoras en los servicios públicos vascos y derechos laborales.',
        cat: 'Utilidad'
      }
    ]
  },

  pnv: {
    id: 'pnv',
    name: 'Euzko Alderdi Jeltzalea - Partido Nacionalista Vasco',
    shortName: 'EAJ-PNV',
    seats: 5,
    votes: '1.12%',
    leader: 'Aitor Esteban / Andoni Ortuzar',
    color: '#008040',
    badgeClass: 'bg-green-100 text-green-800 border-green-300',
    ideology: 'Nacionalismo vasco / Centro-democristiano / Autogobierno / Pro-empresa',
    block: 'Socio parlamentario del Gobierno',
    summary: 'Partido de gobierno en Euskadi durante más de cuatro décadas. Defiende el Concierto Económico, el cumplimiento íntegro del Estatuto de Gernika, el apoyo a la industria y la estabilidad institucional.',
    program_summary: 'Bajo el lema "La voz de Euskadi", el PNV situó en el centro de su agenda la culminación de todas las transferencias pendientes del Estatuto de Gernika, un nuevo estatus de autogobierno bilateral basado en el reconocimiento nacional vasco, la defensa del Concierto Económico y la protección de la competitividad de la industria vasca.',
    key_proposals: [
      'Traspaso íntegro e inmediato de todas las competencias pendientes del Estatuto de Gernika.',
      'Defensa absoluta y blindaje foral del Concierto Económico vasco.',
      'Nuevo estatus de autogobierno con reconocimiento de Euskadi como nación y bilateralidad con el Estado.',
      'Defensa de la industria manufacturera y energética vasca frente a la sobreimposición fiscal.',
      'Traspaso de la gestión de la Seguridad Social y de las infraestructuras de transporte ferroviario.'
    ],
    fulfilled_promises: [
      'Consiguió el traspaso efectivo de competencias clave a Euskadi, como la homologación de títulos universitarios extranjeros y las líneas de cercanías ferroviarias.',
      'Logró enmiendas esenciales en leyes fiscales para proteger las deducciones e inversiones industriales de las empresas vascas.',
      'Revalidó la Lehendakaritza tras las elecciones vascas de 2024 con Imanol Pradales mediante la reedición de la coalición con el PSE-EE.',
      'Blindaje de la interlocución directa bilateral de las haciendas forales vascas.'
    ],
    broken_promises: [
      'Pérdida del monopolio de interlocución en Madrid: El avance de EH Bildu ha restado protagonismo y exclusividad al PNV como socio preferente del Gobierno de España.',
      'Retraso acumulado en el nuevo estatus político de autogobierno, que sigue sin avances sustantivos en las mesas parlamentarias.',
      'Desgaste en la gestión sanitaria vasca (crisis de Osakidetza) y descontento entre sectores tradicionales del centro-derecha vasco por su alineamiento continuo con el bloque de Pedro Sánchez.'
    ],
    answers: [+1, -1, -1, -1, -1, +1, +2, +1, +1, +1, +1, +1, +1, +1, +1, +2, +1, +2, +1, -1],
    reasons: [
      {
        title: 'Autogobierno útil y culminación del Estatuto de Gernika',
        desc: 'Garantía histórica de que cada voto se traduce en competencias reales, autogobierno tangible y recursos directos gestionados desde las instituciones vascas.',
        cat: 'Autogobierno'
      },
      {
        title: 'Defensa a ultranza del Concierto Económico y la Hacienda Foral',
        desc: 'Protección innegociable de la joya de la corona del autogobierno vasco, asegurando la autonomía financiera y el pago justo mediante el cupo.',
        cat: 'Finanzas'
      },
      {
        title: 'Modelo de solvencia de gestión y protección del tejido industrial',
        desc: 'Apostar por el ecosistema empresarial vasco, las cooperativas, los centros tecnológicos y el empleo cualificado frente al intervencionismo asfixiante.',
        cat: 'Industria'
      },
      {
        title: 'Estabilidad y cultura institucional frente a la bronca política',
        desc: 'Ejercicio de una política responsable, educada y predecible que rehúye del populismo, la crispación y los insultos que dominan la escena nacional.',
        cat: 'Institucional'
      },
      {
        title: 'Línea roja inequívoca frente al extremismo de VOX',
        desc: 'Firmeza absoluta para no legitimar ni facilitar ningún gobierno dependiente de la extrema derecha que pretenda suprimir las instituciones forales.',
        cat: 'Democracia'
      },
      {
        title: 'Defensa del modelo educativo mixto y la concertada',
        desc: 'Protección de la red de ikastolas y colegios concertados que garantizan la libre elección educativa de las familias y la inmersión lingüística en euskera.',
        cat: 'Educación'
      },
      {
        title: 'Pragmatismo bilateral con el Estado',
        desc: 'Capacidad de pactar tanto con gobiernos socialistas como con administraciones de otro signo político siempre que se respete la singularidad vasca.',
        cat: 'Bilateralidad'
      },
      {
        title: 'Proyección europeísta y red atlántica',
        desc: 'Tradición histórica de europeísmo democrático, fomentando la conexión de Euskadi con las regiones líderes de Europa y el Corredor Ferroviario Atlántico.',
        cat: 'Europa'
      },
      {
        title: 'Cohesión social sin dogmatismos trasnochados',
        desc: 'Fomento del sistema de Renta de Garantía de Ingresos (RGI) más avanzado de España, compaginando el escudo social con el fomento del esfuerzo laboral.',
        cat: 'Social'
      },
      {
        title: 'La voz sensata y de confianza de la sociedad vasca',
        desc: 'Experiencia acumulada de más de cuatro décadas construyendo el Euskadi moderno con las tasas de desempleo más bajas y los mayores índices de desarrollo humano.',
        cat: 'Historia'
      }
    ]
  },

  bng: {
    id: 'bng',
    name: 'Bloque Nacionalista Galego',
    shortName: 'BNG',
    seats: 1,
    votes: '0.62%',
    leader: 'Néstor Rego / Ana Pontón',
    color: '#73b2d9',
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-300',
    ideology: 'Nacionalismo gallego / Izquierda soberanista / Ecologismo',
    block: 'Socio de investidura',
    summary: 'Único representante del nacionalismo gallego en las Cortes. Destaca por vincular su apoyo a Sánchez a inversiones directas en Galicia, bonificación de la AP-9 y la reactivación del ferrocarril de proximidad.',
    program_summary: 'Bajo el lema "Galiza con voz propia", el BNG defendió una agenda gallega ambiciosa: transferencia de la autopista AP-9 y supresión de peajes, modernización de la red ferroviaria interior gallega, creación de una tarifa eléctrica gallega que compense su condición de productora excedentaria de energía y financiación autonómica justa.',
    key_proposals: [
      'Traspaso a Galicia y gratuidad progresiva de los peajes de la AP-9 y AP-53.',
      'Plan de modernización ferroviaria: cercanías en Galicia y conexión directa Ferrol-A Coruña y Lugo-Ourense.',
      'Tarifa eléctrica gallega que beneficie a familias y empresas locales por la producción renovable e hidroeléctrica del país.',
      'Reconocimiento de Galicia como nación con nuevo estatuto de soberanía.',
      'Defensa del sector pesquero, conservero y del campo gallego ante normativas restrictivas comunitarias.'
    ],
    fulfilled_promises: [
      'Firmó el acuerdo de investidura con el PSOE que garantizó nuevas bonificaciones de hasta el 75% en los peajes de la AP-9 y la AP-53.',
      'Compromiso vinculante del Ministerio de Transportes para avanzar en el estudio y despliegue del tren de cercanías en Galicia.',
      'Histórico ascenso en las elecciones gallegas de febrero de 2024, alcanzando 25 escaños y consolidándose como líder indiscutible de la alternativa de gobierno en Galicia.'
    ],
    broken_promises: [
      'El peso de un único diputado en el Congreso es limitado para forzar la transferencia total de la AP-9 o la tarifa eléctrica gallega.',
      'Muchos de los compromisos presupuestarios e inversiones ferroviarias pactados sufren retrasos crónicos por parte del Gobierno central.'
    ],
    answers: [+2, +2, +2, +2, +2, +2, +2, -2, -2, +2, +2, -2, +2, +2, +2, -2, -2, +2, -2, -2],
    reasons: [
      {
        title: 'Galicia en el centro de todas las decisiones',
        desc: 'Garantía absoluta de que Galicia no es olvidada en los presupuestos de Madrid frente a las exigencias continuas de Cataluña o el País Vasco.',
        cat: 'Galicia'
      },
      {
        title: 'Rebaja histórica y gratuidad de los peajes de la AP-9',
        desc: 'Logro real de rebajas de hasta el 75% en los costes de la autopista del Atlántico, luchando por el fin del peaje de una infraestructura ya más que amortizada.',
        cat: 'Transporte'
      },
      {
        title: 'Tarifa eléctrica propia para un país productor de energía',
        desc: 'Justicia económica para que la ciudadanía gallega pague menos por la luz, compensando el impacto ecológico de los parques eólicos y embalses en su territorio.',
        cat: 'Energía'
      },
      {
        title: 'El tren que Galicia merece: red de cercanías real',
        desc: 'Lucha por recuperar el ferrocarril de proximidad y conectar las ciudades y villas gallegas frente al abandono del tren convencional en favor exclusivo del AVE.',
        cat: 'Movilidad'
      },
      {
        title: 'Izquierda transformadora, ecologista y defensora del mar',
        desc: 'Defensa de las rías gallegas frente a la contaminación industrial, de la flota pesquera artesanal y del medio rural sostenible frente a la especulación de macrocelulosas.',
        cat: 'Mar e Industria'
      },
      {
        title: 'Liderazgo consolidado y en auge de Ana Pontón',
        desc: 'Un proyecto fresco, transversal y en constante crecimiento que ya es la segunda fuerza política de Galicia con 25 diputados en el Parlamento de O Hórreo.',
        cat: 'Liderazgo'
      },
      {
        title: 'Defensa de la lengua gallega sin complejos',
        desc: 'Dignificación del gallego frente al retroceso de hablantes, fomentando su uso cotidiano en la enseñanza, la justicia y los medios digitales.',
        cat: 'Cultura'
      },
      {
        title: 'Solidaridad fiscal y blindaje del gasto social',
        desc: 'Propuesta de mayor presión fiscal a las rentas más altas y a las eléctricas para financiar la sanidad pública y residencias de mayores 100% públicas.',
        cat: 'Fiscal'
      },
      {
        title: 'Reconocimiento nacional y soberanía política',
        desc: 'Defensa de Galicia como nación histórica con derecho a decidir su futuro y a no ser tratada como una provincia periférica de segunda categoría.',
        cat: 'Soberanía'
      },
      {
        title: 'Voto útil y coherente para frenar al Partido Popular',
        desc: 'La única fuerza política que planta cara con firmeza a las mayorías conservadoras del PP de Rueda en Galicia mientras aporta estabilidad al bloque progresista estatal.',
        cat: 'Estrategia'
      }
    ]
  },

  cc: {
    id: 'cc',
    name: 'Coalición Canaria',
    shortName: 'CC',
    seats: 1,
    votes: '0.46%',
    leader: 'Cristina Valido / Fernando Clavijo',
    color: '#ffd500',
    badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    ideology: 'Nacionalismo canario / Centro-liberal / Regionalismo insular',
    block: 'Voto de investidura transaccional',
    summary: 'Partido de gobierno en las Islas Canarias (coalición con el PP). Su único escaño fue clave para la investidura de Pedro Sánchez tras la firma rigurosa de la "Agenda Canaria" y el cumplimiento del Régimen Económico y Fiscal (REF).',
    program_summary: 'Centró su programa en el cumplimiento íntegro del Régimen Económico y Fiscal (REF), la bonificación del 75% al transporte marítimo y aéreo para residentes canarios, la gratuidad de guaguas y tranvías y la atención urgente del Estado y de la UE ante la crisis migratoria de la Ruta Canaria.',
    key_proposals: [
      'Cumplimiento y blindaje constitucional del Régimen Económico y Fiscal (REF) de Canarias.',
      'Reforma obligatoria del artículo 35 de la Ley de Extranjería para repartir a los menores migrantes no acompañados entre todas las comunidades.',
      'Garantía permanente de la bonificación del 75% en el transporte aéreo y marítimo para residentes canarios.',
      'Gratuidad del transporte terrestre en guagua y tranvía en todas las islas.',
      'Plan de rescate y reconstrucción de la isla de La Palma tras la erupción volcánica de 2021.'
    ],
    fulfilled_promises: [
      'Selló con el PSOE la "Agenda Canaria" como condición de investidura, asegurando partidas presupuestarias específicas para el archipiélago.',
      'Mantuvo la gratuidad del transporte público de viajeros en Canarias durante todo 2024.',
      'Lidera el Gobierno de Canarias en coalición con el Partido Popular, mostrando pragmatismo institucional a ambos lados del espectro político.'
    ],
    broken_promises: [
      'Fracaso del reparto obligatorio de menores migrantes en el Congreso (julio 2024): A pesar de sus esfuerzos, PP, Vox y Junts tumbaron la reforma legal de la Ley de Extranjería, dejando a Canarias saturada con más de 5.500 menores en centros de acogida.',
      'Su dependencia presupuestaria de Madrid la somete a la constante incertidumbre por la falta de Presupuestos Generales del Estado.'
    ],
    answers: [0, -1, -1, -1, 0, 0, +1, +1, +1, +1, 0, +1, +1, +1, +1, +1, +1, +2, +1, +1],
    reasons: [
      {
        title: 'La Agenda Canaria por encima de cualquier ideología de bloque',
        desc: 'Prioridad exclusiva a los intereses de las 8 islas por encima de las disciplinas de partido de los grandes bloques de Madrid o de peleas partidistas.',
        cat: 'Canarias'
      },
      {
        title: 'Blindaje irrenunciable del REF y fuero canario',
        desc: 'Protección constitucional de las especificidades tributarias e incentivos económicos de Canarias para compensar la ultraperiferia y la lejanía continental.',
        cat: 'Economía'
      },
      {
        title: 'Bonificación del 75% en billetes y transporte gratuito',
        desc: 'Garantía del descuento del 75% en viajes en avión y barco a la península y mantenimiento de la gratuidad de las guaguas para los residentes canarios.',
        cat: 'Movilidad'
      },
      {
        title: 'Exigencia de solidaridad del Estado ante la crisis migratoria',
        desc: 'Lucha infatigable para que el Estado y el resto de comunidades asuman su cuota de acogida de menores migrantes no acompañados en lugar de saturar a las islas.',
        cat: 'Migración'
      },
      {
        title: 'Reconstrucción justa e indemnizaciones para La Palma',
        desc: 'Compromiso continuo con las familias afectadas por el volcán de Cumbre Vieja mediante deducciones fiscales y entrega de viviendas definitivas.',
        cat: 'La Palma'
      },
      {
        title: 'Capacidad de pactar a derecha e izquierda',
        desc: 'Pragmatismo institucional demostrado: gobierna con el PP en Canarias y apoyó la investidura de Pedro Sánchez en Madrid para maximizar los recursos del archipiélago.',
        cat: 'Gobernanza'
      },
      {
        title: 'Defensa de las aguas territoriales canarias y recursos',
        desc: 'Vigilancia activa frente a las pretensiones de delimitación marítima de Marruecos y control estricto de cualquier prospección en aguas cercanas.',
        cat: 'Soberanía'
      },
      {
        title: 'Turismo sostenible y diversificación económica',
        desc: 'Impulso a un modelo turístico de mayor valor añadido que respete los frágiles ecosistemas canarios y genere empleo de calidad para la población local.',
        cat: 'Sostenibilidad'
      },
      {
        title: 'Sanidad y educación adaptadas a la realidad insular',
        desc: 'Inversión específica para dotar a las islas no capitalinas de servicios sanitarios de urgencia y especialistas para evitar traslados constantes.',
        cat: 'Servicios'
      },
      {
        title: 'Voto decisivo en un Congreso fraccionado al milímetro',
        desc: 'El valor incalculable de tener un escaño bisagra que puede decantar votaciones nacionales clave en favor de las demandas del pueblo canario.',
        cat: 'Estrategia'
      }
    ]
  },

  upn: {
    id: 'upn',
    name: 'Unión del Pueblo Navarro',
    shortName: 'UPN',
    seats: 1,
    votes: '0.21%',
    leader: 'Alberto Catalán / Cristina Ibarrola',
    color: '#002f6c',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
    ideology: 'Regionalismo foral navarro / Centro-derecha / Constitucionalismo español',
    block: 'Oposición frontal',
    summary: 'Fuerza foralista histórica de Navarra. Defiende el Régimen Foral y el Convenio Económico dentro de la unidad indivisible de España, y rechaza categóricamente la anexión de Navarra a Euskadi.',
    program_summary: 'Bajo el lema "La defensa de Navarra frente al nacionalismo", UPN articuló un programa centrado en la derogación de la disposición transitoria cuarta de la Constitución (que contempla la posible incorporación de Navarra a Euskadi), la defensa de la foralidad integrada en España, la bajada de impuestos y la oposición a los acuerdos entre el PSOE y EH Bildu.',
    key_proposals: [
      'Derogación de la Disposición Transitoria Cuarta de la Constitución Española.',
      'Defensa del régimen foral navarro y actualización del Convenio Económico con el Estado.',
      'Freno absoluto a la cesión institucional ante el independentismo vasco y condena sin fisuras de ETA.',
      'Bajada del IRPF en Navarra para dejar de ser la comunidad con mayor presión fiscal sobre rentas medias.',
      'Defensa de la libertad de elección de centro educativo y del modelo concertado en Navarra.'
    ],
    fulfilled_promises: [
      'Voto inflexible en el Congreso contra la investidura de Pedro Sánchez y contra la Ley de Amnistía.',
      'Oposición rotunda a los acuerdos del PSN con EH Bildu en Navarra.',
      'Defensa incondicional de los símbolos de Navarra y del régimen foral en las Cortes Generales.'
    ],
    broken_promises: [
      'Pérdida de la alcaldía de Pamplona en diciembre de 2023 tras la moción de censura pactada entre el PSOE y Bildu, dejando a UPN sin su principal bastión de gobierno.',
      'Aislamiento institucional tras la ruptura electoral con el Partido Popular en los comicios generales y forales, limitando su influencia real en el Parlamento nacional a un único escaño testimoníal.'
    ],
    answers: [-1, -2, -2, -2, -1, -2, -2, +2, +2, -2, -2, +2, -2, -1, -2, +2, +2, -1, +2, +2],
    reasons: [
      {
        title: 'Navarra foral y española: freno a la anexión vasquista',
        desc: 'El muro más firme contra las pretensiones del nacionalismo abertzale de absorber a Navarra dentro de una hipotética Euskal Herria independiente.',
        cat: 'Navarra'
      },
      {
        title: 'Derogación de la Disposición Transitoria Cuarta',
        desc: 'Exigencia para suprimir definitivamente de la Constitución la cláusula que permite la unión territorial de Navarra con la Comunidad Autónoma Vasca.',
        cat: 'Constitución'
      },
      {
        title: 'Defensa del Régimen Foral y Convenio Económico',
        desc: 'Protección de los derechos históricos y del Convenio de Navarra con el Estado para gestionar con autonomía propia los tributos forales.',
        cat: 'Foralismo'
      },
      {
        title: 'Dignidad de las víctimas y memoria frente a los herederos de ETA',
        desc: 'Rechazo categórico a cualquier pacto político con EH Bildu mientras no condenen sin ambages el terrorismo y colaboren con el esclarecimiento de crímenes impunes.',
        cat: 'Memoria'
      },
      {
        title: 'Rebaja fiscal para devolver el dinamismo a Navarra',
        desc: 'Eliminación del castigo fiscal impuesto por los gobiernos del PSN y nacionalistas, reduciendo el IRPF a familias y pymes para recuperar la competitividad perdida.',
        cat: 'Fiscal'
      },
      {
        title: 'Libertad educativa y apoyo a la educación concertada',
        desc: 'Garantía del derecho de los padres navarros a elegir centro escolar, idioma y orientación formativa para sus hijos con financiación pública garantizada.',
        cat: 'Educación'
      },
      {
        title: 'Apoyo decidido al tejido agroalimentario e industrial',
        desc: 'Defensa del Canal de Navarra, de la huerta ribera y del potente sector automovilístico e industrial de la Comunidad Foral.',
        cat: 'Economía'
      },
      {
        title: 'Firmeza constitucional y respeto al Estado de Derecho',
        desc: 'Oposición frontal a la Ley de Amnistía y a cualquier privilegio penal concedido a políticos a cambio de votos parlamentarios en Madrid.',
        cat: 'Justicia'
      },
      {
        title: 'Defensa del derecho a la vida y apoyo integral a la maternidad',
        desc: 'Protección activa del concebido no nacido como valor ético foral fundamental, fomento de alternativas reales y ayudas asistenciales para las familias y madres gestantes.',
        cat: 'Vida y Familia'
      },
      {
        title: 'Voz propia en el Congreso sin ataduras con Génova ni Ferraz',
        desc: 'Representación directa y exclusiva de los intereses de Navarra sin someterse a los dictados de las sedes centrales de los partidos madrileños.',
        cat: 'Independencia'
      }
    ]
  }
};

// =========================================================================
// 20 PREGUNTAS RIGUROSAS PARA EL TEST DE AFINIDAD (USUARIOS FORMADOS)
// =========================================================================

const QUESTIONS = [
  {
    id: 1,
    topic: 'Financiación Territorial',
    title: 'Financiación Singular vs. Solidaridad Interterritorial',
    question: '¿Debe permitirse a comunidades autónomas de alta capacidad fiscal (como Cataluña) acceder a una financiación singular basada en la recaudación del 100% de los tributos y transferencia de un cupo, o debe blindarse un régimen común basado en la nivelación y la solidaridad estricta?',
    context: 'Debate de fondo tras el pacto PSOE-ERC para la investidura en Cataluña (2024), confrontando el modelo foral/concierto con los principios de equidad del Título VIII de la Constitución.',
    dimension: 'territorial',
    direction: -1, // +2: Régimen común/centralizado; -2: Soberanía fiscal/singular
    // Party stances on scale: -2 (totalmente en contra de singularidad / pro régimen común o recentralización) to +2 (totalmente a favor del cupo/concierto/singularidad)
    partyStances: {
      pp: -2,
      psoe: +1, // Ha aceptado el principio de financiación singular en Cataluña
      vox: -2,  // Radical rechazo a cualquier régimen especial
      sumar: +1,// A favor de la soberanía fiscal y plurinacionalidad
      erc: +2,  // Exigencia fundacional
      junts: +2,// Exigencia fundacional
      bildu: +2,// Defiende la soberanía tributaria
      pnv: +2,  // Defiende el concierto y su extensión
      bng: +2,  // Reclama concierto para Galicia
      cc: 0,    // Defiende el REF canario, neutral en pugna catalana
      upn: -1   // Defiende el Convenio Navarro pero rechaza el cupo catalán
    }
  },
  {
    id: 2,
    topic: 'Fiscalidad',
    title: 'Gravámenes Extraordinarios a Banca, Energéticas y Grandes Fortunas',
    question: '¿Es conveniente hacer permanentes los impuestos extraordinarios sobre beneficios extraordinarios de entidades bancarias, energéticas y patrimonios superiores a 3 millones de euros para reforzar el Estado del bienestar, o deben suprimirse para incentivar la inversión productiva?',
    context: 'Disyuntiva entre redistribución progresiva mediante figuras tributarias finalistas o estímulo a la competitividad empresarial y atracción de capital privado.',
    dimension: 'economic',
    partyStances: {
      pp: -2,
      psoe: +2,
      vox: -2,
      sumar: +2,
      erc: +2,
      junts: -1, // Junts defiende alivio tributario a empresas y pymes
      bildu: +2,
      pnv: -1,  // PNV ha pedido exenciones y concertación para proteger a Repsol/Iberdrola
      bng: +2,
      cc: -1,
      upn: -2
    }
  },
  {
    id: 3,
    topic: 'Vivienda',
    title: 'Intervención de Precios del Alquiler vs. Desregulación y Seguridad Jurídica',
    question: '¿Debe el Estado intervenir de forma coercitiva los precios del alquiler en áreas tensionadas e imponer recargos a viviendas desocupadas, o debe basarse la política en la liberalización de suelo, incentivos fiscales y garantías procesales para el desalojo exprés de ocupaciones ilegales?',
    context: 'Aplicación práctica de la Ley Estatal de Vivienda 12/2023 frente al modelo de seguridad para propietarios y oferta libre defendido por las comunidades del centro-derecha.',
    dimension: 'economic',
    partyStances: {
      pp: -2,
      psoe: +1,
      vox: -2,
      sumar: +2,
      erc: +2,
      junts: -2, // Junts rechaza topar alquileres y prioriza propiedad
      bildu: +2,
      pnv: -1,  // PNV recurrió la ley por invasión de competencias
      bng: +2,
      cc: -1,
      upn: -2
    }
  },
  {
    id: 4,
    topic: 'Mercado Laboral',
    title: 'Reducción Legal de la Jornada Laboral a 37,5 Horas Semanales',
    question: '¿Debe establecerse por ley una jornada laboral máxima de 37,5 horas semanales sin reducción de salario de manera homogénea en toda la economía, o debe dejarse la determinación del tiempo de trabajo a la negociación colectiva sectorial?',
    context: 'Iniciativa impulsada por el Ministerio de Trabajo de Yolanda Díaz que enfrenta a las organizaciones sindicales con la patronal CEOE y sectores empresariales intensivos en mano de obra.',
    dimension: 'economic',
    partyStances: {
      pp: -2,
      psoe: +1,
      vox: -2,
      sumar: +2,
      erc: +2,
      junts: -1,
      bildu: +2,
      pnv: -1,
      bng: +2,
      cc: -1,
      upn: -2
    }
  },
  {
    id: 5,
    topic: 'Pensiones',
    title: 'Revalorización de Pensiones por IPC vs. Factor de Sostenibilidad Mixto',
    question: '¿Debe mantenerse intacto el blindaje de la revalorización de todas las pensiones según el IPC anual sosteniéndolo con subidas de cotizaciones a empresas y trabajadores, o deben introducirse factores de ajuste demográfico e incentivos a planes privados o de capitalización?',
    context: 'Dilema de equidad intergeneracional ante el aumento continuado de la partida de gasto en pensiones en los PGE y las recomendaciones de la AIReF.',
    dimension: 'economic',
    partyStances: {
      pp: -1,
      psoe: +2,
      vox: -1,
      sumar: +2,
      erc: +1,
      junts: -1,
      bildu: +2,
      pnv: -1,
      bng: +2,
      cc: 0,
      upn: -1
    }
  },
  {
    id: 6,
    topic: 'Institucional',
    title: 'Ley de Amnistía para los Encausados del Procés Catalán',
    question: '¿Es la Ley de Amnistía una medida jurídicamente admisible y políticamente necesaria para normalizar la convivencia y devolver la disputa al terreno político, o supone una vulneración del principio constitucional de igualdad y una injerencia lesiva en el Poder Judicial?',
    context: 'Aprobación de la Ley Orgánica 1/2024 de amnistía tras la investidura de la XV Legislatura y su examen por parte del Tribunal Constitucional y el Tribunal de Justicia de la UE.',
    dimension: 'institutional',
    partyStances: {
      pp: -2,
      psoe: +2,
      vox: -2,
      sumar: +2,
      erc: +2,
      junts: +2,
      bildu: +2,
      pnv: +2,
      bng: +2,
      cc: -1,
      upn: -2
    }
  },
  {
    id: 7,
    topic: 'Modelo de Estado',
    title: 'Reconocimiento de la Plurinacionalidad y Consultas de Autodeterminación',
    question: '¿Debe reformarse el marco constitucional para reconocer a España como un Estado plurinacional con cauces legales para celebrar referéndums de autodeterminación vinculantes en nacionalidades históricas, o debe preservarse la soberanía nacional única e indivisible del pueblo español?',
    context: 'Núcleo del conflicto territorial entre el soberanismo periférico (Cataluña, Euskadi, Galicia) y las concepciones unitarias o de autonomía descentralizada de la Constitución de 1978.',
    dimension: 'territorial',
    partyStances: {
      pp: -2,
      psoe: -1, // PSOE defiende Estado autonómico plurinacional pero rechaza referéndum
      vox: -2,
      sumar: +2,
      erc: +2,
      junts: +2,
      bildu: +2,
      pnv: +2,
      bng: +2,
      cc: +1,
      upn: -2
    }
  },
  {
    id: 8,
    topic: 'Transición Energética',
    title: 'Cierre Definitivo de Centrales Nucleares vs. Extensión de su Vida Útil',
    question: '¿Debe ejecutarse el calendario acordado de cierre definitivo del parque nuclear español entre 2027 y 2035 sustituyéndolo exclusivamente por renovables y almacenamiento, o debe prorrogarse su vida operativa para garantizar suministro base continuo y precios competitivos?',
    context: 'Divergencia entre la política del PNIEC del Gobierno y las tendencias de la taxonomía verde europea adoptadas por Francia, EE.UU. u otros socios de la OCDE.',
    dimension: 'economic',
    partyStances: {
      pp: +2,  // A favor de extender vida útil de nucleares
      psoe: -2,// Firme en el calendario de cierre
      vox: +2, // A favor de nucleares
      sumar: -2,// Rechazo total a la nuclear
      erc: -2,
      junts: +1, // Junts es favorable a mantener industria y evitar cortes
      bildu: -2,
      pnv: +1,  // PNV defiende la competitividad de la industria vasca
      bng: -2,
      cc: +1,
      upn: +2
    }
  },
  {
    id: 9,
    topic: 'Poder Judicial',
    title: 'Elección de los Vocales del Consejo General del Poder Judicial',
    question: '¿Deben los 12 vocales judiciales del CGPJ ser elegidos directamente por los propios jueces sin intervención del poder legislativo, o debe mantenerse un sistema donde las Cortes Generales participen para garantizar la legitimidad democrática emanada de la soberanía popular?',
    context: 'Bloqueo histórico de más de un lustro en el órgano de gobierno de los jueces y las recomendaciones del Grupo de Estados contra la Corrupción (GRECO) del Consejo de Europa.',
    dimension: 'institutional',
    partyStances: {
      pp: +2,  // Elección corporativa directa por jueces
      psoe: -2,// Legitimidad parlamentaria
      vox: +2, // Elección por jueces
      sumar: -2,// Legitimidad parlamentaria
      erc: -2,
      junts: -1,
      bildu: -2,
      pnv: 0,
      bng: -2,
      cc: +1,
      upn: +2
    }
  },
  {
    id: 10,
    topic: 'Inmigración',
    title: 'Regularizaciones Extraordinarias y Reparto Obligatorio vs. Endurecimiento Fronterizo',
    question: '¿Debe España promover regularizaciones extraordinarias de personas extranjeras en situación administrativa y hacer obligatorio por ley el reparto de menores migrantes entre CC.AA., o debe priorizarse el endurecimiento de controles fronterizos, devoluciones y expulsiones inmediatas?',
    context: 'Crisis migratoria en la Ruta Canaria, saturación de acogida insular y debate sobre la ILP para la regularización de 500.000 personas tramitada en el Congreso.',
    dimension: 'social',
    partyStances: {
      pp: -1,  // Votó en contra del reparto forzoso con Junts
      psoe: +2, // Promotor del reparto y favorable a la ILP
      vox: -2,  // Rechazo total y expulsión
      sumar: +2,// Favorable a regularización y derechos
      erc: +2,
      junts: -1,// Junts exige delegación integral y expulsión de delincuentes
      bildu: +2,
      pnv: +1,
      bng: +2,
      cc: +2,   // Emergencia humanitaria canaria absoluta
      upn: -1
    }
  },
  {
    id: 11,
    topic: 'Memoria Histórica',
    title: 'Ley de Memoria Democrática vs. Leyes de Concordia',
    question: '¿Debe el Estado intensificar las exhumaciones públicas, ilegalización de fundaciones franquistas y anulación de juicios de la dictadura, o deben promoverse "leyes de concordia" que eviten la revisión retrospectiva y mantengan el pacto de reconciliación de la Transición de 1978?',
    context: 'Controversia desatada por las normativas de concordia aprobadas en Castilla y León, C. Valenciana y Aragón por gobiernos PP-VOX y los informes de relatores de la ONU.',
    dimension: 'social',
    partyStances: {
      pp: -2,
      psoe: +2,
      vox: -2,
      sumar: +2,
      erc: +2,
      junts: +1,
      bildu: +2,
      pnv: +1,
      bng: +2,
      cc: 0,
      upn: -2
    }
  },
  {
    id: 12,
    topic: 'Defensa y Geopolítica',
    title: 'Gasto Militar al 2% del PIB y Apoyo Bélico a Ucrania',
    question: '¿Debe España acelerar la inversión en Defensa para alcanzar el 2% del PIB comprometido con la OTAN y mantener el envío de material militar a Ucrania, o debe frenarse el gasto armamentístico priorizando la diplomacia pacífica y la autonomía estratégica civil?',
    context: 'Cumplimiento de los objetivos de la cumbre de Vilna de la Alianza Atlántica y tensiones en el seno del Gobierno entre el ala socialista y sus socios de investidura.',
    dimension: 'institutional',
    partyStances: {
      pp: +2,  // Apoyo decidido al 2% y a la OTAN
      psoe: +2,// Compromiso gubernamental con la OTAN y Zelensky
      vox: +2, // Apoyo al gasto militar y soberanía de fronteras
      sumar: -2,// Rechazo al rearme y al 2% en defensa
      erc: -2, // Antimilitarismo
      junts: +1,// Junts apoya a Ucrania y pertenencia a la OTAN
      bildu: -2,// Rechazo frontal a la OTAN
      pnv: +1, // Respaldo pragmático a compromisos europeos
      bng: -2, // Rechazo a la OTAN
      cc: +1,
      upn: +2
    }
  },
  {
    id: 13,
    topic: 'Política Exterior',
    title: 'Reconocimiento Unilateral del Estado de Palestina',
    question: '¿Ha sido acertado que España reconozca formalmente y de forma unilateral el Estado de Palestina para forzar una solución política de dos estados, o debió supeditarse a un consenso previo unánime en el seno de la Unión Europea y a la liberación de rehenes por Hamás?',
    context: 'Decisión adoptada por el Consejo de Ministros de España en mayo de 2024 junto a Irlanda y Noruega en plena ofensiva en la Franja de Gaza.',
    dimension: 'institutional',
    partyStances: {
      pp: -2,  // Crítica por falta de consenso europeo y oportunidad
      psoe: +2,// Medida impulsada y liderada por Pedro Sánchez
      vox: -2, // Apoyo total a Israel y condena a Hamás
      sumar: +2,// Reclama además ruptura de relaciones y embargo
      erc: +2,
      junts: +1,
      bildu: +2,
      pnv: +1,
      bng: +2,
      cc: +1,
      upn: -2
    }
  },
  {
    id: 14,
    topic: 'Legislación de Género',
    title: 'Marco Específico de Violencia de Género vs. Violencia Intrafamiliar Neutra',
    question: '¿Debe mantenerse y reforzarse la legislación penal específica de violencia de género que agrava las penas al varón y establece juzgados especializados, o debe reemplazarse por una ley de violencia intrafamiliar con igual reproche penal sin distinción de sexo?',
    context: 'Consenso político del Pacto de Estado contra la Violencia de Género confrontado con la postura programática de VOX.',
    dimension: 'social',
    partyStances: {
      pp: +1,  // El PP apoya la ley de violencia de género aunque asumió matices en pactos
      psoe: +2,// Pilar ideológico fundamental
      vox: -2, // Exigencia de derogación total
      sumar: +2,// Pilar ideológico fundamental
      erc: +2,
      junts: +1,
      bildu: +2,
      pnv: +1,
      bng: +2,
      cc: +1,
      upn: +1
    }
  },
  {
    id: 15,
    topic: 'Derechos Civiles',
    title: 'Autodeterminación Registral de Género (Ley Trans)',
    question: '¿Debe consolidarse el principio de autodeterminación del sexo legal en el Registro Civil sin necesidad de informe médico ni hormonación desde los 16 años (Ley 4/2023), o debe derogarse/modificarse para exigir diagnósticos clínicos y salvaguardas periciales previas?',
    context: 'Debate enconado entre el activismo trans y sectores del feminismo clásico abolicionista, junto a las fuerzas de centro-derecha.',
    dimension: 'social',
    partyStances: {
      pp: -2,  // Compromiso de derogación o reforma profunda
      psoe: +1,// Ley aprobada por su gobierno (con tensiones internas previas)
      vox: -2, // Derogación total
      sumar: +2,// Defensa cerrada de la ley
      erc: +2,
      junts: +1,
      bildu: +2,
      pnv: +1,
      bng: +2,
      cc: +1,
      upn: -2
    }
  },
  {
    id: 16,
    topic: 'Educación',
    title: 'Financiación de la Educación Concertada y Libertad de Elección de Centro',
    question: '¿Debe garantizarse la financiación pública continuada de los colegios concertados y el derecho de las familias a elegir centro según sus convicciones morales, o debe priorizarse exclusivamente la inversión en la red pública estatal limitando el régimen de conciertos?',
    context: 'Tensiones derivadas de la aplicación de la LOMLOE (Ley Celaá), ratios por aula y aportaciones complementarias de las familias.',
    dimension: 'social',
    partyStances: {
      pp: +2,  // Defensa de la concertada y cheque escolar
      psoe: -1,// Prioridad a la pública, manteniendo conciertos
      vox: +2, // Máxima defensa de la concertada y pin parental
      sumar: -2,// Supresión progresiva de conciertos educativos
      erc: -2,
      junts: +1,// En Cataluña defiende el modelo concertado histórico
      bildu: -2,
      pnv: +2, // En Euskadi defiende el modelo mixto e ikastolas
      bng: -2,
      cc: +1,
      upn: +2
    }
  },
  {
    id: 17,
    topic: 'Disciplina Fiscal',
    title: 'Austeridad y Reglas Fiscales Europeas vs. Flexibilidad para Gasto Social',
    question: '¿Debe España supeditar estrictamente sus políticas presupuestarias al límite del 3% de déficit y reducción continuada de deuda pública exigidos por la Comisión Europea, o debe primar la inversión en servicios esenciales y flexibilizar los límites de déficit en coyunturas de necesidad social?',
    context: 'Reactivación de las reglas fiscales del Pacto de Estabilidad de la UE tras la suspensión por la pandemia de COVID-19 y la guerra de Ucrania.',
    dimension: 'economic',
    partyStances: {
      pp: +2,  // Cumplimiento estricto y recorte de gasto público
      psoe: 0,  // Compromiso formal con Bruselas buscando senda gradual
      vox: +2, // Reducción de gasto político/autonómico
      sumar: -2,// Rechazo a la austeridad impuesta por Bruselas
      erc: -2,
      junts: +1,// Disciplina financiera y no endeudar a las generaciones
      bildu: -2,
      pnv: +1, // Rigor presupuestario foral
      bng: -2,
      cc: +1,
      upn: +2
    }
  },
  {
    id: 18,
    topic: 'Infraestructuras',
    title: 'Prioridad en Cercanías y Corredores de Mercancías vs. Despliegue de Alta Velocidad (AVE)',
    question: '¿Debe reorientarse de forma masiva el presupuesto del Ministerio de Transportes hacia las redes de Cercanías cotidianas y los corredores ferroviarios periféricos (Mediterráneo y Atlántico), ralentizando la culminación de nuevas líneas de AVE radiales?',
    context: 'Averías y saturación recurrente en las estaciones centrales de Madrid y Barcelona frente a demandas de vertebración industrial de las regiones costeras y fronterizas.',
    dimension: 'economic',
    partyStances: {
      pp: -1,  // Históricamente ha impulsado la red de AVE radial
      psoe: +1,// Ha bonificado cercanías pero mantiene planes AVE
      vox: -1,
      sumar: +2,// Prioridad absoluta al tren cotidiano y mercancías
      erc: +2, // Traspaso de Rodalies como prioridad máxima
      junts: +2,
      bildu: +2,
      pnv: +1, // Reclama la Y Vasca y el Corredor Atlántico
      bng: +2, // Reclama tren de cercanías en Galicia
      cc: 0,   // Realidad insular sin red ferroviaria estatal
      upn: -1  // Reclama el TAV para Navarra
    }
  },
  {
    id: 19,
    topic: 'Sanidad',
    title: 'Sanidad 100% de Gestión Directa vs. Colaboración Público-Privada',
    question: '¿Debe revertirse la gestión privada concertada en hospitales públicos y limitar los conciertos sanitarios a situaciones excepcionales, o debe fomentarse la colaboración público-privada como vía eficiente para aliviar las listas de espera diagnósticas y quirúrgicas?',
    context: 'Debate recurrente en comunidades como Madrid, Cataluña, C. Valenciana o Andalucía sobre los modelos de concesión hospitalaria y derivación de pruebas.',
    dimension: 'social',
    partyStances: {
      pp: +2,  // Fomento activo de la colaboración público-privada
      psoe: -1,// Apuesta preferente por la gestión pública
      vox: +2, // Favorable a conciertos y eficiencia de gestión
      sumar: -2,// Prohibición tajante de la privatización sanitaria
      erc: -2,
      junts: +1,// Tradición concertada histórica del modelo sanitario catalán
      bildu: -2,
      pnv: +1, // Osakidetza mantiene conciertos complementarios
      bng: -2,
      cc: +1,
      upn: +2
    }
  },
  {
    id: 20,
    topic: 'Gobernabilidad',
    title: 'Grandes Pactos de Estado Centrales (PP-PSOE) vs. Bloques Plurinacionales',
    question: '¿Sería preferible para la estabilidad de España una cultura de grandes consensos de Estado entre los dos partidos nacionales mayoritarios (PP y PSOE) que evite la influencia de partidos soberanistas, o es más representativa y democratizadora una gobernanza sustentada en mayorías plurinacionales diversas?',
    context: 'Discusión sobre la polarización política, el sistema electoral y la gobernabilidad parlamentaria en la política española contemporánea.',
    dimension: 'institutional',
    partyStances: {
      pp: +2,  // Defiende la lista más votada y pactos de Estado bipartidistas
      psoe: -1,// Ha asumido el modelo de coalición plurinacional
      vox: -2, // Rechaza el consenso bipartidista (lo llama "el consenso progre")
      sumar: -2,// Apuesta decidida por el bloque plurinacional progresista
      erc: -2, // Defiende la soberanía de las minorías territoriales
      junts: -2,
      bildu: -2,
      pnv: 0,  // Tradicionalmente pactaba con ambos, ahora en bloque
      bng: -2,
      cc: +1,  // Prefiere acuerdos transversales
      upn: +2  // Defiende pactos constitucionales entre PP y PSOE
    }
  },
  {
    id: 21,
    topic: 'Derecho a la Vida y Aborto',
    title: 'Legislación sobre el Aborto: Derecho a Decidir vs. Protección del no Nacido',
    question: '¿Debe blindarse en la Constitución y en la sanidad pública el derecho a la interrupción voluntaria del embarazo (garantizando el acceso sin trabas, periodos de reflexión y permitiéndolo a los 16-17 años sin tutela paterna), o debe protegerse jurídicamente el derecho a la vida del concebido no nacido promoviendo alternativas a la maternidad y restringiendo los supuestos de aborto?',
    context: 'Sentencia del Tribunal Constitucional 44/2023 avalando la ley de plazos de 2010, reforma de 2023 sobre el consentimiento a los 16-17 años, protocolos provida autonómicos y debate sobre su inclusión en la Carta de Derechos Fundamentales de la UE.',
    dimension: 'social',
    partyStances: {
      pp: -1,   // Acepta la ley de plazos tras el aval del TC, pero exige consentimiento paterno obligatorio a menores de 16-17 años y objeción médica
      psoe: +2, // Blindaje del aborto en la sanidad pública, registro de objetores y eliminación de reflexión obligatoria
      vox: -2,  // Derogación total de la ley del aborto, recursos ante el TC y fomento de protocolos provida (latido fetal)
      sumar: +2,// Blindaje en la Constitución como derecho fundamental y garantía 100% en la red hospitalaria pública
      erc: +2,  // Defensa plena de los derechos sexuales y reproductivos
      junts: +1,// Tradición liberal: favorable a la ley de plazos respetando la libertad de conciencia de los facultativos
      bildu: +2,// Defensa plena del derecho de las mujeres a decidir sobre su propio cuerpo
      pnv: +1,  // Tradición democristiana matizada: apoyó la ley de plazos de 2010 con enmiendas de libertad de conciencia médica
      bng: +2,  // Aborto libre, seguro y gratuito en la red sanitaria pública gallega
      cc: +1,   // Respeto al marco legal de plazos con protección de la libertad de conciencia
      upn: -2   // Defensa provida y del derecho a la vida desde la concepción en coherencia con su ideario foral conservador
    }
  }
];

// User Responses State: questionId => value (-2, -1, 0, +1, +2)
let userAnswers = {};
let activePartyId = 'pp';
let radarChartInstance = null;

// =========================================================================
// RENDERERS & CONTROLLERS
// =========================================================================

function initApp() {
  renderPartyPills();
  renderPartyDetailCard(activePartyId);
  renderQuestions();
  renderReasonsPartyGrid();
  renderReasonsDisplayCard(activePartyId);
  renderMatrixTable();
  lucide.createIcons();
}

function switchTab(tabName) {
  const tabs = ['balance', 'test', 'reasons', 'matrix'];
  tabs.forEach(t => {
    const el = document.getElementById(`tab-${t}`);
    const btn = document.getElementById(`tab-btn-${t}`);
    if (t === tabName) {
      el.classList.remove('hidden');
      btn.classList.add('text-sky-700', 'bg-sky-50', 'border', 'border-sky-200');
      btn.classList.remove('text-slate-600', 'hover:bg-slate-100');
    } else {
      el.classList.add('hidden');
      btn.classList.remove('text-sky-700', 'bg-sky-50', 'border', 'border-sky-200');
      btn.classList.add('text-slate-600', 'hover:bg-slate-100');
    }
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
  lucide.createIcons();
}

// -------------------------------------------------------------------------
// TAB 1: BALANCE RENDERING
// -------------------------------------------------------------------------

function renderPartyPills() {
  const container = document.getElementById('party-pills-container');
  container.innerHTML = Object.values(PARTIES_DATA).map(p => {
    const isActive = p.id === activePartyId;
    return `
      <button onclick="selectParty('${p.id}')" class="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-2 border ${
        isActive 
          ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-sky-500/50' 
          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
      }">
        <span class="w-2.5 h-2.5 rounded-full inline-block" style="background-color: ${p.color}"></span>
        <span>${p.shortName}</span>
        <span class="text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}">${p.seats}</span>
      </button>
    `;
  }).join('');
}

function selectParty(partyId) {
  activePartyId = partyId;
  renderPartyPills();
  renderPartyDetailCard(partyId);
  renderReasonsPartyGrid();
  renderReasonsDisplayCard(partyId);
  lucide.createIcons();
}

function renderPartyDetailCard(partyId) {
  const p = PARTIES_DATA[partyId];
  const container = document.getElementById('party-detail-card');

  container.innerHTML = `
    <!-- Party Top Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
      <div class="flex items-start space-x-4">
        <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-md" style="background-color: ${p.color}">
          ${p.shortName}
        </div>
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <h2 class="text-2xl font-bold font-display text-slate-900">${p.name}</h2>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold ${p.badgeClass}">${p.shortName}</span>
          </div>
          <p class="text-xs text-slate-500 mt-1">Líder: <strong>${p.leader}</strong> | Ideología: <strong>${p.ideology}</strong></p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div class="text-right">
          <div class="text-2xl font-black font-display text-slate-900">${p.seats} <span class="text-xs font-normal text-slate-500">diputados</span></div>
          <div class="text-xs text-slate-500">${p.votes} de los votos el 23J</div>
        </div>
        <div class="h-10 w-px bg-slate-200"></div>
        <div class="text-xs font-medium px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
          ${p.block}
        </div>
      </div>
    </div>

    <!-- Editorial Summary & 23J Program -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div class="lg:col-span-5 bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3">
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
          <i data-lucide="compass" class="w-4 h-4 text-sky-600"></i>
          <span>El Programa Electoral 23J</span>
        </h3>
        <p class="text-sm text-slate-700 leading-relaxed">${p.program_summary}</p>
        <div class="pt-2">
          <span class="text-xs font-bold text-slate-700 block mb-2">Compromisos nucleares:</span>
          <ul class="space-y-1.5 text-xs text-slate-600">
            ${p.key_proposals.map(prop => `
              <li class="flex items-start space-x-2">
                <i data-lucide="arrow-right-circle" class="w-3.5 h-3.5 text-sky-600 mt-0.5 shrink-0"></i>
                <span>${prop}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      </div>

      <!-- Fulfilled Promises vs Broken/Contradictions (Side by Side) -->
      <div class="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <!-- Fulfilled -->
        <div class="bg-emerald-50/60 rounded-xl p-5 border border-emerald-200 space-y-3">
          <div class="flex items-center space-x-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
            <i data-lucide="check-check" class="w-4 h-4 text-emerald-600"></i>
            <span>Hechos y Promesas Cumplidas</span>
          </div>
          <p class="text-[11px] text-emerald-700">Acciones legislativas, votos o acuerdos que coinciden con su compromiso electoral:</p>
          <ul class="space-y-2.5 text-xs text-slate-800">
            ${p.fulfilled_promises.map(f => `
              <li class="flex items-start space-x-2">
                <i data-lucide="badge-check" class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"></i>
                <span class="leading-relaxed">${f}</span>
              </li>
            `).join('')}
          </ul>
        </div>

        <!-- Broken / Contradictions -->
        <div class="bg-rose-50/60 rounded-xl p-5 border border-rose-200 space-y-3">
          <div class="flex items-center space-x-2 text-rose-800 font-bold text-xs uppercase tracking-wider">
            <i data-lucide="alert-triangle" class="w-4 h-4 text-rose-600"></i>
            <span>Virajes, Incumplimientos y Contradicciones</span>
          </div>
          <p class="text-[11px] text-rose-700">Decisiones contrarias a sus compromisos, renuncias o cambios doctrinales:</p>
          <ul class="space-y-2.5 text-xs text-slate-800">
            ${p.broken_promises.map(b => `
              <li class="flex items-start space-x-2">
                <i data-lucide="x-circle" class="w-4 h-4 text-rose-600 shrink-0 mt-0.5"></i>
                <span class="leading-relaxed">${b}</span>
              </li>
            `).join('')}
          </ul>
        </div>

      </div>
    </div>

    <!-- Quick Callout to 10 Reasons -->
    <div class="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div class="flex items-center space-x-3 text-xs sm:text-sm">
        <i data-lucide="award" class="w-5 h-5 text-amber-400 shrink-0"></i>
        <span>¿Quieres conocer los argumentos más convincentes para votar a <strong>${p.name}</strong>?</span>
      </div>
      <button onclick="goToReasonsForParty('${p.id}')" class="px-4 py-1.5 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg whitespace-nowrap transition-all shadow">
        Ver 10 razones para votar a ${p.shortName} &rarr;
      </button>
    </div>
  `;
}

function goToReasonsForParty(partyId) {
  selectParty(partyId);
  switchTab('reasons');
}

// -------------------------------------------------------------------------
// TAB 2: TEST DE AFINIDAD RENDERING & ALGORITHM
// -------------------------------------------------------------------------

function renderQuestions() {
  const container = document.getElementById('questions-container');
  container.innerHTML = QUESTIONS.map((q, idx) => {
    const curVal = userAnswers[q.id];
    return `
      <div class="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4 hover:border-slate-300 transition-all" id="q-card-${q.id}">
        <div class="flex items-start justify-between gap-3">
          <div class="space-y-1">
            <div class="flex items-center space-x-2">
              <span class="text-xs font-bold px-2 py-0.5 bg-sky-100 text-sky-800 rounded">Pregunta ${idx + 1} de 20</span>
              <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">${q.topic}</span>
            </div>
            <h3 class="text-base sm:text-lg font-bold text-slate-900 leading-snug">${q.title}</h3>
          </div>
          <span class="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-md border border-slate-200 hidden sm:inline-block">Eje: ${q.dimension}</span>
        </div>

        <p class="text-sm text-slate-700 leading-relaxed font-medium">${q.question}</p>

        <!-- Context note for educated users -->
        <div class="bg-slate-50 border-l-2 border-sky-500 p-3 rounded-r-lg text-xs text-slate-600 leading-relaxed flex items-start space-x-2">
          <i data-lucide="info" class="w-4 h-4 text-sky-600 shrink-0 mt-0.5"></i>
          <span><strong>Contexto institucional:</strong> ${q.context}</span>
        </div>

        <!-- Likert scale options -->
        <div class="pt-2">
          <label class="block text-xs font-semibold uppercase text-slate-500 mb-2">Tu postura al respecto:</label>
          <div class="grid grid-cols-1 sm:grid-cols-5 gap-2">
            
            <button onclick="setAnswer(${q.id}, 2)" class="opt-btn-${q.id} p-2.5 rounded-lg border text-xs font-medium text-left sm:text-center transition-all flex sm:flex-col items-center justify-between ${
              curVal === 2 ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300'
            }">
              <span class="font-bold">Totalmente a favor</span>
              <span class="text-[10px] opacity-75 sm:mt-1">+2</span>
            </button>

            <button onclick="setAnswer(${q.id}, 1)" class="opt-btn-${q.id} p-2.5 rounded-lg border text-xs font-medium text-left sm:text-center transition-all flex sm:flex-col items-center justify-between ${
              curVal === 1 ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300'
            }">
              <span class="font-semibold">Favorable / Matizado</span>
              <span class="text-[10px] opacity-75 sm:mt-1">+1</span>
            </button>

            <button onclick="setAnswer(${q.id}, 0)" class="opt-btn-${q.id} p-2.5 rounded-lg border text-xs font-medium text-left sm:text-center transition-all flex sm:flex-col items-center justify-between ${
              curVal === 0 ? 'bg-slate-700 text-white border-slate-700 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-200'
            }">
              <span class="font-semibold">Indiferente / Neutro</span>
              <span class="text-[10px] opacity-75 sm:mt-1">0</span>
            </button>

            <button onclick="setAnswer(${q.id}, -1)" class="opt-btn-${q.id} p-2.5 rounded-lg border text-xs font-medium text-left sm:text-center transition-all flex sm:flex-col items-center justify-between ${
              curVal === -1 ? 'bg-rose-500 text-white border-rose-500 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-rose-50 hover:border-rose-300'
            }">
              <span class="font-semibold">Contrario / Con reservas</span>
              <span class="text-[10px] opacity-75 sm:mt-1">-1</span>
            </button>

            <button onclick="setAnswer(${q.id}, -2)" class="opt-btn-${q.id} p-2.5 rounded-lg border text-xs font-medium text-left sm:text-center transition-all flex sm:flex-col items-center justify-between ${
              curVal === -2 ? 'bg-rose-600 text-white border-rose-600 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-rose-50 hover:border-rose-300'
            }">
              <span class="font-bold">Totalmente en contra</span>
              <span class="text-[10px] opacity-75 sm:mt-1">-2</span>
            </button>

          </div>
        </div>
      </div>
    `;
  }).join('');
  updateProgressBar();
  lucide.createIcons();
}

function setAnswer(questionId, value) {
  userAnswers[questionId] = value;
  renderQuestions();
}

function updateProgressBar() {
  const answeredCount = Object.keys(userAnswers).length;
  const percent = Math.round((answeredCount / QUESTIONS.length) * 100);
  document.getElementById('progress-answered').innerText = answeredCount;
  document.getElementById('progress-percent').innerText = `${percent}%`;
  document.getElementById('progress-bar').style.width = `${percent}%`;
}

function resetTest() {
  if (confirm('¿Deseas reiniciar todas las respuestas del test?')) {
    userAnswers = {};
    renderQuestions();
    document.getElementById('test-results-section').classList.add('hidden');
    window.scrollTo({ top: document.getElementById('tab-test').offsetTop, behavior: 'smooth' });
  }
}

// ALGORITHM: Calculate Normalized Affinity Scores (0.0 to 10.0)
function calculateTestResults() {
  const answeredIds = Object.keys(userAnswers).map(Number);
  if (answeredIds.length < 5) {
    alert('Por favor responde al menos a 5 preguntas para obtener un cálculo de afinidad representativo (recomendado: las 20 preguntas).');
    return;
  }

  const results = [];

  Object.values(PARTIES_DATA).forEach(party => {
    let totalSimilarity = 0;
    let maxPossibleSimilarity = answeredIds.length; // Cada pregunta pondera con max score de 1

    answeredIds.forEach(qId => {
      const q = QUESTIONS.find(item => item.id === qId);
      const userVal = userAnswers[qId];
      const partyVal = q.partyStances[party.id];

      // Distancia absoluta entre -2 y +2 (máxima distancia es 4)
      const diff = Math.abs(userVal - partyVal);
      // Similitud entre 0 y 1 (si diff = 0 => similitud = 1.0; si diff = 4 => similitud = 0.0)
      const similarity = 1 - (diff / 4);
      totalSimilarity += similarity;
    });

    const normalizedAffinity = (totalSimilarity / maxPossibleSimilarity) * 10;
    const scoreRounded = Math.round(normalizedAffinity * 10) / 10;

    results.push({
      party,
      score: scoreRounded,
      percent: Math.round(scoreRounded * 10)
    });
  });

  // Sort descending by affinity score
  results.sort((a, b) => b.score - a.score);

  displayTestResults(results);
}

function displayTestResults(results) {
  const section = document.getElementById('test-results-section');
  section.classList.remove('hidden');

  // 1. Render Top 3 Podium
  const podiumContainer = document.getElementById('podium-container');
  const top3 = results.slice(0, 3);
  podiumContainer.innerHTML = top3.map((r, i) => {
    const medals = ['🥇 1º Máxima Afinidad', '🥈 2º Mayor Afinidad', '🥉 3º Mayor Afinidad'];
    const badgeColors = ['bg-amber-100 text-amber-900 border-amber-300', 'bg-slate-200 text-slate-800 border-slate-300', 'bg-amber-50 text-amber-800 border-amber-200'];
    return `
      <div class="bg-gradient-to-b from-white to-slate-50 border-2 rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden" style="border-color: ${r.party.color}">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold px-2.5 py-1 rounded-full border ${badgeColors[i]}">${medals[i]}</span>
          <span class="text-xs font-bold text-slate-400">${r.party.seats} escaños</span>
        </div>
        <div class="flex items-center space-x-3 pt-2">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow" style="background-color: ${r.party.color}">
            ${r.party.shortName}
          </div>
          <div>
            <h4 class="font-bold text-slate-900 text-lg">${r.party.name}</h4>
            <p class="text-xs text-slate-500">${r.party.ideology}</p>
          </div>
        </div>
        <div class="pt-2 flex items-baseline justify-between border-t border-slate-100">
          <span class="text-xs text-slate-500 font-medium">Nota de coincidencia:</span>
          <div class="text-3xl font-black font-display" style="color: ${r.party.color}">
            ${r.score.toFixed(1)} <span class="text-sm font-normal text-slate-400">/ 10</span>
          </div>
        </div>
        <button onclick="goToReasonsForParty('${r.party.id}')" class="w-full mt-2 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-all">
          Ver 10 razones para votarles &rarr;
        </button>
      </div>
    `;
  }).join('');

  // 2. Render Full Scores List
  const listContainer = document.getElementById('affinity-scores-list');
  listContainer.innerHTML = results.map(r => `
    <div class="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3 hover:border-slate-300 transition-all">
      <div class="flex items-center space-x-3 min-w-[140px]">
        <span class="w-3.5 h-3.5 rounded-full shrink-0" style="background-color: ${r.party.color}"></span>
        <div>
          <span class="text-xs font-bold text-slate-900 block leading-tight">${r.party.shortName}</span>
          <span class="text-[10px] text-slate-500">${r.party.name}</span>
        </div>
      </div>
      <div class="flex-1 max-w-xs mx-2">
        <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div class="h-full rounded-full transition-all duration-500" style="width: ${r.percent}%; background-color: ${r.party.color}"></div>
        </div>
      </div>
      <div class="text-right min-w-[70px]">
        <span class="text-sm font-black font-display text-slate-900">${r.score.toFixed(1)}</span>
        <span class="text-[10px] text-slate-400">/10</span>
      </div>
    </div>
  `).join('');

  // 3. Render Detailed Match Breakdown (Top 2 vs Bottom 1)
  renderBreakdownDetails(results);

  // 4. Render Radar Chart
  renderRadarChart(results);

  // Scroll to results
  setTimeout(() => {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);

  lucide.createIcons();
}

function renderBreakdownDetails(results) {
  const container = document.getElementById('detailed-breakdown-container');
  const winner = results[0];
  const runnerUp = results[1];
  const lowest = results[results.length - 1];

  const getPoints = (party) => {
    const answeredIds = Object.keys(userAnswers).map(Number);
    const coincidences = [];
    const discrepancies = [];

    answeredIds.forEach(qId => {
      const q = QUESTIONS.find(i => i.id === qId);
      const userVal = userAnswers[qId];
      const partyVal = q.partyStances[party.id];
      const diff = Math.abs(userVal - partyVal);

      if (diff <= 1) {
        coincidences.push(q.title);
      } else if (diff >= 3) {
        discrepancies.push(q.title);
      }
    });

    return { coincidences, discrepancies };
  };

  const winData = getPoints(winner.party);
  const lowData = getPoints(lowest.party);

  container.innerHTML = `
    <!-- Top Party Match -->
    <div class="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3">
      <div class="flex items-center space-x-2 text-slate-900 font-bold text-sm">
        <span class="w-3 h-3 rounded-full" style="background-color: ${winner.party.color}"></span>
        <span>Coincidencias clave con tu 1ª fuerza (${winner.party.shortName} - ${winner.score.toFixed(1)}/10)</span>
      </div>
      <div class="text-xs space-y-2">
        <p class="text-emerald-700 font-semibold">Mayor sintonía en:</p>
        <ul class="list-disc pl-4 space-y-1 text-slate-700">
          ${winData.coincidences.slice(0, 4).map(c => `<li>${c}</li>`).join('') || '<li>Coincidencia equilibrada general</li>'}
        </ul>
        ${winData.discrepancies.length > 0 ? `
          <p class="text-rose-700 font-semibold pt-1">Puntos de fricción:</p>
          <ul class="list-disc pl-4 space-y-1 text-slate-600">
            ${winData.discrepancies.slice(0, 2).map(d => `<li>${d}</li>`).join('')}
          </ul>
        ` : ''}
      </div>
    </div>

    <!-- Antípoda Match -->
    <div class="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3">
      <div class="flex items-center space-x-2 text-slate-900 font-bold text-sm">
        <span class="w-3 h-3 rounded-full" style="background-color: ${lowest.party.color}"></span>
        <span>Mayor discrepancia ideológica (${lowest.party.shortName} - ${lowest.score.toFixed(1)}/10)</span>
      </div>
      <div class="text-xs space-y-2">
        <p class="text-rose-700 font-semibold">Choque frontal de posicionamiento en:</p>
        <ul class="list-disc pl-4 space-y-1 text-slate-700">
          ${lowData.discrepancies.slice(0, 4).map(d => `<li>${d}</li>`).join('') || '<li>Discrepancia distribuida</li>'}
        </ul>
        <p class="text-slate-500 pt-1 leading-relaxed">
          Tu perfil normativo sitúa a <strong>${lowest.party.name}</strong> en las antípodas de tus prioridades legislativas y territoriales.
        </p>
      </div>
    </div>
  `;
}

function renderRadarChart(results) {
  const ctx = document.getElementById('radarChart').getContext('2d');
  if (radarChartInstance) {
    radarChartInstance.destroy();
  }

  // Calculate user profile score per dimension: 0 to 10 scale
  const dimensions = ['economic', 'territorial', 'social', 'institutional'];
  const dimensionLabels = ['Economía y Fiscal', 'Modelo Territorial', 'Derechos y Sociedad', 'Institucional'];

  const calculateDimAvg = (stanceMap) => {
    return dimensions.map(dim => {
      const dimQuestions = QUESTIONS.filter(q => q.dimension === dim && userAnswers[q.id] !== undefined);
      if (dimQuestions.length === 0) return 5;
      const sum = dimQuestions.reduce((acc, q) => acc + (stanceMap(q) + 2), 0); // Convert -2..+2 to 0..4
      return Math.round((sum / (dimQuestions.length * 4)) * 10); // scale 0-10
    });
  };

  const userData = calculateDimAvg(q => userAnswers[q.id]);
  const top1Party = results[0].party;
  const top1Data = calculateDimAvg(q => q.partyStances[top1Party.id]);

  radarChartInstance = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: dimensionLabels,
      datasets: [
        {
          label: 'Tu Perfil Ideológico',
          data: userData,
          backgroundColor: 'rgba(2, 132, 199, 0.25)',
          borderColor: '#0284c7',
          pointBackgroundColor: '#0284c7',
          borderWidth: 2,
        },
        {
          label: `${top1Party.shortName} (Tu 1º partido)`,
          data: top1Data,
          backgroundColor: `${top1Party.color}33`,
          borderColor: top1Party.color,
          pointBackgroundColor: top1Party.color,
          borderWidth: 2,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          min: 0,
          max: 10,
          ticks: { display: false },
          pointLabels: {
            font: { size: 10, family: "'Plus Jakarta Sans', sans-serif", weight: '600' }
          }
        }
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: { boxWidth: 12, font: { size: 10 } }
        }
      }
    }
  });
}

// -------------------------------------------------------------------------
// TAB 3: 10 RAZONES PARA VOTAR A... RENDERING
// -------------------------------------------------------------------------

function renderReasonsPartyGrid() {
  const container = document.getElementById('reasons-party-grid');
  container.innerHTML = Object.values(PARTIES_DATA).map(p => {
    const isSelected = p.id === activePartyId;
    return `
      <button onclick="selectParty('${p.id}')" class="p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
        isSelected 
          ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-sky-500' 
          : 'bg-slate-50 hover:bg-white text-slate-800 border-slate-200 hover:border-slate-300'
      }">
        <span class="w-4 h-4 rounded-full" style="background-color: ${p.color}"></span>
        <span class="font-bold text-xs">${p.shortName}</span>
        <span class="text-[10px] ${isSelected ? 'text-slate-400' : 'text-slate-500'}">${p.seats} esc.</span>
      </button>
    `;
  }).join('');
}

function renderReasonsDisplayCard(partyId) {
  const p = PARTIES_DATA[partyId];
  const container = document.getElementById('reasons-display-card');

  container.innerHTML = `
    <!-- Party Banner Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
      <div class="flex items-center space-x-4">
        <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg" style="background-color: ${p.color}">
          ${p.shortName}
        </div>
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Argumentario de voto</span>
          <h3 class="text-2xl font-bold font-display text-slate-900">10 Razones para votar a ${p.name}</h3>
          <p class="text-xs text-slate-500">Ideología: ${p.ideology} | Líder: ${p.leader}</p>
        </div>
      </div>
      <div class="flex items-center space-x-2">
        <button onclick="switchTab('balance')" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center space-x-1.5">
          <i data-lucide="book-open" class="w-3.5 h-3.5"></i>
          <span>Ver Balance 23J</span>
        </button>
      </div>
    </div>

    <!-- The 10 Reasons Grid / Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      ${p.reasons.map((r, idx) => `
        <div class="bg-slate-50 hover:bg-white rounded-xl p-5 border border-slate-200 hover:border-slate-300 transition-all shadow-sm hover:shadow flex items-start space-x-3.5">
          <div class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white shrink-0 mt-0.5 shadow-sm" style="background-color: ${p.color}">
            ${idx + 1}
          </div>
          <div class="space-y-1.5">
            <div class="flex items-center space-x-2">
              <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200">${r.cat}</span>
            </div>
            <h4 class="text-sm font-bold text-slate-900 leading-snug">${r.title}</h4>
            <p class="text-xs text-slate-600 leading-relaxed">${r.desc}</p>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// -------------------------------------------------------------------------
// TAB 4: MATRIZ COMPARATIVA RENDERING
// -------------------------------------------------------------------------

function renderMatrixTable() {
  const tbody = document.getElementById('matrix-table-body');
  const partiesList = ['pp', 'psoe', 'vox', 'sumar', 'erc', 'junts', 'bildu', 'pnv', 'bng', 'cc', 'upn'];

  tbody.innerHTML = QUESTIONS.map((q, idx) => {
    return `
      <tr class="hover:bg-slate-50/80 transition-colors">
        <td class="py-3 px-4 font-medium text-slate-900 border-r border-slate-100">
          <span class="text-[10px] text-sky-600 font-bold block uppercase">${idx + 1}. ${q.topic}</span>
          <span class="text-xs">${q.title}</span>
        </td>
        ${partiesList.map(pId => {
          const val = q.partyStances[pId];
          let badge = '';
          if (val >= 1) {
            badge = `<span class="inline-flex items-center justify-center w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[11px]" title="A favor (${val})">✓</span>`;
          } else if (val <= -1) {
            badge = `<span class="inline-flex items-center justify-center w-6 h-6 rounded-md bg-rose-100 text-rose-800 font-bold text-[11px]" title="En contra (${val})">✗</span>`;
          } else {
            badge = `<span class="inline-flex items-center justify-center w-6 h-6 rounded-md bg-amber-100 text-amber-800 font-bold text-[11px]" title="Neutro o matizado (0)">~</span>`;
          }
          return `<td class="py-3 px-2 text-center border-r border-slate-100">${badge}</td>`;
        }).join('')}
      </tr>
    `;
  }).join('');
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', initApp);
