import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, CalendarDays, DollarSign, BarChart3 } from "lucide-react";

export default function DashboardPage() {
  const stats = [
    { title: "Total de Alunos", value: "73", icon: Users, color: "text-primary", bgColor: "bg-primary/10" },
    { title: "Aulas Agendadas Hoje", value: "5", icon: CalendarDays, color: "text-green-500", bgColor: "bg-green-500/10" },
    { title: "Pagamentos Pendentes", value: "12", icon: DollarSign, color: "text-amber-500", bgColor: "bg-amber-500/10" },
    { title: "Receita Mensal (Estimada)", value: "R$ 3,450", icon: BarChart3, color: "text-indigo-500", bgColor: "bg-indigo-500/10" },
  ];

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-headline font-bold mb-8 text-foreground">Painel de Controle</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl">Ações Rápidas</CardTitle>
            <CardDescription>Acesse as funcionalidades mais usadas.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button asChild variant="outline" className="w-full justify-start text-left h-auto py-3">
              <Link href="/alunos/novo">
                <Users className="mr-3 h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">Novo Aluno</p>
                  <p className="text-xs text-muted-foreground">Cadastrar um novo aluno</p>
                </div>
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start text-left h-auto py-3">
              <Link href="/agenda">
                <CalendarDays className="mr-3 h-5 w-5 text-primary" />
                 <div>
                  <p className="font-semibold">Ver Agenda</p>
                  <p className="text-xs text-muted-foreground">Visualizar aulas da semana</p>
                </div>
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start text-left h-auto py-3">
              <Link href="/financeiro">
                <DollarSign className="mr-3 h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">Controle Financeiro</p>
                  <p className="text-xs text-muted-foreground">Gerenciar mensalidades</p>
                </div>
              </Link>
            </Button>
             <Button asChild variant="outline" className="w-full justify-start text-left h-auto py-3">
              <Link href="/aulas">
                <Users className="mr-3 h-5 w-5 text-primary" /> {/* Placeholder icon, replace with a better one for classes */}
                 <div>
                  <p className="font-semibold">Configurar Aulas</p>
                  <p className="text-xs text-muted-foreground">Definir horários e locais</p>
                </div>
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl">Próximas Aulas</CardTitle>
            <CardDescription>Aulas agendadas para hoje e amanhã.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Placeholder for upcoming classes list */}
            <div className="space-y-3">
              <div className="p-3 bg-muted/50 rounded-md">
                <p className="font-semibold">Turma das 18:00 - Praia Central</p>
                <p className="text-sm text-muted-foreground">5 alunos confirmados</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-md">
                <p className="font-semibold">Turma das 19:00 - Quadra Coberta</p>
                <p className="text-sm text-muted-foreground">8 alunos confirmados</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-md">
                <p className="font-semibold">Amanhã 08:00 - Praia do Tombo</p>
                <p className="text-sm text-muted-foreground">3 alunos confirmados</p>
              </div>
            </div>
            <Button asChild variant="link" className="mt-4 px-0 text-primary">
              <Link href="/agenda">Ver agenda completa &rarr;</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
