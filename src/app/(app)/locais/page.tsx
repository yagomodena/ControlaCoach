
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { PlusCircle, Search, Edit3, Trash2, MoreVertical, MapPin, Loader2 } from 'lucide-react';
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
import type { Location } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/firebase';
import { collection, onSnapshot, deleteDoc, doc, query, orderBy } from 'firebase/firestore';

export default function LocaisPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    const locationsCollectionRef = collection(db, 'locations');
    const q = query(locationsCollectionRef, orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const locationsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Location));
      setLocations(locationsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching locations: ", error);
      toast({
        title: "Erro ao Carregar Locais",
        description: "Não foi possível buscar os dados dos locais. Tente novamente.",
        variant: "destructive",
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const filteredLocations = useMemo(() => {
    return locations.filter(location =>
      location.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [locations, searchTerm]);

  const handleDeleteLocation = async (locationId: string, locationName: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o local "${locationName}"? Esta ação não pode ser desfeita.`)) {
      try {
        await deleteDoc(doc(db, 'locations', locationId));
        toast({
          title: 'Local Excluído!',
          description: `O local "${locationName}" foi removido com sucesso.`,
        });
        // Real-time listener will update the list
      } catch (error) {
        console.error("Error deleting location: ", error);
        toast({
          title: "Erro ao Excluir",
          description: "Não foi possível excluir o local. Tente novamente.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground">Gestão de Locais</h1>
          <p className="text-muted-foreground">Gerencie os locais das suas aulas.</p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link href="/locais/novo">
            <PlusCircle className="mr-2 h-5 w-5" />
            Adicionar Novo Local
          </Link>
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Lista de Locais Cadastrados</CardTitle>
          <CardDescription>Busque e gerencie os locais disponíveis.</CardDescription>
           <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full sm:w-auto flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nome do local..."
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
              <p className="ml-2 text-muted-foreground">Carregando locais...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Local</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLocations.length > 0 ? (
                  filteredLocations.map((location) => (
                    <TableRow key={location.id}>
                      <TableCell className="font-medium flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-primary" />
                          {location.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant={location.status === 'active' ? 'default' : 'secondary'}
                         className={location.status === 'active' ? 'bg-green-500/20 text-green-700 border-green-500/30' : 'bg-red-500/20 text-red-700 border-red-500/30'}
                        >
                          {location.status === 'active' ? 'Ativo' : 'Inativo'}
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
                              <Link href={`/locais/${location.id}?edit=true`} className="flex items-center">
                                <Edit3 className="mr-2 h-4 w-4" /> Editar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteLocation(location.id, location.name)} className="text-destructive focus:text-destructive focus:bg-destructive/10 flex items-center">
                              <Trash2 className="mr-2 h-4 w-4" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      Nenhum local encontrado.
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
