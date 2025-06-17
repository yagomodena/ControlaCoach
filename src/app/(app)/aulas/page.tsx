
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Settings2, Users } from "lucide-react";
import Link from "next/link";
import { MOCK_CLASS_SESSIONS, type ClassSession } from '@/types';

export default function AulasPage() {
  // In a real app, this would come from a data store (e.g., Firebase)
  const [classSessions, setClassSessions] = React.useState<ClassSession[]>(MOCK_CLASS_SESSIONS);

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground">Configuração de Aulas</h1>
          <p className="text-muted-foreground">Defina os horários, locais e capacidade das suas aulas.</p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link href="/aulas/nova">
            <PlusCircle className="mr-2 h-5 w-5" />
            Nova Configuração de Aula
          </Link>
        </Button>
      </div>

      {classSessions.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {classSessions.map((session) => (
            <Card key={session.id} className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle className="font-headline text-xl">{session.dayOfWeek} - {session.time}</CardTitle>
                <CardDescription>{session.location}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-sm text-muted-foreground mb-1">
                  <span>Capacidade:</span>
                  <span className="font-semibold text-foreground">{session.enrolledStudentIds.length} / {session.maxStudents}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5 mb-3">
                  <div 
                    className="bg-primary h-2.5 rounded-full" 
                    style={{ width: `${(session.enrolledStudentIds.length / session.maxStudents) * 100}%` }}
                  ></div>
                </div>
                 <div className="flex items-center text-xs text-muted-foreground mb-4">
                    <Users className="h-3.5 w-3.5 mr-1.5"/> {session.enrolledStudentIds.length} aluno(s) inscrito(s)
                </div>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/aulas/${session.id}`}>
                    <Settings2 className="mr-2 h-4 w-4" />
                    Gerenciar Aula
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 flex flex-col items-center justify-center">
            <Settings2 className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">Nenhuma aula configurada</h3>
            <p className="text-muted-foreground mb-4 text-center">Comece adicionando os horários e locais das suas aulas.</p>
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/aulas/nova">
                <PlusCircle className="mr-2 h-5 w-5" />
                Configurar Nova Aula
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
