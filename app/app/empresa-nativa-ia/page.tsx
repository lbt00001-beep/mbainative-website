import { pageMetadata } from '@/lib/seo';
import { JourneyShell, Sources } from '@/components/journey/JourneyShell';
import Understanding from '@/components/journey/Understanding';
export const metadata=pageMetadata('/empresa-nativa-ia');
export default function Page(){return <JourneyShell step={0} title="Imagina tu empresa trabajando de otra manera." intro="Recorre una empresa nativa en IA: entiende qué cambia, sigue un proceso y descubre qué necesitas para empezar en la tuya."><Understanding/><Sources items={['agents','work']}/></JourneyShell>;}
