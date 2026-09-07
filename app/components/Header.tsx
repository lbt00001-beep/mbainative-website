"use client";
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const links = [
  ['/', 'Inicio'], ['/about', 'El proyecto'], ['/services', 'Servicios'],
  ['/mejores-practicas', 'Aprender'], ['/aplicaciones', 'Aplicaciones'],
];
export default function Header() {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (open && event.key === 'Escape') { setOpenPath(null); button.current?.focus(); }
    };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [open]);
  return <header className="site-header">
    <div className="site-shell header-inner">
      <Link href="/" className="brand" aria-label="MBAI Native, inicio" onClick={() => setOpenPath(null)}>
        <Image src="/images/logo-mbainative-small.webp" alt="" width={147} height={80} priority className="brand-logo" />
        <span>MBAI <span className="text-blue-400">Native</span></span>
      </Link>
      <button ref={button} type="button" className="menu-toggle" aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={open} aria-controls="navegacion-principal" onClick={() => setOpenPath(open ? null : pathname)}>
        <svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d={open ? 'M6 6l12 12M6 18L18 6' : 'M4 6h16M4 12h16M4 18h16'} />
        </svg>
      </button>
      <nav id="navegacion-principal" aria-label="Navegación principal" className={'site-nav' + (open ? ' is-open' : '')}>
        {links.map(([href, label]) => <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined} onClick={() => setOpenPath(null)}>{label}</Link>)}
        <Link className="button button-small" href="/contact" onClick={() => setOpenPath(null)}>Hablemos de tu proyecto <span aria-hidden="true">↗</span></Link>
      </nav>
    </div>
  </header>;
}
