import { Student, Activity, StudentActivityRecord } from '../types';

export const INITIAL_STUDENTS: Student[] = [
  { id: 'st-1', name: 'Ana Souza', group: 'Turma 01', avatarColor: 'bg-emerald-600' },
  { id: 'st-2', name: 'Bruno Lima', group: 'Turma 01', avatarColor: 'bg-blue-600' },
  { id: 'st-3', name: 'Carla Dias', group: 'Turma 01', avatarColor: 'bg-amber-600' },
  { id: 'st-4', name: 'Daniel Alves', group: 'Turma 02', avatarColor: 'bg-purple-600' },
  { id: 'st-5', name: 'Elena Rost', group: 'Turma 02', avatarColor: 'bg-teal-600' },
];

export const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: 'act-1',
    title: 'Atividade 01 - Diagnóstico Inicial',
    dueDate: '2026-08-15',
    description: 'Realizar o questionário de nivelamento da formação.',
  },
  {
    id: 'act-2',
    title: 'Atividade 02 - Estudo de Caso Prático',
    dueDate: '2026-08-20',
    description: 'Entregar a resolução do estudo de caso referente ao módulo 1.',
  },
  {
    id: 'act-3',
    title: 'Atividade 03 - Avaliação Final',
    dueDate: '2026-08-28',
    description: 'Apresentação do projeto de conclusão.',
  },
];

export const INITIAL_RECORDS: StudentActivityRecord[] = [
  { id: 'st-1_act-1', studentId: 'st-1', activityId: 'act-1', status: 'concluido', updatedAt: '2026-08-04' },
  { id: 'st-1_act-2', studentId: 'st-1', activityId: 'act-2', status: 'em_progresso', updatedAt: '2026-08-05' },
  { id: 'st-1_act-3', studentId: 'st-1', activityId: 'act-3', status: 'pendente', updatedAt: '2026-08-06' },

  { id: 'st-2_act-1', studentId: 'st-2', activityId: 'act-1', status: 'concluido', updatedAt: '2026-08-04' },
  { id: 'st-2_act-2', studentId: 'st-2', activityId: 'act-2', status: 'pendente', updatedAt: '2026-08-06' },

  { id: 'st-3_act-1', studentId: 'st-3', activityId: 'act-3', status: 'em_progresso', updatedAt: '2026-08-05' },
];
