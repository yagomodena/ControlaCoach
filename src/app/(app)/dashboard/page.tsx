
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, CalendarDays, DollarSign, BarChart3, BookOpenCheck, Loader2 } from "lucide-react";
import { db } from '@/firebase';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import type { Student, Plan, BookedClass } from '@/types';
import { INITIAL_MOCK_BOOKED_CLASSES } from '@/types'; // Using this for booked class stats for now
import { 
  format, 
  parseISO, 
  isSameDay, 
  addDays, 
  isBefore, 
  startOfToday,
  isAfter,
  isEqual,
  addMonths,
  setDate,
  getDay,
  startOfDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardStats {
  totalAlunos: number;
  aulasHoje: number;
  pagamentosPendentes: number;
  receitaEstimada: number;
}

export default function DashboardPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  // For booked classes, we'll use the mock data as per current app structure.
  // In a real scenario, these would be fetched from Firestore if the Agenda page saved them there.
  const [bookedClasses] = useState<BookedClass[]>(INITIAL_MOCK_BOOKED_CLASSES); 
  const [isLoading, setIsLoading] = useState(true);

  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalAlunos: 0,
    aulasHoje: 0,
    pagamentosPendentes: 0,
    receitaEstimada: 0,
  });
  const [proximasAulas, setProximasAulas] = useState<BookedClass[]>([]);

  useEffect(() => {
    setIsLoading(true);
    const studentQuery = query(collection(db, 'students'), where('status', '==', 'active'), orderBy('name'));
    const planQuery = query(collection(db, 'plans'), orderBy('name'));

    const unsubStudents = onSnapshot(studentQuery, (snapshot) => {
      const activeStudentsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Student));
      setStudents(activeStudentsData);
    }, (error) => {
      console.error("Error fetching students:", error);
    });

    const unsubPlans = onSnapshot(planQuery, (snapshot) => {
      const plansData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Plan));
      setPlans(plansData);
    }, (error) => {
      console.error("Error fetching plans:", error);
    });
    
    // Simulate loading completion; in a real app with booked classes from Firestore, this would depend on that fetch too.
    const timer = setTimeout(() => setIsLoading(false), 1200);


    return () => {
      unsubStudents();
      unsubPlans();
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!students.length && !plans.length && !isLoading) return; // Avoid calculation if initial load isn't complete or no data

    // Calculate Total Alunos Ativos
    const totalAlunosAtivos = students.filter(s => s.status === 'active').length;

    // Calculate Aulas Agendadas Hoje (using mock data)
    const today = startOfToday();
    const aulasHojeCount = bookedClasses.filter(c => {
        try {
            return isSameDay(parseISO(c.date), today);
        } catch (e) { return false; }
    }).length;

    // Calculate Pagamentos Pendentes
    let pendentesCount = 0;
    if (students.length > 0 && plans.length > 0) {
        students.filter(s => s.status === 'active').forEach(student => {
            const planDetails = plans.find(p => p.name === student.plan);
            if (!planDetails) return;

            let effectiveStatus = student.paymentStatus;
            let currentDueDate: Date | null = student.dueDate ? startOfDay(parseISO(student.dueDate)) : null;

            if (student.paymentStatus === 'pago' && student.lastPaymentDate) {
                const lastPaymentDate = startOfDay(parseISO(student.lastPaymentDate));
                const cycleEndDate = addDays(lastPaymentDate, planDetails.durationDays);
                
                if (isBefore(cycleEndDate, today)) { // Paid period ended
                    effectiveStatus = 'vencido';
                    currentDueDate = cycleEndDate; // The due date for the cycle that just ended
                } else {
                    // Still within paid period, not pending/overdue FOR THE CURRENT CYCLE
                    // The student.dueDate should ideally point to the *next* cycle's due date
                    // if this logic is to be perfect.
                    // For simplicity here, if they are 'pago' and period not ended, they are not counted as pending.
                    effectiveStatus = 'pago'; 
                }
            } else if (currentDueDate && (student.paymentStatus === 'pendente' || student.paymentStatus === 'vencido')) {
                 if (isBefore(currentDueDate, today)) {
                    effectiveStatus = 'vencido';
                 } else {
                    effectiveStatus = 'pendente';
                 }
            } else if (!student.paymentStatus && currentDueDate) { // Default new student to pending if due date exists
                 if (isBefore(currentDueDate, today)) {
                    effectiveStatus = 'vencido';
                 } else {
                    effectiveStatus = 'pendente';
                 }
            }


            if (effectiveStatus === 'pendente' || effectiveStatus === 'vencido') {
                pendentesCount++;
            }
        });
    }
    
    // Calculate Receita Mensal Estimada
    const receitaEstimadaTotal = students
      .filter(s => s.status === 'active')
      .reduce((sum, student) => {
        const planDetails = plans.find(p => p.name === student.plan);
        return sum + (planDetails?.price || 0);
      }, 0);

    setDashboardStats({
      totalAlunos: totalAlunosAtivos,
      aulasHoje: aulasHojeCount,
      pagamentosPendentes: pendentesCount,
      receitaEstimada: receitaEstimadaTotal,
    });

    // Calculate Próximas Aulas (using mock data)
    const tomorrow = addDays(today, 1);
    const upcoming = bookedClasses
      .filter(c => {
        try {
            const classDate = parseISO(c.date);
            return isSameDay(classDate, today) || isSameDay(classDate, tomorrow);
        } catch(e) { return false;}
      })
      .sort((a, b) => {
        const dateA = parseISO(a.date).getTime();
        const dateB = parseISO(b.date).getTime();
        if (dateA !== dateB) return dateA - dateB;
        return a.time.localeCompare(b.time);
      })
      .slice(0, 3);
    setProximasAulas(upcoming);

  }, [students, plans, bookedClasses, isLoading]);

  const statCards = [
    { title: "Total de Alunos Ativos", value: dashboardStats.totalAlunos.toString(), icon: Users, color: "text-primary", bgColor: "bg-primary/10" },
    { title: "Aulas Agendadas Hoje", value: dashboardStats.aulasHoje.toString(), icon: CalendarDays, color: "text-green-500", bgColor: "bg-green-500/10" },
    { title: "Pagamentos Pendentes", value: dashboardStats.pagamentosPendentes.toString(), icon: DollarSign, color: "text-amber-500", bgColor: "bg-amber-500/10" },
    { title: "Receita Mensal (Estimada)", value: `R$ ${dashboardStats.receitaEstimada.toFixed(2)}`, icon: BarChart3, color: "text-indigo-500", bgColor: "bg-indigo-500/10" },
  ];

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex flex-col items-center justify-center min-h-[calc(100vh-150px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Carregando dados do painel...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-headline font-bold mb-8 text-foreground">Painel de Controle</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((stat) => (
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
                  <p className="text-xs text-muted-foreground">Visualizar e agendar aulas</p>
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
                <BookOpenCheck className="mr-3 h-5 w-5 text-primary" /> 
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
            {proximasAulas.length > 0 ? (
              <div className="space-y-3">
                {proximasAulas.map((aula) => (
                  <div key={aula.id} className="p-3 bg-muted/50 rounded-md">
                    <p className="font-semibold">{aula.title} - {aula.location}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(aula.date), "dd/MM 'às' HH:mm", { locale: ptBR })} 
                      {' '} ({aula.studentIds.length} aluno(s))
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">Nenhuma aula programada para hoje ou amanhã.</p>
            )}
            <Button asChild variant="link" className="mt-4 px-0 text-primary">
              <Link href="/agenda">Ver agenda completa &rarr;</Link>
            </Button>
             <p className="text-xs text-muted-foreground mt-2">* A lista de próximas aulas é baseada em dados de exemplo.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    