import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Settings2 } from "lucide-react";
import Link from "next/link";

// Mock data for class sessions
const mockClassSessions = [
  { id: 'c1', dayOfWeek: 'Segunda', time: '18:00', location: 'Praia Central', maxStudents: 10, enrolledCount: 8 },
  { id: 'c2', dayOfWeek: 'Segunda', time: '19:00', location: 'Praia Central', maxStudents: 10, enrolledCount: 10 },
  { id: 'c3', dayOfWeek: 'Terça', time: '07:00', location: 'Quadra Coberta A', maxStudents: 12, enrolledCount: 9 },
  { id: 'c4', dayOfWeek: 'Quarta', time: '18:30', location: 'Praia do Tombo', maxStudents: 8, enrolledCount: 5 },
  { id: 'c5', dayOfWeek: 'Quinta', time: '07:00', location: 'Quadra Coberta B', maxStudents: 12, enrolledCount: 11 },
];


export default function AulasPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground">Configuração de Aulas</h1>
          <p className="text-muted-foreground">Defina os horários, locais e capacidade das suas aulas.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <PlusCircle className="mr-2 h-5 w-5" />
          Nova Configuração de Aula
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mockClassSessions.map((session) => (
          <Card key={session.id} className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="font-headline text-xl">{session.dayOfWeek} - {session.time}</CardTitle>
              <CardDescription>{session.location}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center text-sm text-muted-foreground mb-2">
                <span>Capacidade:</span>
                <span className="font-semibold text-foreground">{session.enrolledCount} / {session.maxStudents}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5 mb-4">
                <div 
                  className="bg-primary h-2.5 rounded-full" 
                  style={{ width: `${(session.enrolledCount / session.maxStudents) * 100}%` }}
                ></div>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                <Settings2 className="mr-2 h-4 w-4" />
                Gerenciar Aula
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {mockClassSessions.length === 0 && (
        <Card>
          <CardContent className="py-12 flex flex-col items-center justify-center">
            <Settings2 className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">Nenhuma aula configurada</h3>
            <p className="text-muted-foreground mb-4 text-center">Comece adicionando os horários e locais das suas aulas.</p>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <PlusCircle className="mr-2 h-5 w-5" />
              Configurar Nova Aula
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
