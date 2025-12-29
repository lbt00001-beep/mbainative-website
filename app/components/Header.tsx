"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled ? "bg-[--primary]/80 shadow-md backdrop-blur-sm" : "bg-transparent"
        }`}
    >
      <div className="container mx-auto flex justify-between items-center p-4 text-[--foreground]">
        <Link href="/" className="flex items-center gap-3 text-2xl font-bold">
          <img
            src="/images/logo-mbainative.png"
            alt="MBAI Native Logo"
            className="h-10 w-auto"
          />
          <span className="hidden sm:inline">MBAI Native</span>
        </Link>
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/" className="hover:text-[--accent] transition-colors">
            Home
          </Link>
          <Link href="/about" className="hover:text-[--accent] transition-colors">
            About
          </Link>
          <Link href="/services" className="hover:text-[--accent] transition-colors">
            Services
          </Link>
          <Link href="/mejores-practicas" className="hover:text-[--accent] transition-colors">
            Mejores Prácticas
          </Link>
          <Link href="/contact" className="hover:text-[--accent] transition-colors">
            Contact
          </Link>
          <Link href="/aplicaciones" className="hover:text-[--accent] transition-colors">
            Aplicaciones
          </Link>
          <Link
            href="https://juego-empresa-ia-mbai-797037398090.europe-west1.run.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[--accent] hover:bg-[--accent]/90 text-[--primary] font-bold py-2 px-4 rounded-md transition-colors"
          >
            Acceso Plataforma
          </Link>
        </nav>
        <div className="md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-[--foreground] focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"}></path>
            </svg>
          </button>
        </div>
      </div>
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[--background]/95 backdrop-blur-sm">
          <nav className="flex flex-col items-center space-y-4 p-4 text-[--foreground]">
            <Link href="/" className="hover:text-[--accent] transition-colors">Home</Link>
            <Link href="/about" className="hover:text-[--accent] transition-colors">About</Link>
            <Link href="/services" className="hover:text-[--accent] transition-colors">Services</Link>
            <Link href="/mejores-practicas" className="hover:text-[--accent] transition-colors">Mejores Prácticas</Link>
            <Link href="/contact" className="hover:text-[--accent] transition-colors">Contact</Link>
            <Link href="/aplicaciones" className="hover:text-[--accent] transition-colors">Aplicaciones</Link>
            <Link
              href="https://juego-empresa-ia-mbai-797037398090.europe-west1.run.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[--accent] hover:bg-[--accent]/90 text-[--primary] font-bold py-2 px-4 rounded-md transition-colors"
            >
              Acceso Plataforma
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}