
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, CalendarCheck2, Dumbbell, Activity, Loader2 } from "lucide-react";
import { auth, db } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Student } from '@/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function StudentDashboardPage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudentData = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        // This case should be handled by the layout's auth guard
        setIsLoading(false);
        setError("Usuário não autenticado.");
        return;
      }

      try {
        // For this example, we assume the student's main data is in a `students` collection
        // In a real multi-tenant app, this would be more complex, likely under `/coaches/{coachId}/students/{studentId}`
        // This part WILL need to be adapted once the student login flow is fully defined.
        const studentDocRef = doc(db, 'students', currentUser.uid); // Placeholder path
        const docSnap = await getDoc(studentDocRef);

        if (docSnap.exists()) {
          setStudent({ ...docSnap.data(), id: docSnap.id } as Student);
        } else {
          // This is a likely scenario until student creation is updated
          setError("Dados do aluno não encontrados. O cadastro pode estar incompleto.");
        }
      } catch (err) {
        console.error(err);
        setError("Ocorreu um erro ao buscar seus dados.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-lg text-muted-foreground">Carregando seu painel...</p>
      </div>
    );
  }
  
  if (error) {
     return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-destructive">Erro ao Carregar Painel</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-destructive">{error}</p>
                <p className="text-muted-foreground mt-2">Por favor, entre em contato com seu treinador para verificar seu cadastro.</p>
            </CardContent>
        </Card>
     )
  }

  if (!student) {
    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Bem-vindo!</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Não foi possível carregar seus dados completos. Fale com seu treinador.</p>
            </CardContent>
        </Card>
    )
  }
  
  const lastAssessment = student.physicalAssessments?.[student.physicalAssessments.length - 1];

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-headline font-bold mb-2 text-foreground">Olá, {student.name.split(' ')[0]}!</h1>
      <p className="text-muted-foreground mb-8">Bem-vindo ao seu portal. Aqui estão suas informações mais recentes.</p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center text-lg"><CalendarCheck2 className="mr-2 text-primary" /> Próxima Aula</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Quarta-feira, 18:00</p>
            <p className="text-sm text-muted-foreground">Praia Central, Quadra A</p>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center text-lg"><Dumbbell className="mr-2 text-primary" /> Treino de Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Membros Superiores</p>
            <p className="text-sm text-muted-foreground">Foco em peito e ombros.</p>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center text-lg"><Activity className="mr-2 text-primary" /> Última Avaliação</CardTitle>
             <CardDescription>
                {lastAssessment ? `Em ${format(parseISO(lastAssessment.date), "dd/MM/yyyy", { locale: ptBR })}` : "Nenhuma avaliação registrada"}
             </CardDescription>
          </CardHeader>
          <CardContent>
             {lastAssessment ? (
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <p><strong>Peso:</strong> {lastAssessment.weight || '-'} kg</p>
                    <p><strong>Gordura:</strong> {lastAssessment.bodyFatPercentage || '-'} %</p>
                    <p><strong>Cintura:</strong> {lastAssessment.waist || '-'} cm</p>
                    <p><strong>Quadril:</strong> {lastAssessment.hips || '-'} cm</p>
                </div>
            ) : (
                <p className="text-muted-foreground">Peça ao seu treinador para registrar uma avaliação.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    