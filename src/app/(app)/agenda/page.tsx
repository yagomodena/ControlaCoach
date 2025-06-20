
'use client'

import React, { useState, useMemo, useEffect } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Users, Edit, PlusCircle, Clock, Trash2, Search, UserCircle, Loader2, MapPin } from "lucide-react"; // Added MapPin
import Link from 'next/link';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import type { BookedClass, DailyAvailability, Student, Location, DayOfWeek } from '@/types';
import { INITIAL_MOCK_BOOKED_CLASSES, MOCK_COACH_AVAILABILITY, getDayOfWeekName, DAYS_OF_WEEK } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/firebase';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';

interface TimeSlot {
  time: string; 
  isBooked: boolean;
  bookingType?: 'one-off' | 'recurring-student';
  bookedClassDetails?: { 
    id: string; 
    title: string;
    location: string;
    studentsCount: number;
  };
  recurringStudentDetails?: { 
    studentName: string;
    location?: string;
  };
}


export default function AgendaPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [bookedClasses, setBookedClasses] = useState<BookedClass[]>(INITIAL_MOCK_BOOKED_CLASSES);
  const { toast } = useToast();

  const [isStudentSelectionDialogOpen, setIsStudentSelectionDialogOpen] = useState(false);
  const [slotBeingBooked, setSlotBeingBooked] = useState<string | null>(null);
  const [selectedStudentIdsForBooking, setSelectedStudentIdsForBooking] = useState<string[]>([]);
  
  const [isEditClassDialogOpen, setIsEditClassDialogOpen] = useState(false);
  const [classBeingEdited, setClassBeingEdited] = useState<BookedClass | null>(null);
  const [editedClassTitle, setEditedClassTitle] = useState('');
  const [editedClassLocation, setEditedClassLocation] = useState('');
  const [editedClassStudentIds, setEditedClassStudentIds] = useState<string[]>([]);

  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [activeStudentsList, setActiveStudentsList] = useState<Student[]>([]);
  const [activeLocations, setActiveLocations] = useState<Location[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);

  useEffect(() => {
    setIsLoadingStudents(true);
    const studentsCollectionRef = collection(db, 'students');
    const qStudents = query(studentsCollectionRef, orderBy('name', 'asc'));

    const unsubscribeStudents = onSnapshot(qStudents, (snapshot) => {
      const studentsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Student));
      setAllStudents(studentsData);
      setActiveStudentsList(studentsData.filter(s => s.status === 'active'));
      setIsLoadingStudents(false);
    }, (error) => {
      console.error("Error fetching students: ", error);
      toast({
        title: "Erro ao Carregar Alunos",
        description: "Não foi possível buscar os dados dos alunos para a agenda.",
        variant: "destructive",
      });
      setIsLoadingStudents(false);
    });

    setIsLoadingLocations(true);
    const locationsCollectionRef = collection(db, 'locations');
    const qLocations = query(locationsCollectionRef, where('status', '==', 'active'), orderBy('name', 'asc'));
    const unsubscribeLocations = onSnapshot(qLocations, (snapshot) => {
      const locationsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Location));
      setActiveLocations(locationsData);
      setIsLoadingLocations(false);
    }, (error) => {
      console.error("Error fetching active locations: ", error);
      toast({ title: "Erro ao Carregar Locais", variant: "destructive" });
      setIsLoadingLocations(false);
    });

    return () => {
        unsubscribeStudents();
        unsubscribeLocations();
    };
  }, [toast]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const daysWithEvents = useMemo(() => {
    const eventDates = new Set<string>();
    bookedClasses.forEach(c => eventDates.add(format(parseISO(c.date), 'yyyy-MM-dd')));

    if(selectedDate) { 
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();

        allStudents.forEach(student => {
            if (student.recurringClassTime && student.recurringClassDays && student.recurringClassDays.length > 0) {
                for (let day = 1; day <= 31; day++) {
                    try {
                        const dateInMonth = new Date(year, month, day);
                        if (dateInMonth.getMonth() !== month) continue; 
                        
                        const dayOfWeekName = getDayOfWeekName(getDay(dateInMonth));
                        if (dayOfWeekName && student.recurringClassDays.includes(dayOfWeekName)) {
                             eventDates.add(format(dateInMonth, 'yyyy-MM-dd'));
                        }
                    } catch (e) { /* ignore invalid dates like Feb 30 */ }
                }
            }
        });
    }
    return Array.from(eventDates).map(dateStr => parseISO(dateStr));
  }, [bookedClasses, allStudents, currentMonth, selectedDate]);

  const availableTimeSlots = useMemo((): TimeSlot[] => {
    if (!selectedDate) return [];

    const slots: TimeSlot[] = [];
    const numericDayOfWeek = getDay(selectedDate);
    const dayOfWeekName = getDayOfWeekName(numericDayOfWeek);
    
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
          });
          const breakEndDateTime = set(selectedDate, {
            hours: parseInt(breakRange.end.split(':')[0]),
            minutes: parseInt(breakRange.end.split(':')[1]),
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
          });
          return isSameDay(selectedDate, classDate) && isEqual(currentSlotStartDateTime, classStartDateTime);
        });

        if (bookedClass) {
          slots.push({
            time: slotTimeFormatted,
            isBooked: true,
            bookingType: 'one-off',
            bookedClassDetails: {
              id: bookedClass.id, 
              title: bookedClass.title,
              location: bookedClass.location,
              studentsCount: bookedClass.studentIds.length,
            },
          });
          currentSlotStartDateTime = addMinutes(currentSlotStartDateTime, slotDurationMinutes);
          continue; 
        }

        let recurringStudentBookedThisSlot: Student | undefined = undefined;
        if (dayOfWeekName) {
            for (const student of allStudents) {
                if (
                    student.status === 'active' &&
                    student.recurringClassTime === slotTimeFormatted &&
                    student.recurringClassDays?.includes(dayOfWeekName)
                ) {
                    recurringStudentBookedThisSlot = student;
                    break; 
                }
            }
        }

        if (recurringStudentBookedThisSlot) {
            slots.push({
                time: slotTimeFormatted,
                isBooked: true,
                bookingType: 'recurring-student',
                recurringStudentDetails: {
                    studentName: recurringStudentBookedThisSlot.name,
                    location: recurringStudentBookedThisSlot.recurringClassLocation || 'A definir',
                },
            });
        } else {
          slots.push({ time: slotTimeFormatted, isBooked: false });
        }
        currentSlotStartDateTime = addMinutes(currentSlotStartDateTime, slotDurationMinutes);
      }
    });
    return slots.sort((a, b) => a.time.localeCompare(b.time));
  }, [selectedDate, bookedClasses, allStudents]);

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
    setSelectedStudentIdsForBooking([]); 
    setIsStudentSelectionDialogOpen(true);
  };

  const handleStudentSelectionChangeForBooking = (studentId: string, checked: boolean) => {
    setSelectedStudentIdsForBooking(prevSelectedIds => {
      if (checked) {
        return [...prevSelectedIds, studentId];
      } else {
        return prevSelectedIds.filter(id => id !== studentId);
      }
    });
  };

  const handleConfirmBooking = () => {
    if (!selectedDate || !slotBeingBooked || selectedStudentIdsForBooking.length === 0) {
      toast({
        title: "Erro ao Agendar",
        description: "Informações incompletas. Selecione data, horário e pelo menos um aluno.",
        variant: "destructive",
      });
      return;
    }

    let classTitle = "Aula em Grupo";
    let toastDescription = `Aula em grupo às ${slotBeingBooked} no dia ${format(selectedDate, 'dd/MM/yyyy')} foi agendada com ${selectedStudentIdsForBooking.length} aluno(s).`;

    if (selectedStudentIdsForBooking.length === 1) {
      const student = allStudents.find(s => s.id === selectedStudentIdsForBooking[0]);
      if (student) {
        classTitle = `Aula Particular - ${student.name}`;
        toastDescription = `Aula com ${student.name} às ${slotBeingBooked} no dia ${format(selectedDate, 'dd/MM/yyyy')} foi agendada.`;
      } else {
         classTitle = `Aula Agendada`; 
      }
    }

    const newBookedClass: BookedClass = {
      id: crypto.randomUUID(),
      date: format(selectedDate, 'yyyy-MM-dd'),
      time: slotBeingBooked,
      title: classTitle, 
      location: 'A definir', 
      studentIds: selectedStudentIdsForBooking,
      durationMinutes: 60,
    };

    setBookedClasses(prevClasses => [...prevClasses, newBookedClass]);

    toast({
      title: "Aula Agendada!",
      description: toastDescription,
    });
    setIsStudentSelectionDialogOpen(false);
    setSlotBeingBooked(null);
    setSelectedStudentIdsForBooking([]);
  };

  const openEditClassDialog = (classId: string) => {
    const classToEdit = bookedClasses.find(c => c.id === classId);
    if (classToEdit) {
      setClassBeingEdited(classToEdit);
      setEditedClassTitle(classToEdit.title);
      setEditedClassLocation(classToEdit.location);
      setEditedClassStudentIds([...classToEdit.studentIds]);
      setIsEditClassDialogOpen(true);
    } else {
      toast({ title: "Erro", description: "Aula não encontrada para edição.", variant: "destructive" });
    }
  };

  const handleStudentSelectionChangeForEdit = (studentId: string, checked: boolean) => {
    setEditedClassStudentIds(prevSelectedIds => {
      if (checked) {
        return [...prevSelectedIds, studentId];
      } else {
        return prevSelectedIds.filter(id => id !== studentId);
      }
    });
  };

  const handleSaveChangesToClass = () => {
    if (!classBeingEdited || editedClassStudentIds.length === 0 || !editedClassTitle || !editedClassLocation) {
      toast({
        title: "Erro ao Salvar",
        description: "Informações incompletas. Título, local e ao menos um aluno são necessários.",
        variant: "destructive",
      });
      return;
    }

    setBookedClasses(prevClasses => 
      prevClasses.map(c => 
        c.id === classBeingEdited.id 
          ? { ...c, title: editedClassTitle, location: editedClassLocation, studentIds: editedClassStudentIds } 
          : c
      )
    );

    toast({
      title: "Aula Atualizada!",
      description: `A aula às ${classBeingEdited.time} foi atualizada.`,
    });
    setIsEditClassDialogOpen(false);
    setClassBeingEdited(null);
  };

  const handleDeleteClass = () => {
    if (!classBeingEdited) return;

    if (window.confirm(`Tem certeza que deseja excluir a aula "${classBeingEdited.title}" de ${format(parseISO(classBeingEdited.date), 'dd/MM/yyyy')} às ${classBeingEdited.time}?`)) {
        setBookedClasses(prevClasses => prevClasses.filter(c => c.id !== classBeingEdited.id));
        toast({
            title: "Aula Excluída!",
            description: `A aula "${classBeingEdited.title}" foi excluída.`,
        });
        setIsEditClassDialogOpen(false);
        setClassBeingEdited(null);
    }
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
            {isLoadingStudents || isLoadingLocations ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">Carregando dados...</p>
              </div>
            ) : selectedDate ? (
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
                      {slot.isBooked && slot.bookedClassDetails && slot.bookingType === 'one-off' && (
                        <div className="mt-2 pl-6">
                          <p className="font-medium text-foreground">{slot.bookedClassDetails.title}</p>
                          <p className="text-xs text-muted-foreground flex items-center"><MapPin className="h-3 w-3 mr-1"/>{slot.bookedClassDetails.location}</p>
                          <div className="mt-1 flex items-center text-xs text-muted-foreground">
                            <Users className="h-3 w-3 mr-1" /> {slot.bookedClassDetails.studentsCount} aluno(s)
                          </div>
                           <Button variant="link" size="sm" className="mt-1 px-0 h-auto text-xs" onClick={() => openEditClassDialog(slot.bookedClassDetails!.id)}>
                             <Edit className="h-3 w-3 mr-1"/> Gerenciar Aula
                           </Button>
                        </div>
                      )}
                      {slot.isBooked && slot.recurringStudentDetails && slot.bookingType === 'recurring-student' && (
                        <div className="mt-2 pl-6">
                           <p className="font-medium text-foreground">Aula Recorrente</p>
                           <p className="text-sm text-foreground/90">{slot.recurringStudentDetails.studentName}</p>
                           <p className="text-xs text-muted-foreground flex items-center"><MapPin className="h-3 w-3 mr-1"/>{slot.recurringStudentDetails.location}</p>
                           <div className="mt-1 flex items-center text-xs text-muted-foreground">
                             <UserCircle className="h-3 w-3 mr-1" /> Aluno Fixo
                           </div>
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
              {isLoadingStudents ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : activeStudentsList.length > 0 ? (
                activeStudentsList.map(student => (
                  <div key={student.id} className="flex items-center space-x-2 mb-2">
                    <Checkbox
                      id={`book-student-${student.id}`}
                      checked={selectedStudentIdsForBooking.includes(student.id)}
                      onCheckedChange={(checked) => handleStudentSelectionChangeForBooking(student.id, !!checked)}
                    />
                    <Label htmlFor={`book-student-${student.id}`} className="font-normal">
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
            <Button type="button" onClick={handleConfirmBooking} disabled={selectedStudentIdsForBooking.length === 0 || isLoadingStudents}>
              Confirmar Agendamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditClassDialogOpen} onOpenChange={setIsEditClassDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Gerenciar Aula - {classBeingEdited?.time}</DialogTitle>
            <DialogDescription>
              Edite os detalhes da aula de {classBeingEdited?.time} em {classBeingEdited ? format(parseISO(classBeingEdited.date), 'dd/MM/yyyy', { locale: ptBR }) : ''}.
            </DialogDescription>
          </DialogHeader>
          {classBeingEdited && (
            <div className="py-4 space-y-4">
              <div>
                <Label htmlFor="editClassTitle" className="mb-1 block">Título da Aula</Label>
                <Input 
                  id="editClassTitle" 
                  value={editedClassTitle} 
                  onChange={(e) => setEditedClassTitle(e.target.value)} 
                  placeholder="Ex: Aula Particular - João"
                />
              </div>
              <div>
                <Label htmlFor="editClassLocation" className="mb-1 block flex items-center"><MapPin className="h-4 w-4 mr-1"/>Local da Aula</Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={editedClassLocation}
                    onValueChange={setEditedClassLocation}
                    disabled={isLoadingLocations}
                  >
                    <SelectTrigger id="editClassLocation" className="flex-grow">
                      <SelectValue placeholder={isLoadingLocations ? "Carregando..." : "Selecione o local"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A definir">A definir</SelectItem>
                      {activeLocations.map(loc => (
                        <SelectItem key={loc.id} value={loc.name}>{loc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" asChild>
                    <Link href="/locais/novo" target="_blank" rel="noopener noreferrer">
                      <PlusCircle className="h-4 w-4" />
                      <span className="sr-only">Adicionar Novo Local</span>
                    </Link>
                  </Button>
                  <Button variant="outline" size="icon" asChild>
                    <Link href="/locais" target="_blank" rel="noopener noreferrer">
                      <Search className="h-4 w-4" />
                      <span className="sr-only">Consultar Locais</span>
                    </Link>
                  </Button>
                </div>
              </div>
              <div>
                <Label className="mb-2 block">Alunos Inscritos</Label>
                <ScrollArea className="h-[180px] w-full rounded-md border p-4">
                 {isLoadingStudents ? (
                    <div className="flex justify-center items-center h-full">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : activeStudentsList.length > 0 ? (
                    activeStudentsList.map(student => (
                      <div key={student.id} className="flex items-center space-x-2 mb-2">
                        <Checkbox
                          id={`edit-student-${student.id}`}
                          checked={editedClassStudentIds.includes(student.id)}
                          onCheckedChange={(checked) => handleStudentSelectionChangeForEdit(student.id, !!checked)}
                        />
                        <Label htmlFor={`edit-student-${student.id}`} className="font-normal">
                          {student.name}
                        </Label>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum aluno ativo encontrado.</p>
                  )}
                </ScrollArea>
              </div>
            </div>
          )}
          <DialogFooter className="sm:justify-between">
            <Button type="button" variant="destructive" onClick={handleDeleteClass} className="sm:mr-auto">
              <Trash2 className="mr-2 h-4 w-4" /> Excluir Aula
            </Button>
            <div className="flex gap-2 mt-2 sm:mt-0">
                <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="button" onClick={handleSaveChangesToClass} disabled={editedClassStudentIds.length === 0 || !editedClassTitle || !editedClassLocation || isLoadingStudents || isLoadingLocations}>
                Salvar Alterações
                </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
