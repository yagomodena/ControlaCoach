
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineChart, Activity, Loader2, Dumbbell } from 'lucide-react';
import { auth, db } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Student, WorkoutLog } from '@/types';
import { format, parseISO } from 'date-fns';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { CartesianGrid, XAxis, YAxis, Legend, Line, ComposedChart, ResponsiveContainer } from 'recharts';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

export default function StudentEvolutionPage() {
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
            setError("Seus dados de aluno não foram encontrados.");
          }
        } catch (err) {
          console.error(err);
          setError("Ocorreu um erro ao buscar seus dados de evolução.");
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
    try { return format(parseISO(dateString), 'dd/MM/yy'); } catch (e) { return 'Data inválida'; }
  };

  const sortedAssessments = student?.physicalAssessments?.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) || [];
  
  const chartData = sortedAssessments.map(a => ({
    date: formatDateString(a.date),
    Peso: a.weight,
    'Gordura Corporal (%)': a.bodyFatPercentage,
  }));
  
  const sortedWorkoutLogs = student?.workoutLogs?.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()) || [];


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-lg text-muted-foreground">Carregando sua evolução...</p>
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
  
  if (!student) {
     return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center"><Activity className="mr-2 h-5 w-5 text-primary"/>Sua Evolução Física</CardTitle>
                <CardDescription>Acompanhe seu progresso ao longo do tempo.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-center py-10">Não foi possível carregar seus dados.</p>
            </CardContent>
        </Card>
     )
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold text-foreground">Minha Evolução</h1>
        <p className="text-muted-foreground">Acompanhe seu progresso, suas medidas e o histórico de cargas.</p>
      </div>

       <Card className="shadow-lg">
          <CardHeader>
              <CardTitle className="flex items-center"><LineChart className="mr-2 h-5 w-5 text-primary"/>Gráfico de Progresso</CardTitle>
              <CardDescription>Visualização da evolução do seu peso e percentual de gordura.</CardDescription>
          </CardHeader>
          <CardContent>
              {chartData.length > 1 ? (
                <ChartContainer config={{}} className="min-h-[250px] w-full">
                  <ResponsiveContainer>
                      <ComposedChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{fontSize: 12}} />
                      <YAxis yAxisId="left" label={{ value: 'Peso (kg)', angle: -90, position: 'insideLeft' }} tick={{fontSize: 12}}/>
                      <YAxis yAxisId="right" orientation="right" label={{ value: 'Gordura (%)', angle: -90, position: 'insideRight' }} tick={{fontSize: 12}}/>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="Peso" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{r: 4}} activeDot={{r: 6}} />
                      <Line yAxisId="right" type="monotone" dataKey="Gordura Corporal (%)" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{r: 4}} activeDot={{r: 6}}/>
                    </ComposedChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                  <p className="text-center text-sm text-muted-foreground py-8">
                      É necessário ter pelo menos duas avaliações para exibir o gráfico de progresso.
                  </p>
              )}
          </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><Activity className="mr-2 h-5 w-5 text-primary"/>Histórico de Avaliações Físicas</CardTitle>
          <CardDescription>Todas as suas medidas registradas pelo seu treinador.</CardDescription>
        </CardHeader>
        <CardContent>
         {sortedAssessments.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Peso</TableHead>
                  <TableHead>Gordura</TableHead>
                  <TableHead>Cintura</TableHead>
                  <TableHead>Quadril</TableHead>
                  <TableHead>Peito</TableHead>
                  <TableHead>Braço D.</TableHead>
                  <TableHead>Coxa D.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAssessments.slice().reverse().map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{format(parseISO(item.date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{item.weight?.toFixed(1) || '-'} kg</TableCell>
                    <TableCell>{item.bodyFatPercentage?.toFixed(1) || '-'} %</TableCell>
                    <TableCell>{item.waist?.toFixed(1) || '-'} cm</TableCell>
                    <TableCell>{item.hips?.toFixed(1) || '-'} cm</TableCell>
                    <TableCell>{item.chest?.toFixed(1) || '-'} cm</TableCell>
                    <TableCell>{item.rightArm?.toFixed(1) || '-'} cm</TableCell>
                    <TableCell>{item.rightThigh?.toFixed(1) || '-'} cm</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
         ) : (
             <p className="text-muted-foreground text-center py-10">Nenhuma avaliação física encontrada.</p>
         )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><Dumbbell className="mr-2 h-5 w-5 text-primary"/>Histórico de Cargas</CardTitle>
          <CardDescription>Seus últimos pesos registrados nos treinos.</CardDescription>
        </CardHeader>
        <CardContent>
         {sortedWorkoutLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Exercício</TableHead>
                  <TableHead className="text-right">Peso Utilizado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedWorkoutLogs.map((log) => (
                  <TableRow key={log.logId}>
                    <TableCell className="font-medium">{format(parseISO(log.date), 'dd/MM/yyyy HH:mm')}</TableCell>
                    <TableCell>{log.exerciseName}</TableCell>
                    <TableCell className="text-right"><Badge variant="secondary">{log.weightUsed} kg</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
         ) : (
            <p className="text-muted-foreground text-center py-10">Nenhum peso registrado ainda. Comece a registrar na tela "Meu Treino"!</p>
         )}
        </CardContent>
      </Card>

    </div>
  );
}
