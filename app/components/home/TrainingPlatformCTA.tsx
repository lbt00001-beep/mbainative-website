import Link from "next/link";

export default function TrainingPlatformCTA() {
  return (
    <section className="py-20 px-4 bg-[--dark-gray] text-white text-center">
      <div className="container mx-auto">
        <h2 className="text-4xl font-bold mb-4">
          Practica la Gestión <span className="text-[--accent]">AI-Nativa</span>
        </h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto text-gray-300">
          Simula la dirección de una empresa con agentes de IA. Configura autonomías,
          supervisa tareas y toma decisiones estratégicas en tiempo real.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="https://juego-empresa-ia-mbai-797037398090.europe-west1.run.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[--accent] hover:bg-[--accent]/90 text-[--primary] font-bold py-4 px-10 text-lg rounded-full shadow-lg transform hover:scale-105 transition-transform duration-300"
          >
            🎮 Iniciar Simulador
          </Link>
          <Link
            href="/mejores-practicas/doctrinas"
            className="border-2 border-white/30 hover:border-[--accent] text-white hover:text-[--accent] font-bold py-4 px-10 text-lg rounded-full transition-all duration-300"
          >
            📜 Explorar Principios
          </Link>
        </div>
      </div>
    </section>
  );
}