
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dumbbell, Loader2, Save } from 'lucide-react';
import { auth, db } from '@/firebase';
import { doc, getDoc, updateDoc, arrayUnion, setDoc } from 'firebase/firestore';
import type { Student, DayOfWeek, Exercise, WorkoutLog } from '@/types';
import { DAYS_OF_WEEK } from '@/types';
import { format, formatISO, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { Label } from '@/components/ui/label';

const sortDays = (days: DayOfWeek[] = []) => {
    return days.sort((a, b) => DAYS_OF_WEEK.indexOf(a) - DAYS_OF_WEEK.indexOf(b));
}

export default function StudentWorkoutPage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weightInputs, setWeightInputs] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
  const router = useRouter();
  const { toast } = useToast();

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

  const handleWeightChange = (exerciseId: string, value: string) => {
    setWeightInputs(prev => ({ ...prev, [exerciseId]: value }));
  };

  const handleSaveWeight = async (exercise: Exercise) => {
    const studentId = student?.id;
    if (!studentId) {
      toast({ title: "Erro", description: "Aluno não encontrado.", variant: "destructive" });
      return;
    }
    
    const weightValue = weightInputs[exercise.id];
    if (!weightValue || isNaN(parseFloat(weightValue)) || parseFloat(weightValue) <= 0) {
      toast({ title: "Valor Inválido", description: "Por favor, insira um valor de peso válido.", variant: "destructive" });
      return;
    }
    
    setIsSaving(prev => ({...prev, [exercise.id]: true}));

    const newLog: WorkoutLog = {
      logId: uuidv4(),
      date: formatISO(new Date()),
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      weightUsed: parseFloat(weightValue),
    };

    try {
      const studentDocRef = doc(db, 'students', studentId);
      // Using setDoc with merge to safely update or create the workoutLogs array.
      await setDoc(studentDocRef, {
        workoutLogs: arrayUnion(newLog)
      }, { merge: true });

      toast({
        title: "Progresso Salvo!",
        description: `Peso de ${newLog.weightUsed}kg salvo para ${exercise.name}.`,
      });
      // Clear input after saving
      handleWeightChange(exercise.id, '');
    } catch (error) {
       console.error("Error saving workout log:", error);
       toast({ title: "Erro ao Salvar", description: "Não foi possível salvar seu progresso.", variant: "destructive" });
    } finally {
      setIsSaving(prev => ({...prev, [exercise.id]: false}));
    }
  };

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
        <p className="text-muted-foreground">Aqui está seu plano de treino. Registre suas cargas para acompanhar a evolução!</p>
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
                            <h3 className="font-semibold text-xl text-foreground mb-3 border-b pb-2 border-primary/20">Treino de {day}</h3>
                            
                            {/* Desktop Table View */}
                            <div className="overflow-x-auto hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Exercício</TableHead>
                                            <TableHead>Séries</TableHead>
                                            <TableHead>Reps</TableHead>
                                            <TableHead>Descanso</TableHead>
                                            <TableHead>Obs</TableHead>
                                            <TableHead className="w-[120px]">Peso (kg)</TableHead>
                                            <TableHead className="w-[100px]">Ação</TableHead>
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
                                                <TableCell>
                                                    <Input
                                                      type="number"
                                                      placeholder="Ex: 50"
                                                      className="h-9"
                                                      value={weightInputs[ex.id] || ''}
                                                      onChange={(e) => handleWeightChange(ex.id, e.target.value)}
                                                      disabled={isSaving[ex.id]}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                   <Button 
                                                     size="sm" 
                                                     onClick={() => handleSaveWeight(ex)}
                                                     disabled={!weightInputs[ex.id] || isSaving[ex.id]}
                                                   >
                                                     {isSaving[ex.id] ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4"/>}
                                                     <span className="ml-2 hidden sm:inline">{isSaving[ex.id] ? '...' : 'Salvar'}</span>
                                                   </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="space-y-4 md:hidden">
                                {exercises.map(ex => (
                                    <Card key={`mobile-${ex.id}`} className="bg-muted/50">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base">{ex.name}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-sm">
                                                <div><Label className="text-xs text-muted-foreground">Séries</Label><p>{ex.sets}</p></div>
                                                <div><Label className="text-xs text-muted-foreground">Reps</Label><p>{ex.reps}</p></div>
                                                <div><Label className="text-xs text-muted-foreground">Descanso</Label><p>{ex.rest}</p></div>
                                                {ex.notes && <div className="col-span-3"><Label className="text-xs text-muted-foreground">Obs</Label><p>{ex.notes}</p></div>}
                                            </div>
                                            <div className="flex items-end gap-2 pt-2 border-t">
                                                <div className="flex-1 space-y-1">
                                                     <Label htmlFor={`weight-${ex.id}`} className="text-xs">Peso (kg)</Label>
                                                     <Input
                                                      id={`weight-${ex.id}`}
                                                      type="number"
                                                      placeholder="Ex: 50"
                                                      className="h-9 bg-background"
                                                      value={weightInputs[ex.id] || ''}
                                                      onChange={(e) => handleWeightChange(ex.id, e.target.value)}
                                                      disabled={isSaving[ex.id]}
                                                    />
                                                </div>
                                                <Button 
                                                   size="sm" 
                                                   className="h-9"
                                                   onClick={() => handleSaveWeight(ex)}
                                                   disabled={!weightInputs[ex.id] || isSaving[ex.id]}
                                                >
                                                   {isSaving[ex.id] ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4"/>}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
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
