'use client';

import {usePathname} from 'next/navigation';
import {findAppCredit, formatAppCredit} from '@/lib/app-credits';

export default function AppAttribution({location = 'inline'}: {location?: 'inline' | 'site-footer'}) {
  const credit = findAppCredit(usePathname());
  if (!credit || credit.placement !== location) return null;
  return <p data-app-credit className="text-sm text-current leading-relaxed mb-4">{formatAppCredit(credit)}</p>;
}
