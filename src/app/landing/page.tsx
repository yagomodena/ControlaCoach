
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { UsersRound, CalendarClock, CircleDollarSign, Smartphone, ReceiptText, CheckCircle2, Facebook, Instagram, Twitter, Youtube, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

const bannerImageUrl = "https://storage.googleapis.com/project-ai-prototyper.appspot.com/projects%2FJzkpAS8qTryME2DL477q%2Ffiles%2Ftreinadores.png";


const featureItems = [
  {
    icon: UsersRound,
    title: "Gestão de Alunos Completa",
    description: "Cadastre, edite, organize seus alunos e acompanhe a presença de forma simples e eficiente.",
  },
  {
    icon: CalendarClock,
    title: "Agenda Inteligente de Aulas",
    description: "Configure horários, turmas e visualize sua agenda de forma clara, evitando conflitos.",
  },
  {
    icon: CircleDollarSign,
    title: "Controle Financeiro Integrado",
    description: "Gerencie mensalidades, registre pagamentos e tenha uma visão clara das suas finanças.",
  },
  {
    icon: Smartphone,
    title: "Painel Intuitivo e Responsivo",
    description: "Acesse de qualquer dispositivo, seja no computador, tablet ou celular, com total facilidade.",
  },
  {
    icon: ReceiptText,
    title: "Recibos e Organização",
    description: "Gere recibos de pagamento para seus alunos e mantenha tudo organizado digitalmente.",
  },
];

const targetAudienceItems = [
  "Personal Trainers",
  "Professores de Futevôlei",
  "Professores de Vôlei",
  "Professores de Beach Tennis",
  "Técnicos de Esportes",
  "Instrutores de modalidades individuais ou em grupo",
  "Coachs Esportivos",
  "Estúdios de Treinamento Funcional",
];

const testimonials = [
  {
    quote: "Organizei meus alunos em 1 dia! Não vivo mais sem o FitPlanner. Facilitou demais minha rotina.",
    name: "João Alves",
    role: "Coach de Beach Tennis",
  },
  {
    quote: "Simples, direto ao ponto e muito eficiente. Exatamente o que eu precisava para gerenciar meus pagamentos e aulas.",
    name: "Fernanda Lima",
    role: "Personal Trainer",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#0D0D0D] font-body antialiased">
      {/* Header */}
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

      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-white text-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-headline text-[#0D0D0D] leading-tight">
            A Gestão <span className="text-[#FF6B00]">Simples e Profissional</span> que Seu Treino Merece
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-700 max-w-2xl mx-auto">
            Controle seus alunos, aulas e finanças com o FitPlanner. Tudo em um só lugar, de forma simples e 100% online.
          </p>
          <div className="mt-10">
            <Link href="/cadastro" passHref>
              <Button size="lg" className="bg-[#FF6B00] text-white hover:bg-[#FF8C42] px-10 py-4 text-lg font-semibold rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:ring-[#FF8C42] focus:ring-offset-2">
                Testar grátis por 14 dias <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
        <div className="mt-12 md:mt-16 max-w-4xl mx-auto">
          <Image
            src={bannerImageUrl}
            alt="Profissionais de educação física sorrindo e treinando com o logo FitPlanner"
            width={1280}
            height={720}
            className="rounded-xl shadow-2xl object-cover"
            priority
          />
        </div>
      </section>

      {/* Features Section */}
      <section id="funcionalidades" className="py-16 md:py-20 bg-[#F5F5F5] px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold font-headline text-center text-[#0D0D0D] mb-12 sm:mb-16">
            Tudo que você precisa para <span className="text-[#FF6B00]">elevar o nível</span> da sua gestão
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
            {featureItems.map((item, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                <item.icon className="h-10 w-10 text-[#FF6B00] mb-4" />
                <h3 className="text-xl font-semibold text-[#0D0D0D] mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Target Audience Section */}
      <section id="para-quem" className="py-16 md:py-20 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold font-headline text-[#0D0D0D] mb-10">
            Para quem é o <span className="text-[#FF6B00]">FitPlanner?</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-left">
            {targetAudienceItems.map((item, index) => (
              <div key={index} className="flex items-start">
                <CheckCircle2 className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                <span className="text-gray-700 text-lg">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precos" className="py-16 md:py-20 bg-[#0D0D0D] text-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold font-headline mb-4">Planos e Preços</h2>
          <p className="text-lg text-gray-300 mb-12 sm:mb-16">Escolha o plano ideal para você e comece a transformar sua gestão.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            <div className="bg-white text-[#0D0D0D] p-8 rounded-xl shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-2xl font-bold text-[#FF6B00] mb-2">Plano Mensal</h3>
                <p className="text-4xl font-bold mb-1">R$ 49<span className="text-2xl">,90</span><span className="text-lg font-normal text-gray-600">/mês</span></p>
                <p className="text-gray-600 mb-6">Acesso completo a todas as funcionalidades.</p>
                <ul className="space-y-2 text-left mb-8">
                  {['Alunos ilimitados', 'Agenda completa', 'Controle financeiro', 'Suporte prioritário'].map(feature => (
                    <li key={feature} className="flex items-center"><ShieldCheck className="h-5 w-5 text-green-500 mr-2" />{feature}</li>
                  ))}
                </ul>
              </div>
              <Link href="/cadastro" passHref>
                <Button size="lg" className="w-full bg-[#FF6B00] text-white hover:bg-[#FF8C42] py-3 text-md font-semibold rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105">
                  Começar Teste Gratuito
                </Button>
              </Link>
            </div>
            <div className="bg-white text-[#0D0D0D] p-8 rounded-xl shadow-xl border-2 border-[#FF6B00] flex flex-col justify-between relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FF6B00] text-white px-4 py-1 text-sm font-semibold rounded-full">MAIS POPULAR</div>
              <div>
                <h3 className="text-2xl font-bold text-[#FF6B00] mb-2 mt-3">Plano Anual</h3>
                <p className="text-4xl font-bold mb-1">R$ 497<span className="text-lg font-normal text-gray-600">/ano</span></p>
                <p className="text-gray-600 mb-6">Economize 17% (equivale a R$ 41,41/mês).</p>
                <ul className="space-y-2 text-left mb-8">
                  {['Tudo do Plano Mensal', 'Desconto exclusivo', 'Acesso antecipado a novidades'].map(feature => (
                    <li key={feature} className="flex items-center"><ShieldCheck className="h-5 w-5 text-green-500 mr-2" />{feature}</li>
                  ))}
                </ul>
              </div>
              <Link href="/cadastro" passHref>
                <Button size="lg" className="w-full bg-[#FF6B00] text-white hover:bg-[#FF8C42] py-3 text-md font-semibold rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105">
                  Começar Teste Gratuito
                </Button>
              </Link>
            </div>
          </div>
          <p className="mt-10 text-gray-300">
            Teste gratuitamente por <span className="font-semibold text-white">14 dias</span>. Sem compromisso, cancele quando quiser. <span className="font-semibold text-white">Não pedimos cartão de crédito</span> para testar.
          </p>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="depoimentos" className="py-16 md:py-20 bg-[#F5F5F5] px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold font-headline text-center text-[#0D0D0D] mb-12 sm:mb-16">
            O que nossos <span className="text-[#FF6B00]">usuários dizem</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-lg">
                <p className="text-gray-700 italic text-lg mb-6">"{testimonial.quote}"</p>
                <div className="text-right">
                  <p className="font-semibold text-[#0D0D0D]">{testimonial.name}</p>
                  <p className="text-sm text-[#FF6B00]">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 md:py-24 bg-white text-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold font-headline text-[#0D0D0D] mb-6">
            Pronto para <span className="text-[#FF6B00]">profissionalizar</span> sua gestão?
          </h2>
          <p className="text-lg text-gray-700 mb-10">
            Junte-se a centenas de treinadores que já estão economizando tempo e organizando suas vidas com o FitPlanner.
          </p>
          <Link href="/cadastro" passHref>
            <Button size="lg" className="bg-[#FF6B00] text-white hover:bg-[#FF8C42] px-10 py-4 text-lg font-semibold rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:ring-[#FF8C42] focus:ring-offset-2">
              Comece agora – Grátis por 14 dias <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-[#0D0D0D] text-gray-400 text-sm px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex justify-center space-x-6 mb-6">
            <Link href="/termos-de-uso" className="hover:text-[#FF6B00]">Termos de Uso</Link>
            <Link href="/politica-de-privacidade" className="hover:text-[#FF6B00]">Política de Privacidade</Link>
            <Link href="/contato" className="hover:text-[#FF6B00]">Contato</Link>
          </div>
          <div className="flex justify-center space-x-6 mb-6">
            <Link href="#" aria-label="Youtube" className="text-gray-400 hover:text-[#FF6B00]">
              <Youtube className="h-6 w-6" />
            </Link>
            <Link href="https://www.instagram.com/fitplannerbr/" aria-label="Instagram" className="text-gray-400 hover:text-[#FF6B00]">
              <Instagram className="h-6 w-6" />
            </Link>
          </div>
          <p>&copy; {new Date().getFullYear()} FitPlanner. Todos os direitos reservados.</p>
          <p className="mt-1 text-xs">Feito com ❤️ para treinadores apaixonados.</p>
        </div>
      </footer>
    </div>
  );
}
