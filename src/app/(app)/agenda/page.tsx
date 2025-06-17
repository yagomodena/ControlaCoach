'use client'

import React, { useState } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Users, Edit } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Mock data for classes on specific dates
const mockScheduledClasses = [
  { date: '2024-07-29', time: '18:00', title: 'Futevôlei Iniciante', location: 'Praia Central', students: ['Ana S.', 'Bruno C.'] },
  { date: '2024-07-29', time: '19:00', title: 'Futevôlei Intermediário', location: 'Praia Central', students: ['Carlos D.', 'Daniela R.', 'Eduardo L.'] },
  { date: '2024-07-30', time: '07:00', title: 'Futevôlei Avançado', location: 'Quadra Coberta A', students: ['Fernanda M.', 'Gabriel P.'] },
  { date: '2024-08-01', time: '18:30', title: 'Técnica e Tática', location: 'Praia do Tombo', students: ['Heloisa V.', 'Igor B.'] },
];


export default function AgendaPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const daysInMonth = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth), { locale: ptBR }),
    end: endOfWeek(endOfMonth(currentMonth), { locale: ptBR }),
  });

  const classesForSelectedDate = mockScheduledClasses.filter(c => 
    selectedDate && isSameDay(new Date(c.date), selectedDate)
  );

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground">Agenda de Aulas</h1>
          <p className="text-muted-foreground">Visualize e gerencie suas aulas agendadas.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth} aria-label="Mês anterior">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold text-foreground capitalize tabular-nums">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </h2>
          <Button variant="outline" size="icon" onClick={nextMonth} aria-label="Próximo mês">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="md:col-span-2 shadow-lg">
          <CardContent className="p-0">
             <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              locale={ptBR}
              className="w-full"
              classNames={{
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground",
              }}
              components={{
                DayContent: ({ date, displayMonth }) => {
                  const dayHasEvent = mockScheduledClasses.some(c => isSameDay(new Date(c.date), date));
                  return (
                    <div className="relative w-full h-full flex items-center justify-center">
                      {format(date, 'd')}
                      {dayHasEvent && isSameMonth(date, displayMonth) && (
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-primary"></span>
                      )}
                    </div>
                  );
                }
              }}
            />
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl">
              Aulas para {selectedDate ? format(selectedDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Data não selecionada'}
            </CardTitle>
            <CardDescription>Detalhes das aulas do dia selecionado.</CardDescription>
          </CardHeader>
          <CardContent>
            {classesForSelectedDate.length > 0 ? (
              <div className="space-y-4">
                {classesForSelectedDate.map((c, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-background hover:border-primary transition-colors">
                    <h4 className="font-semibold text-primary">{c.time} - {c.title}</h4>
                    <p className="text-sm text-muted-foreground">{c.location}</p>
                    <div className="mt-2 flex items-center text-sm text-muted-foreground">
                      <Users className="h-4 w-4 mr-1" /> {c.students.length} alunos
                    </div>
                    <ul className="text-xs list-disc list-inside pl-1 text-muted-foreground mt-1">
                        {c.students.slice(0,3).map(s => <li key={s}>{s}</li>)}
                        {c.students.length > 3 && <li>e mais {c.students.length - 3}...</li>}
                    </ul>
                    <Button variant="outline" size="sm" className="mt-3 w-full">
                      <Edit className="h-3 w-3 mr-1.5"/> Gerenciar Aula
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                {selectedDate ? 'Nenhuma aula agendada para este dia.' : 'Selecione uma data no calendário.'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
