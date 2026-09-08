import type { Metadata } from 'next';
import './globals.css';
import './journey.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageAssistant from '@/components/assistant/PageAssistant';
import { SITE_URL } from '@/lib/seo';
// Preserve Hostinger's stale-HTML/CSS-404 fix (be3b463) until host cache invalidation is verified.
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'MBAI Native · Empresa nativa en IA', template: '%s | MBAI Native' },
  description: 'Formación, principios y herramientas para dirigir empresas con personas y agentes de inteligencia artificial.',
};
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return <html lang="es"><body>
    <a className="skip-link" href="#contenido">Saltar al contenido</a>
    <Header /><main id="contenido" tabIndex={-1}>{children}</main><Footer /><PageAssistant />
  </body></html>;
}
