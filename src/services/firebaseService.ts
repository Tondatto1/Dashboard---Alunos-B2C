import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  getDoc,
  writeBatch,
  query,
  where,
  getDocFromServer,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import {
  Student,
  Activity,
  StudentActivityRecord,
  AuthorizedUser,
  Turma,
  UserPreference,
} from '../types';
import { logSecurityEvent } from './auditService';
import { sanitizeInput } from '../utils/security';

const STUDENTS_COL = 'students';
const ACTIVITIES_COL = 'activities';
const RECORDS_COL = 'records';
const USERS_COL = 'authorized_users';
const TURMAS_COL = 'turmas';
const PREFERENCES_COL = 'user_preferences';

// Helper to remove undefined keys which Firestore rejects
function cleanObject<T extends Record<string, any>>(obj: T): T {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned as T;
}

// ----------------------------------------------------
// Real-time Subscriptions with Error Handling
// ----------------------------------------------------

export function subscribeStudents(
  onData: (students: Student[]) => void,
  onError?: (err: Error) => void
) {
  return onSnapshot(
    collection(db, STUDENTS_COL),
    (snapshot) => {
      const students = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Student[];
      onData(students);
    },
    (err) => {
      console.error('Erro ao escutar coleção de alunos:', err);
      if (onError) onError(err);
    }
  );
}

export function subscribeActivities(
  onData: (activities: Activity[]) => void,
  onError?: (err: Error) => void
) {
  return onSnapshot(
    collection(db, ACTIVITIES_COL),
    (snapshot) => {
      const activities = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Activity[];
      onData(activities);
    },
    (err) => {
      console.error('Erro ao escutar coleção de atividades:', err);
      if (onError) onError(err);
    }
  );
}

export function subscribeRecords(
  onData: (records: StudentActivityRecord[]) => void,
  onError?: (err: Error) => void
) {
  return onSnapshot(
    collection(db, RECORDS_COL),
    (snapshot) => {
      const records = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as StudentActivityRecord[];
      onData(records);
    },
    (err) => {
      console.error('Erro ao escutar coleção de registros de progresso:', err);
      if (onError) onError(err);
    }
  );
}

export function subscribeTurmas(
  onData: (turmas: Turma[]) => void,
  onError?: (err: Error) => void
) {
  return onSnapshot(
    collection(db, TURMAS_COL),
    (snapshot) => {
      const turmas = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Turma[];
      onData(turmas);
    },
    (err) => {
      console.error('Erro ao escutar coleção de turmas:', err);
      if (onError) onError(err);
    }
  );
}

export function subscribeAuthorizedUsers(
  onData: (users: AuthorizedUser[]) => void,
  onError?: (err: Error) => void
) {
  return onSnapshot(
    collection(db, USERS_COL),
    (snapshot) => {
      const users = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as AuthorizedUser[];
      onData(users);
    },
    (err) => {
      console.error('Erro ao escutar usuários autorizados:', err);
      if (onError) onError(err);
    }
  );
}

export function subscribeUserPreferences(
  email: string,
  onData: (pref: UserPreference | null) => void,
  onError?: (err: Error) => void
) {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return () => {};

  return onSnapshot(
    doc(db, PREFERENCES_COL, cleanEmail),
    (snapshot) => {
      if (snapshot.exists()) {
        onData({ id: snapshot.id, ...snapshot.data() } as UserPreference);
      } else {
        onData(null);
      }
    },
    (err) => {
      console.warn('Erro ao escutar preferências do usuário:', err);
      if (onError) onError(err);
    }
  );
}

// ----------------------------------------------------
// Master Admins Initialization
// ----------------------------------------------------

export async function ensureMasterAdminExists() {
  const now = new Date().toISOString().split('T')[0];
  const ceruttiEmail = 'cerutticonsultoria@gmail.com';
  const guilhermeEmail = 'guilhermetondatto@gmail.com';

  try {
    const ceruttiDoc = await getDoc(doc(db, USERS_COL, ceruttiEmail));
    if (!ceruttiDoc.exists() || ceruttiDoc.data()?.status !== 'active') {
      const ceruttiAdmin: AuthorizedUser = {
        id: ceruttiEmail,
        email: ceruttiEmail,
        name: 'Cerutti Consultoria (ADM)',
        role: 'admin',
        targetScope: 'ALL_GROUPS',
        status: 'active',
        createdAt: now,
      };
      await setDoc(doc(db, USERS_COL, ceruttiEmail), cleanObject(ceruttiAdmin));
    }

    const guilhermeDoc = await getDoc(doc(db, USERS_COL, guilhermeEmail));
    if (!guilhermeDoc.exists()) {
      const guilhermeAdmin: AuthorizedUser = {
        id: guilhermeEmail,
        email: guilhermeEmail,
        name: 'Guilherme Tondatto (ADM)',
        role: 'admin',
        targetScope: 'ALL_GROUPS',
        status: 'active',
        createdAt: now,
      };
      await setDoc(doc(db, USERS_COL, guilhermeEmail), cleanObject(guilhermeAdmin));
    }
  } catch (err) {
    console.warn('Notice while ensuring master admins exist in Firestore:', err);
  }
}

