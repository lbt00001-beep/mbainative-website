import Link from 'next/link';

export default function PrivacyPolicy() {
    return (
        <section className="py-20 px-4 bg-[--primary] text-white">
            <div className="container mx-auto max-w-4xl">
                <Link href="/" className="text-[--accent] hover:underline mb-8 inline-block">
                    ← Volver al inicio
                </Link>

                <h1 className="text-4xl font-extrabold mb-8">Política de Privacidad</h1>

                <div className="prose prose-invert max-w-none space-y-6 text-gray-300">
                    <p className="text-sm text-gray-400">Última actualización: 28 de diciembre de 2025</p>

                    <h2 className="text-2xl font-bold text-white mt-8">1. Responsable del Tratamiento</h2>
                    <p>
                        <strong>MBAI Native</strong><br />
                        Calle Romero Robledo, 14<br />
                        28008-Madrid, España<br />
                        Email: info@mbainative.com
                    </p>

                    <h2 className="text-2xl font-bold text-white mt-8">2. Datos que Recopilamos</h2>
                    <p>Recopilamos los siguientes datos personales:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Datos de contacto:</strong> nombre, dirección de email y mensaje cuando utilizas nuestro formulario de contacto.</li>
                        <li><strong>Datos de navegación:</strong> información técnica como dirección IP, tipo de navegador y páginas visitadas.</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-white mt-8">3. Finalidad del Tratamiento</h2>
                    <p>Utilizamos tus datos para:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Responder a tus consultas y solicitudes de información.</li>
                        <li>Mejorar nuestros servicios y la experiencia de usuario.</li>
                        <li>Cumplir con obligaciones legales.</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-white mt-8">4. Base Legal</h2>
                    <p>El tratamiento de tus datos se basa en:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Tu consentimiento al enviar el formulario de contacto.</li>
                        <li>Nuestro interés legítimo en mejorar nuestros servicios.</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-white mt-8">5. Conservación de Datos</h2>
                    <p>
                        Conservamos tus datos durante el tiempo necesario para cumplir con la finalidad
                        para la que fueron recogidos y para determinar las posibles responsabilidades
                        que se pudieran derivar.
                    </p>

                    <h2 className="text-2xl font-bold text-white mt-8">6. Tus Derechos</h2>
                    <p>Puedes ejercer los siguientes derechos:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Acceso:</strong> conocer qué datos personales tenemos sobre ti.</li>
                        <li><strong>Rectificación:</strong> corregir datos inexactos.</li>
                        <li><strong>Supresión:</strong> solicitar la eliminación de tus datos.</li>
                        <li><strong>Oposición:</strong> oponerte al tratamiento de tus datos.</li>
                        <li><strong>Portabilidad:</strong> recibir tus datos en formato electrónico.</li>
                    </ul>
                    <p>Para ejercer estos derechos, contacta con nosotros en info@mbainative.com</p>

                    <h2 className="text-2xl font-bold text-white mt-8">7. Seguridad</h2>
                    <p>
                        Implementamos medidas técnicas y organizativas apropiadas para proteger
                        tus datos personales contra el acceso no autorizado, alteración, divulgación o destrucción.
                    </p>

                    <h2 className="text-2xl font-bold text-white mt-8">8. Cambios en esta Política</h2>
                    <p>
                        Nos reservamos el derecho de modificar esta política de privacidad.
                        Cualquier cambio será publicado en esta página.
                    </p>
                </div>
            </div>
        </section>
    );
}
