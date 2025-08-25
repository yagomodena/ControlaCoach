
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Facebook, Instagram, Twitter } from 'lucide-react';

// Re-using the landing page header and footer structure for consistency
const Header = () => (
  <header className="sticky top-0 z-50 py-4 px-6 md:px-10 flex justify-between items-center bg-white shadow-md">
    <Link href="/landing" className="flex items-center gap-2 group">
    <Image
          src="/images/FP-SB.png"   // caminho relativo à pasta public
          alt="FitPlanner Logo"
          width={80}               // largura da logo
          height={40}               // altura da logo
          priority
        />
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

export default function PoliticaDePrivacidadePage() {
  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#0D0D0D] font-body antialiased flex flex-col">
      <Header />
      <main className="flex-grow py-12 md:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-white p-8 md:p-10 rounded-lg shadow-lg">
          <h1 className="text-3xl sm:text-4xl font-bold font-headline text-[#0D0D0D] mb-8">
            Política de Privacidade
          </h1>
          
          <div className="space-y-6 text-gray-700 prose prose-sm sm:prose-base max-w-none">
            <p className="text-sm text-gray-500">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

            <section>
              <h2 className="text-xl font-semibold text-[#0D0D0D] mb-2">1. Introdução</h2>
              <p>Bem-vindo ao FitPlanner. A sua privacidade é importante para nós. Esta Política de Privacidade explica como coletamos, usamos, divulgamos e protegemos suas informações quando você usa nosso Serviço.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0D0D0D] mb-2">2. Coleta de Informações</h2>
              <p>Coletamos informações que você nos fornece diretamente, como quando você cria uma conta, se inscreve em um plano ou se comunica conosco. Isso pode incluir seu nome, endereço de e-mail, número de telefone e informações de pagamento.</p>
              <p>Também podemos coletar informações automaticamente quando você usa o Serviço, como seu endereço IP, tipo de navegador, sistema operacional, informações do dispositivo e dados de uso.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0D0D0D] mb-2">3. Uso das Informações</h2>
              <p>Usamos as informações que coletamos para:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Fornecer, operar e manter nosso Serviço;</li>
                <li>Melhorar, personalizar e expandir nosso Serviço;</li>
                <li>Entender e analisar como você usa nosso Serviço;</li>
                <li>Desenvolver novos produtos, serviços, recursos e funcionalidades;</li>
                <li>Comunicar com você, seja diretamente ou através de um de nossos parceiros, inclusive para atendimento ao cliente, para fornecer atualizações e outras informações relacionadas ao Serviço, e para fins de marketing e promocionais;</li>
                <li>Processar suas transações;</li>
                <li>Encontrar e prevenir fraudes.</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold text-[#0D0D0D] mb-2">4. Compartilhamento de Informações</h2>
              <p>Não compartilhamos suas informações pessoais com terceiros, exceto conforme descrito nesta Política de Privacidade ou com seu consentimento. Podemos compartilhar informações com: </p>
                <ul className="list-disc pl-6 space-y-1">
                    <li>Provedores de serviços que realizam serviços em nosso nome;</li>
                    <li>Se exigido por lei ou em resposta a um processo legal válido;</li>
                    <li>Para proteger nossos direitos, privacidade, segurança ou propriedade, e/ou de nossos afiliados, você ou outros.</li>
                </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0D0D0D] mb-2">5. Segurança dos Dados</h2>
              <p>Tomamos medidas razoáveis para proteger suas informações contra acesso, uso ou divulgação não autorizados. No entanto, nenhum método de transmissão pela Internet ou método de armazenamento eletrônico é 100% seguro.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0D0D0D] mb-2">6. Seus Direitos de Privacidade</h2>
              <p>Dependendo da sua jurisdição, você pode ter certos direitos em relação às suas informações pessoais, como o direito de acessar, corrigir ou excluir suas informações. Entre em contato conosco para exercer seus direitos.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0D0D0D] mb-2">7. Cookies e Tecnologias de Rastreamento</h2>
              <p>Usamos cookies e tecnologias de rastreamento semelhantes para rastrear a atividade em nosso Serviço e manter certas informações. Você pode instruir seu navegador a recusar todos os cookies ou a indicar quando um cookie está sendo enviado.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0D0D0D] mb-2">8. Alterações nesta Política de Privacidade</h2>
              <p>Podemos atualizar nossa Política de Privacidade de tempos em tempos. Notificaremos você sobre quaisquer alterações publicando a nova Política de Privacidade nesta página. Aconselhamos que você revise esta Política de Privacidade periodicamente para quaisquer alterações.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0D0D0D] mb-2">9. Contato</h2>
              <p>Se você tiver alguma dúvida sobre esta Política de Privacidade, entre em contato conosco em fitplannerbr@gmail.com ou através da nossa <Link href="/contato" className="text-[#FF6B00] hover:underline">página de contato</Link>.</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
