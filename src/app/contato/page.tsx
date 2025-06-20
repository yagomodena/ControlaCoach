
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';

// Re-using the landing page header and footer structure for consistency
const Header = () => (
  <header className="sticky top-0 z-50 py-4 px-6 md:px-10 flex justify-between items-center bg-white shadow-md">
    <Link href="/landing" className="flex items-center gap-2 group">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FF6B00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a10 10 0 0 0-3.91 19.48M12 22a10 10 0 0 0 3.91-19.48" />
        <path d="M2 12h20" />
        <path d="M12 2a10 10 0 0 0-7.79 3.94" />
        <path d="M12 22a10 10 0 0 1-7.79-3.94" />
      </svg>
      <span className="font-headline text-xl font-bold text-[#0D0D0D]">ControlaCoach</span>
    </Link>
    <Link href="/login" passHref>
      <Button variant="outline" className="border-[#FF6B00] text-[#FF6B00] hover:bg-[#FF6B00] hover:text-white focus:ring-[#FF8C42]">
        Entrar
      </Button>
    </Link>
  </header>
);

const Footer = () => (
  <footer className="py-10 bg-[#0D0D0D] text-gray-400 text-sm px-4 sm:px-6 lg:px-8">
    <div className="max-w-5xl mx-auto text-center">
      <div className="flex justify-center space-x-6 mb-6">
        <Link href="/termos-de-uso" className="hover:text-[#FF6B00]">Termos de Uso</Link>
        <Link href="/politica-de-privacidade" className="hover:text-[#FF6B00]">Política de Privacidade</Link>
        <Link href="/contato" className="hover:text-[#FF6B00]">Contato</Link>
      </div>
      <div className="flex justify-center space-x-6 mb-6">
        <Link href="#" aria-label="Facebook" className="text-gray-400 hover:text-[#FF6B00]">
          <Facebook className="h-6 w-6" />
        </Link>
        <Link href="#" aria-label="Instagram" className="text-gray-400 hover:text-[#FF6B00]">
          <Instagram className="h-6 w-6" />
        </Link>
        <Link href="#" aria-label="Twitter" className="text-gray-400 hover:text-[#FF6B00]">
          <Twitter className="h-6 w-6" />
        </Link>
      </div>
      <p>&copy; {new Date().getFullYear()} ControlaCoach. Todos os direitos reservados.</p>
      <p className="mt-1 text-xs">Feito com ❤️ para treinadores apaixonados.</p>
    </div>
  </footer>
);

export default function ContatoPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#0D0D0D] font-body antialiased flex flex-col">
      <Header />
      <main className="flex-grow py-12 md:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-white p-8 md:p-10 rounded-lg shadow-lg">
          <h1 className="text-3xl sm:text-4xl font-bold font-headline text-[#0D0D0D] mb-8 text-center">
            Entre em Contato
          </h1>
          
          <p className="text-lg text-gray-700 mb-8 text-center">
            Adoraríamos ouvir de você! Se você tiver dúvidas, sugestões ou precisar de suporte,
            não hesite em nos contatar através dos canais abaixo.
          </p>

          <div className="space-y-6">
            <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <Mail className="h-8 w-8 text-[#FF6B00] mr-4" />
              <div>
                <h2 className="text-xl font-semibold text-[#0D0D0D]">Email</h2>
                <a href="mailto:contato@controlacoach.com.br" className="text-gray-700 hover:text-[#FF6B00] hover:underline">
                  contato@controlacoach.com.br
                </a>
                <p className="text-sm text-gray-500">Para dúvidas gerais e suporte.</p>
              </div>
            </div>

            <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <Phone className="h-8 w-8 text-[#FF6B00] mr-4" />
              <div>
                <h2 className="text-xl font-semibold text-[#0D0D0D]">Telefone / WhatsApp</h2>
                <a href="tel:+5511999998888" className="text-gray-700 hover:text-[#FF6B00] hover:underline">
                  (11) 99999-8888
                </a>
                <p className="text-sm text-gray-500">Disponível em horário comercial.</p>
              </div>
            </div>
            
            <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <MapPin className="h-8 w-8 text-[#FF6B00] mr-4" />
              <div>
                <h2 className="text-xl font-semibold text-[#0D0D0D]">Nosso Endereço (Exemplo)</h2>
                <p className="text-gray-700">
                  Rua Exemplo, 123, Sala 45<br />
                  Cidade Exemplo, Estado - CEP 00000-000
                </p>
                <p className="text-sm text-gray-500">Visitas apenas com agendamento.</p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-lg text-gray-700 mb-4">Siga-nos nas redes sociais:</p>
            <div className="flex justify-center space-x-6">
              <Link href="#" aria-label="Facebook" className="text-gray-500 hover:text-[#FF6B00]">
                <Facebook className="h-8 w-8" />
              </Link>
              <Link href="#" aria-label="Instagram" className="text-gray-500 hover:text-[#FF6B00]">
                <Instagram className="h-8 w-8" />
              </Link>
              <Link href="#" aria-label="Twitter" className="text-gray-500 hover:text-[#FF6B00]">
                <Twitter className="h-8 w-8" />
              </Link>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
