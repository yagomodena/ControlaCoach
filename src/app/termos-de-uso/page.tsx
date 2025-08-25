
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Facebook, Instagram, Twitter, ArrowRight } from 'lucide-react';

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
      <span className="font-headline text-xl font-bold">
        <span className="text-[#FF6B00]">Fit</span>
        <span className="text-[#0D0D0D]">Planner</span>
      </span>
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
      <p>&copy; {new Date().getFullYear()} FitPlanner. Todos os direitos reservados.</p>
      <p className="mt-1 text-xs">Feito com ❤️ para treinadores apaixonados.</p>
    </div>
  </footer>
);

export default function TermosDeUsoPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#0D0D0D] font-body antialiased flex flex-col">
      <Header />
      <main className="flex-grow py-12 md:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-white p-8 md:p-10 rounded-lg shadow-lg">
          <h1 className="text-3xl sm:text-4xl font-bold font-headline text-[#0D0D0D] mb-8">
            Termos de Uso
          </h1>
          
          <div className="space-y-6 text-gray-700 prose prose-sm sm:prose-base max-w-none">
            <p className="text-sm text-gray-500">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

            <section>
              <h2 className="text-xl font-semibold text-[#0D0D0D] mb-2">1. Aceitação dos Termos</h2>
              <p>Ao acessar e usar o FitPlanner ("Serviço"), você concorda em cumprir e estar vinculado a estes Termos de Uso ("Termos"). Se você não concorda com estes Termos, não use o Serviço.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0D0D0D] mb-2">2. Descrição do Serviço</h2>
              <p>O FitPlanner é um sistema de gestão para treinadores, coachs e personal trainers, oferecendo funcionalidades para gerenciamento de alunos, aulas, agenda e finanças.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0D0D0D] mb-2">3. Contas de Usuário</h2>
              <p>Para acessar certas funcionalidades do Serviço, você pode ser obrigado a criar uma conta. Você é responsável por manter a confidencialidade de suas credenciais de conta e por todas as atividades que ocorrem sob sua conta. Você concorda em nos notificar imediatamente sobre qualquer uso não autorizado de sua conta.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0D0D0D] mb-2">4. Uso Aceitável</h2>
              <p>Você concorda em não usar o Serviço para qualquer finalidade ilegal ou proibida por estes Termos. Você não pode usar o Serviço de qualquer maneira que possa danificar, desabilitar, sobrecarregar ou prejudicar o Serviço.</p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold text-[#0D0D0D] mb-2">5. Propriedade Intelectual</h2>
              <p>O Serviço e seu conteúdo original, recursos e funcionalidades são e permanecerão propriedade exclusiva do FitPlanner e seus licenciadores. O Serviço é protegido por direitos autorais, marcas registradas e outras leis.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0D0D0D] mb-2">6. Planos e Pagamentos</h2>
              <p>O Serviço pode oferecer planos pagos. Ao se inscrever em um plano pago, você concorda em pagar as taxas aplicáveis. Todos os pagamentos são processados através de gateways de pagamento seguros. Oferecemos um período de teste gratuito, conforme especificado em nossa página de preços.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0D0D0D] mb-2">7. Rescisão</h2>
              <p>Podemos rescindir ou suspender seu acesso ao Serviço imediatamente, sem aviso prévio ou responsabilidade, por qualquer motivo, incluindo, sem limitação, se você violar os Termos.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0D0D0D] mb-2">8. Limitação de Responsabilidade</h2>
              <p>Em nenhuma circunstância o FitPlanner, nem seus diretores, funcionários, parceiros, agentes, fornecedores ou afiliados, serão responsáveis por quaisquer danos indiretos, incidentais, especiais, consequenciais ou punitivos, incluindo, sem limitação, perda de lucros, dados, uso, boa vontade ou outras perdas intangíveis.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0D0D0D] mb-2">9. Alterações nos Termos</h2>
              <p>Reservamo-nos o direito, a nosso exclusivo critério, de modificar ou substituir estes Termos a qualquer momento. Se uma revisão for material, forneceremos um aviso com pelo menos 30 dias de antecedência antes que quaisquer novos termos entrem em vigor. O que constitui uma alteração material será determinado a nosso exclusivo critério.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0D0D0D] mb-2">10. Contato</h2>
              <p>Se você tiver alguma dúvida sobre estes Termos, entre em contato conosco em contato@fitplanner.com.br ou através da nossa <Link href="/contato" className="text-[#FF6B00] hover:underline">página de contato</Link>.</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
