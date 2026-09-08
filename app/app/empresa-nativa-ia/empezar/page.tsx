import { pageMetadata } from '@/lib/seo';
import { JourneyShell } from '@/components/journey/JourneyShell';
import PilotBuilder from '@/components/journey/PilotBuilder';
export const metadata=pageMetadata('/empresa-nativa-ia/empezar');
export default async function Page({searchParams}:{searchParams:Promise<{proceso?:string|string[]}>}){
  const params=await searchParams;const exampleId=typeof params.proceso==='string'?params.proceso:'compras';
  return <JourneyShell step={3} title="Empieza con un proceso de tu empresa." intro="No necesitas transformar todo de una vez. Sal de este recorrido con una ficha que te permita hablar con tu equipo de una prueba concreta."><PilotBuilder key={exampleId} exampleId={exampleId}/></JourneyShell>;
}
