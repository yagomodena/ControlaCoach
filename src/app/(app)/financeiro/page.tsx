
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { DollarSign, Search, Filter, FileText, Users, AlertTriangle, CheckCircle, Clock, Printer, ChevronLeft, ChevronRight, Loader2, PlusCircle, MinusCircle, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Student, Payment, Plan, Expense } from '@/types';
import { 
  format, 
  parseISO, 
  startOfMonth, 
  endOfMonth, 
  isWithinInterval, 
  getMonth, 
  getYear, 
  addMonths, 
  subMonths, 
  setDate, 
  addDays, 
  subDays,
  isBefore,
  isAfter,
  isEqual,
  startOfDay,
  formatISO as dateFnsFormatISO 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { db, auth } from '@/firebase';
import { collection, onSnapshot, query, where, orderBy, doc, updateDoc, getDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { AddExpenseDialog } from '@/components/dialogs/add-expense-dialog';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


interface PaymentEntry extends Payment {
  studentName: string;
  studentPhone?: string;
  studentPlanName?: string;
}

interface MonthlyReportData {
  monthYear: string;
  totalReceived: number;
  totalPending: number;
  totalOverdue: number;
  totalExpenses: number;
  paidInMonth: PaymentEntry[];
  outstandingInMonth: PaymentEntry[];
  expensesInMonth: Expense[];
}

export default function FinanceiroPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilters, setStatusFilters] = useState<Set<Payment['status']>>(
    new Set(['pago', 'pendente', 'vencido']) 
  );
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [clientRendered, setClientRendered] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportData, setReportData] = useState<MonthlyReportData | null>(null);
  const [selectedMonthDate, setSelectedMonthDate] = useState(new Date());
  const [isAddExpenseDialogOpen, setIsAddExpenseDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  useEffect(() => {
    setClientRendered(true);
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        toast({ title: "Autenticação Necessária", variant: "destructive" });
        router.push('/login');
      }
    });
    return () => unsubscribeAuth();
  }, [router, toast]);


  const fetchExpenses = (currentUserId: string, date: Date) => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const expensesQuery = query(
        collection(db, 'coaches', currentUserId, 'expenses'), 
        where('date', '>=', dateFnsFormatISO(monthStart, { representation: 'date' })),
        where('date', '<=', dateFnsFormatISO(monthEnd, { representation: 'date' })),
        orderBy('date', 'desc')
    );
    return onSnapshot(expensesQuery, (snapshot) => {
        setExpenses(snapshot.docs.map(doc => ({...doc.data(), id: doc.id} as Expense)));
    }, (error) => {
        console.error("Error fetching expenses:", error);
        toast({ title: "Erro ao Carregar Saídas", variant: "destructive"});
    });
  }

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      setPayments([]);
      setExpenses([]);
      setAllPlans([]);
      setAllStudents([]);
      return;
    }
    
    setIsLoading(true);

    const plansQuery = query(collection(db, 'coaches', userId, 'plans'), orderBy('name'));
    const studentsQuery = query(collection(db, 'coaches', userId, 'students'), orderBy('name'));

    const unsubPlans = onSnapshot(plansQuery, snapshot => {
      setAllPlans(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Plan)));
    }, error => {
      console.error("Error fetching plans: ", error);
      toast({ title: "Erro ao Carregar Planos", variant: "destructive" });
    });

    const unsubStudents = onSnapshot(studentsQuery, snapshot => {
      setAllStudents(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Student)));
    }, error => {
      console.error("Error fetching students: ", error);
      toast({ title: "Erro ao Carregar Alunos", variant: "destructive" });
    });

    return () => {
      unsubPlans();
      unsubStudents();
    };

  }, [userId, toast]);


  useEffect(() => {
      if (!userId) return;

      const unsubscribeExpenses = fetchExpenses(userId, selectedMonthDate);

      return () => unsubscribeExpenses();
  }, [userId, selectedMonthDate, toast]);


  useEffect(() => {
    if (allStudents.length === 0 || allPlans.length === 0) {
        if(userId) setIsLoading(false); // Only stop loading if we are logged in but have no data
        return;
    }

    const monthStart = startOfMonth(selectedMonthDate);
    const monthEnd = endOfMonth(selectedMonthDate);
    const today = startOfDay(new Date());

    const derivedPayments: PaymentEntry[] = [];

    allStudents.forEach(student => {
        if (student.status !== 'active' || !student.registrationDate) return;

        const planDetails = allPlans.find(p => p.name === student.plan);
        if (!planDetails || !planDetails.durationDays || planDetails.durationDays <= 0) {
            return;
        }

        let firstPaymentCycleStartDate: Date;
        if (planDetails.chargeOnEnrollment) {
          firstPaymentCycleStartDate = startOfDay(parseISO(student.registrationDate));
        } else {
          firstPaymentCycleStartDate = addDays(startOfDay(parseISO(student.registrationDate)), planDetails.durationDays);
        }
        
        let currentCycleEffectiveDueDate = firstPaymentCycleStartDate;
        
        while (isBefore(currentCycleEffectiveDueDate, addMonths(monthEnd, 2))) { 
            
            if (isAfter(currentCycleEffectiveDueDate, addDays(monthEnd, planDetails.durationDays * 2))) {
                 break; 
            }

            if (isWithinInterval(currentCycleEffectiveDueDate, { start: monthStart, end: monthEnd })) {
                let entryStatus: Payment['status'] = 'pendente';
                let entryPaymentDate: string | undefined = undefined;

                const studentLastPaymentDate = student.lastPaymentDate ? startOfDay(parseISO(student.lastPaymentDate)) : null;
                
                if (studentLastPaymentDate && 
                    (isEqual(studentLastPaymentDate, currentCycleEffectiveDueDate) || 
                     (isAfter(studentLastPaymentDate, currentCycleEffectiveDueDate) && isBefore(studentLastPaymentDate, addDays(currentCycleEffectiveDueDate, planDetails.durationDays)))
                    )
                   ) {
                     if (student.paymentStatus === 'pago') {
                        const studentOverallDueDate = student.dueDate ? startOfDay(parseISO(student.dueDate)) : null;
                        if (studentOverallDueDate && isAfter(studentOverallDueDate, currentCycleEffectiveDueDate)) {
                            entryStatus = 'pago';
                            entryPaymentDate = student.lastPaymentDate;
                        }
                     } else if (isEqual(studentLastPaymentDate, currentCycleEffectiveDueDate)){
                        entryStatus = 'pago';
                        entryPaymentDate = student.lastPaymentDate;
                     }
                }
                
                if (entryStatus !== 'pago') { 
                    if (isBefore(currentCycleEffectiveDueDate, today)) {
                        entryStatus = 'vencido';
                    } else {
                        entryStatus = 'pendente';
                    }
                }
                
                const studentOverallDueDate = student.dueDate ? startOfDay(parseISO(student.dueDate)) : null;
                if (studentOverallDueDate && isEqual(currentCycleEffectiveDueDate, studentOverallDueDate)) {
                    if (student.paymentStatus === 'vencido') entryStatus = 'vencido';
                    else if (student.paymentStatus === 'pendente' && entryStatus !== 'vencido') entryStatus = 'pendente';
                    else if (student.paymentStatus === 'pago' && entryStatus !== 'vencido') {
                       entryStatus = 'pago';
                       entryPaymentDate = student.lastPaymentDate;
                    }
                }


                derivedPayments.push({
                    id: `pay-${student.id}-${dateFnsFormatISO(currentCycleEffectiveDueDate, { representation: 'date' })}`,
                    studentId: student.id,
                    studentName: student.name,
                    studentPhone: student.phone,
                    studentPlanName: student.plan,
                    amount: planDetails.price, 
                    paymentDate: entryPaymentDate,
                    dueDate: dateFnsFormatISO(currentCycleEffectiveDueDate, { representation: 'date' }),
                    status: entryStatus,
                    method: student.paymentMethod || 'PIX',
                    referenceMonth: format(currentCycleEffectiveDueDate, 'yyyy-MM'),
                });
            }
            
            currentCycleEffectiveDueDate = addDays(currentCycleEffectiveDueDate, planDetails.durationDays);
        }
    });
    
    const uniquePayments = Array.from(new Map(derivedPayments.map(p => [p.id, p])).values());

    uniquePayments.sort((a, b) => {
        const dateA = parseISO(a.dueDate).getTime();
        const dateB = parseISO(b.dueDate).getTime();
        if (dateA !== dateB) return dateA - dateB;
        return a.studentName.localeCompare(b.studentName);
    });
    setPayments(uniquePayments);
    setIsLoading(false);
  }, [allStudents, allPlans, selectedMonthDate, userId]);


  const handleMarkAsPaid = async (paymentEntryToUpdate: PaymentEntry) => {
    if (!userId) {
      toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
      return;
    }
    const studentDocRef = doc(db, 'coaches', userId, 'students', paymentEntryToUpdate.studentId);
    try {
      const studentDocSnap = await getDoc(studentDocRef);
      if (!studentDocSnap.exists()) {
        toast({ title: "Erro", description: "Aluno não encontrado.", variant: "destructive" });
        return;
      }
      const currentStudentData = studentDocSnap.data() as Student;
      const planDetails = allPlans.find(p => p.name === currentStudentData.plan);

      if (!planDetails) {
        toast({ title: "Erro", description: "Plano do aluno não encontrado.", variant: "destructive" });
        return;
      }

      const paymentMadeForDueDate = startOfDay(parseISO(paymentEntryToUpdate.dueDate));
      
      let nextOverallDueDate: Date;
      if (planDetails.durationDays > 0) {
        nextOverallDueDate = addDays(paymentMadeForDueDate, planDetails.durationDays);
      } else { 
        nextOverallDueDate = setDate(addMonths(paymentMadeForDueDate, 1), 5); 
      }
      
      const updatePayload: Partial<Student> = {
        paymentStatus: 'pago',
        lastPaymentDate: dateFnsFormatISO(paymentMadeForDueDate, { representation: 'date' }), 
        dueDate: dateFnsFormatISO(nextOverallDueDate, { representation: 'date' }),
        amountDue: planDetails.price, 
      };

      await updateDoc(studentDocRef, updatePayload);

      toast({
        title: "Pagamento Confirmado!",
        description: `Pagamento de ${currentStudentData.name} (ref. ${format(paymentMadeForDueDate, 'dd/MM/yyyy')}) marcado como pago. Próximo vencimento: ${format(nextOverallDueDate, 'dd/MM/yyyy', { locale: ptBR })}`,
      });
    } catch (error) {
      console.error("Error marking as paid: ", error);
      toast({ title: "Erro ao Marcar como Pago", variant: "destructive", description: (error as Error).message });
    }
  };

  const confirmDeleteExpense = (expense: Expense) => {
    setExpenseToDelete(expense);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteExpense = async () => {
    if (!userId || !expenseToDelete) {
      toast({ title: "Erro", description: "Nenhuma saída selecionada para excluir.", variant: "destructive" });
      return;
    }
    try {
        await deleteDoc(doc(db, 'coaches', userId, 'expenses', expenseToDelete.id));
        toast({ title: "Saída Excluída!" });
    } catch(error) {
        console.error("Error deleting expense:", error);
        toast({ title: "Erro ao Excluir Saída", variant: "destructive"});
    } finally {
        setIsDeleteDialogOpen(false);
        setExpenseToDelete(null);
    }
  };


  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      const nameMatch = payment.studentName.toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatch = statusFilters.size === 0 || statusFilters.has(payment.status);
      return nameMatch && statusMatch;
    });
  }, [payments, searchTerm, statusFilters]);
  
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => 
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
      expense.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [expenses, searchTerm]);

  const toggleStatusFilter = (status: Payment['status']) => {
    setStatusFilters(prev => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };
  
  const getPaymentStatusBadge = (status: Payment['status']) => {
    switch (status) {
      case 'pago': return <Badge className="bg-green-500/20 text-green-700 border-green-500/30"><CheckCircle className="inline mr-1 h-3 w-3"/> Pago</Badge>;
      case 'pendente': return <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30"><Clock className="inline mr-1 h-3 w-3"/> Pendente</Badge>;
      case 'vencido': return <Badge className="bg-red-500/20 text-red-700 border-red-500/30"><AlertTriangle className="inline mr-1 h-3 w-3"/> Vencido</Badge>;
      default: return <Badge variant="outline">N/A</Badge>;
    }
  };

  const summaryStats = useMemo(() => {
    const totalRecebidoMes = payments
        .filter(p => p.status === 'pago')
        .reduce((sum, p) => sum + p.amount, 0);

    const totalSaidasMes = expenses
        .reduce((sum, e) => sum + e.amount, 0);

    return {
      totalRecebidoMes,
      totalPendente: payments
        .filter(p => p.status === 'pendente')
        .reduce((sum, p) => sum + p.amount, 0),
      totalVencido: payments
        .filter(p => p.status === 'vencido')
        .reduce((sum, p) => sum + p.amount, 0),
      totalSaidasMes,
      saldoMes: totalRecebidoMes - totalSaidasMes,
    }
  }, [payments, expenses]);

  const handleGenerateReport = () => {
    const paidInMonth = payments.filter(p => p.status === 'pago');
    const outstandingInMonth = payments.filter(p => p.status === 'pendente' || p.status === 'vencido');
    
    setReportData({
      monthYear: format(selectedMonthDate, 'MMMM yyyy', { locale: ptBR }),
      totalReceived: summaryStats.totalRecebidoMes,
      totalPending: summaryStats.totalPendente,
      totalOverdue: summaryStats.totalVencido,
      totalExpenses: summaryStats.totalSaidasMes,
      paidInMonth,
      outstandingInMonth,
      expensesInMonth: expenses,
    });
    setIsReportDialogOpen(true);
  };

  const handleDownloadPdf = async () => {
    const reportContentElement = document.getElementById('report-content-area');
    if (!reportContentElement || !reportData) {
      toast({ title: "Erro", description: "Não foi possível encontrar o conteúdo do relatório para baixar.", variant: "destructive" });
      return;
    }
    
    setIsDownloadingPdf(true);

    try {
        const canvas = await html2canvas(reportContentElement, {
            scale: 2, // Higher scale for better quality
            useCORS: true,
            backgroundColor: null,
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'px',
            format: [canvas.width, canvas.height]
        });
        
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        
        const fileName = `Relatorio_Financeiro_${reportData.monthYear.replace(' ', '_')}.pdf`;
        pdf.save(fileName);

    } catch (error) {
        console.error("Error generating PDF:", error);
        toast({ title: "Erro ao gerar PDF", description: "Não foi possível gerar o PDF. Tente novamente.", variant: "destructive"});
    } finally {
        setIsDownloadingPdf(false);
    }
  };


  const printReport = () => {
    const printableContent = document.getElementById('report-content-area');
    if (printableContent) {
      const printWindow = window.open('', '_blank');
      printWindow?.document.write('<html><head><title>Relatório Financeiro Mensal</title>');
      printWindow?.document.write(
        '<style>' +
        'body { font-family: sans-serif; margin: 20px; }\n' +
        'table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }\n' +
        'th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }\n' +
        'th { background-color: #f2f2f2; }\n' +
        'h1, h2, h3 { color: #333; }\n' +
        '@page { size: auto;  margin: 25mm 25mm 25mm 25mm; }\n' + // Print margin
        '.report-header { margin-bottom: 20px; text-align: center;}\n' +
        '.summary-section, .details-section { margin-bottom: 30px; }\n' +
        '.summary-item { margin-bottom: 5px; }\n' +
        '.no-print { display: none !important; }\n' +
        '</style>'
      );
      printWindow?.document.write('</head><body>');
      printWindow?.document.write(printableContent.innerHTML);
      printWindow?.document.write('</body></html>');
      printWindow?.document.close();
      printWindow?.print();
    }
  };

  const handlePrevMonth = () => {
    setSelectedMonthDate(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setSelectedMonthDate(prev => addMonths(prev, 1));
  };

  const safeFormatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy');
    } catch (e) {
      console.warn("Invalid date for formatting in table:", dateString);
      return dateString; 
    }
  };

  if (isLoading || !userId) {
    return (
      <div className="container mx-auto py-8 flex flex-col items-center justify-center min-h-[calc(100vh-150px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }


  return (
    <>
      <div className="container mx-auto py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold text-foreground">Controle Financeiro</h1>
            <p className="text-muted-foreground">
              Gerencie mensalidades e pagamentos para {clientRendered ? format(selectedMonthDate, 'MMMM yyyy', { locale: ptBR }) : 'o mês atual'}.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevMonth} aria-label="Mês anterior">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-semibold text-foreground tabular-nums w-36 text-center">
              {clientRendered ? format(selectedMonthDate, 'MMMM yyyy', { locale: ptBR }) : 'Carregando...'}
            </span>
            <Button variant="outline" size="icon" onClick={handleNextMonth} aria-label="Próximo mês">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={handleGenerateReport} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <FileText className="mr-2 h-5 w-5" />
            Relatório de {clientRendered ? format(selectedMonthDate, 'MMMM', { locale: ptBR }) : ''}
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Saldo do Mês</CardTitle>
              <DollarSign className={`h-5 w-5 ${summaryStats.saldoMes >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summaryStats.saldoMes >= 0 ? 'text-green-500' : 'text-red-500'}`}>R$ {summaryStats.saldoMes.toFixed(2)}</div>
               <p className="text-xs text-muted-foreground">Recebido (R$ {summaryStats.totalRecebidoMes.toFixed(2)}) - Saídas (R$ {summaryStats.totalSaidasMes.toFixed(2)})</p>
            </CardContent>
          </Card>
           <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Saídas</CardTitle>
              <MinusCircle className="h-5 w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">R$ {summaryStats.totalSaidasMes.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pendente</CardTitle>
              <Clock className="h-5 w-5 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">R$ {summaryStats.totalPendente.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Vencido</CardTitle>
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">R$ {summaryStats.totalVencido.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>


        <Card className="shadow-lg">
          <Tabs defaultValue="payments">
             <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                        <CardTitle>Movimentações de {clientRendered ? format(selectedMonthDate, 'MMMM yyyy', { locale: ptBR }) : '...'}</CardTitle>
                        <CardDescription>Acompanhe as entradas e saídas do mês selecionado.</CardDescription>
                    </div>
                    <TabsList>
                        <TabsTrigger value="payments">Recebimentos</TabsTrigger>
                        <TabsTrigger value="expenses">Saídas</TabsTrigger>
                    </TabsList>
                </div>
                <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative w-full sm:w-auto flex-grow">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                        type="search"
                        placeholder="Buscar por aluno, descrição..."
                        className="pl-8 w-full bg-background"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                            <Filter className="mr-2 h-4 w-4" /> Filtrar Status
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Status de Pagamento</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {(['pago', 'pendente', 'vencido'] as Payment['status'][]).map(statusValue => (
                            <DropdownMenuCheckboxItem
                            key={statusValue}
                            checked={statusFilters.has(statusValue)}
                            onCheckedChange={() => toggleStatusFilter(statusValue)}
                            className="capitalize"
                            >
                            {statusValue === 'pago' ? 'Pago' : statusValue === 'pendente' ? 'Pendente' : 'Vencido'}
                            </DropdownMenuCheckboxItem>
                        ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button onClick={() => setIsAddExpenseDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4"/> Adicionar Saída
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="px-0 sm:px-6">
                 <TabsContent value="payments">
                     {isLoading ? (
                        <div className="flex justify-center items-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="ml-2 text-muted-foreground">Carregando recebimentos...</p>
                        </div>
                    ) : (
                    <>
                    {/* Desktop Table */}
                    <div className="hidden md:block">
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Aluno</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Vencimento</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Método</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPayments.length > 0 ? (
                            filteredPayments.map((payment) => (
                                <TableRow key={payment.id}>
                                <TableCell className="font-medium truncate max-w-xs">{payment.studentName}</TableCell>
                                <TableCell>R$ {payment.amount.toFixed(2)}</TableCell>
                                <TableCell>{safeFormatDate(payment.dueDate)}</TableCell>
                                <TableCell>{getPaymentStatusBadge(payment.status)}</TableCell>
                                <TableCell>{payment.method}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end space-x-1">
                                    {(payment.status === 'pendente' || payment.status === 'vencido') && (
                                        <Button variant="ghost" size="sm" className="text-green-500 hover:text-green-600" onClick={() => handleMarkAsPaid(payment)} title="Marcar como Pago">
                                            <CheckCircle className="h-4 w-4 mr-1" /> Pago
                                        </Button>
                                    )}
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href={`/alunos/${payment.studentId}`} title="Ver Aluno"><Users className="h-4 w-4 mr-1" /> Aluno</Link>
                                    </Button>
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href={`/financeiro/lembrete/${payment.studentId}`} title="Gerar Lembrete"><DollarSign className="h-4 w-4 mr-1" /> Lembrete</Link>
                                    </Button>
                                    </div>
                                </TableCell>
                                </TableRow>
                            ))
                            ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                Nenhum recebimento encontrado para {clientRendered ? format(selectedMonthDate, 'MMMM yyyy', { locale: ptBR }) : '...'}.
                                </TableCell>
                            </TableRow>
                            )}
                        </TableBody>
                        </Table>
                    </div>
                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4">
                        {filteredPayments.length > 0 ? (
                            filteredPayments.map((payment) => (
                                <Card key={`mobile-${payment.id}`} className="bg-muted/30">
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-base">{payment.studentName}</CardTitle>
                                                <CardDescription>Venc. {safeFormatDate(payment.dueDate)}</CardDescription>
                                            </div>
                                            {getPaymentStatusBadge(payment.status)}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex flex-col space-y-2">
                                         <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground">Valor:</span>
                                            <span className="font-medium">R$ {payment.amount.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground">Método:</span>
                                            <span className="font-medium">{payment.method}</span>
                                        </div>
                                        <div className="pt-2 flex flex-wrap gap-2 justify-end">
                                            {(payment.status === 'pendente' || payment.status === 'vencido') && (
                                                <Button size="sm" className="flex-1 bg-green-500 hover:bg-green-600" onClick={() => handleMarkAsPaid(payment)}><CheckCircle className="h-4 w-4 mr-1"/> Pago</Button>
                                            )}
                                            <Button variant="secondary" size="sm" className="flex-1" asChild>
                                                <Link href={`/alunos/${payment.studentId}`}><Users className="h-4 w-4 mr-1"/> Aluno</Link>
                                            </Button>
                                            <Button variant="secondary" size="sm" className="flex-1" asChild>
                                                <Link href={`/financeiro/lembrete/${payment.studentId}`}><DollarSign className="h-4 w-4 mr-1"/> Lembrete</Link>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                             <div className="text-center text-muted-foreground py-8">
                                Nenhum recebimento encontrado para {clientRendered ? format(selectedMonthDate, 'MMMM yyyy', { locale: ptBR }) : '...'}.
                            </div>
                        )}
                    </div>
                    </>
                    )}
                 </TabsContent>
                 <TabsContent value="expenses">
                     {isLoading ? (
                        <div className="flex justify-center items-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <p className="ml-2 text-muted-foreground">Carregando saídas...</p>
                        </div>
                    ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Descrição</TableHead>
                                        <TableHead>Categoria</TableHead>
                                        <TableHead>Data</TableHead>
                                        <TableHead className="text-right">Valor</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredExpenses.length > 0 ? (
                                        filteredExpenses.map((expense) => (
                                        <TableRow key={expense.id}>
                                            <TableCell className="font-medium">{expense.description}</TableCell>
                                            <TableCell><Badge variant="outline">{expense.category}</Badge></TableCell>
                                            <TableCell>{safeFormatDate(expense.date)}</TableCell>
                                            <TableCell className="text-right">R$ {expense.amount.toFixed(2)}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive/90" onClick={() => confirmDeleteExpense(expense)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                            Nenhuma saída registrada para {clientRendered ? format(selectedMonthDate, 'MMMM yyyy', { locale: ptBR }) : '...'}.
                                        </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-4">
                            {filteredExpenses.length > 0 ? (
                                filteredExpenses.map((expense) => (
                                    <Card key={`mobile-exp-${expense.id}`} className="bg-muted/30">
                                        <CardContent className="p-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-semibold text-foreground">{expense.description}</p>
                                                    <p className="text-sm text-muted-foreground">{safeFormatDate(expense.date)}</p>
                                                </div>
                                                <Badge variant="outline">{expense.category}</Badge>
                                            </div>
                                            <div className="flex justify-between items-center mt-2 pt-2 border-t">
                                                <p className="text-lg font-bold text-red-600">R$ {expense.amount.toFixed(2)}</p>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive/90" onClick={() => confirmDeleteExpense(expense)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <div className="text-center text-muted-foreground py-8">
                                     Nenhuma saída registrada para {clientRendered ? format(selectedMonthDate, 'MMMM yyyy', { locale: ptBR }) : '...'}.
                                </div>
                            )}
                        </div>
                    </>
                    )}
                 </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>

      <AddExpenseDialog
        open={isAddExpenseDialogOpen}
        onOpenChange={setIsAddExpenseDialogOpen}
        onExpenseAdded={() => {
          if(userId) fetchExpenses(userId, selectedMonthDate);
        }}
      />

       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente a despesa: <br/>
                <span className="font-medium text-foreground">"{expenseToDelete?.description}"</span>.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setExpenseToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteExpense}>Continuar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
       </AlertDialog>


      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Relatório Financeiro Mensal - {reportData?.monthYear}</DialogTitle>
            <DialogDescription>
              Resumo financeiro para {reportData?.monthYear}.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-grow overflow-y-auto pr-2">
            <div id="report-content-area" className="py-4 space-y-6 bg-white text-black p-4">
              {reportData ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Resumo do Mês</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-green-500/10 rounded-lg">
                        <p className="text-sm text-green-700 font-medium">Saldo do Mês</p>
                        <p className={`text-xl font-bold ${reportData.totalReceived - reportData.totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>R$ {(reportData.totalReceived - reportData.totalExpenses).toFixed(2)}</p>
                      </div>
                      <div className="p-4 bg-green-500/10 rounded-lg">
                        <p className="text-sm text-green-700 font-medium">Total Recebido</p>
                        <p className="text-xl font-bold text-green-600">R$ {reportData.totalReceived.toFixed(2)}</p>
                      </div>
                      <div className="p-4 bg-red-500/10 rounded-lg">
                        <p className="text-sm text-red-700 font-medium">Total de Saídas</p>
                        <p className="text-xl font-bold text-red-600">R$ {reportData.totalExpenses.toFixed(2)}</p>
                      </div>
                      <div className="p-4 bg-yellow-500/10 rounded-lg">
                        <p className="text-sm text-yellow-700 font-medium">Total a Receber</p>
                        <p className="text-xl font-bold text-yellow-600">R$ {(reportData.totalPending + reportData.totalOverdue).toFixed(2)}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle className="text-lg">Recebimentos de {reportData?.monthYear}</CardTitle></CardHeader>
                    <CardContent>
                      {reportData.paidInMonth.length > 0 ? (
                        <>
                          {/* Desktop View */}
                          <div className="hidden md:block"><Table><TableHeader><TableRow><TableHead>Aluno</TableHead><TableHead>Valor (R$)</TableHead><TableHead>Data Pag.</TableHead><TableHead>Método</TableHead></TableRow></TableHeader><TableBody>{reportData.paidInMonth.map(p => (<TableRow key={`paid-${p.id}`}><TableCell>{p.studentName}</TableCell><TableCell>{p.amount.toFixed(2)}</TableCell><TableCell>{p.paymentDate ? safeFormatDate(p.paymentDate) : '-'}</TableCell><TableCell>{p.method}</TableCell></TableRow>))}</TableBody></Table></div>
                          {/* Mobile View */}
                          <div className="md:hidden space-y-2">{reportData.paidInMonth.map(p => (<div key={`paid-mobile-${p.id}`} className="p-3 bg-muted/50 rounded-md text-sm"><div className="flex justify-between font-medium"><p>{p.studentName}</p><p>R$ {p.amount.toFixed(2)}</p></div><div className="flex justify-between text-muted-foreground text-xs"><p>Pago em: {p.paymentDate ? safeFormatDate(p.paymentDate) : '-'}</p><p>Método: {p.method}</p></div></div>))}</div>
                        </>
                      ) : (<p className="text-muted-foreground text-center py-4">Nenhum recebimento em {reportData?.monthYear}.</p>)}
                    </CardContent>
                  </Card>

                   <Card>
                    <CardHeader><CardTitle className="text-lg">Saídas de {reportData?.monthYear}</CardTitle></CardHeader>
                    <CardContent>
                      {reportData.expensesInMonth.length > 0 ? (
                        <>
                          {/* Desktop View */}
                          <div className="hidden md:block"><Table><TableHeader><TableRow><TableHead>Descrição</TableHead><TableHead>Categoria</TableHead><TableHead>Data</TableHead><TableHead className="text-right">Valor (R$)</TableHead></TableRow></TableHeader><TableBody>{reportData.expensesInMonth.map(e => (<TableRow key={`exp-${e.id}`}><TableCell>{e.description}</TableCell><TableCell><Badge variant="outline">{e.category}</Badge></TableCell><TableCell>{safeFormatDate(e.date)}</TableCell><TableCell className="text-right">{e.amount.toFixed(2)}</TableCell></TableRow>))}</TableBody></Table></div>
                          {/* Mobile View */}
                          <div className="md:hidden space-y-2">{reportData.expensesInMonth.map(e => (<div key={`exp-mobile-${e.id}`} className="p-3 bg-muted/50 rounded-md text-sm"><div className="flex justify-between font-medium"><p>{e.description}</p><p className="text-red-500">R$ {e.amount.toFixed(2)}</p></div><div className="flex justify-between text-muted-foreground text-xs"><p>{e.category}</p><p>{safeFormatDate(e.date)}</p></div></div>))}</div>
                        </>
                      ) : (<p className="text-muted-foreground text-center py-4">Nenhuma saída registrada em {reportData?.monthYear}.</p>)}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle className="text-lg">Pendentes/Vencidos (Venc. em {reportData?.monthYear})</CardTitle></CardHeader>
                    <CardContent>
                      {reportData.outstandingInMonth.length > 0 ? (
                        <>
                          {/* Desktop View */}
                          <div className="hidden md:block"><Table><TableHeader><TableRow><TableHead>Aluno</TableHead><TableHead>Valor (R$)</TableHead><TableHead>Vencimento</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{reportData.outstandingInMonth.map(p => (<TableRow key={`out-${p.id}`}><TableCell>{p.studentName}</TableCell><TableCell>{p.amount.toFixed(2)}</TableCell><TableCell>{p.dueDate ? safeFormatDate(p.dueDate) : '-'}</TableCell><TableCell>{getPaymentStatusBadge(p.status)}</TableCell></TableRow>))}</TableBody></Table></div>
                          {/* Mobile View */}
                          <div className="md:hidden space-y-2">{reportData.outstandingInMonth.map(p => (<div key={`out-mobile-${p.id}`} className="p-3 bg-muted/50 rounded-md text-sm"><div className="flex justify-between items-start"><div className="font-medium"><p>{p.studentName}</p><p className="text-xs text-muted-foreground">Venc: {p.dueDate ? safeFormatDate(p.dueDate) : '-'}</p></div><div>{getPaymentStatusBadge(p.status)}</div></div><div className="text-right font-bold mt-1">R$ {p.amount.toFixed(2)}</div></div>))}</div>
                        </>
                      ) : (<p className="text-muted-foreground text-center py-4">Nenhum pagamento pendente ou vencido com vencimento em {reportData?.monthYear}.</p>)}
                    </CardContent>
                  </Card>
                </>
              ) : (
                <p>Gerando relatório...</p>
              )}
            </div>
          </ScrollArea>
          
          <DialogFooter className="pt-4 border-t mt-auto no-print">
            <Button variant="outline" onClick={handleDownloadPdf} disabled={isDownloadingPdf}>
              {isDownloadingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4" />}
              {isDownloadingPdf ? 'Baixando...' : 'Baixar PDF'}
            </Button>
            <Button variant="outline" onClick={printReport}>
              <Printer className="mr-2 h-4 w-4" /> Imprimir Relatório
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Fechar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