// ----------------------------------------------------
// Turmas (Groups) CRUD & Batch Synchronization
// ----------------------------------------------------

export async function saveTurmaToFirebase(
  turma: Turma,
  actorEmail = 'system',
  actorName = 'Sistema'
) {
  const sanitizedTurma: Turma = {
    ...turma,
    name: sanitizeInput(turma.name).trim(),
    description: turma.description ? sanitizeInput(turma.description).trim() : undefined,
  };

  const cleanData = cleanObject(sanitizedTurma);
  await setDoc(doc(db, TURMAS_COL, turma.id), cleanData, { merge: true });

  await logSecurityEvent(
    'GROUP_MUTATED',
    actorEmail,
    `Turma salva/atualizada: "${sanitizedTurma.name}" (ID: ${turma.id})`,
    'info',
    actorName
  );
}

export async function renameTurmaInFirebase(
  turmaId: string,
  oldName: string,
  newName: string,
  actorEmail = 'system',
  actorName = 'Sistema'
) {
  const cleanNewName = sanitizeInput(newName).trim();
  if (!cleanNewName || oldName === cleanNewName) return;

  const batch = writeBatch(db);

  // Update turma doc
  const turmaRef = doc(db, TURMAS_COL, turmaId);
  batch.update(turmaRef, { name: cleanNewName });

  // Update students in this turma
  const studentsSnap = await getDocs(
    query(collection(db, STUDENTS_COL), where('group', '==', oldName))
  );
  studentsSnap.docs.forEach((d) => {
    batch.update(d.ref, { group: cleanNewName });
  });

  // Update activities targeting this turma
  const activitiesSnap = await getDocs(
    query(collection(db, ACTIVITIES_COL), where('targetGroup', '==', oldName))
  );
  activitiesSnap.docs.forEach((d) => {
    batch.update(d.ref, { targetGroup: cleanNewName });
  });

  // Update authorized users restricted to this turma
  const usersSnap = await getDocs(
    query(collection(db, USERS_COL), where('allowedGroup', '==', oldName))
  );
  usersSnap.docs.forEach((d) => {
    batch.update(d.ref, { allowedGroup: cleanNewName });
  });

  await batch.commit();

  await logSecurityEvent(
    'GROUP_MUTATED',
    actorEmail,
    `Turma renomeada de "${oldName}" para "${cleanNewName}" com atualização em lote de alunos e atividades.`,
    'info',
    actorName
  );
}

export async function deleteTurmaFromFirebase(
  turmaId: string,
  turmaName: string,
  actorEmail = 'system',
  actorName = 'Sistema'
) {
  const batch = writeBatch(db);

  // Delete turma doc
  batch.delete(doc(db, TURMAS_COL, turmaId));

  await batch.commit();

  await logSecurityEvent(
    'GROUP_MUTATED',
    actorEmail,
    `Turma "${turmaName}" (ID: ${turmaId}) removida do sistema.`,
    'warning',
    actorName
  );
}

// ----------------------------------------------------
// Student CRUD & Cascade Deletion
// ----------------------------------------------------

