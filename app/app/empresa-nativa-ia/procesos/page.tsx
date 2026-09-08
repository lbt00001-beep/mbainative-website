import { pageMetadata } from '@/lib/seo';
import { JourneyShell, Sources } from '@/components/journey/JourneyShell';
import ProcessExplorer from '@/components/journey/ProcessExplorer';
export const metadata=pageMetadata('/empresa-nativa-ia/procesos');
export default function Page(){return <JourneyShell step={1} title="Un proceso. Agentes concretos. Personas responsables." intro="Sigue una petición a través del departamento. Descubre qué puede hacer un agente y en qué momento debe intervenir una persona."><ProcessExplorer/><Sources items={['agents','orchestration']}/></JourneyShell>;}
