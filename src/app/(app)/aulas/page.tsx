
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Settings2, Users, Clock, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import type { ClassSession } from '@/types';
import { db } from '@/firebase';
import { collection, onSnapshot, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function AulasPage() {
  const [classSessions, setClassSessions] = React.useState<ClassSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    const classSessionsCollectionRef = collection(db, 'classSessions');
    // Order by dayOfWeek, then startTime for consistent display
    const q = query(classSessionsCollectionRef, orderBy('dayOfWeek'), orderBy('startTime'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessionsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ClassSession));
      setClassSessions(sessionsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching class sessions: ", error);
      toast({
        title: "Erro ao Carregar Configurações de Aula",
        description: "Não foi possível buscar os dados. Tente novamente.",
        variant: "destructive",
      });
      setIsLoading(false);
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, [toast]);

  const handleDeleteClassSession = async (sessionId: string, sessionTitle: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a configuração de aula "${sessionTitle}"? Esta ação não pode ser desfeita.`)) {
      try {
        await deleteDoc(doc(db, 'classSessions', sessionId));
        toast({
          title: 'Configuração de Aula Excluída!',
          description: `A configuração "${sessionTitle}" foi removida com sucesso.`,
        });
        // Real-time listener will update the list automatically
      } catch (error) {
        console.error("Error deleting class session: ", error);
        toast({
          title: "Erro ao Excluir",
          description: "Não foi possível excluir a configuração de aula. Tente novamente.",
          variant: "destructive",
        });
      }
    }
  };


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

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Carregando configurações...</p>
        </div>
      ) : classSessions.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {classSessions.map((session) => (
            <Card key={session.id} className="shadow-lg hover:shadow-xl transition-shadow flex flex-col">
              <CardHeader>
                <CardTitle className="font-headline text-xl">{session.dayOfWeek}</CardTitle>
                <CardDescription className="flex items-center">
                    <Clock className="h-4 w-4 mr-1.5 text-muted-foreground"/> {session.startTime} - {session.endTime}
                </CardDescription>
                <CardDescription>{session.location}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col">
                <div className="flex justify-between items-center text-sm text-muted-foreground mb-1">
                  <span>Capacidade:</span>
                  <span className="font-semibold text-foreground">{session.enrolledStudentIds?.length || 0} / {session.maxStudents}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5 mb-3">
                  <div 
                    className="bg-primary h-2.5 rounded-full" 
                    style={{ width: `${session.maxStudents > 0 ? ((session.enrolledStudentIds?.length || 0) / session.maxStudents) * 100 : 0}%` }}
                  ></div>
                </div>
                 <div className="flex items-center text-xs text-muted-foreground mb-4">
                    <Users className="h-3.5 w-3.5 mr-1.5"/> {(session.enrolledStudentIds?.length || 0)} aluno(s) inscrito(s) (padrão)
                </div>
                <div className="mt-auto flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/aulas/${session.id}`}>
                        <Settings2 className="mr-2 h-4 w-4" />
                        Gerenciar
                    </Link>
                    </Button>
                     <Button 
                        variant="destructive" 
                        size="icon" 
                        onClick={() => handleDeleteClassSession(session.id, `${session.dayOfWeek} ${session.startTime}-${session.endTime}`)}
                        aria-label="Excluir Configuração"
                        className="shrink-0"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
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
