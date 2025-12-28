"use client";

import { useState } from "react";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setFormData({ name: "", email: "", message: "" });
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Error al enviar el mensaje');
      }
    } catch {
      setStatus('error');
      setErrorMessage('Error de conexión. Inténtalo de nuevo.');
    }
  };

  return (
    <section className="py-20 px-4 bg-[--primary] text-white">
      <div className="container mx-auto text-center">
        <h1 className="text-5xl font-extrabold mb-8">Contáctanos</h1>
        <p className="text-xl max-w-3xl mx-auto mb-12">
          ¿Tienes preguntas o quieres saber más sobre MBAI Native? No dudes en ponerte en contacto con nosotros.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left">
          {/* Contact Information */}
          <div className="bg-[--dark-gray] p-8 rounded-lg shadow-lg">
            <h3 className="text-3xl font-bold text-[--accent] mb-4">Información de Contacto</h3>
            <p className="text-lg text-gray-300 mb-2">
              <strong className="text-[--accent-secondary]">Email:</strong> info@mbainative.com
            </p>
            <p className="text-lg text-gray-300">
              <strong className="text-[--accent-secondary]">Dirección:</strong><br />
              Calle Romero Robledo, 14<br />
              28008-Madrid, España
            </p>
          </div>

          {/* Contact Form */}
          <div className="bg-[--dark-gray] p-8 rounded-lg shadow-lg">
            <h3 className="text-3xl font-bold text-[--accent] mb-4">Envíanos un Mensaje</h3>

            {status === 'success' ? (
              <div className="bg-green-600/20 border border-green-500 rounded-lg p-6 text-center">
                <div className="text-4xl mb-4">✅</div>
                <h4 className="text-xl font-bold text-green-400 mb-2">¡Mensaje enviado!</h4>
                <p className="text-gray-300">Te responderemos lo antes posible. Revisa tu email para confirmar la recepción.</p>
                <button
                  onClick={() => setStatus('idle')}
                  className="mt-4 text-[--accent] hover:underline"
                >
                  Enviar otro mensaje
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {status === 'error' && (
                  <div className="bg-red-600/20 border border-red-500 rounded-lg p-4 text-red-300">
                    {errorMessage}
                  </div>
                )}
                <div>
                  <label htmlFor="name" className="block text-lg font-medium text-gray-300 mb-2">Nombre</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full p-3 rounded-md bg-[--primary] border border-gray-600 text-white focus:ring-2 focus:ring-[--accent] focus:border-transparent"
                    required
                    disabled={status === 'sending'}
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-lg font-medium text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full p-3 rounded-md bg-[--primary] border border-gray-600 text-white focus:ring-2 focus:ring-[--accent] focus:border-transparent"
                    required
                    disabled={status === 'sending'}
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-lg font-medium text-gray-300 mb-2">Mensaje</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={5}
                    className="w-full p-3 rounded-md bg-[--primary] border border-gray-600 text-white focus:ring-2 focus:ring-[--accent] focus:border-transparent"
                    required
                    disabled={status === 'sending'}
                  ></textarea>
                </div>
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="w-full bg-[--accent] hover:bg-[--accent]/90 text-[--primary] font-bold py-3 px-6 rounded-md shadow-lg transform hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {status === 'sending' ? 'Enviando...' : 'Enviar Mensaje'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}