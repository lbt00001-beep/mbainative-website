'use client';

export default function ComparativaUE() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="flex-grow w-full h-[90vh]">
        <iframe 
          src="https://mbai-native-detector-2026.web.app" 
          className="w-full h-full border-none shadow-inner"
          title="Dashboard Económico España vs UE"
          allow="fullscreen"
        />
      </div>
      <div className="p-4 bg-gray-50 border-t text-center text-sm text-gray-500">
        Dashboard Económico Comparativo: España vs Unión Europea (2000-2025). Datos en tiempo real vía Eurostat API.
      </div>
    </div>
  );
}
