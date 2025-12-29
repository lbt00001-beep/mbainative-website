import Link from 'next/link';

export default function Precisiones() {
    return (
        <section className="py-20 px-4 bg-[--primary] text-white">
            <div className="container mx-auto max-w-4xl">
                <Link href="/" className="text-[--accent] hover:underline mb-8 inline-block">
                    ← Volver al inicio
                </Link>

                <h1 className="text-4xl font-extrabold mb-8">Precisiones</h1>

                <div className="prose prose-invert max-w-none space-y-6 text-gray-300 leading-relaxed">
                    <p>
                        La expresión <em className="text-[--accent]">talento artificial</em> no se debe entender
                        por comparación con el talento natural de las personas. El talento de las personas y
                        cualquier otra forma de vida biológica se ha configurado a través de un proceso evolutivo
                        de cientos de millones de años regido por leyes; sean cuales sean esas leyes, es su autor,
                        el autor de las leyes, el origen de ese talento.
                    </p>

                    <p>
                        En el caso de la Inteligencia Artificial (IA) son las personas las que, conociendo y
                        dominando las leyes de la naturaleza, las mismas que han producido su talento personal,
                        han podido construir estructuras no biológicas, de momento, que producen inteligencia
                        en sentido general.
                    </p>

                    <p>
                        Así que, aun cuando en el futuro haya personas que construyan estructuras biológicas
                        o mixtas que produzcan inteligencia, lo harán no como creadores, sino aprovechando
                        esas leyes que el Creador, desde el origen, ha puesto en la naturaleza.
                    </p>

                    <p>
                        En sus manos estará, también, la reflexión ética que permita valorar, más allá del
                        rendimiento económico, si este talento artificial beneficia o no a la Humanidad.
                    </p>
                </div>
            </div>
        </section>
    );
}
