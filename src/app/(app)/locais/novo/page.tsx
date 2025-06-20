
'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { type Location } from '@/types';
import { db } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';

const locationSchema = z.object({
  name: z.string().min(3, { message: 'Nome do local deve ter pelo menos 3 caracteres.' }),
  status: z.enum(['active', 'inactive'], { required_error: 'Selecione o status.'}),
});

type LocationFormData = z.infer<typeof locationSchema>;

export default function NovoLocalPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: '',
      status: 'active',
    },
  });

  const onSubmit = async (data: LocationFormData) => {
    try {
      await addDoc(collection(db, 'locations'), data);
      toast({
        title: "Local Adicionado!",
        description: `O local "${data.name}" foi cadastrado com sucesso.`,
      });
      router.push('/locais'); 
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
    <div className="container mx-auto py-8">
       <div className="flex items-center mb-8">
        <Button variant="outline" size="icon" asChild className="mr-4">
          <Link href="/locais">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground">Adicionar Novo Local</h1>
          <p className="text-muted-foreground">Preencha os dados do novo local de aula.</p>
        </div>
      </div>

      <Card className="max-w-xl mx-auto shadow-lg">
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle className="flex items-center"><MapPin className="h-5 w-5 mr-2 text-primary"/> Informações do Local</CardTitle>
            <CardDescription>Insira os detalhes abaixo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Local</Label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => <Input id="name" placeholder="Ex: Praia Central, Quadra A" {...field} />}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
               <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              {errors.status && <p className="text-sm text-destructive">{errors.status.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
             <Button variant="outline" type="button" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Salvando...' : 'Salvar Local'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
