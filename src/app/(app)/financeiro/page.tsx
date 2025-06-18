
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { DollarSign, Search, Filter, FileText, Users, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
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
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Student, Payment } from '@/types';
import { MOCK_STUDENTS } from '@/types'; 
import { format, parse } from 'date-fns';

interface PaymentEntry extends Payment {
  studentName: string;
}

const mockPayments: PaymentEntry[] = MOCK_STUDENTS.map(student => ({
  id: `p-${student.id}`,
  studentId: student.id,
  studentName: student.name,
  amount: student.amountDue || 150,
  paymentDate: student.lastPaymentDate || (student.paymentStatus === 'pago' ? student.dueDate || new Date().toISOString() : ''),
  dueDate: student.dueDate || new Date(new Date().setDate(new Date().getDate() + 5)).toISOString(),
  status: student.paymentStatus || 'pendente',
  method: student.paymentMethod || 'PIX',
  referenceMonth: student.dueDate ? new Date(student.dueDate).toISOString().substring(0,7) : new Date().toISOString().substring(0,7)
}));


export default function FinanceiroPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilters, setStatusFilters] = useState<Set<Payment['status']>>(new Set(['pendente', 'vencido']));
  const [clientRendered, setClientRendered] = useState(false);

  useEffect(() => {
    setClientRendered(true);
  }, []);

  const filteredPayments = useMemo(() => {
    return mockPayments.filter(payment => {
      const nameMatch = payment.studentName.toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatch = statusFilters.size === 0 || statusFilters.has(payment.status);
      return nameMatch && statusMatch;
    });
  }, [searchTerm, statusFilters]);

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

  const summaryStats = useMemo(() => ({
    totalRecebidoMes: mockPayments.filter(p => p.status === 'pago').reduce((sum, p) => sum + p.amount, 0),
    totalPendente: mockPayments.filter(p => p.status === 'pendente').reduce((sum, p) => sum + p.amount, 0),
    totalVencido: mockPayments.filter(p => p.status === 'vencido').reduce((sum, p) => sum + p.amount, 0),
  }), []);


  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground">Controle Financeiro</h1>
          <p className="text-muted-foreground">Gerencie mensalidades e pagamentos dos alunos.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <FileText className="mr-2 h-5 w-5" />
          Gerar Relatório Mensal
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recebido este Mês</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">R$ {summaryStats.totalRecebidoMes.toFixed(2)}</div>
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
        <CardHeader>
          <CardTitle>Lista de Pagamentos</CardTitle>
          <CardDescription>Acompanhe o status das mensalidades.</CardDescription>
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
        <CardContent className="px-2 sm:px-6">
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
                    <TableCell className="font-medium p-2 sm:p-4 truncate max-w-[100px] xxs:max-w-[120px] xs:max-w-[150px] sm:max-w-xs">
                        {payment.studentName}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell p-2 sm:p-4">R$ {payment.amount.toFixed(2)}</TableCell>
                    <TableCell className="p-2 sm:p-4">
                      {clientRendered ? (
                        payment.dueDate.includes('T') ? format(parse(payment.dueDate, "yyyy-MM-dd'T'HH:mm:ss.SSSX", new Date()), 'dd/MM/yyyy') : format(parse(payment.dueDate, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy')
                      ) : (
                        payment.dueDate.split('T')[0] // SSR fallback
                      )}
                    </TableCell>
                    <TableCell className="p-2 sm:p-4">{getPaymentStatusBadge(payment.status)}</TableCell>
                    <TableCell className="hidden md:table-cell p-2 sm:p-4">{payment.method}</TableCell>
                    <TableCell className="text-right p-2 sm:p-4">
                       <div className="flex items-center justify-end space-x-0.5">
                        <Button variant="ghost" size="icon" className="h-8 w-8 sm:hidden" asChild>
                          <Link href={`/alunos/${payment.studentId}`} title="Ver Aluno">
                            <Users className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" className="hidden sm:inline-flex items-center" asChild>
                          <Link href={`/alunos/${payment.studentId}`} title="Ver Aluno">
                            <Users className="h-4 w-4 mr-1" /> Ver Aluno
                          </Link>
                        </Button>

                        <Button variant="ghost" size="icon" className="h-8 w-8 sm:hidden" asChild>
                          <Link href={`/financeiro/lembrete/${payment.studentId}`} title="Gerar Lembrete">
                            <DollarSign className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" className="hidden sm:inline-flex items-center" asChild>
                          <Link href={`/financeiro/lembrete/${payment.studentId}`} title="Gerar Lembrete">
                            <DollarSign className="h-4 w-4 mr-1" /> Lembrete
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                 <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8 p-2 sm:p-4">
                    Nenhum pagamento encontrado com os filtros atuais.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
