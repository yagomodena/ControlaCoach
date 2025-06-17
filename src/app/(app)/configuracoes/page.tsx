
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save, Palette, Bell, Shield, CalendarClock } from "lucide-react"; // Added CalendarClock
import { Separator } from '@/components/ui/separator';

interface DailyScheduleState {
  name: string;
  isWorkDay: boolean;
  workStart: string;
  workEnd: string;
  breakStart: string;
  breakEnd: string;
}

const initialWeekSchedule: DailyScheduleState[] = [
  { name: 'Segunda-feira', isWorkDay: true, workStart: '08:00', workEnd: '18:00', breakStart: '12:00', breakEnd: '13:30' },
  { name: 'Terça-feira', isWorkDay: true, workStart: '08:00', workEnd: '18:00', breakStart: '12:00', breakEnd: '13:30' },
  { name: 'Quarta-feira', isWorkDay: true, workStart: '08:00', workEnd: '18:00', breakStart: '12:00', breakEnd: '13:30' },
  { name: 'Quinta-feira', isWorkDay: true, workStart: '08:00', workEnd: '18:00', breakStart: '12:00', breakEnd: '13:30' },
  { name: 'Sexta-feira', isWorkDay: true, workStart: '08:00', workEnd: '18:00', breakStart: '12:00', breakEnd: '13:30' },
  { name: 'Sábado', isWorkDay: true, workStart: '08:00', workEnd: '12:00', breakStart: '', breakEnd: '' },
  { name: 'Domingo', isWorkDay: false, workStart: '08:00', workEnd: '12:00', breakStart: '', breakEnd: '' },
];


export default function ConfiguracoesPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [weekSchedule, setWeekSchedule] = useState<DailyScheduleState[]>(initialWeekSchedule);

  React.useEffect(() => {
    setMounted(true);
  }, []);
  
  const mockSettings = {
    coachName: "ControlaCoach",
    notificationsEnabled: true,
    defaultPaymentReminderDays: 3,
  };

  const handleScheduleChange = (index: number, field: keyof DailyScheduleState, value: string | boolean) => {
    const newSchedule = [...weekSchedule];
    (newSchedule[index] as any)[field] = value;
    setWeekSchedule(newSchedule);
  };

  const handleSaveAvailability = () => {
    // Placeholder for saving logic
    console.log("Saving availability:", weekSchedule);
    // Here you would typically call an API or update a global state/mock data
    alert("Funcionalidade de salvar disponibilidade será implementada em breve!");
  };


  if (!mounted) {
    return null; 
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-headline font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">Ajuste as preferências do sistema ControlaCoach.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> Perfil do Treinador
            </CardTitle>
            <CardDescription>Informações básicas do treinador.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="coachName">Nome do Treinador</Label>
              <Input id="coachName" defaultValue={mockSettings.coachName} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="coachEmail">Email de Contato</Label>
              <Input id="coachEmail" type="email" defaultValue="coach@bossolan.com" />
            </div>
            <Button className="w-full mt-2 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Save className="mr-2 h-4 w-4" /> Salvar Informações
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" /> Notificações
            </CardTitle>
            <CardDescription>Preferências de alertas e lembretes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <Label htmlFor="notificationsEnabled" className="flex flex-col space-y-1">
                <span>Ativar Notificações Gerais</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Receber alertas sobre pagamentos, aulas, etc.
                </span>
              </Label>
              <Switch id="notificationsEnabled" defaultChecked={mockSettings.notificationsEnabled} />
            </div>
             <div className="space-y-1">
              <Label htmlFor="reminderDays">Dias para Lembrete de Pagamento</Label>
              <Input id="reminderDays" type="number" defaultValue={mockSettings.defaultPaymentReminderDays} />
              <p className="text-xs text-muted-foreground">Quantos dias antes do vencimento enviar lembrete.</p>
            </div>
            <Button className="w-full mt-2 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Save className="mr-2 h-4 w-4" /> Salvar Preferências de Notificação
            </Button>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" /> Aparência
            </CardTitle>
            <CardDescription>Personalize a interface do sistema.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <Label htmlFor="darkMode" className="flex flex-col space-y-1">
                <span>Modo Escuro</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Alternar para o tema escuro.
                </span>
              </Label>
              <Switch 
                id="darkMode" 
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              /> 
            </div>
            <p className="text-sm text-muted-foreground">
              O sistema também respeitará sua preferência de tema do sistema operacional.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Availability Card */}
      <Card className="shadow-lg mt-8 lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" /> Disponibilidade Semanal
          </CardTitle>
          <CardDescription>Defina seus horários de trabalho e pausas para cada dia da semana. Estes horários serão refletidos na sua Agenda.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {weekSchedule.map((day, index) => (
            <React.Fragment key={day.name}>
              {index > 0 && <Separator className="my-6" />}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-lg text-foreground">{day.name}</h4>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor={`isWorkDay-${index}`} className="text-sm text-muted-foreground">
                      Dia de Trabalho
                    </Label>
                    <Switch
                      id={`isWorkDay-${index}`}
                      checked={day.isWorkDay}
                      onCheckedChange={(checked) => handleScheduleChange(index, 'isWorkDay', checked)}
                    />
                  </div>
                </div>

                {day.isWorkDay && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                    {/* Work Hours */}
                    <div className="space-y-1">
                      <Label htmlFor={`workStart-${index}`} className="text-xs">Horário de Início (Trabalho)</Label>
                      <Input
                        id={`workStart-${index}`}
                        type="time"
                        value={day.workStart}
                        onChange={(e) => handleScheduleChange(index, 'workStart', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`workEnd-${index}`} className="text-xs">Horário de Fim (Trabalho)</Label>
                      <Input
                        id={`workEnd-${index}`}
                        type="time"
                        value={day.workEnd}
                        onChange={(e) => handleScheduleChange(index, 'workEnd', e.target.value)}
                      />
                    </div>

                    {/* Break Hours */}
                    <div className="space-y-1">
                      <Label htmlFor={`breakStart-${index}`} className="text-xs">Início da Pausa (Opcional)</Label>
                      <Input
                        id={`breakStart-${index}`}
                        type="time"
                        value={day.breakStart}
                        onChange={(e) => handleScheduleChange(index, 'breakStart', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`breakEnd-${index}`} className="text-xs">Fim da Pausa (Opcional)</Label>
                      <Input
                        id={`breakEnd-${index}`}
                        type="time"
                        value={day.breakEnd}
                        onChange={(e) => handleScheduleChange(index, 'breakEnd', e.target.value)}
                      />
                    </div>
                  </div>
                )}
                {!day.isWorkDay && (
                  <p className="text-sm text-muted-foreground">Dia de descanso.</p>
                )}
              </div>
            </React.Fragment>
          ))}
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveAvailability} className="ml-auto bg-primary hover:bg-primary/90 text-primary-foreground">
            <Save className="mr-2 h-4 w-4" /> Salvar Disponibilidade
          </Button>
        </CardFooter>
      </Card>

    </div>
  );
}


    