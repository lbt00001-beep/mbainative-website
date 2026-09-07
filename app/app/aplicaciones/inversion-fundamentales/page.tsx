import { pageMetadata } from '@/lib/seo';
export const metadata = pageMetadata("/aplicaciones/inversion-fundamentales");
import InversionFundamentales from '@/components/aplicaciones/InversionFundamentales';

export default function InversionFundamentalesPage() {
  return (
    <InversionFundamentales />
  );
}
