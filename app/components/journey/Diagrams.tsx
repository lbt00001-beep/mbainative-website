import type { Topology } from '@/data/ai-journey';

function Node({ x,y,w=220,title,sub,accent=false }: { x:number;y:number;w?:number;title:string;sub:string;accent?:boolean }) {
  return <g><rect x={x} y={y} width={w} height={72} rx="10" fill={accent?'#173c40':'#14253b'} stroke={accent?'#65d6be':'#48617d'} /><circle cx={x+18} cy={y+24} r="4" fill={accent?'#74e3c5':'#82baff'}/><text x={x+32} y={y+29} fill="#f3f8ff" fontSize="16" fontWeight="600">{title}</text><text x={x+18} y={y+53} fill="#bacbdd" fontSize="13">{sub}</text></g>;
}
function Wire({ d, accent=false }: { d:string;accent?:boolean }) { return <path d={d} fill="none" stroke={accent?'#65d6be':'#527092'} strokeWidth="2" strokeDasharray={accent?'6 5':undefined}/>; }

export function OperatingDiagram({ native }: { native:boolean }) {
  return <svg className="operating-svg" viewBox="0 0 370 465" role="img" aria-label={native?'El proceso coordina contexto, agente y herramientas; el supervisor controla el resultado.':'La persona traslada información entre correo, documentos y aplicaciones.'}>
    <text x="18" y="28" fill="#88adce" fontSize="12" letterSpacing="2">{native?'EL PROCESO CONECTA EL TRABAJO':'LA PERSONA CONECTA LAS PIEZAS'}</text>
    <Wire d="M185 118V145 M185 217V244 M185 316V343" accent={native}/>
    <Node x={25} y={46} w={320} title={native?'Objetivo + responsable':'Una petición en el correo'} sub={native?'Resultado, límites y criterio de calidad':'La persona interpreta qué hacer'} accent={native}/>
    <Node x={25} y={145} w={320} title={native?'Contexto + agente':'Buscar y copiar información'} sub={native?'Fuentes autorizadas y pasos definidos':'Carpetas, hojas de cálculo, ERP'}/>
    <Node x={25} y={244} w={320} title={native?'Herramientas con permisos':'Ejecutar y perseguir respuestas'} sub={native?'Proponer, comprobar, pedir aprobación':'Cambiar de aplicación y coordinar'}/>
    <Node x={25} y={343} w={320} title={native?'Supervisión + evidencia':'Revisar cuando llega el resultado'} sub={native?'Aceptar, corregir o detener; medir':'La trazabilidad depende de cada persona'} accent={native}/>
    <text x="185" y="448" textAnchor="middle" fill="#a4bdd2" fontSize="13">{native?'La responsabilidad sigue siendo humana.':'Ejemplo simplificado de trabajo fragmentado.'}</text>
  </svg>;
}

export function ProcessDiagram({ active, labels }: { active:number; labels:string[] }) {
  return <svg viewBox="0 0 360 470" role="img" aria-label={'Paso '+(active+1)+': '+labels[active]+'. Flujo: '+labels.join(', ')} className="process-svg">
    {labels.map((label,i)=><g key={label}>
      {i<4&&<Wire d={`M46 ${74+i*88}V${100+i*88}`} accent={i<active}/>}
      <circle cx="46" cy={44+i*88} r="25" fill={i===active?'#71dfc3':'#14253b'} stroke={i===active?'#71dfc3':'#54708d'}/>
      <text x="46" y={50+i*88} textAnchor="middle" fill={i===active?'#092421':'#b7cde1'} fontSize="16" fontWeight="700">{i+1}</text>
      <text x="88" y={43+i*88} fill={i===active?'#8aefd4':'#edf5ff'} fontSize="20" fontWeight="600">{label}</text>
      <text x="88" y={65+i*88} fill="#a9bfd4" fontSize="13">{i===3?'Una persona decide':i===4?'Se conserva la evidencia':i===active?'Paso seleccionado':'Explora este paso'}</text>
    </g>)}
  </svg>;
}

