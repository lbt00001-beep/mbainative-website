export default function Hero() {
  return (
    <section className="relative h-screen flex items-center justify-center text-center text-[--foreground]">
      <div className="relative z-10 p-4">
        <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-4 animate-fade-in-down">
          MBAI <span className="text-[--accent]">Native</span>
        </h1>
        <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto animate-fade-in-up">
          Creando la doctrina para la nueva generación de empresas nativas en Inteligencia Artificial.
        </p>
        <a
          href="#doctrine"
          className="bg-[--accent] hover:bg-[--accent]/90 text-[--primary] font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition-transform duration-300"
        >
          Saber más
        </a>
      </div>
    </section>
  );
}