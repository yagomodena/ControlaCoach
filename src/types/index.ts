

export interface Student {
  id: string;
  name: string;
  phone: string;
  plan: 'Mensal' | 'Trimestral' | 'Avulso';
  technicalLevel: 'Iniciante' | 'Intermediário' | 'Avançado';
  status: 'active' | 'inactive';
  registrationDate: string; // ISO date string
  objective?: string;
  attendanceHistory?: { date: string; classId: string; status: 'present' | 'absent' | 'rescheduled' }[];
  
  paymentStatus?: 'pago' | 'pendente' | 'vencido';
  dueDate?: string; // ISO date string
  amountDue?: number;
  paymentMethod?: 'PIX' | 'Dinheiro' | 'Cartão';
  lastPaymentDate?: string; // ISO date string
}

export interface ClassSession {
  id: string;
  dayOfWeek: 'Segunda' | 'Terça' | 'Quarta' | 'Quinta' | 'Sexta' | 'Sábado' | 'Domingo';
  time: string; // e.g., "18:00"
  location: string; // Location name string
  maxStudents: number;
  enrolledStudentIds: string[];
}

export interface BookedClass {
  id: string;
  classSessionId?: string; 
  title: string; 
  date: string; 
  time: string; 
  durationMinutes?: number; 
  location: string; // Location name string
  studentIds: string[]; 
}


export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  paymentDate: string; // ISO date string
  dueDate: string; // ISO date string
  status: 'pago' | 'pendente' | 'vencido';
  method: 'PIX' | 'Dinheiro' | 'Cartão';
  referenceMonth?: string; // e.g., "2024-07"
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

// Mock data for students
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
      { date: '2024-07-01', classId: 'c1', status: 'present' },
      { date: '2024-07-03', classId: 'c1', status: 'present' },
    ],
    lastPaymentDate: '2024-07-05',
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
      { date: '2024-07-02', classId: 'c2', status: 'present' },
      { date: '2024-07-04', classId: 'c2', status: 'absent' },
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
        { date: '2024-07-01', classId: 'c1', status: 'present' },
        { date: '2024-07-08', classId: 'c1', status: 'present' },
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
        { date: '2024-07-15', classId: 'c3', status: 'present' },
    ],
  }
];

export let MOCK_CLASS_SESSIONS: ClassSession[] = [
  { id: 'c1', dayOfWeek: 'Segunda', time: '18:00', location: 'Praia Central', maxStudents: 10, enrolledStudentIds: ['1', '2', 's3', 's4', 's5', 's6', 's7', 's8'] },
  { id: 'c2', dayOfWeek: 'Segunda', time: '19:00', location: 'Praia Central', maxStudents: 10, enrolledStudentIds: ['s9', 's10', 's11', 's12', 's13', 's14', 's15', 's16', 's17', 's18'] },
  { id: 'c3', dayOfWeek: 'Terça', time: '07:00', location: 'Quadra Coberta A', maxStudents: 12, enrolledStudentIds: ['s19', 's20', 's21', 's22', 's23', 's24', 's25', 's26', 's27'] },
  { id: 'c4', dayOfWeek: 'Quarta', time: '18:30', location: 'Praia do Tombo', maxStudents: 8, enrolledStudentIds: ['s28', 's29', 's30', 's31', 's32'] },
  { id: 'c5', dayOfWeek: 'Quinta', time: '07:00', location: 'Quadra Coberta B', maxStudents: 12, enrolledStudentIds: ['s33', 's34', 's35', 's36', 's37', 's38', 's39', 's40', 's41', 's42', 's43'] },
];

export const DAYS_OF_WEEK: ClassSession['dayOfWeek'][] = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export let INITIAL_MOCK_BOOKED_CLASSES: BookedClass[] = [
  { id: 'bc1', date: '2024-07-29', time: '18:00', title: 'Futevôlei Iniciante', location: 'Praia Central', studentIds: ['1'], durationMinutes: 60 },
  { id: 'bc2', date: '2024-07-29', time: '19:00', title: 'Futevôlei Intermediário', location: 'Praia Central', studentIds: ['2', '4'], durationMinutes: 60 },
  { id: 'bc3', date: '2024-07-30', time: '07:00', title: 'Futevôlei Avançado', location: 'Quadra Coberta A', studentIds: ['3'], durationMinutes: 60 },
  { id: 'bc4', date: '2024-08-01', time: '18:30', title: 'Técnica e Tática', location: 'Praia do Tombo', studentIds: ['s28', 's29'], durationMinutes: 90 },
  { id: 'bc5', date: '2024-08-05', time: '09:00', title: 'Aula Particular - Ana S.', location: 'Praia Central', studentIds:['1'], durationMinutes: 60},
];

export const MOCK_COACH_AVAILABILITY: CoachAvailability = {
  1: { workRanges: [{ start: '08:00', end: '18:00' }], breaks: [{ start: '12:00', end: '13:30' }] },
  2: { workRanges: [{ start: '08:00', end: '18:00' }], breaks: [{ start: '12:00', end: '13:30' }] },
  3: { workRanges: [{ start: '08:00', end: '18:00' }], breaks: [{ start: '12:00', end: '13:30' }] },
  4: { workRanges: [{ start: '08:00', end: '18:00' }], breaks: [{ start: '12:00', end: '13:30' }] },
  5: { workRanges: [{ start: '08:00', end: '18:00' }], breaks: [{ start: '12:00', end: '13:30' }] },
  6: { workRanges: [{ start: '08:00', end: '12:00' }], breaks: [] },
  0: { workRanges: [{ start: '08:00', end: '12:00' }], breaks: [] },
  defaultDaily: { workRanges: [], breaks: [] } 
};

export let MOCK_LOCATIONS: Location[] = [
    { id: 'loc1', name: 'Praia Central', status: 'active' },
    { id: 'loc2', name: 'Quadra Coberta A', status: 'active' },
    { id: 'loc3', name: 'Praia do Tombo', status: 'active' },
    { id: 'loc4', name: 'Academia FitX', status: 'active' },
    { id: 'loc5', name: 'Parque da Cidade', status: 'inactive' },
];
