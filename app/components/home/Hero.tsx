export default function Hero() {
  return (
    <section className="relative h-screen flex items-center justify-center text-center text-[--foreground]">
      <div className="relative z-10 p-4">
        <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-4 animate-fade-in-down">
          Empresa <span className="text-[--accent]">AI-Nativa</span>
        </h1>
        <p className="text-xl md:text-2xl mb-4 max-w-4xl mx-auto animate-fade-in-up">
          La empresa nativa en IA no adapta procesos, los define de nuevo incluyendo el talento artificial.
        </p>
        <p className="text-lg md:text-xl mb-4 max-w-3xl mx-auto text-gray-400 animate-fade-in-up">
          20 principios que definen cómo organizar, dirigir y escalar empresas en la era de los agentes de IA.
        </p>
        <div className="text-sm text-gray-500 mb-8 animate-fade-in-up">
          <p>AI (Artificial Intelligence)</p>
          <p>IA (Inteligencia Artificial)</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#doctrine"
            className="bg-[--accent] hover:bg-[--accent]/90 text-[--primary] font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition-transform duration-300"
          >
            Explorar la Doctrina
          </a>
          <a
            href="https://juego-empresa-ia-mbai-797037398090.europe-west1.run.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="border-2 border-[--accent] text-[--accent] hover:bg-[--accent] hover:text-[--primary] font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition-transform duration-300"
          >
            Simulador Empresarial
          </a>
        </div>
      </div>
    </section>
  );
}