import { pageMetadata } from '@/lib/seo';
import { JourneyShell, Sources } from '@/components/journey/JourneyShell';
import ArchitectureExplorer from '@/components/journey/ArchitectureExplorer';
export const metadata=pageMetadata('/arquitectura-solucion');
export default function Page(){return <JourneyShell step={2} title="Arquitectura de la solución." intro="De tus redes y aplicaciones actuales a una empresa que coordina personas, procesos y agentes. Explora dónde se ejecuta la IA y cómo se gobierna su trabajo."><ArchitectureExplorer/><Sources items={['pair','spark','cluster','mcp','orchestration']}/></JourneyShell>;}
