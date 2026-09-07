import { pageMetadata } from '@/lib/seo';
export const metadata = pageMetadata("/aplicaciones/futuros");
import FuturosMonitor from '@/components/aplicaciones/FuturosMonitor';

export default function FuturosPage() {
  return <FuturosMonitor />;
}