export function NetworkDiagram({ mode }: { mode:Topology }) {
  const distributed=mode==='distributed';const hybrid=mode==='hybrid';
  const title=distributed?'Dos redes locales con capacidad propia':hybrid?'Red local y salida selectiva hacia la nube':'Redes de la empresa y servicio central de IA';
  return <figure className="network-figure">
    <svg className="diagram-wide" viewBox="0 0 860 605" role="img" aria-label={title}>
      <rect x="12" y="42" width="836" height="350" rx="16" fill="#0c1b2c" stroke="#355470" strokeDasharray="7 6"/>
      <text x="32" y="28" fill="#83bbeb" fontSize="14">LAN A · sede principal · segmentos de acceso controlado</text>
      <Wire d="M190 142V187H430V213 M668 142V187H430 M430 285V315" accent/>
      <Node x={70} y={70} w={240} title="Personas y departamentos" sub="Acceso corporativo · roles"/>
      <Node x={550} y={70} w={240} title="ERP · CRM · documentos" sub="Sistemas y datos actuales"/>
      <Node x={290} y={213} w={280} title="Servicio de procesos y agentes" sub="Estado · permisos · revisión humana" accent/>
      {distributed?<>
        <Node x={42} y={303} w={235} title="Aplicación + PAIR local" sub="Entrada en el mismo equipo"/>
        <Node x={303} y={303} w={245} title="Nodo RTX / RTX PRO" sub="PAIR + motor + modelo"/>
        <Node x={580} y={303} w={235} title="Nodo DGX Spark" sub="PAIR + motor + modelo"/>
        <Wire d="M290 249H159V303 M277 340H303 M548 340H580" accent/>
      </>:<Node x={275} y={309} w={310} title="Servidor local de inferencia" sub="Modelos · GPU · capacidad compartida"/>}
      <Wire d="M290 249H22V411H207V480 M570 249H832V455H635V475"/>
      <rect x="12" y="430" width="390" height="148" rx="16" fill="#0c1b2c" stroke="#355470" strokeDasharray="7 6"/>
      <text x="32" y="459" fill="#83bbeb" fontSize="14">LAN B · sucursal o planta</text>
      <Node x={32} y={480} w={350} title={distributed?'Servicio local + nodos de IA':'Puestos y aplicaciones de la sede'} sub={distributed?'Gestión común · ejecución por sede':'Acceso al servicio central autorizado'}/>
      <Node x={455} y={475} w={360} title={hybrid?'Pasarela → proveedor de modelos':'Operación y seguridad'} sub={hybrid?'Solo solicitudes y datos autorizados':'Identidad · copias · recuperación'} accent={hybrid}/>
      <text x="280" y="416" fill="#aac1d5" fontSize="13">VPN / WAN entre sedes</text>
    </svg>
    <svg className="diagram-narrow" viewBox="0 0 360 810" role="img" aria-label={title}>
      <rect x="8" y="34" width="344" height="536" rx="14" fill="#0c1b2c" stroke="#355470" strokeDasharray="7 6"/>
      <text x="20" y="22" fill="#83bbeb" fontSize="14">LAN A · sede principal</text>
      <Wire d="M180 130V153 M180 225V248 M180 320V343 M180 415V438 M336 284H348V640H336 M348 640V735H336" accent/>
      <Node x={24} y={58} w={312} title="Personas y departamentos" sub="Identidad corporativa · roles"/>
      <Node x={24} y={153} w={312} title="ERP · CRM · documentos" sub="Los sistemas actuales se conservan"/>
      <Node x={24} y={248} w={312} title="Procesos y agentes" sub="Permisos · supervisión · trazas" accent/>
      <Node x={24} y={343} w={312} title={distributed?'Aplicación + PAIR local':'Servidor local de IA'} sub={distributed?'Entrada en el equipo de la aplicación':'Inferencia · modelos · GPU'}/>
      <Node x={24} y={438} w={312} title={distributed?'Nodos RTX / DGX Spark':'Operación y respaldo'} sub={distributed?'PAIR + Ollama o LM Studio + modelo':'Métricas · copias · recuperación'}/>
      <text x="180" y="548" textAnchor="middle" fill="#aac1d5" fontSize="13">Segmentos de red con acceso controlado</text>
      <Node x={24} y={604} w={312} title={hybrid?'Pasarela hacia la nube':'Enlace privado entre sedes'} sub={hybrid?'Solo datos autorizados':'VPN / WAN · servicios autenticados'} accent={hybrid}/>
      <Node x={24} y={699} w={312} title="LAN B · sucursal o planta" sub={distributed?'Capacidad local y gestión común':'Acceso controlado al servicio central'}/>
    </svg>
    <figcaption>Esquema lógico orientativo. Las líneas representan relaciones entre servicios, no un plano de cableado ni accesos directos a bases de datos.</figcaption>
  </figure>;
}
