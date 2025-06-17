
'use client'

import React, { useState, useMemo, useEffect } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight, Users, Edit, PlusCircle, Clock } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  format, 
  addMonths, 
  subMonths, 
  isSameMonth, 
  isSameDay, 
  getDay,
  set,
  addMinutes,
  isBefore,
  isAfter,
  isEqual,
  parseISO
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { BookedClass, CoachAvailability, DailyAvailability, Student } from '@/types';
import { INITIAL_MOCK_BOOKED_CLASSES, MOCK_COACH_AVAILABILITY, MOCK_STUDENTS } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface TimeSlot {
  time: string; // "HH:MM"
  isBooked: boolean;
  bookedClassDetails?: {
    title: string;
    location: string;
    studentsCount: number;
  };
}


export default function AgendaPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [bookedClasses, setBookedClasses] = useState<BookedClass[]>(INITIAL_MOCK_BOOKED_CLASSES);
  const { toast } = useToast();

  const [isStudentSelectionDialogOpen, setIsStudentSelectionDialogOpen] = useState(false);
  const [slotBeingBooked, setSlotBeingBooked] = useState<string | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentsList, setStudentsList] = useState<Student[]>([]);

  useEffect(() => {
    setStudentsList(MOCK_STUDENTS.filter(s => s.status === 'active'));
  }, []);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const daysWithEvents = useMemo(() => {
    return bookedClasses.map(c => parseISO(c.date));
  }, [bookedClasses]);

  const availableTimeSlots = useMemo((): TimeSlot[] => {
    if (!selectedDate) return [];

    const slots: TimeSlot[] = [];
    const numericDayOfWeek = getDay(selectedDate);
    
    const dailySchedule: DailyAvailability = MOCK_COACH_AVAILABILITY[numericDayOfWeek] || MOCK_COACH_AVAILABILITY.defaultDaily;

    if (!dailySchedule || dailySchedule.workRanges.length === 0) {
      return [];
    }

    const slotDurationMinutes = 60;

    dailySchedule.workRanges.forEach(workRange => {
      let currentSlotStartDateTime = set(selectedDate, {
        hours: parseInt(workRange.start.split(':')[0]),
        minutes: parseInt(workRange.start.split(':')[1]),
        seconds: 0,
        milliseconds: 0,
      });

      const workRangeEndDateTime = set(selectedDate, {
        hours: parseInt(workRange.end.split(':')[0]),
        minutes: parseInt(workRange.end.split(':')[1]),
        seconds: 0,
        milliseconds: 0,
      });

      while (isBefore(currentSlotStartDateTime, workRangeEndDateTime)) {
        const currentSlotEndDateTime = addMinutes(currentSlotStartDateTime, slotDurationMinutes);
        const slotTimeFormatted = format(currentSlotStartDateTime, 'HH:mm');

        let isWithinBreak = false;
        for (const breakRange of dailySchedule.breaks) {
          const breakStartDateTime = set(selectedDate, {
            hours: parseInt(breakRange.start.split(':')[0]),
            minutes: parseInt(breakRange.start.split(':')[1]),
            seconds: 0,
            milliseconds: 0,
          });
          const breakEndDateTime = set(selectedDate, {
            hours: parseInt(breakRange.end.split(':')[0]),
            minutes: parseInt(breakRange.end.split(':')[1]),
            seconds: 0,
            milliseconds: 0,
          });

          if (isBefore(currentSlotStartDateTime, breakEndDateTime) && isAfter(currentSlotEndDateTime, breakStartDateTime)) {
            isWithinBreak = true;
            break;
          }
        }

        if (isWithinBreak) {
          currentSlotStartDateTime = addMinutes(currentSlotStartDateTime, slotDurationMinutes);
          continue;
        }

        const bookedClass = bookedClasses.find(c => {
          const classDate = parseISO(c.date);
          const classStartDateTime = set(classDate, {
            hours: parseInt(c.time.split(':')[0]),
            minutes: parseInt(c.time.split(':')[1]),
            seconds: 0,
            milliseconds: 0,
          });
          return isSameDay(selectedDate, classDate) && isEqual(currentSlotStartDateTime, classStartDateTime);
        });

        if (bookedClass) {
          slots.push({
            time: slotTimeFormatted,
            isBooked: true,
            bookedClassDetails: {
              title: bookedClass.title,
              location: bookedClass.location,
              studentsCount: bookedClass.studentIds.length,
            },
          });
        } else {
          slots.push({ time: slotTimeFormatted, isBooked: false });
        }
        currentSlotStartDateTime = addMinutes(currentSlotStartDateTime, slotDurationMinutes);
      }
    });
    return slots.sort((a, b) => a.time.localeCompare(b.time));
  }, [selectedDate, bookedClasses]);

  const openStudentSelectionDialog = (time: string) => {
    if (!selectedDate) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma data primeiro.",
        variant: "destructive",
      });
      return;
    }
    setSlotBeingBooked(time);
    setSelectedStudentIds([]); 
    setIsStudentSelectionDialogOpen(true);
  };

  const handleStudentSelectionChange = (studentId: string, checked: boolean) => {
    setSelectedStudentIds(prevSelectedIds => {
      if (checked) {
        return [...prevSelectedIds, studentId];
      } else {
        return prevSelectedIds.filter(id => id !== studentId);
      }
    });
  };

  const handleConfirmBooking = () => {
    if (!selectedDate || !slotBeingBooked || selectedStudentIds.length === 0) {
      toast({
        title: "Erro ao Agendar",
        description: "Informações incompletas. Selecione data, horário e pelo menos um aluno.",
        variant: "destructive",
      });
      return;
    }

    let classTitle = "Aula em Grupo";
    let toastDescription = `Aula em grupo às ${slotBeingBooked} no dia ${format(selectedDate, 'dd/MM/yyyy')} foi agendada com ${selectedStudentIds.length} aluno(s).`;

    if (selectedStudentIds.length === 1) {
      const student = MOCK_STUDENTS.find(s => s.id === selectedStudentIds[0]);
      if (student) {
        classTitle = `Aula Particular - ${student.name}`;
        toastDescription = `Aula com ${student.name} às ${slotBeingBooked} no dia ${format(selectedDate, 'dd/MM/yyyy')} foi agendada.`;
      } else {
         classTitle = `Aula Agendada`; // Fallback
      }
    }


    const newBookedClass: BookedClass = {
      id: crypto.randomUUID(),
      date: format(selectedDate, 'yyyy-MM-dd'),
      time: slotBeingBooked,
      title: classTitle, 
      location: 'A definir', 
      studentIds: selectedStudentIds,
      durationMinutes: 60,
    };

    setBookedClasses(prevClasses => [...prevClasses, newBookedClass]);

    toast({
      title: "Aula Agendada!",
      description: toastDescription,
    });
    setIsStudentSelectionDialogOpen(false);
    setSlotBeingBooked(null);
    setSelectedStudentIds([]);
  };


  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground">Agenda de Aulas</h1>
          <p className="text-muted-foreground">Visualize sua disponibilidade e aulas agendadas.</p>
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

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-8">
        <Card className="md:col-span-2 xl:col-span-3 shadow-lg">
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
              modifiers={{ booked: daysWithEvents }}
              modifiersClassNames={{ booked: "font-bold text-primary" }}
              components={{
                DayContent: ({ date, displayMonth }) => {
                  const dayHasEvent = daysWithEvents.some(eventDate => isSameDay(eventDate, date));
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

        <Card className="md:col-span-1 xl:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl">
              Horários para {selectedDate ? format(selectedDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Data não selecionada'}
            </CardTitle>
            <CardDescription>Disponibilidade e aulas do dia.</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedDate ? (
              availableTimeSlots.length > 0 ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                  {availableTimeSlots.map((slot, index) => (
                    <div 
                      key={index} 
                      className={`p-4 border rounded-lg transition-colors text-sm
                        ${slot.isBooked ? 'bg-muted/70 border-muted-foreground/30' : 'bg-background hover:border-primary'}`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                           <Clock className={`h-4 w-4 mr-2 ${slot.isBooked ? 'text-muted-foreground' : 'text-primary'}`} />
                           <span className={`font-semibold ${slot.isBooked ? 'text-muted-foreground' : 'text-primary'}`}>{slot.time}</span>
                        </div>
                        {!slot.isBooked && (
                           <Button variant="outline" size="sm" onClick={() => openStudentSelectionDialog(slot.time)}>
                             <PlusCircle className="h-3.5 w-3.5 mr-1.5"/> Agendar
                           </Button>
                        )}
                      </div>
                      {slot.isBooked && slot.bookedClassDetails && (
                        <div className="mt-2 pl-6">
                          <p className="font-medium text-foreground">{slot.bookedClassDetails.title}</p>
                          <p className="text-xs text-muted-foreground">{slot.bookedClassDetails.location}</p>
                          <div className="mt-1 flex items-center text-xs text-muted-foreground">
                            <Users className="h-3 w-3 mr-1" /> {slot.bookedClassDetails.studentsCount} aluno(s)
                          </div>
                           <Button variant="link" size="sm" className="mt-1 px-0 h-auto text-xs">
                             <Edit className="h-3 w-3 mr-1"/> Gerenciar Aula
                           </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum horário de trabalho configurado para este dia ou todos os horários são pausas.
                </p>
              )
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Selecione uma data no calendário para ver os horários.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isStudentSelectionDialogOpen} onOpenChange={setIsStudentSelectionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agendar Aula para {slotBeingBooked}</DialogTitle>
            <DialogDescription>
              Selecione o(s) aluno(s) para o horário de {slotBeingBooked} em {selectedDate ? format(selectedDate, 'dd/MM/yyyy', { locale: ptBR }) : ''}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="mb-2 block">Alunos Ativos</Label>
            <ScrollArea className="h-[200px] w-full rounded-md border p-4">
              {studentsList.length > 0 ? (
                studentsList.map(student => (
                  <div key={student.id} className="flex items-center space-x-2 mb-2">
                    <Checkbox
                      id={`student-${student.id}`}
                      checked={selectedStudentIds.includes(student.id)}
                      onCheckedChange={(checked) => handleStudentSelectionChange(student.id, !!checked)}
                    />
                    <Label htmlFor={`student-${student.id}`} className="font-normal">
                      {student.name}
                    </Label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum aluno ativo encontrado.</p>
              )}
            </ScrollArea>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="button" onClick={handleConfirmBooking} disabled={selectedStudentIds.length === 0}>
              Confirmar Agendamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

