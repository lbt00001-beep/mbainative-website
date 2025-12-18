import Link from "next/link";

const SocialIcon = ({ href, children }: { href: string, children: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[--accent] transition-colors">
    {children}
  </a>
);

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12 px-4">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1">
          <h3 className="text-2xl font-bold mb-4">MBAI <span className="text-[--accent]">Native</span></h3>
          <p className="text-gray-400">
            Formando a la nueva generación de líderes en Inteligencia Artificial.
          </p>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-4">Navegación</h3>
          <ul className="space-y-2">
            <li><Link href="/" className="hover:text-[--accent] transition-colors">Home</Link></li>
            <li><Link href="/about" className="hover:text-[--accent] transition-colors">About</Link></li>
            <li><Link href="/services" className="hover:text-[--accent] transition-colors">Services</Link></li>
            <li><Link href="/contact" className="hover:text-[--accent] transition-colors">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-4">Contacto</h3>
          <p className="text-gray-400">
            Email: <a href="mailto:info@mbainative.com" className="hover:text-[--accent] transition-colors">info@mbainative.com</a>
          </p>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-4">Síguenos</h3>
          <div className="flex space-x-4">
            <SocialIcon href="https://twitter.com">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-.424.727-.666 1.581-.666 2.477 0 1.916.92 3.722 2.311 4.718-.857-.027-1.657-.262-2.353-.645v.058c0 2.684 1.808 4.982 4.253 5.494-.445.121-.918.185-1.407.185-.34 0-.672-.033-1-.094.716 2.213 2.783 3.824 5.234 3.87-1.838 1.439-4.14 2.296-6.65 2.296-.431 0-.858-.025-1.278-.075 2.38 1.533 5.216 2.423 8.284 2.423 9.944 0 15.39-8.246 15.39-15.39 0-.234-.005-.467-.015-.7a10.963 10.963 0 002.7-2.809z"></path></svg>
            </SocialIcon>
            <SocialIcon href="https://linkedin.com">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"></path></svg>
            </SocialIcon>
          </div>
        </div>
      </div>
      <div className="container mx-auto text-center text-gray-500 border-t border-gray-700 pt-8 mt-8">
        <p>&copy; {new Date().getFullYear()} MBAI Native. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}