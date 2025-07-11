
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { DollarSign, Search, Filter, FileText, Users, AlertTriangle, CheckCircle, Clock, Printer, ChevronLeft, ChevronRight } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Student, Payment, Plan } from '@/types';
import { MOCK_STUDENTS, MOCK_PLANS } from '@/types'; 
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, getMonth, getYear, addMonths, subMonths, setDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface PaymentEntry extends Payment {
  studentName: string;
  studentPhone?: string;
}

interface MonthlyReportData {
  monthYear: string;
  totalReceived: number;
  totalPending: number;
  totalOverdue: number;
  paidInMonth: PaymentEntry[];
  outstandingInMonth: PaymentEntry[];
}

export default function FinanceiroPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilters, setStatusFilters] = useState<Set<Payment['status']>>(
    new Set(['pago', 'pendente', 'vencido']) 
  );
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [clientRendered, setClientRendered] = useState(false);
  const { toast } = useToast();
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportData, setReportData] = useState<MonthlyReportData | null>(null);
  const [selectedMonthDate, setSelectedMonthDate] = useState(new Date());


  const loadAndSetPayments = () => {
    const derivedPayments: PaymentEntry[] = MOCK_STUDENTS.map(student => {
      const planDetails: Plan | undefined = MOCK_PLANS.find(p => p.name === student.plan);
      let effectiveDueDate = student.dueDate;
      if (!effectiveDueDate) {
          const today = new Date();
          let baseDateForDefault = student.lastPaymentDate ? parseISO(student.lastPaymentDate) : today;
          if (student.paymentStatus === 'pago' && student.lastPaymentDate) {
             // If paid, next due date is based on last payment + plan duration approx.
             baseDateForDefault = addMonths(parseISO(student.lastPaymentDate), 1); // Simplified: assume next month
          }
          effectiveDueDate = setDate(baseDateForDefault, MOCK_PLANS.find(p => p.name === student.plan)?.durationDays === 1 ? getDay(baseDateForDefault) : 5).toISOString();
      }


      return {
        id: `pay-${student.id}-${new Date(effectiveDueDate).toISOString().substring(0,7)}`,
        studentId: student.id,
        studentName: student.name,
        studentPhone: student.phone,
        amount: student.amountDue || planDetails?.price || 0,
        paymentDate: student.paymentStatus === 'pago' ? (student.lastPaymentDate || effectiveDueDate) : '',
        dueDate: effectiveDueDate,
        status: student.paymentStatus || 'pendente',
        method: student.paymentMethod || 'PIX',
        referenceMonth: new Date(effectiveDueDate).toISOString().substring(0,7),
      };
    });
    setPayments(derivedPayments);
  };

  useEffect(() => {
    setClientRendered(true);
    loadAndSetPayments();
  }, []);

  const handleMarkAsPaid = (studentIdToUpdate: string) => {
    const studentIndex = MOCK_STUDENTS.findIndex(s => s.id === studentIdToUpdate);
    if (studentIndex !== -1) {
      const studentName = MOCK_STUDENTS[studentIndex].name;
      MOCK_STUDENTS[studentIndex].paymentStatus = 'pago';
      const paymentDate = new Date();
      MOCK_STUDENTS[studentIndex].lastPaymentDate = paymentDate.toISOString();
      
      const planDetails = MOCK_PLANS.find(p => p.name === MOCK_STUDENTS[studentIndex].plan);
      MOCK_STUDENTS[studentIndex].amountDue = planDetails?.price || 0;

      const currentDueDate = MOCK_STUDENTS[studentIndex].dueDate ? parseISO(MOCK_STUDENTS[studentIndex].dueDate!) : paymentDate;
      // Set next due date to the 5th of the month following the current due date's month, or payment month if no due date
      const nextMonthForDueDate = addMonths(currentDueDate, 1);
      const nextDueDate = setDate(nextMonthForDueDate, 5); // Default to 5th of next month
      
      MOCK_STUDENTS[studentIndex].dueDate = nextDueDate.toISOString();
      
      loadAndSetPayments(); 

      toast({
        title: "Pagamento Confirmado!",
        description: `O pagamento de ${studentName} foi marcado como pago.`,
      });
    }
  };

  const filteredPayments = useMemo(() => {
    const targetYear = getYear(selectedMonthDate);
    const targetMonth = getMonth(selectedMonthDate);

    return payments.filter(payment => {
      const nameMatch = payment.studentName.toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatch = statusFilters.size === 0 || statusFilters.has(payment.status);
      
      let monthMatch = false;
      if (payment.dueDate) {
        const dueDateObj = parseISO(payment.dueDate);
        monthMatch = getYear(dueDateObj) === targetYear && getMonth(dueDateObj) === targetMonth;
      }
      return nameMatch && statusMatch && monthMatch;
    });
  }, [payments, searchTerm, statusFilters, selectedMonthDate]);

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
    const targetYear = getYear(selectedMonthDate);
    const targetMonth = getMonth(selectedMonthDate);

    return {
      totalRecebidoMes: payments
        .filter(p => p.status === 'pago' && p.paymentDate && getYear(parseISO(p.paymentDate)) === targetYear && getMonth(parseISO(p.paymentDate)) === targetMonth)
        .reduce((sum, p) => sum + p.amount, 0),
      totalPendente: payments
        .filter(p => p.status === 'pendente' && p.dueDate && getYear(parseISO(p.dueDate)) === targetYear && getMonth(parseISO(p.dueDate)) === targetMonth)
        .reduce((sum, p) => sum + p.amount, 0),
      totalVencido: payments
        .filter(p => p.status === 'vencido' && p.dueDate && getYear(parseISO(p.dueDate)) === targetYear && getMonth(parseISO(p.dueDate)) === targetMonth)
        .reduce((sum, p) => sum + p.amount, 0),
    }
  }, [payments, selectedMonthDate]);

  const handleGenerateReport = () => {
    const reportMonthStart = startOfMonth(selectedMonthDate);
    const reportMonthEnd = endOfMonth(selectedMonthDate);

    const paidInMonth = payments.filter(p => 
      p.status === 'pago' && 
      p.paymentDate && 
      isWithinInterval(parseISO(p.paymentDate), { start: reportMonthStart, end: reportMonthEnd })
    );

    const outstandingInMonth = payments.filter(p => 
      (p.status === 'pendente' || p.status === 'vencido') &&
      p.dueDate &&
      getYear(parseISO(p.dueDate)) === getYear(selectedMonthDate) &&
      getMonth(parseISO(p.dueDate)) === getMonth(selectedMonthDate)
    );
    
    const totalReceived = paidInMonth.reduce((sum, p) => sum + p.amount, 0);
    const totalPending = outstandingInMonth.filter(p=> p.status === 'pendente').reduce((sum, p) => sum + p.amount, 0);
    const totalOverdue = outstandingInMonth.filter(p=> p.status === 'vencido').reduce((sum, p) => sum + p.amount, 0);

    setReportData({
      monthYear: format(selectedMonthDate, 'MMMM yyyy', { locale: ptBR }),
      totalReceived,
      totalPending,
      totalOverdue,
      paidInMonth,
      outstandingInMonth,
    });
    setIsReportDialogOpen(true);
  };

  const printReport = () => {
    const printableContent = document.getElementById('report-content-area');
    if (printableContent) {
      const printWindow = window.open('', '_blank');
      printWindow?.document.write('<html><head><title>Relatório Financeiro Mensal</title>');
      printWindow?.document.write(`
        <style>
          body { font-family: sans-serif; margin: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          h1, h2, h3 { color: #333; }
          .report-header { margin-bottom: 20px; text-align: center;}
          .summary-section, .details-section { margin-bottom: 30px; }
          .summary-item { margin-bottom: 5px; }
          .no-print { display: none !important; }
        </style>
      `);
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

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Recebido em {clientRendered ? format(selectedMonthDate, 'MMMM', { locale: ptBR }) : '...'}</CardTitle>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">R$ {summaryStats.totalRecebidoMes.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pendente em {clientRendered ? format(selectedMonthDate, 'MMMM', { locale: ptBR }) : '...'}</CardTitle>
              <Clock className="h-5 w-5 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">R$ {summaryStats.totalPendente.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Vencido em {clientRendered ? format(selectedMonthDate, 'MMMM', { locale: ptBR }) : '...'}</CardTitle>
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">R$ {summaryStats.totalVencido.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>


        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Pagamentos com Vencimento em {clientRendered ? format(selectedMonthDate, 'MMMM yyyy', { locale: ptBR }) : '...'}</CardTitle>
            <CardDescription>Acompanhe o status das mensalidades do mês selecionado.</CardDescription>
            <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
              <div className="relative w-full sm:w-auto flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por aluno..."
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
            </div>
          </CardHeader>
          <CardContent className="px-0 xxs:px-2 sm:px-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-2 py-3 sm:px-4">Aluno</TableHead>
                  <TableHead className="hidden lg:table-cell px-2 py-3 sm:px-4">Valor</TableHead>
                  <TableHead className="px-2 py-3 sm:px-4">Vencimento</TableHead>
                  <TableHead className="px-2 py-3 sm:px-4">Status</TableHead>
                  <TableHead className="hidden md:table-cell px-2 py-3 sm:px-4">Método</TableHead>
                  <TableHead className="text-right px-2 py-3 sm:px-4">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length > 0 ? (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium p-2 sm:p-4 truncate max-w-[80px] xxs:max-w-[100px] xs:max-w-[120px] sm:max-w-xs">
                          {payment.studentName}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell p-2 sm:p-4">R$ {payment.amount.toFixed(2)}</TableCell>
                      <TableCell className="p-2 sm:p-4">
                        {clientRendered && payment.dueDate ? (
                          format(parseISO(payment.dueDate), 'dd/MM/yyyy')
                        ) : (
                          payment.dueDate?.split('T')[0] || 'N/A'
                        )}
                      </TableCell>
                      <TableCell className="p-2 sm:p-4">{getPaymentStatusBadge(payment.status)}</TableCell>
                      <TableCell className="hidden md:table-cell p-2 sm:p-4">{payment.method}</TableCell>
                      <TableCell className="text-right p-1 sm:p-2">
                        <div className="flex items-center justify-end space-x-0.5">
                          {(payment.status === 'pendente' || payment.status === 'vencido') && (
                            <>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500 hover:text-green-600 sm:hidden" onClick={() => handleMarkAsPaid(payment.studentId)} title="Marcar como Pago">
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="hidden sm:inline-flex items-center text-green-500 hover:text-green-600" onClick={() => handleMarkAsPaid(payment.studentId)} title="Marcar como Pago">
                                <CheckCircle className="h-4 w-4 mr-1" /> <span className="hidden xs:inline">Pago</span>
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8 sm:hidden" asChild>
                            <Link href={`/alunos/${payment.studentId}`} title="Ver Aluno">
                              <Users className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" className="hidden sm:inline-flex items-center" asChild>
                            <Link href={`/alunos/${payment.studentId}`} title="Ver Aluno">
                              <Users className="h-4 w-4 mr-1" /> <span className="hidden xs:inline">Aluno</span>
                            </Link>
                          </Button>

                          <Button variant="ghost" size="icon" className="h-8 w-8 sm:hidden" asChild>
                            <Link href={`/financeiro/lembrete/${payment.studentId}`} title="Gerar Lembrete">
                              <DollarSign className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" className="hidden sm:inline-flex items-center" asChild>
                            <Link href={`/financeiro/lembrete/${payment.studentId}`} title="Gerar Lembrete">
                              <DollarSign className="h-4 w-4 mr-1" /> <span className="hidden xs:inline">Lembrete</span>
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8 p-2 sm:p-4">
                      Nenhum pagamento encontrado com os filtros atuais para o mês de {clientRendered ? format(selectedMonthDate, 'MMMM yyyy', { locale: ptBR }) : '...'}.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Relatório Financeiro Mensal - {reportData?.monthYear}</DialogTitle>
            <DialogDescription>
              Resumo financeiro para {reportData?.monthYear}.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-grow overflow-y-auto pr-2">
            <div id="report-content-area" className="py-4 space-y-6">
              {reportData ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Resumo do Mês</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 bg-green-500/10 rounded-lg">
                        <p className="text-sm text-green-700 font-medium">Total Recebido</p>
                        <p className="text-2xl font-bold text-green-600">R$ {reportData.totalReceived.toFixed(2)}</p>
                      </div>
                      <div className="p-4 bg-yellow-500/10 rounded-lg">
                        <p className="text-sm text-yellow-700 font-medium">Total Pendente</p>
                        <p className="text-2xl font-bold text-yellow-600">R$ {reportData.totalPending.toFixed(2)}</p>
                      </div>
                      <div className="p-4 bg-red-500/10 rounded-lg">
                        <p className="text-sm text-red-700 font-medium">Total Vencido</p>
                        <p className="text-2xl font-bold text-red-600">R$ {reportData.totalOverdue.toFixed(2)}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Pagamentos Recebidos em {reportData?.monthYear}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {reportData.paidInMonth.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Aluno</TableHead>
                              <TableHead>Valor (R$)</TableHead>
                              <TableHead>Data Pag.</TableHead>
                              <TableHead>Método</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {reportData.paidInMonth.map(p => (
                              <TableRow key={`paid-${p.id}`}>
                                <TableCell>{p.studentName}</TableCell>
                                <TableCell>{p.amount.toFixed(2)}</TableCell>
                                <TableCell>{p.paymentDate ? format(parseISO(p.paymentDate), 'dd/MM/yy') : '-'}</TableCell>
                                <TableCell>{p.method}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-muted-foreground">Nenhum pagamento recebido em {reportData?.monthYear}.</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Pagamentos Pendentes/Vencidos (Venc. em {reportData?.monthYear})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {reportData.outstandingInMonth.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Aluno</TableHead>
                              <TableHead>Valor (R$)</TableHead>
                              <TableHead>Vencimento</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {reportData.outstandingInMonth.map(p => (
                              <TableRow key={`out-${p.id}`}>
                                <TableCell>{p.studentName}</TableCell>
                                <TableCell>{p.amount.toFixed(2)}</TableCell>
                                <TableCell>{p.dueDate ? format(parseISO(p.dueDate), 'dd/MM/yy') : '-'}</TableCell>
                                <TableCell>{getPaymentStatusBadge(p.status)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-muted-foreground">Nenhum pagamento pendente ou vencido com vencimento em {reportData?.monthYear}.</p>
                      )}
                    </CardContent>
                  </Card>
                </>
              ) : (
                <p>Gerando relatório...</p>
              )}
            </div>
          </ScrollArea>
          
          <DialogFooter className="pt-4 border-t mt-auto no-print">
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

