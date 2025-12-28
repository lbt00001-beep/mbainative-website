import Link from 'next/link';

export default function CookiesPolicy() {
    return (
        <section className="py-20 px-4 bg-[--primary] text-white">
            <div className="container mx-auto max-w-4xl">
                <Link href="/" className="text-[--accent] hover:underline mb-8 inline-block">
                    ← Volver al inicio
                </Link>

                <h1 className="text-4xl font-extrabold mb-8">Política de Cookies</h1>

                <div className="prose prose-invert max-w-none space-y-6 text-gray-300">
                    <p className="text-sm text-gray-400">Última actualización: 28 de diciembre de 2025</p>

                    <h2 className="text-2xl font-bold text-white mt-8">1. ¿Qué son las Cookies?</h2>
                    <p>
                        Las cookies son pequeños archivos de texto que los sitios web almacenan en tu
                        dispositivo cuando los visitas. Se utilizan para recordar tus preferencias,
                        mejorar tu experiencia de navegación y recopilar información sobre cómo
                        utilizas el sitio.
                    </p>

                    <h2 className="text-2xl font-bold text-white mt-8">2. Tipos de Cookies que Utilizamos</h2>

                    <h3 className="text-xl font-bold text-[--accent] mt-6">Cookies Técnicas (Necesarias)</h3>
                    <p>
                        Son esenciales para el funcionamiento del sitio web. Sin ellas,
                        el sitio no funcionaría correctamente.
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Sesión:</strong> Mantienen tu sesión activa mientras navegas.</li>
                        <li><strong>Preferencias:</strong> Recuerdan tus preferencias de idioma y configuración.</li>
                    </ul>

                    <h3 className="text-xl font-bold text-[--accent] mt-6">Cookies Analíticas</h3>
                    <p>
                        Nos ayudan a entender cómo los visitantes interactúan con el sitio web,
                        proporcionando información sobre las páginas visitadas, el tiempo de permanencia,
                        y posibles errores.
                    </p>

                    <h2 className="text-2xl font-bold text-white mt-8">3. Gestión de Cookies</h2>
                    <p>
                        Puedes configurar tu navegador para rechazar todas las cookies o para
                        que te avise cuando se envía una cookie. Sin embargo, es posible que
                        algunas características del sitio no funcionen correctamente si desactivas las cookies.
                    </p>
                    <p>Cómo gestionar cookies en los navegadores más comunes:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Chrome:</strong> Configuración → Privacidad y seguridad → Cookies</li>
                        <li><strong>Firefox:</strong> Opciones → Privacidad y seguridad → Cookies</li>
                        <li><strong>Safari:</strong> Preferencias → Privacidad → Cookies</li>
                        <li><strong>Edge:</strong> Configuración → Cookies y permisos del sitio</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-white mt-8">4. Cookies de Terceros</h2>
                    <p>
                        Podemos utilizar servicios de terceros (como YouTube para vídeos embebidos)
                        que pueden establecer sus propias cookies. No tenemos control sobre estas
                        cookies de terceros.
                    </p>

                    <h2 className="text-2xl font-bold text-white mt-8">5. Actualización de esta Política</h2>
                    <p>
                        Podemos actualizar esta política de cookies en cualquier momento.
                        Te recomendamos revisar esta página periódicamente para estar informado
                        de cualquier cambio.
                    </p>

                    <h2 className="text-2xl font-bold text-white mt-8">6. Contacto</h2>
                    <p>
                        Si tienes alguna pregunta sobre nuestra política de cookies, puedes contactarnos en:<br />
                        <strong>Email:</strong> info@mbainative.com
                    </p>
                </div>
            </div>
        </section>
    );
}
