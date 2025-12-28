import Link from 'next/link';

export default function TermsOfUse() {
    return (
        <section className="py-20 px-4 bg-[--primary] text-white">
            <div className="container mx-auto max-w-4xl">
                <Link href="/" className="text-[--accent] hover:underline mb-8 inline-block">
                    ← Volver al inicio
                </Link>

                <h1 className="text-4xl font-extrabold mb-8">Condiciones de Uso</h1>

                <div className="prose prose-invert max-w-none space-y-6 text-gray-300">
                    <p className="text-sm text-gray-400">Última actualización: 28 de diciembre de 2025</p>

                    <h2 className="text-2xl font-bold text-white mt-8">1. Aceptación de las Condiciones</h2>
                    <p>
                        Al acceder y utilizar el sitio web mbainative.com, aceptas cumplir con estas
                        condiciones de uso. Si no estás de acuerdo con alguna de estas condiciones,
                        te rogamos que no utilices este sitio web.
                    </p>

                    <h2 className="text-2xl font-bold text-white mt-8">2. Descripción del Servicio</h2>
                    <p>
                        MBAI Native proporciona información y recursos sobre la gestión de empresas
                        AI-nativas, incluyendo doctrinas, mejores prácticas y acceso a un simulador
                        empresarial educativo.
                    </p>

                    <h2 className="text-2xl font-bold text-white mt-8">3. Propiedad Intelectual</h2>
                    <p>
                        Todo el contenido de este sitio web, incluyendo textos, gráficos, logotipos,
                        imágenes y software, es propiedad de MBAI Native o de sus proveedores de contenido
                        y está protegido por las leyes de propiedad intelectual.
                    </p>
                    <p>
                        Queda prohibida la reproducción, distribución o modificación del contenido
                        sin autorización expresa por escrito.
                    </p>

                    <h2 className="text-2xl font-bold text-white mt-8">4. Uso Aceptable</h2>
                    <p>Te comprometes a:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Utilizar el sitio web solo para fines legales.</li>
                        <li>No intentar acceder a áreas restringidas del sitio.</li>
                        <li>No transmitir virus u otro código malicioso.</li>
                        <li>No utilizar el sitio de forma que pueda dañar, deshabilitar o sobrecargar nuestros servidores.</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-white mt-8">5. Enlaces a Terceros</h2>
                    <p>
                        Este sitio web puede contener enlaces a sitios web de terceros.
                        No somos responsables del contenido ni de las políticas de privacidad
                        de estos sitios externos.
                    </p>

                    <h2 className="text-2xl font-bold text-white mt-8">6. Limitación de Responsabilidad</h2>
                    <p>
                        El contenido de este sitio web se proporciona "tal cual" sin garantías de ningún tipo.
                        MBAI Native no será responsable por daños directos, indirectos, incidentales o
                        consecuentes que resulten del uso de este sitio web.
                    </p>

                    <h2 className="text-2xl font-bold text-white mt-8">7. Modificaciones</h2>
                    <p>
                        Nos reservamos el derecho de modificar estas condiciones en cualquier momento.
                        Los cambios entrarán en vigor inmediatamente después de su publicación en el sitio web.
                    </p>

                    <h2 className="text-2xl font-bold text-white mt-8">8. Ley Aplicable</h2>
                    <p>
                        Estas condiciones se rigen por la legislación española.
                        Para cualquier controversia, las partes se someten a los juzgados y tribunales de Madrid.
                    </p>

                    <h2 className="text-2xl font-bold text-white mt-8">9. Contacto</h2>
                    <p>
                        Para cualquier consulta sobre estas condiciones, puedes contactarnos en:<br />
                        <strong>Email:</strong> info@mbainative.com
                    </p>
                </div>
            </div>
        </section>
    );
}
