export type Status = 'pendente' | 'em_progresso' | 'concluido';

export interface Student {
  id: string;
  name: string;
  group: string; // Turma / Equipe
  avatarColor: string;
  role?: string;
}

export interface Activity {
  id: string;
  title: string;
  dueDate?: string;
  description?: string;
  assignedStudentIds?: string[];
  targetGroup?: string; // Turma específica ou 'ALL' / undefined para todas
}

export interface StudentActivityRecord {
  id: string; // `${studentId}_${activityId}`
  studentId: string;
  activityId: string;
  status: Status;
  updatedAt: string;
  notes?: string;
}

export type ViewMode = 'matrix' | 'students' | 'activities';

export type UserRole = 'admin' | 'viewer';

export type ScopeType = 'ALL_GROUPS' | 'SPECIFIC_GROUP' | 'SPECIFIC_STUDENT';

export interface AuthorizedUser {
  id: string; // doc id (lowercased email)
  email: string;
  name?: string;
  role: UserRole;
  targetScope: ScopeType;
  allowedGroup?: string; // e.g. 'Turma 01'
  allowedStudentId?: string; // specific student ID
  status: 'pending' | 'active'; // 'pending' = invited by admin, 'active' = account registered
  createdAt: string;
  invitedBy?: string;
}

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  actorEmail: string;
  actorName?: string;
  action:
    | 'LOGIN_SUCCESS'
    | 'LOGIN_FAILED'
    | 'STUDENT_MUTATED'
    | 'ACTIVITY_MUTATED'
    | 'RECORD_MUTATED'
    | 'USER_MUTATED'
    | 'DATA_RESET';
  details: string;
  severity: 'info' | 'warning' | 'critical';
  ipOrAgent?: string;
}
