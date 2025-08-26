
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dumbbell, Loader2 } from 'lucide-react';
import { auth, db } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Student, DayOfWeek, Exercise } from '@/types';
import { DAYS_OF_WEEK } from '@/types';
import { format, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';

const sortDays = (days: DayOfWeek[] = []) => {
    return days.sort((a, b) => DAYS_OF_WEEK.indexOf(a) - DAYS_OF_WEEK.indexOf(b));
}

export default function StudentWorkoutPage() {
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
                    setStudent({ ...studentDocSnap.data(), id: studentDocSnap.id } as Student);
                } else {
                    setError("Dados do aluno não encontrados.");
                }
            } catch (err) {
                console.error(err);
                setError("Ocorreu um erro ao buscar sua ficha de treino.");
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

  const formatDateString = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try { return format(parseISO(dateString), 'dd/MM/yyyy'); } catch (e) { return 'Data inválida'; }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-lg text-muted-foreground">Carregando seu treino...</p>
      </div>
    );
  }
  
  if (error) {
     return (
        <Card className="shadow-lg">
            <CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader>
            <CardContent><p className="text-destructive">{error}</p></CardContent>
        </Card>
     )
  }
  
  const trainingSheet = student?.trainingSheet;
  const workoutDays = trainingSheet?.workouts ? sortDays(Object.keys(trainingSheet.workouts) as DayOfWeek[]) : [];

  return (
    <div className="container mx-auto py-8">
       <div>
        <h1 className="text-3xl font-headline font-bold text-foreground">Meu Treino</h1>
        <p className="text-muted-foreground">Aqui está seu plano de treino atualizado.</p>
      </div>
      
      <Card className="shadow-lg mt-8">
        <CardHeader>
          <CardTitle className="flex items-center"><Dumbbell className="mr-2 h-5 w-5 text-primary"/>Plano de Treino Semanal</CardTitle>
          <CardDescription>
            {trainingSheet?.lastUpdated 
              ? `Sua ficha foi atualizada pela última vez em: ${formatDateString(trainingSheet.lastUpdated)}`
              : 'Nenhuma ficha de treino cadastrada.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            {workoutDays.length > 0 ? (
                workoutDays.map(day => {
                    const exercises = trainingSheet!.workouts[day];
                    if (!exercises || exercises.length === 0) return null;
                    return (
                        <div key={day}>
                            <h3 className="font-semibold text-xl text-foreground mb-2 border-b pb-1 border-primary/20">Treino de {day}</h3>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Exercício</TableHead>
                                            <TableHead>Séries</TableHead>
                                            <TableHead>Reps</TableHead>
                                            <TableHead>Descanso</TableHead>
                                            <TableHead>Observações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {exercises.map(ex => (
                                            <TableRow key={ex.id}>
                                                <TableCell className="font-medium">{ex.name}</TableCell>
                                                <TableCell>{ex.sets}</TableCell>
                                                <TableCell>{ex.reps}</TableCell>
                                                <TableCell>{ex.rest}</TableCell>
                                                <TableCell>{ex.notes || '-'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )
                })
            ) : (
                <p className="text-muted-foreground text-center py-10">Nenhuma ficha de treino encontrada. Peça para seu treinador cadastrar uma!</p>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
