
'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { PlusCircle, Search, Edit3, Trash2, MoreVertical, ListChecks, BadgeDollarSign, CalendarClock } from 'lucide-react';
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
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Plan } from '@/types';
import { MOCK_PLANS } from '@/types'; 
import { useToast } from '@/hooks/use-toast';

export default function PlanosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [plans, setPlans] = useState<Plan[]>(MOCK_PLANS);
  const { toast } = useToast();

  const filteredPlans = useMemo(() => {
    return plans.filter(plan =>
      plan.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [plans, searchTerm]);

  const handleDeletePlan = (planId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este plano? Esta ação não pode ser desfeita.')) {
      const updatedPlans = plans.filter(p => p.id !== planId);
      setPlans(updatedPlans);
      // Update MOCK_PLANS directly for demo purposes
      const index = MOCK_PLANS.findIndex(p => p.id === planId);
      if (index > -1) {
        MOCK_PLANS.splice(index, 1);
      }
      toast({
        title: 'Plano Excluído!',
        description: 'O plano foi removido com sucesso.',
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground">Gestão de Planos</h1>
          <p className="text-muted-foreground">Gerencie os planos de assinatura disponíveis.</p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link href="/planos/novo">
            <PlusCircle className="mr-2 h-5 w-5" />
            Adicionar Novo Plano
          </Link>
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Lista de Planos Cadastrados</CardTitle>
          <CardDescription>Busque e gerencie os planos.</CardDescription>
           <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full sm:w-auto flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nome do plano..."
                className="pl-8 w-full bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Plano</TableHead>
                <TableHead className="hidden md:table-cell">Preço (R$)</TableHead>
                <TableHead className="hidden sm:table-cell">Duração (dias)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlans.length > 0 ? (
                filteredPlans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium flex items-center">
                        <ListChecks className="h-4 w-4 mr-2 text-primary" />
                        {plan.name}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                        {plan.price.toFixed(2)}
                    </TableCell>
                     <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {plan.durationDays}
                    </TableCell>
                    <TableCell>
                      <Badge variant={plan.status === 'active' ? 'default' : 'secondary'}
                       className={plan.status === 'active' ? 'bg-green-500/20 text-green-700 border-green-500/30' : 'bg-red-500/20 text-red-700 border-red-500/30'}
                      >
                        {plan.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Mais ações</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/planos/${plan.id}?edit=true`} className="flex items-center">
                              <Edit3 className="mr-2 h-4 w-4" /> Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeletePlan(plan.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10 flex items-center">
                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum plano encontrado.
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
