
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineChart, Activity, Loader2 } from 'lucide-react';
import { auth, db } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Student, PhysicalAssessment } from '@/types';
import { format, parseISO } from 'date-fns';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { CartesianGrid, XAxis, YAxis, Legend, Line, ComposedChart, ResponsiveContainer } from 'recharts';

export default function StudentEvolutionPage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudentData = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setIsLoading(false);
        setError("Usuário não autenticado.");
        return;
      }
      try {
        // This is a simplified query. A real implementation needs to find the student
        // across all coach subcollections, or have a global students collection.
        // For now, we'll assume a direct lookup is possible.
        const studentDocRef = doc(db, 'students', currentUser.uid); // Placeholder path
        const docSnap = await getDoc(studentDocRef);

        if (docSnap.exists()) {
          setStudent({ ...docSnap.data(), id: docSnap.id } as Student);
        } else {
          setError("Dados do aluno não encontrados.");
        }
      } catch (err) {
        console.error(err);
        setError("Ocorreu um erro ao buscar seus dados de evolução.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentData();
  }, []);
  
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
  
  if (!student || !sortedAssessments.length) {
     return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center"><Activity className="mr-2 h-5 w-5 text-primary"/>Sua Evolução Física</CardTitle>
                <CardDescription>Acompanhe seu progresso ao longo do tempo.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-center py-10">Nenhuma avaliação física encontrada. Peça para seu treinador registrar uma!</p>
            </CardContent>
        </Card>
     )
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold text-foreground">Minha Evolução</h1>
        <p className="text-muted-foreground">Acompanhe seu progresso e suas medidas.</p>
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
          <CardTitle className="flex items-center"><Activity className="mr-2 h-5 w-5 text-primary"/>Histórico de Avaliações</CardTitle>
          <CardDescription>Todas as suas medidas registradas pelo seu treinador.</CardDescription>
        </CardHeader>
        <CardContent>
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
                {sortedAssessments.map((item, index) => (
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
                )).reverse()}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    
