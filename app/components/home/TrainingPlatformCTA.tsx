import Link from "next/link";

export default function TrainingPlatformCTA() {
  return (
    <section className="py-20 px-4 bg-[--dark-gray] text-white text-center">
      <div className="container mx-auto">
        <h2 className="text-4xl font-bold mb-4">
          Entrena tus Habilidades de Liderazgo en <span className="text-[--accent]">IA</span>
        </h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto">
          Accede a nuestra plataforma de simulación y pon a prueba tus
          habilidades para liderar una empresa nativa en IA.
        </p>
        <Link
          href="https://juego-empresa-ia-mbai-797037398090.europe-west1.run.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[--accent] hover:bg-[--accent]/90 text-[--primary] font-bold py-4 px-10 text-lg rounded-full shadow-lg transform hover:scale-105 transition-transform duration-300"
        >
          Iniciar Simulación
        </Link>
      </div>
    </section>
  );
}