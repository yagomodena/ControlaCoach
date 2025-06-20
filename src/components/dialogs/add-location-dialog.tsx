
'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { LocationForm, type LocationFormData } from '@/components/forms/location-form';
import { useToast } from '@/hooks/use-toast';
import { db, auth } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';

interface AddLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLocationAdded: () => void;
}

export function AddLocationDialog({ open, onOpenChange, onLocationAdded }: AddLocationDialogProps) {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      setUserId(user ? user.uid : null);
    });
    return () => unsubscribeAuth();
  }, []);

  const handleAddLocation = async (data: LocationFormData) => {
    if (!userId) {
      toast({ title: "Erro de Autenticação", description: "Por favor, faça login novamente.", variant: "destructive" });
      return;
    }
    try {
      await addDoc(collection(db, 'coaches', userId, 'locations'), data);
      toast({
        title: "Local Adicionado!",
        description: `O local "${data.name}" foi cadastrado com sucesso.`,
      });
      onLocationAdded();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding location: ", error);
      toast({
        title: "Erro ao Adicionar Local",
        description: "Não foi possível cadastrar o local. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Local</DialogTitle>
          <DialogDescription>Preencha os dados do novo local de aula.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <LocationForm
            onSubmit={handleAddLocation}
            submitButtonText="Adicionar Local"
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
