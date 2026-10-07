'use client';

export default function Voto23JPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-900">
      <div className="bg-slate-950 border-b border-slate-800 px-4 py-3 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse"></span>
          <span className="font-semibold text-slate-200">Voto 23J | Radiografía Electoral y Brújula Política</span>
        </div>
        <div className="flex items-center space-x-3">
          <a
            href="/voto-23j/index.html"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded font-medium transition-all inline-flex items-center space-x-1"
          >
            <span>Abrir a pantalla completa</span>
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
      <div className="flex-grow w-full h-[calc(100vh-110px)] min-h-[850px]">
        <iframe
          src="/voto-23j/index.html"
          className="w-full h-full border-none shadow-inner"
          title="Voto 23J: Radiografía Electoral, Promesas y Brújula Política"
          allow="fullscreen"
        />
      </div>
    </div>
  );
}
