

export type DayOfWeek = 'Segunda' | 'Terça' | 'Quarta' | 'Quinta' | 'Sexta' | 'Sábado' | 'Domingo';
export const DAYS_OF_WEEK: DayOfWeek[] = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export interface Student {
  id: string;
  name: string;
  phone: string;
  plan: string; 
  technicalLevel: 'Iniciante' | 'Intermediário' | 'Avançado';
  status: 'active' | 'inactive';
  registrationDate: string; 
  objective?: string;
  attendanceHistory?: { date: string; classId: string; bookedClassId: string; status: 'present' | 'absent' | 'rescheduled' | 'pending' }[];
  
  paymentStatus?: 'pago' | 'pendente' | 'vencido';
  dueDate?: string; 
  amountDue?: number;
  paymentMethod?: 'PIX' | 'Dinheiro' | 'Cartão';
  lastPaymentDate?: string; 

  recurringClassTime?: string; 
  recurringClassDays?: DayOfWeek[]; 
  recurringClassLocation?: string; 
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  durationDays: number; 
  status: 'active' | 'inactive';
}

export interface ClassSession {
  id: string;
  dayOfWeek: DayOfWeek;
  startTime: string; 
  endTime: string;   
  location: string; 
  maxStudents: number;
  enrolledStudentIds: string[]; 
}

export interface BookedClass {
  id: string;
  classSessionId?: string; 
  title: string; 
  date: string; 
  time: string; // This is the start time of the booked class instance
  durationMinutes?: number; 
  location: string; 
  studentIds: string[]; 
  attendance?: Record<string, Student['attendanceHistory'][0]['status']>;
}


export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  paymentDate: string; 
  dueDate: string; 
  status: 'pago' | 'pendente' | 'vencido';
  method: 'PIX' | 'Dinheiro' | 'Cartão';
  referenceMonth?: string; 
  receiptUrl?: string;
}

export interface AppSettings {
  coachName: string;
  defaultLocations: string[];
  defaultPlans: { name: string; price: number; durationDays: number }[];
}

export interface TimeRange {
  start: string; 
  end: string;   
}

export interface DailyAvailability {
  workRanges: TimeRange[];
  breaks: TimeRange[];
}

export type CoachAvailability = {
  [dayOfWeek: number]: DailyAvailability; 
  defaultDaily: DailyAvailability; 
};

export interface Location {
  id: string;
  name: string;
  status: 'active' | 'inactive';
}


export const MOCK_STUDENTS: Student[] = [
  {
    id: '1',
    name: 'Ana Silva',
    phone: '(11) 98765-4321',
    plan: 'Mensal', 
    technicalLevel: 'Iniciante',
    status: 'active',
    registrationDate: '2023-01-15',
    objective: 'Melhorar o condicionamento físico e aprender os fundamentos do futevôlei.',
    paymentStatus: 'pago',
    dueDate: '2024-08-05',
    amountDue: 150,
    paymentMethod: 'PIX',
    attendanceHistory: [
      { date: '2024-07-01', classId: 'c1', bookedClassId: 'bc1', status: 'present' },
      { date: '2024-07-03', classId: 'c1', bookedClassId: 'bc1', status: 'present' },
    ],
    lastPaymentDate: '2024-07-05',
    recurringClassTime: '09:00',
    recurringClassDays: ['Segunda', 'Quarta'],
    recurringClassLocation: 'Praia Central',
  },
  {
    id: '2',
    name: 'Bruno Costa',
    phone: '(21) 91234-5678',
    plan: 'Trimestral', 
    technicalLevel: 'Intermediário',
    status: 'active',
    registrationDate: '2022-11-20',
    objective: 'Aprimorar técnicas de ataque e defesa, participar de torneios amadores.',
    paymentStatus: 'pendente',
    dueDate: '2024-07-20',
    amountDue: 400,
    paymentMethod: 'Cartão',
    attendanceHistory: [
      { date: '2024-07-02', classId: 'c2', bookedClassId: 'bc2', status: 'present' },
      { date: '2024-07-04', classId: 'c2', bookedClassId: 'bc2', status: 'absent' },
    ],
  },
  {
    id: '3',
    name: 'Carlos Dias',
    phone: '(31) 99999-8888',
    plan: 'Mensal', 
    technicalLevel: 'Avançado',
    status: 'inactive',
    registrationDate: '2023-05-10',
    objective: 'Manter a forma física e jogar em alto nível.',
    paymentStatus: 'vencido',
    dueDate: '2024-06-10',
    amountDue: 150,
    paymentMethod: 'Dinheiro',
    attendanceHistory: [],
    recurringClassTime: '10:00',
    recurringClassDays: ['Sexta'],
    recurringClassLocation: 'Quadra Coberta A',
  },
   {
    id: '4',
    name: 'Daniela Rocha',
    phone: '(41) 98888-7777',
    plan: 'Mensal', 
    technicalLevel: 'Intermediário',
    status: 'active',
    registrationDate: '2023-08-01',
    objective: 'Aprender o saque tubarão e melhorar o posicionamento em quadra.',
    paymentStatus: 'pago',
    dueDate: '2024-08-10',
    amountDue: 150,
    paymentMethod: 'PIX',
    attendanceHistory: [
        { date: '2024-07-01', classId: 'c1', bookedClassId: 'bc_daniela1', status: 'present' },
        { date: '2024-07-08', classId: 'c1', bookedClassId: 'bc_daniela2', status: 'present' },
    ],
    lastPaymentDate: '2024-07-10',
  },
  {
    id: '5',
    name: 'Eduardo Lima',
    phone: '(51) 97777-6666',
    plan: 'Avulso', 
    technicalLevel: 'Iniciante',
    status: 'active',
    registrationDate: '2024-06-15',
    objective: 'Experimentar o futevôlei e decidir se matricula em plano fixo.',
    paymentStatus: 'pendente',
    dueDate: '2024-07-25',
    amountDue: 50,
    paymentMethod: 'PIX',
    attendanceHistory: [
        { date: '2024-07-15', classId: 'c3', bookedClassId: 'bc_eduardo1', status: 'present' },
    ],
  }
];

