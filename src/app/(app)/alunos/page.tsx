
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { PlusCircle, Search, Edit3, Trash2, MoreVertical, Eye, Loader2 } from 'lucide-react';
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
import type { Student } from '@/types';
import { db, auth } from '@/firebase';
import { collection, deleteDoc, doc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function AlunosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [students, setStudents] = useState<Student[]>([]);
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
      setIsLoading(false); // Stop loading if no user
      setStudents([]); // Clear students if no user
      return;
    }

    setIsLoading(true);
    const studentsCollectionRef = collection(db, 'coaches', userId, 'students');
    const q = query(studentsCollectionRef, orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const studentsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Student));
      setStudents(studentsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching students: ", error);
      toast({
        title: "Erro ao Carregar Alunos",
        description: "Não foi possível buscar os dados dos alunos. Tente novamente.",
        variant: "destructive",
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userId, toast]);

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const nameMatch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatch = statusFilter === 'all' || student.status === statusFilter;
      return nameMatch && statusMatch;
    });
  }, [students, searchTerm, statusFilter]);

  const handleDeleteStudent = async (studentIdToDelete: string, studentName: string) => {
    if (!userId) {
      toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
      return;
    }
    if (window.confirm(`Tem certeza que deseja excluir o aluno "${studentName}"? Esta ação não pode ser desfeita.`)) {
      try {
        await deleteDoc(doc(db, 'coaches', userId, 'students', studentIdToDelete));
        setStudents(prevStudents => prevStudents.filter(s => s.id !== studentIdToDelete)); // Update local state
        toast({
          title: 'Aluno Excluído!',
          description: `O aluno "${studentName}" foi removido com sucesso.`,
        });
      } catch (error) {
        console.error("Error deleting student: ", error);
        toast({
          title: "Erro ao Excluir",
          description: "Não foi possível excluir o aluno. Tente novamente.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground">Gestão de Alunos</h1>
          <p className="text-muted-foreground">Gerencie as informações dos seus alunos.</p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link href="/alunos/novo">
            <PlusCircle className="mr-2 h-5 w-5" />
            Adicionar Aluno
          </Link>
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Lista de Alunos</CardTitle>
          <CardDescription>Busque, filtre e gerencie seus alunos cadastrados.</CardDescription>
           <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full sm:w-auto flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nome..."
                className="pl-8 w-full bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
                <Button 
                    variant={statusFilter === 'all' ? 'default' : 'outline'} 
                    onClick={() => setStatusFilter('all')}
                    className="flex-1 sm:flex-none"
                >
                    Todos
                </Button>
                <Button 
                    variant={statusFilter === 'active' ? 'default' : 'outline'} 
                    onClick={() => setStatusFilter('active')}
                    className="flex-1 sm:flex-none"
                >
                    Ativos
                </Button>
                <Button 
                    variant={statusFilter === 'inactive' ? 'default' : 'outline'} 
                    onClick={() => setStatusFilter('inactive')}
                    className="flex-1 sm:flex-none"
                >
                    Inativos
                </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Carregando alunos...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden lg:table-cell">Telefone</TableHead>
                  <TableHead className="hidden sm:table-cell">Plano</TableHead>
                  <TableHead className="hidden md:table-cell">Nível</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">{student.phone}</TableCell>
                      <TableCell className="hidden sm:table-cell">{student.plan}</TableCell>
                      <TableCell className="hidden md:table-cell">{student.technicalLevel}</TableCell>
                      <TableCell>
                        <Badge variant={student.status === 'active' ? 'default' : 'secondary'}
                        className={student.status === 'active' ? 'bg-green-500/20 text-green-700 border-green-500/30' : 'bg-red-500/20 text-red-700 border-red-500/30'}
                        >
                          {student.status === 'active' ? 'Ativo' : 'Inativo'}
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
                              <Link href={`/alunos/${student.id}`} className="flex items-center">
                                <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/alunos/${student.id}?edit=true`} className="flex items-center">
                                <Edit3 className="mr-2 h-4 w-4" /> Editar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteStudent(student.id, student.name)} className="text-destructive focus:text-destructive focus:bg-destructive/10 flex items-center">
                              <Trash2 className="mr-2 h-4 w-4" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Nenhum aluno encontrado.
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
