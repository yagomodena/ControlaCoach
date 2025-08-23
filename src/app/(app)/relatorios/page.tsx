
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Users, CalendarCheck2, DollarSign, Loader2, Printer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, Bar, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { db, auth } from '@/firebase';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import type { Student, Plan, BookedClass } from '@/types';
import { format, parseISO, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval, isWithinInterval, addDays, isBefore, isEqual, startOfDay, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface MonthlyDataPoint {
  month: string; // e.g., "Jan/24"
  count?: number;
  revenue?: number;
}

const CHART_MONTH_RANGE = 12; // Display data for the last 12 months

const chartConfigBase = {
  count: { label: "Contagem", color: "hsl(var(--chart-1))" },
  revenue: { label: "Receita (R$)", color: "hsl(var(--chart-2))" },
};

export default function RelatoriosPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [bookedClasses, setBookedClasses] = useState<BookedClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const [newStudentsData, setNewStudentsData] = useState<MonthlyDataPoint[]>([]);
  const [bookedClassesData, setBookedClassesData] = useState<MonthlyDataPoint[]>([]);
  const [monthlyRevenueData, setMonthlyRevenueData] = useState<MonthlyDataPoint[]>([]);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        setIsLoading(false);
        toast({ title: "Autenticação Necessária", variant: "destructive" });
        router.push('/login');
      }
    });
    return () => unsubscribeAuth();
  }, [router, toast]);

  useEffect(() => {
    if (!userId) {
      setStudents([]);
      setPlans([]);
      setBookedClasses([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const studentQuery = query(collection(db, 'coaches', userId, 'students'), orderBy('registrationDate', 'desc'));
    const planQuery = query(collection(db, 'coaches', userId, 'plans'));
    const bookedClassesQuery = query(collection(db, 'coaches', userId, 'bookedClasses'), orderBy('date', 'desc'));

    const unsubStudents = onSnapshot(studentQuery, (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Student)));
    }, (error) => console.error("Error fetching students:", error));

    const unsubPlans = onSnapshot(planQuery, (snapshot) => {
      setPlans(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Plan)));
    }, (error) => console.error("Error fetching plans:", error));

    const unsubBookedClasses = onSnapshot(bookedClassesQuery, (snapshot) => {
      setBookedClasses(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as BookedClass)));
      setIsLoading(false); // Set loading false after the last essential fetch
    }, (error) => {
      console.error("Error fetching booked classes:", error);
      setIsLoading(false);
    });

    return () => {
      unsubStudents();
      unsubPlans();
      unsubBookedClasses();
    };
  }, [userId]);

  useEffect(() => {
    if (isLoading || !students.length) return;

    const today = new Date();
    const last12MonthsInterval = {
      start: subMonths(startOfMonth(today), CHART_MONTH_RANGE -1),
      end: endOfMonth(today),
    };
    const monthLabels = eachMonthOfInterval(last12MonthsInterval).map(m => format(m, 'MMM/yy', { locale: ptBR }));

    // Process New Students Data
    const studentCounts = students.reduce((acc, student) => {
      if (student.registrationDate) {
        try {
          const regDate = parseISO(student.registrationDate);
           if (isWithinInterval(regDate, last12MonthsInterval)) {
            const monthYear = format(regDate, 'MMM/yy', { locale: ptBR });
            acc[monthYear] = (acc[monthYear] || 0) + 1;
          }
        } catch (e) { console.error("Error parsing student registrationDate", student.registrationDate, e); }
      }
      return acc;
    }, {} as Record<string, number>);
    setNewStudentsData(monthLabels.map(month => ({ month, count: studentCounts[month] || 0 })));


    // Process Booked Classes Data
    const classCounts = bookedClasses.reduce((acc, bClass) => {
      if (bClass.date) {
        try {
          const classDate = parseISO(bClass.date);
          if (isWithinInterval(classDate, last12MonthsInterval)) {
            const monthYear = format(classDate, 'MMM/yy', { locale: ptBR });
            acc[monthYear] = (acc[monthYear] || 0) + 1;
          }
        } catch (e) { console.error("Error parsing bookedClass date", bClass.date, e); }
      }
      return acc;
    }, {} as Record<string, number>);
    setBookedClassesData(monthLabels.map(month => ({ month, count: classCounts[month] || 0 })));
    
    // Process Monthly Revenue Data
    if (plans.length > 0) {
        const revenueByMonth: Record<string, number> = {};
        const allActiveStudents = students.filter(s => s.status === 'active');

        eachMonthOfInterval(last12MonthsInterval).forEach(currentReportMonthDate => {
            const reportMonthStart = startOfMonth(currentReportMonthDate);
            const reportMonthEnd = endOfMonth(currentReportMonthDate);
            const reportMonthKey = format(reportMonthStart, 'MMM/yy', { locale: ptBR });
            revenueByMonth[reportMonthKey] = 0;

            allActiveStudents.forEach(student => {
                const planDetails = plans.find(p => p.name === student.plan);
                if (!planDetails || !planDetails.durationDays || planDetails.durationDays <= 0 || !student.registrationDate) return;

                let cycleStartDate = startOfDay(parseISO(student.registrationDate));
                if (!planDetails.chargeOnEnrollment) {
                    cycleStartDate = addDays(cycleStartDate, planDetails.durationDays);
                }
                
                while(isBefore(cycleStartDate, reportMonthEnd)) {
                    if (isAfter(cycleStartDate, addDays(reportMonthEnd, planDetails.durationDays * 2))) break; // Optimization

                    const cycleEndDate = addDays(cycleStartDate, planDetails.durationDays -1); // Inclusive end

                    if (isWithinInterval(cycleStartDate, { start: reportMonthStart, end: reportMonthEnd })) {
                         // Check if this cycle was paid
                        let isCyclePaid = false;
                        if (student.lastPaymentDate) {
                            const lastPaidDate = startOfDay(parseISO(student.lastPaymentDate));
                            // A payment covers a cycle if lastPaidDate is ON or AFTER cycleStartDate AND BEFORE cycleEndDate + 1 day (or start of next cycle)
                            if ((isEqual(lastPaidDate, cycleStartDate) || isAfter(lastPaidDate, cycleStartDate)) && 
                                isBefore(lastPaidDate, addDays(cycleStartDate, planDetails.durationDays))) {
                                isCyclePaid = true;
                            }
                        }
                         // More robust check: If overall student due date matches this cycle's start, and student status is paid.
                        if (!isCyclePaid && student.paymentStatus === 'pago' && student.dueDate) {
                            if (isEqual(startOfDay(parseISO(student.dueDate)), addDays(cycleStartDate, planDetails.durationDays))) {
                                isCyclePaid = true;
                            }
                        }

                        if (isCyclePaid) {
                            revenueByMonth[reportMonthKey] = (revenueByMonth[reportMonthKey] || 0) + planDetails.price;
                        }
                    }
                    cycleStartDate = addDays(cycleStartDate, planDetails.durationDays);
                }
            });
        });
        setMonthlyRevenueData(monthLabels.map(month => ({ month, revenue: revenueByMonth[month] || 0 })));
    }


  }, [students, plans, bookedClasses, isLoading, userId]);

  if (isLoading || !userId) {
    return (
      <div className="container mx-auto py-8 flex flex-col items-center justify-center min-h-[calc(100vh-150px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Carregando relatórios...</p>
      </div>
    );
  }
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 bg-background/90 border border-border rounded-md shadow-lg">
          <p className="label text-sm font-medium">{`${label}`}</p>
          {payload.map((pld: any, index: number) => (
            <p key={index} style={{ color: pld.fill }} className="text-xs">
              {`${pld.name}: ${pld.value.toLocaleString(undefined, pld.dataKey === 'revenue' ? { style: 'currency', currency: 'BRL' } : {})}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const handlePrint = () => {
    window.print();
  };


  return (
    <>
      <div className="container mx-auto py-8 print:py-4">
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
          <div>
            <h1 className="text-3xl font-headline font-bold text-foreground">Relatórios</h1>
            <p className="text-muted-foreground">Insights sobre o desempenho do seu negócio.</p>
          </div>
          <Button onClick={handlePrint} variant="outline">
              <Printer className="mr-2 h-4 w-4" />
              Imprimir Relatórios
          </Button>
        </div>

        <div id="report-content-area" className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 print:grid-cols-2 print:gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-xl"><Users className="mr-2 h-5 w-5 text-primary" />Novos Alunos por Mês</CardTitle>
              <CardDescription>Últimos {CHART_MONTH_RANGE} meses</CardDescription>
            </CardHeader>
            <CardContent>
              {newStudentsData.length > 0 ? (
              <ChartContainer config={chartConfigBase} className="min-h-[250px] w-full">
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsBarChart data={newStudentsData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={10} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={10} width={30}/>
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', radius: 4 }}/>
                    <Legend content={<ChartLegendContent />} />
                    <Bar dataKey="count" name="Novos Alunos" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </ChartContainer>
              ) : <p className="text-muted-foreground text-sm text-center py-10">Nenhum dado de novos alunos para exibir.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-xl"><CalendarCheck2 className="mr-2 h-5 w-5 text-primary" />Aulas Realizadas por Mês</CardTitle>
              <CardDescription>Últimos {CHART_MONTH_RANGE} meses</CardDescription>
            </CardHeader>
            <CardContent>
              {bookedClassesData.length > 0 ? (
              <ChartContainer config={chartConfigBase} className="min-h-[250px] w-full">
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsBarChart data={bookedClassesData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={10} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={10} width={30}/>
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', radius: 4 }}/>
                    <Legend content={<ChartLegendContent />} />
                    <Bar dataKey="count" name="Aulas Realizadas" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </ChartContainer>
              ) : <p className="text-muted-foreground text-sm text-center py-10">Nenhum dado de aulas realizadas para exibir.</p>}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 xl:col-span-1 print:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center text-xl"><DollarSign className="mr-2 h-5 w-5 text-primary" />Receita Mensal Estimada</CardTitle>
              <CardDescription>Estimativa de receita nos últimos {CHART_MONTH_RANGE} meses (baseado em pagamentos confirmados)</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyRevenueData.length > 0 ? (
              <ChartContainer config={chartConfigBase} className="min-h-[250px] w-full">
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsBarChart data={monthlyRevenueData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={10} />
                    <YAxis 
                      tickLine={false} 
                      axisLine={false} 
                      fontSize={10} 
                      width={50}
                      tickFormatter={(value) => `R$${value.toLocaleString('pt-BR')}`}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', radius: 4 }}/>
                    <Legend content={<ChartLegendContent />} />
                    <Bar dataKey="revenue" name="Receita (R$)" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </ChartContainer>
              ) : <p className="text-muted-foreground text-sm text-center py-10">Nenhum dado de receita para exibir.</p>}
            </CardContent>
          </Card>
        </div>
      </div>
      {/* A more robust way to handle print styles */}
      <style>{`
        @media print {
          body, html {
            background-color: white !important;
            -webkit-print-color-adjust: exact;
          }
          main {
             padding: 0 !important;
             margin: 0 !important;
             overflow: visible !important;
          }
          .container {
             padding: 0 !important;
             margin: 0 !important;
             max-width: 100% !important;
             width: 100% !important;
          }
          .recharts-wrapper {
            width: 100% !important;
            height: 250px !important;
          }
          .recharts-surface {
            width: 100% !important;
            height: 250px !important;
          }
        }
      `}</style>
    </>
  );
}