export let MOCK_CLASS_SESSIONS: ClassSession[] = [
  { id: 'c1', dayOfWeek: 'Segunda', startTime: '18:00', endTime: '19:00', location: 'Praia Central', maxStudents: 10, enrolledStudentIds: ['1', '2', '4'] },
  { id: 'c2', dayOfWeek: 'Segunda', startTime: '19:00', endTime: '20:00', location: 'Praia Central', maxStudents: 10, enrolledStudentIds: ['2'] },
  { id: 'c3', dayOfWeek: 'Terça', startTime: '07:00', endTime: '08:30', location: 'Quadra Coberta A', maxStudents: 12, enrolledStudentIds: [] },
  { id: 'c4', dayOfWeek: 'Quarta', startTime: '18:30', endTime: '20:00', location: 'Praia do Tombo', maxStudents: 8, enrolledStudentIds: ['1', '4', '5'] },
  { id: 'c5', dayOfWeek: 'Quinta', startTime: '07:00', endTime: '08:00', location: 'Quadra Coberta B', maxStudents: 12, enrolledStudentIds: [] },
];


export let INITIAL_MOCK_BOOKED_CLASSES: BookedClass[] = [
  { 
    id: 'bc2', 
    date: '2024-07-29', 
    time: '19:00', 
    title: 'Futevôlei Intermediário', 
    location: 'Praia Central', 
    studentIds: ['2', '4'], 
    durationMinutes: 60,
    attendance: { '2': 'present', '4': 'pending' }
  },
  { 
    id: 'bc3', 
    date: '2024-07-30', 
    time: '07:00', 
    title: 'Futevôlei Avançado', 
    location: 'Quadra Coberta A', 
    studentIds: ['3'], 
    durationMinutes: 60,
    attendance: { '3': 'absent'}
  },
  { 
    id: 'bc4', 
    date: '2024-08-01', 
    time: '18:30', 
    title: 'Técnica e Tática', 
    location: 'Praia do Tombo', 
    studentIds: ['s28', 's29'], 
    durationMinutes: 90 
  },
];

export const MOCK_COACH_AVAILABILITY: CoachAvailability = {
  1: { workRanges: [{ start: '08:00', end: '20:00' }], breaks: [{ start: '12:00', end: '13:30' }] }, // Mon
  2: { workRanges: [{ start: '08:00', end: '20:00' }], breaks: [{ start: '12:00', end: '13:30' }] }, // Tue
  3: { workRanges: [{ start: '08:00', end: '20:00' }], breaks: [{ start: '12:00', end: '13:30' }] }, // Wed
  4: { workRanges: [{ start: '08:00', end: '20:00' }], breaks: [{ start: '12:00', end: '13:30' }] }, // Thu
  5: { workRanges: [{ start: '08:00', end: '20:00' }], breaks: [{ start: '12:00', end: '13:30' }] }, // Fri
  6: { workRanges: [{ start: '08:00', end: '14:00' }], breaks: [] }, // Sat
  0: { workRanges: [{ start: '08:00', end: '12:00' }], breaks: [] }, // Sun
  defaultDaily: { workRanges: [], breaks: [] } 
};

export let MOCK_LOCATIONS: Location[] = [
    { id: 'loc1', name: 'Praia Central', status: 'active' },
    { id: 'loc2', name: 'Quadra Coberta A', status: 'active' },
    { id: 'loc3', name: 'Praia do Tombo', status: 'active' },
    { id: 'loc4', name: 'Academia FitX', status: 'active' },
    { id: 'loc5', name: 'Parque da Cidade', status: 'inactive' },
];

export let MOCK_PLANS: Plan[] = [
  { id: 'plan1', name: 'Mensal', price: 150, durationDays: 30, status: 'active' },
  { id: 'plan2', name: 'Trimestral', price: 400, durationDays: 90, status: 'active' },
  { id: 'plan3', name: 'Avulso', price: 50, durationDays: 1, status: 'active' },
  { id: 'plan4', name: 'Anual VIP', price: 1500, durationDays: 365, status: 'active' },
  { id: 'plan5', name: 'Experimental (Inativo)', price: 0, durationDays: 7, status: 'inactive' },
];

export const getDayOfWeekName = (dayNumber: number): DayOfWeek | undefined => {
  const map: Record<number, DayOfWeek> = {
    0: 'Domingo',
    1: 'Segunda',
    2: 'Terça',
    3: 'Quarta',
    4: 'Quinta',
    5: 'Sexta',
    6: 'Sábado',
  };
  return map[dayNumber];
};