export async function saveStudentToFirebase(
  student: Student,
  actorEmail = 'system',
  actorName = 'Sistema'
) {
  const sanitizedStudent: Student = {
    ...student,
    name: sanitizeInput(student.name).trim(),
    group: sanitizeInput(student.group).trim(),
    role: student.role ? sanitizeInput(student.role).trim() : undefined,
    createdAt: student.createdAt || new Date().toISOString().split('T')[0],
  };

  const cleanData = cleanObject(sanitizedStudent);
  await setDoc(doc(db, STUDENTS_COL, student.id), cleanData, { merge: true });

  // Auto-register Turma if it doesn't exist yet
  try {
    const groupName = sanitizedStudent.group;
    const turmaQuery = await getDocs(
      query(collection(db, TURMAS_COL), where('name', '==', groupName))
    );
    if (turmaQuery.empty) {
      const newTurma: Turma = {
        id: `turma-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: groupName,
        createdAt: new Date().toISOString().split('T')[0],
      };
      await setDoc(doc(db, TURMAS_COL, newTurma.id), cleanObject(newTurma));
    }
  } catch (e) {
    console.warn('Auto turma create notice:', e);
  }

  await logSecurityEvent(
    'STUDENT_MUTATED',
    actorEmail,
    `Aluno salvo: ${sanitizedStudent.name} (Turma: ${sanitizedStudent.group})`,
    'info',
    actorName
  );
}

export async function deleteStudentFromFirebase(
  studentId: string,
  actorEmail = 'system',
  actorName = 'Sistema'
) {
  const batch = writeBatch(db);

  // Delete student doc
  batch.delete(doc(db, STUDENTS_COL, studentId));

  // Cascade delete all records for this student
  const recordsSnap = await getDocs(
    query(collection(db, RECORDS_COL), where('studentId', '==', studentId))
  );
  recordsSnap.docs.forEach((d) => {
    batch.delete(d.ref);
  });

  await batch.commit();

  await logSecurityEvent(
    'STUDENT_MUTATED',
    actorEmail,
    `Aluno ID "${studentId}" e todos os seus registros de progresso foram removidos permanentemente.`,
    'warning',
    actorName
  );
}

// ----------------------------------------------------
// Activity CRUD & Cascade Deletion
// ----------------------------------------------------

export async function saveActivityToFirebase(
  activity: Activity,
  actorEmail = 'system',
  actorName = 'Sistema'
) {
  const sanitizedActivity: Activity = {
    ...activity,
    title: sanitizeInput(activity.title).trim(),
    description: activity.description ? sanitizeInput(activity.description).trim() : undefined,
    subject: activity.subject ? sanitizeInput(activity.subject).trim() : undefined,
    targetGroup: activity.targetGroup ? sanitizeInput(activity.targetGroup).trim() : 'ALL',
    dueDate: activity.dueDate || undefined,
    assignedStudentIds:
      activity.assignedStudentIds && activity.assignedStudentIds.length > 0
        ? activity.assignedStudentIds
        : undefined,
    createdAt: activity.createdAt || new Date().toISOString().split('T')[0],
  };

  const cleanData = cleanObject(sanitizedActivity);
  await setDoc(doc(db, ACTIVITIES_COL, activity.id), cleanData, { merge: true });

  await logSecurityEvent(
    'ACTIVITY_MUTATED',
    actorEmail,
    `Atividade salva: "${sanitizedActivity.title}" (Destinada: ${sanitizedActivity.targetGroup || 'Todas as Turmas'})`,
    'info',
    actorName
  );
}

export async function deleteActivityFromFirebase(
  activityId: string,
  actorEmail = 'system',
  actorName = 'Sistema'
) {
  const batch = writeBatch(db);

  // Delete activity doc
  batch.delete(doc(db, ACTIVITIES_COL, activityId));

  // Cascade delete all student progress records for this activity
  const recordsSnap = await getDocs(
    query(collection(db, RECORDS_COL), where('activityId', '==', activityId))
  );
  recordsSnap.docs.forEach((d) => {
    batch.delete(d.ref);
  });

  await batch.commit();

  await logSecurityEvent(
    'ACTIVITY_MUTATED',
    actorEmail,
    `Atividade ID "${activityId}" e todos os registros associados foram excluídos permanentemente.`,
    'warning',
    actorName
  );
}

// ----------------------------------------------------
// Student Activity Record CRUD
// ----------------------------------------------------

export async function saveRecordToFirebase(
  record: StudentActivityRecord,
  actorEmail = 'system',
  actorName = 'Sistema'
) {
  const sanitizedRecord: StudentActivityRecord = {
    ...record,
    notes: record.notes ? sanitizeInput(record.notes).trim() : undefined,
    updatedAt: record.updatedAt || new Date().toISOString().split('T')[0],
  };

  const cleanData = cleanObject(sanitizedRecord);
  await setDoc(doc(db, RECORDS_COL, record.id), cleanData, { merge: true });

  await logSecurityEvent(
    'RECORD_MUTATED',
    actorEmail,
    `Status da atividade atualizado para "${record.status}" (Registro: ${record.id})`,
    'info',
    actorName
  );
}

export async function deleteRecordFromFirebase(
  recordId: string,
  actorEmail = 'system',
  actorName = 'Sistema'
) {
  await deleteDoc(doc(db, RECORDS_COL, recordId));
  await logSecurityEvent(
    'RECORD_MUTATED',
    actorEmail,
    `Registro de progresso ID "${recordId}" removido.`,
    'warning',
    actorName
  );
}

// ----------------------------------------------------
// User Preferences Persistence (Filters & View Mode)
// ----------------------------------------------------

export async function saveUserPreferenceToFirebase(
  preference: UserPreference,
  actorEmail = 'system'
) {
  const cleanEmail = preference.email.trim().toLowerCase();
  if (!cleanEmail) return;

  const sanitizedPref: UserPreference = {
    ...preference,
    id: cleanEmail,
    email: cleanEmail,
    search: sanitizeInput(preference.search || ''),
    updatedAt: new Date().toISOString(),
  };

  const cleanData = cleanObject(sanitizedPref);
  await setDoc(doc(db, PREFERENCES_COL, cleanEmail), cleanData, { merge: true });
}

export async function getUserPreferenceFromFirebase(
  email: string
): Promise<UserPreference | null> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return null;

  try {
    const snap = await getDoc(doc(db, PREFERENCES_COL, cleanEmail));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as UserPreference;
    }
  } catch (err) {
    console.warn('Error reading user preferences from Firestore:', err);
  }
  return null;
}

// ----------------------------------------------------
// Authorized Users CRUD
// ----------------------------------------------------

export async function getAuthorizedUserByEmail(
  email: string
): Promise<AuthorizedUser | null> {
  const cleanEmail = email.trim().toLowerCase();

  const defaultAdmins: Record<string, string> = {
    'cerutticonsultoria@gmail.com': 'Cerutti Consultoria (ADM)',
    'admin@formacao.com': 'Administrador Master',
    'guilhermetondatto@gmail.com': 'Guilherme Tondatto (ADM)',
  };

  try {
    const docRef = doc(db, USERS_COL, cleanEmail);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as AuthorizedUser;
    }

    const q = query(collection(db, USERS_COL), where('email', '==', cleanEmail));
    const querySnap = await getDocs(q);
    if (!querySnap.empty) {
      const d = querySnap.docs[0];
      return { id: d.id, ...d.data() } as AuthorizedUser;
    }
  } catch (err) {
    console.warn('Error fetching user from Firestore:', err);
  }

  // Fallback auto-provisioning for master admins
  if (defaultAdmins[cleanEmail]) {
    const fallbackUser: AuthorizedUser = {
      id: cleanEmail,
      email: cleanEmail,
      name: defaultAdmins[cleanEmail],
      role: 'admin',
      targetScope: 'ALL_GROUPS',
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
    };
    try {
      await setDoc(doc(db, USERS_COL, cleanEmail), cleanObject(fallbackUser));
    } catch (e) {
      console.warn('Error saving fallback admin:', e);
    }
    return fallbackUser;
  }

  return null;
}

export async function saveAuthorizedUserToFirebase(
  user: AuthorizedUser,
  actorEmail = 'system',
  actorName = 'Sistema'
) {
  const cleanEmail = user.email.trim().toLowerCase();
  const userData: AuthorizedUser = {
    ...user,
    id: cleanEmail,
    email: cleanEmail,
    name: user.name ? sanitizeInput(user.name).trim() : user.name,
  };

  const cleanData = cleanObject(userData);
  await setDoc(doc(db, USERS_COL, cleanEmail), cleanData, { merge: true });

  await logSecurityEvent(
    'USER_MUTATED',
    actorEmail,
    `Usuário autorizado salvo/atualizado: ${cleanEmail} [Função: ${user.role}, Escopo: ${user.targetScope}]`,
    'info',
    actorName
  );
}

export async function deleteAuthorizedUserFromFirebase(
  userId: string,
  actorEmail = 'system',
  actorName = 'Sistema'
) {
  const targetId = userId.toLowerCase();
  await deleteDoc(doc(db, USERS_COL, targetId));

  await logSecurityEvent(
    'USER_MUTATED',
    actorEmail,
    `Acesso do usuário "${targetId}" foi revogado e removido do sistema.`,
    'warning',
    actorName
  );
}

// ----------------------------------------------------
// Complete Database Clear
// ----------------------------------------------------

export async function clearAllDashboardDataFromFirebase(
  actorEmail = 'system',
  actorName = 'Sistema'
) {
  try {
    const studentSnapshot = await getDocs(collection(db, STUDENTS_COL));
    const activitySnapshot = await getDocs(collection(db, ACTIVITIES_COL));
    const recordSnapshot = await getDocs(collection(db, RECORDS_COL));
    const turmasSnapshot = await getDocs(collection(db, TURMAS_COL));

    const batch = writeBatch(db);

    studentSnapshot.docs.forEach((d) => batch.delete(d.ref));
    activitySnapshot.docs.forEach((d) => batch.delete(d.ref));
    recordSnapshot.docs.forEach((d) => batch.delete(d.ref));
    turmasSnapshot.docs.forEach((d) => batch.delete(d.ref));

    await batch.commit();

    await logSecurityEvent(
      'DATA_RESET',
      actorEmail,
      'Esvaziamento completo dos alunos, atividades, turmas e registros de progresso do painel realizado.',
      'warning',
      actorName
    );
  } catch (err) {
    console.error('Erro ao esvaziar dados do dashboard no Firestore:', err);
    throw err;
  }
}
