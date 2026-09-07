import { pageMetadata } from '@/lib/seo';
import ApplicationCatalog from '@/components/ApplicationCatalog';
export const metadata = pageMetadata('/aplicaciones');
export default function Aplicaciones() { return <ApplicationCatalog />; }
