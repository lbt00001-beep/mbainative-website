import { pageMetadata } from '@/lib/seo';
export const metadata = pageMetadata("/aplicaciones/tradingalpha");
import TradingAlpha from '@/components/tradingalpha/TradingAlpha';

export default function TradingAlphaPage() {
  return <TradingAlpha />;
}
