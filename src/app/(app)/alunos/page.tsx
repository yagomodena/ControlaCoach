'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { PlusCircle, Search, Edit3, Trash2, MoreVertical, Eye } from 'lucide-react';
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
import { MOCK_STUDENTS } from '@/types'; // Using mock data

export default function AlunosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  // In a real app, this would come from a data store (e.g., Firebase)
  const [students, setStudents] = useState<Student[]>(MOCK_STUDENTS);

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const nameMatch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatch = statusFilter === 'all' || student.status === statusFilter;
      return nameMatch && statusMatch;
    });
  }, [students, searchTerm, statusFilter]);

  const handleDeleteStudent = (studentId: string) => {
    // Placeholder for delete logic
    if (window.confirm('Tem certeza que deseja excluir este aluno? Esta ação não pode ser desfeita.')) {
      setStudents(prevStudents => prevStudents.filter(s => s.id !== studentId));
      // Add toast notification for success
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">Telefone</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead className="hidden sm:table-cell">Nível</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{student.phone}</TableCell>
                    <TableCell>{student.plan}</TableCell>
                    <TableCell className="hidden sm:table-cell">{student.technicalLevel}</TableCell>
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
                            <Link href={`/alunos/${student.id}?edit=true`} className="flex items-center"> {/* Assuming edit mode via query param or separate route */}
                              <Edit3 className="mr-2 h-4 w-4" /> Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteStudent(student.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10 flex items-center">
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
        </CardContent>
      </Card>
    </div>
  );
}
