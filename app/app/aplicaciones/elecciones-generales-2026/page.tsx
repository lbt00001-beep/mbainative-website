import AppAttribution from '@/components/AppAttribution';

export default function EleccionesGenerales2026Page() {
  return (
    <section className="pt-[80px] min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <iframe
        src="/elecciones-2026/index.html"
        title="Programas Electorales 2026 — Cuadro de mandos y comparador"
        className="w-full h-[calc(100vh-118px)] min-h-[680px] border-none block bg-slate-950"
        allow="fullscreen"
      />
      <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-900/90 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
        <div className="[&>p]:mb-0">
          <AppAttribution location="inline" />
        </div>
        <a
          href="/elecciones-2026/index.html"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-100 font-medium transition-colors"
        >
          Abrir a pantalla completa ↗
        </a>
      </div>
    </section>
  );
}
