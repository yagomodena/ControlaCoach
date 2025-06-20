
'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, MapPin, Loader2 } from 'lucide-react';
import { type Location } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { AddLocationDialog } from './add-location-dialog';
import { db, auth } from '@/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

interface ManageLocationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLocationsManaged: () => void;
}

export function ManageLocationsDialog({ open, onOpenChange, onLocationsManaged }: ManageLocationsDialogProps) {
  const { toast } = useToast();
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAddLocationDialogOpen, setIsAddLocationDialogOpen] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      setUserId(user ? user.uid : null);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (open && userId) {
      setIsLoading(true);
      const locationsCollectionRef = collection(db, 'coaches', userId, 'locations');
      const q = query(locationsCollectionRef, orderBy('name', 'asc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const locationsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Location));
        setLocations(locationsData);
        setIsLoading(false);
      }, (error) => {
        console.error("Error fetching locations for dialog: ", error);
        toast({ title: "Erro ao Carregar Locais", variant: "destructive" });
        setIsLoading(false);
      });
      return () => unsubscribe();
    } else if (!userId && open) {
      setLocations([]);
      setIsLoading(false);
    }
  }, [open, userId, toast]);
  
  const handleLocationAdded = () => {
    onLocationsManaged(); // This will trigger re-fetch in parent component
  };


  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Gerenciar Locais de Aula</DialogTitle>
            <DialogDescription>Visualize e adicione novos locais.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Button onClick={() => setIsAddLocationDialogOpen(true)} className="w-full sm:w-auto" disabled={!userId}>
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Novo Local
            </Button>
            <ScrollArea className="h-[300px] w-full rounded-md border">
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : !userId ? (
                 <div className="flex justify-center items-center h-full">
                    <p className="text-muted-foreground">Autenticação necessária.</p>
                 </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="flex items-center"><MapPin className="mr-1 h-4 w-4"/>Nome</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {locations.length > 0 ? (
                      locations.map((loc) => (
                        <TableRow key={loc.id}>
                          <TableCell className="font-medium">{loc.name}</TableCell>
                          <TableCell>
                            <Badge variant={loc.status === 'active' ? 'default' : 'secondary'}
                              className={loc.status === 'active' ? 'bg-green-500/20 text-green-700 border-green-500/30' : 'bg-red-500/20 text-red-700 border-red-500/30'}
                            >
                              {loc.status === 'active' ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                          Nenhum local cadastrado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Fechar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddLocationDialog
        open={isAddLocationDialogOpen}
        onOpenChange={setIsAddLocationDialogOpen}
        onLocationAdded={handleLocationAdded}
      />
    </>
  );
}
