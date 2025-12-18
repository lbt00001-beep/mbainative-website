"use client";

import { useState } from "react";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the form data to an API endpoint
    console.log("Form submitted:", formData);
    alert("Mensaje enviado con éxito! Nos pondremos en contacto contigo pronto.");
    setFormData({ name: "", email: "", message: "" });
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
            <p className="text-lg text-gray-300 mb-2">
              <strong className="text-[--accent-secondary]">Teléfono:</strong> +34 123 456 789
            </p>
            <p className="text-lg text-gray-300">
              <strong className="text-[--accent-secondary]">Dirección:</strong> Calle Falsa 123, Madrid, España
            </p>
          </div>

          {/* Contact Form */}
          <div className="bg-[--dark-gray] p-8 rounded-lg shadow-lg">
            <h3 className="text-3xl font-bold text-[--accent] mb-4">Envíanos un Mensaje</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full bg-[--accent] hover:bg-[--accent]/90 text-[--primary] font-bold py-3 px-6 rounded-md shadow-lg transform hover:scale-105 transition-transform duration-300"
              >
                Enviar Mensaje
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}