import Link from "next/link";

export default function Aplicaciones() {
  return (
    <section className="py-20 px-4 bg-[--primary] text-[--foreground]">
      <div className="container mx-auto text-center">
        <h1 className="text-5xl font-extrabold mb-8">Aplicaciones</h1>
        <p className="text-xl max-w-3xl mx-auto mb-12">
          Aquí encontrarás una selección de herramientas y aplicaciones desarrolladas por MBAI Native.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
          <div className="bg-[--dark-gray] p-8 rounded-lg shadow-lg">
            <h3 className="text-2xl font-bold text-[--accent] mb-4">Estimación de Inversión con Fundamentales</h3>
            <p className="text-[--secondary] mb-4">
              Una herramienta para analizar los fundamentales de un ticker y estimar su potencial de inversión.
            </p>
            <Link
              href="/aplicaciones/inversion-fundamentales"
              className="bg-[--accent] hover:bg-[--accent]/90 text-[--primary] font-bold py-2 px-4 rounded-md transition-colors"
            >
              Abrir Aplicación
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
