
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { PlusCircle, Search, Edit3, Trash2, MoreVertical, ListChecks, Loader2 } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { db, auth } from '@/firebase';
import { collection, onSnapshot, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function PlanosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
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

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      setPlans([]);
      return;
    }

    setIsLoading(true);
    const plansCollectionRef = collection(db, 'coaches', userId, 'plans');
    const q = query(plansCollectionRef, orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const plansData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Plan));
      setPlans(plansData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching plans: ", error);
      toast({
        title: "Erro ao Carregar Planos",
        description: "Não foi possível buscar os dados dos planos. Tente novamente.",
        variant: "destructive",
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userId, toast]);

  const filteredPlans = useMemo(() => {
    return plans.filter(plan =>
      plan.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [plans, searchTerm]);

  const handleDeletePlan = async (planIdToDelete: string, planName: string) => {
    if (!userId) {
      toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
      return;
    }
    if (window.confirm(`Tem certeza que deseja excluir o plano "${planName}"? Esta ação não pode ser desfeita.`)) {
      try {
        await deleteDoc(doc(db, 'coaches', userId, 'plans', planIdToDelete));
        setPlans(prevPlans => prevPlans.filter(p => p.id !== planIdToDelete)); // Update local state immediately
        toast({
          title: 'Plano Excluído!',
          description: `O plano "${planName}" foi removido com sucesso.`,
        });
      } catch (error) {
        console.error("Error deleting plan: ", error);
        toast({
          title: "Erro ao Excluir",
          description: "Não foi possível excluir o plano. Tente novamente.",
          variant: "destructive",
        });
      }
    }
  };
  
  if (isLoading || !userId) {
    return (
        <div className="container mx-auto py-8 flex flex-col items-center justify-center min-h-[calc(100vh-150px)]">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Carregando planos...</p>
        </div>
    );
  }

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
          {isLoading ? (
             <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Carregando planos...</p>
            </div>
          ) : (
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
                            <DropdownMenuItem onClick={() => handleDeletePlan(plan.id, plan.name)} className="text-destructive focus:text-destructive focus:bg-destructive/10 flex items-center">
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}

