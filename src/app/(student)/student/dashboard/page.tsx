
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, CalendarCheck2, Dumbbell, Activity, Loader2, AlertTriangle } from "lucide-react";
import { auth, db } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Student } from '@/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

export default function StudentDashboardPage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const studentId = sessionStorage.getItem('fitplanner_student_id');

    if (studentId) {
      const fetchStudentData = async () => {
        try {
          const studentDocRef = doc(db, 'students', studentId);
          const studentDocSnap = await getDoc(studentDocRef);

          if (studentDocSnap.exists()) {
            const studentData = { ...studentDocSnap.data(), id: studentDocSnap.id } as Student;
            if (studentData.status === 'inactive') {
              setError("Sua conta está inativa. Por favor, entre em contato com seu treinador para reativá-la.");
            } else {
              setStudent(studentData);
            }
          } else {
            setError("Seus dados de aluno não foram encontrados. Por favor, entre em contato com seu treinador.");
          }
        } catch (err) {
          console.error(err);
          setError("Ocorreu um erro ao buscar seus dados.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchStudentData();
    } else {
      setIsLoading(false);
      setError("Sessão de aluno inválida. Por favor, faça login novamente.");
      setTimeout(() => router.push('/login/aluno'), 2000);
    }
  }, [router]);

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
        <Card className="shadow-lg max-w-lg mx-auto mt-10">
            <CardHeader className="text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
                <CardTitle className="text-destructive text-2xl">Acesso Negado</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-center text-muted-foreground">{error}</p>
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
            <p className="text-2xl font-bold">{student.recurringClassTime ? `${student.recurringClassDays?.[0] || 'Próximo dia'}, ${student.recurringClassTime}` : "A ser definida"}</p>
            <p className="text-sm text-muted-foreground">{student.recurringClassLocation || 'Local a definir'}</p>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center text-lg"><Dumbbell className="mr-2 text-primary" /> Treino de Hoje</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-2xl font-bold">Consulte sua ficha</p>
             <p className="text-sm text-muted-foreground">Verifique a aba "Meu Treino" para detalhes.</p>
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
