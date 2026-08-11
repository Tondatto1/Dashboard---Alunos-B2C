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
import { Student, Activity, StudentActivityRecord, AuthorizedUser } from '../types';
import { logSecurityEvent } from './auditService';
import { sanitizeInput } from '../utils/security';

const STUDENTS_COL = 'students';
const ACTIVITIES_COL = 'activities';
const RECORDS_COL = 'records';
const USERS_COL = 'authorized_users';

// Connection validation
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Verifique a conexão e configuração do Firebase.');
    }
  }
}
testConnection();

// Real-time Listeners with error handling
export function subscribeStudents(
  onData: (students: Student[]) => void,
  onError?: (err: Error) => void
) {
  return onSnapshot(
    collection(db, STUDENTS_COL),
    (snapshot) => {
      const students = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Student)
      );
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
      const activities = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Activity)
      );
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
      const records = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() } as StudentActivityRecord)
      );
      onData(records);
    },
    (err) => {
      console.error('Erro ao escutar coleção de registros:', err);
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
      const users = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() } as AuthorizedUser)
      );
      onData(users);
    },
    (err) => {
      console.error('Erro ao escutar coleção de usuários autorizados:', err);
      if (onError) onError(err);
    }
  );
}

// Data Seeding and Cleanup
export async function cleanupInitialMockDataIfPresent() {
  try {
    const studentSnapshot = await getDocs(collection(db, STUDENTS_COL));
    const mockIds = ['st-1', 'st-2', 'st-3', 'st-4', 'st-5'];
    const mockNames = ['Ana Souza', 'Bruno Lima', 'Carla Dias', 'Daniel Alves', 'Elena Rost'];

    const mockStudentDocs = studentSnapshot.docs.filter((d) => {
      const data = d.data();
      return mockIds.includes(d.id) || mockNames.includes(data.name);
    });

    const deletedStudentIds = new Set(mockStudentDocs.map((d) => d.id));

    const activitySnapshot = await getDocs(collection(db, ACTIVITIES_COL));
    const mockActIds = ['act-1', 'act-2', 'act-3'];
    const mockTitles = [
      'Atividade 01 - Diagnóstico Inicial',
      'Atividade 02 - Estudo de Caso Prático',
      'Atividade 03 - Avaliação Final',
    ];

    const mockActivityDocs = activitySnapshot.docs.filter((d) => {
      const data = d.data();
      return mockActIds.includes(d.id) || mockTitles.includes(data.title);
    });

    const deletedActivityIds = new Set(mockActivityDocs.map((d) => d.id));

    const recordSnapshot = await getDocs(collection(db, RECORDS_COL));
    const mockRecordDocs = recordSnapshot.docs.filter((d) => {
      const data = d.data();
      return (
        deletedStudentIds.has(data.studentId) ||
        deletedActivityIds.has(data.activityId) ||
        d.id.startsWith('st-1') ||
        d.id.startsWith('st-2') ||
        d.id.startsWith('st-3') ||
        d.id.startsWith('st-4') ||
        d.id.startsWith('st-5')
      );
    });

    if (mockStudentDocs.length > 0 || mockActivityDocs.length > 0 || mockRecordDocs.length > 0) {
      const batch = writeBatch(db);
      mockStudentDocs.forEach((d) => batch.delete(d.ref));
      mockActivityDocs.forEach((d) => batch.delete(d.ref));
      mockRecordDocs.forEach((d) => batch.delete(d.ref));

      await batch.commit();
      console.log('Dados fictícios/demonstração removidos do Firestore com sucesso.');
    }
  } catch (err) {
    console.warn('Aviso na limpeza de dados mock do Firestore:', err);
  }
}

export async function clearAllDashboardDataFromFirebase(actorEmail = 'system') {
  try {
    const studentSnapshot = await getDocs(collection(db, STUDENTS_COL));
    const activitySnapshot = await getDocs(collection(db, ACTIVITIES_COL));
    const recordSnapshot = await getDocs(collection(db, RECORDS_COL));

    const batch = writeBatch(db);

    studentSnapshot.docs.forEach((d) => batch.delete(d.ref));
    activitySnapshot.docs.forEach((d) => batch.delete(d.ref));
    recordSnapshot.docs.forEach((d) => batch.delete(d.ref));

    await batch.commit();

    await logSecurityEvent(
      'DATA_RESET',
      actorEmail,
      'Esvaziamento completo dos dados do painel realizado.',
      'warning'
    );
  } catch (err) {
    console.error('Erro ao esvaziar dados do dashboard no Firestore:', err);
  }
}

export async function seedInitialDataIfEmpty() {
  try {
    // Ensure all demo mock data is wiped from Firestore
    await cleanupInitialMockDataIfPresent();

    // Seed default admin accounts if missing
    const ceruttiEmail = 'cerutticonsultoria@gmail.com';
    const ceruttiDoc = await getDoc(doc(db, USERS_COL, ceruttiEmail));

    const now = new Date().toISOString().split('T')[0];

    if (!ceruttiDoc.exists() || ceruttiDoc.data()?.status === 'pending') {
      const ceruttiAdmin: AuthorizedUser = {
        id: ceruttiEmail,
        email: ceruttiEmail,
        name: 'Cerutti Consultoria (ADM)',
        role: 'admin',
        targetScope: 'ALL_GROUPS',
        status: 'active',
        createdAt: now,
      };
      await setDoc(doc(db, USERS_COL, ceruttiEmail), ceruttiAdmin);
    }

    const usersSnapshot = await getDocs(collection(db, USERS_COL));
    if (usersSnapshot.empty) {
      const defaultAdminEmail = 'admin@formacao.com';
      const userEmail = 'guilhermetondatto@gmail.com';

      const initialAdmins: AuthorizedUser[] = [
        {
          id: defaultAdminEmail,
          email: defaultAdminEmail,
          name: 'Administrador Master',
          role: 'admin',
          targetScope: 'ALL_GROUPS',
          status: 'pending',
          createdAt: now,
        },
        {
          id: userEmail,
          email: userEmail,
          name: 'Guilherme Tondatto (ADM)',
          role: 'admin',
          targetScope: 'ALL_GROUPS',
          status: 'pending',
          createdAt: now,
        },
      ];

      const batch = writeBatch(db);
      initialAdmins.forEach((adm) => {
        const ref = doc(db, USERS_COL, adm.id);
        batch.set(ref, adm);
      });
      await batch.commit();
    }
  } catch (err) {
    console.error('Error seeding initial admins in Firestore:', err);
  }
}

// Authorized Users CRUD
export async function getAuthorizedUserByEmail(email: string): Promise<AuthorizedUser | null> {
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
      await setDoc(doc(db, USERS_COL, cleanEmail), fallbackUser);
    } catch (e) {
      console.warn('Error saving fallback admin:', e);
    }
    return fallbackUser;
  }

  return null;
}

export async function saveAuthorizedUserToFirebase(user: AuthorizedUser, actorEmail = 'system') {
  const cleanEmail = user.email.trim().toLowerCase();
  const userData = {
    ...user,
    id: cleanEmail,
    email: cleanEmail,
    name: user.name ? sanitizeInput(user.name) : user.name,
  };
  const cleanData = JSON.parse(JSON.stringify(userData));
  await setDoc(doc(db, USERS_COL, cleanEmail), cleanData);
  await logSecurityEvent(
    'USER_MUTATED',
    actorEmail,
    `Usuário salvo/atualizado: ${cleanEmail} [Função: ${user.role}]`,
    'info'
  );
}

export async function deleteAuthorizedUserFromFirebase(userId: string, actorEmail = 'system') {
  const targetId = userId.toLowerCase();
  await deleteDoc(doc(db, USERS_COL, targetId));
  await logSecurityEvent(
    'USER_MUTATED',
    actorEmail,
    `Usuário removido do sistema: ${targetId}`,
    'warning'
  );
}

// Student CRUD
export async function saveStudentToFirebase(student: Student, actorEmail = 'system') {
  const sanitizedStudent: Student = {
    ...student,
    name: sanitizeInput(student.name),
    group: sanitizeInput(student.group),
  };
  const cleanData = JSON.parse(JSON.stringify(sanitizedStudent));
  await setDoc(doc(db, STUDENTS_COL, student.id), cleanData);
  await logSecurityEvent(
    'STUDENT_MUTATED',
    actorEmail,
    `Aluno salvo: ${student.name} (${student.id}) na turma ${student.group}`,
    'info'
  );
}

export async function deleteStudentFromFirebase(studentId: string, actorEmail = 'system') {
  await deleteDoc(doc(db, STUDENTS_COL, studentId));
  await logSecurityEvent(
    'STUDENT_MUTATED',
    actorEmail,
    `Aluno ID ${studentId} removido`,
    'warning'
  );
}

// Activity CRUD
export async function saveActivityToFirebase(activity: Activity, actorEmail = 'system') {
  const sanitizedActivity: Activity = {
    ...activity,
    title: sanitizeInput(activity.title),
    description: activity.description ? sanitizeInput(activity.description) : undefined,
  };
  const cleanData = JSON.parse(JSON.stringify(sanitizedActivity));
  await setDoc(doc(db, ACTIVITIES_COL, activity.id), cleanData);
  await logSecurityEvent(
    'ACTIVITY_MUTATED',
    actorEmail,
    `Atividade salva: ${activity.title} (${activity.id})`,
    'info'
  );
}

export async function deleteActivityFromFirebase(activityId: string, actorEmail = 'system') {
  await deleteDoc(doc(db, ACTIVITIES_COL, activityId));
  await logSecurityEvent(
    'ACTIVITY_MUTATED',
    actorEmail,
    `Atividade ID ${activityId} removida`,
    'warning'
  );
}

// Record CRUD
export async function saveRecordToFirebase(record: StudentActivityRecord, actorEmail = 'system') {
  const sanitizedRecord: StudentActivityRecord = {
    ...record,
    notes: record.notes ? sanitizeInput(record.notes) : undefined,
  };
  const cleanData = JSON.parse(JSON.stringify(sanitizedRecord));
  await setDoc(doc(db, RECORDS_COL, record.id), cleanData);
  await logSecurityEvent(
    'RECORD_MUTATED',
    actorEmail,
    `Status de atividade alterado para '${record.status}' (Registro: ${record.id})`,
    'info'
  );
}

export async function deleteRecordFromFirebase(recordId: string, actorEmail = 'system') {
  await deleteDoc(doc(db, RECORDS_COL, recordId));
  await logSecurityEvent(
    'RECORD_MUTATED',
    actorEmail,
    `Registro de progresso ID ${recordId} removido`,
    'warning'
  );
}


