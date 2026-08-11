import React, { useState, useEffect } from 'react';
import { Student, Activity, StudentActivityRecord, Status, ViewMode, AuthorizedUser } from './types';
import {
  subscribeStudents,
  subscribeActivities,
  subscribeRecords,
  subscribeAuthorizedUsers,
  seedInitialDataIfEmpty,
  clearAllDashboardDataFromFirebase,
  saveStudentToFirebase,
  deleteStudentFromFirebase,
  saveActivityToFirebase,
  deleteActivityFromFirebase,
  saveRecordToFirebase,
  deleteRecordFromFirebase,
  saveAuthorizedUserToFirebase,
  deleteAuthorizedUserFromFirebase,
} from './services/firebaseService';

import { HeaderControls } from './components/HeaderControls';
import { StatsSummary } from './components/StatsSummary';
import { MatrixView } from './components/MatrixView';
import { StudentView } from './components/StudentView';
import { ActivityView } from './components/ActivityView';

import { AddStudentModal } from './components/AddStudentModal';
import { AddActivityModal } from './components/AddActivityModal';
import { EditStudentModal } from './components/EditStudentModal';
import { EditActivityModal } from './components/EditActivityModal';
import { NoteModal } from './components/NoteModal';
import { ExportReportModal } from './components/ExportReportModal';
import { LoginModal } from './components/LoginModal';
import { UserAccessManagerModal } from './components/UserAccessManagerModal';
import { SecurityAuditModal } from './components/SecurityAuditModal';

const USER_SESSION_KEY = 'formacao_alunos_logged_user_v1';

export function App() {
  // Authentication & Users State
  const [authorizedUsers, setAuthorizedUsers] = useState<AuthorizedUser[]>([]);
  const [currentUser, setCurrentUser] = useState<AuthorizedUser | null>(() => {
    const saved = sessionStorage.getItem(USER_SESSION_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  // Primary Data State synced with Firestore
  const [students, setStudents] = useState<Student[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [records, setRecords] = useState<StudentActivityRecord[]>([]);
  const [isFirebaseLoading, setIsFirebaseLoading] = useState(true);

  // Filters & View Mode State
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState<Status | 'todos'>('todos');
  const [viewMode, setViewMode] = useState<ViewMode>('matrix');

  // Modals
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isAddActivityOpen, setIsAddActivityOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isUserAccessManagerOpen, setIsUserAccessManagerOpen] = useState(false);
  const [isSecurityAuditOpen, setIsSecurityAuditOpen] = useState(false);

  // Edit Modals
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  // Note Modal State
  const [activeNoteRecord, setActiveNoteRecord] = useState<{
    studentId: string;
    activityId: string;
  } | null>(null);

  // Initialize and Subscribe to Firestore Realtime Updates
  useEffect(() => {
    let unsubStudents: (() => void) | null = null;
    let unsubActivities: (() => void) | null = null;
    let unsubRecords: (() => void) | null = null;
    let unsubUsers: (() => void) | null = null;

    async function initFirebase() {
      await seedInitialDataIfEmpty();

      unsubStudents = subscribeStudents((data) => {
        setStudents(data);
        setIsFirebaseLoading(false);
      });

      unsubActivities = subscribeActivities((data) => {
        setActivities(data);
      });

      unsubRecords = subscribeRecords((data) => {
        setRecords(data);
      });

      unsubUsers = subscribeAuthorizedUsers((data) => {
        setAuthorizedUsers(data);
      });
    }

    initFirebase();

    return () => {
      if (unsubStudents) unsubStudents();
      if (unsubActivities) unsubActivities();
      if (unsubRecords) unsubRecords();
      if (unsubUsers) unsubUsers();
    };
  }, []);

  // Update session storage when logged user changes
  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem(USER_SESSION_KEY, JSON.stringify(currentUser));
    } else {
      sessionStorage.removeItem(USER_SESSION_KEY);
    }
  }, [currentUser]);

  // Keep currentUser synced if ADM updates their permissions
  useEffect(() => {
    if (currentUser && authorizedUsers.length > 0) {
      const updated = authorizedUsers.find(
        (u) => u.email.toLowerCase() === currentUser.email.toLowerCase()
      );
      if (updated) {
        setCurrentUser(updated);
      }
    }
  }, [authorizedUsers]);

  const handleLoginSuccess = (user: AuthorizedUser) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // User Permission Management Handlers (Admin Only)
  const handleSaveUserPermission = async (user: AuthorizedUser) => {
    await saveAuthorizedUserToFirebase(user);
  };

  const handleDeleteUserPermission = async (userId: string) => {
    await deleteAuthorizedUserFromFirebase(userId);
  };

  // Derived Unique Groups/Turmas for Filter Dropdown
  const groups = Array.from(new Set(students.map((s) => s.group))).sort();

  // Scope Enforcement for Viewer Users
  let scopeRestrictedStudents = students;
  if (currentUser?.role === 'viewer') {
    if (currentUser.targetScope === 'SPECIFIC_GROUP' && currentUser.allowedGroup) {
      scopeRestrictedStudents = students.filter(
        (s) => s.group.toLowerCase() === currentUser.allowedGroup?.toLowerCase()
      );
    } else if (
      currentUser.targetScope === 'SPECIFIC_STUDENT' &&
      currentUser.allowedStudentId
    ) {
      scopeRestrictedStudents = students.filter(
        (s) => s.id === currentUser.allowedStudentId
      );
    }
  }

  // Handlers for Activity Status Toggle
  const handleToggleStatus = (studentId: string, activityId: string) => {
    const existing = records.find(
      (r) => r.studentId === studentId && r.activityId === activityId
    );

    const statusCycle: Record<Status, Status> = {
      pendente: 'em_progresso',
      em_progresso: 'concluido',
      concluido: 'pendente',
    };

    const now = new Date().toISOString().split('T')[0];

    if (existing) {
      const updatedRecord: StudentActivityRecord = {
        ...existing,
        status: statusCycle[existing.status],
        updatedAt: now,
      };
      saveRecordToFirebase(updatedRecord);
    } else {
      const newRecord: StudentActivityRecord = {
        id: `${studentId}_${activityId}`,
        studentId,
        activityId,
        status: 'em_progresso',
        updatedAt: now,
      };
      saveRecordToFirebase(newRecord);
    }
  };

  // Handlers for Notes
  const handleSaveNote = (
    studentId: string,
    activityId: string,
    noteText: string,
    newStatus?: Status
  ) => {
    const existing = records.find(
      (r) => r.studentId === studentId && r.activityId === activityId
    );
    const now = new Date().toISOString().split('T')[0];

    if (existing) {
      const updatedRecord: StudentActivityRecord = {
        ...existing,
        notes: noteText,
        status: newStatus || existing.status,
        updatedAt: now,
      };
      saveRecordToFirebase(updatedRecord);
    } else {
      const newRecord: StudentActivityRecord = {
        id: `${studentId}_${activityId}`,
        studentId,
        activityId,
        status: newStatus || 'pendente',
        updatedAt: now,
        notes: noteText,
      };
      saveRecordToFirebase(newRecord);
    }
  };

  // CRUD Student
  const handleAddStudent = (newStudentData: Omit<Student, 'id'>) => {
    const newStudent: Student = {
      ...newStudentData,
      id: `st-${Date.now()}`,
    };
    saveStudentToFirebase(newStudent);
  };

  const handleSaveStudent = (updatedStudent: Student) => {
    saveStudentToFirebase(updatedStudent);
  };

  const handleDeleteStudent = (studentId: string) => {
    deleteStudentFromFirebase(studentId);
    // Also cleanup student records
    records
      .filter((r) => r.studentId === studentId)
      .forEach((r) => deleteRecordFromFirebase(r.id));
  };

  // CRUD Activity
  const handleAddActivity = (newActivityData: Omit<Activity, 'id'>) => {
    const newActivity: Activity = {
      ...newActivityData,
      id: `act-${Date.now()}`,
    };
    saveActivityToFirebase(newActivity);
  };

  const handleSaveActivity = (updatedActivity: Activity) => {
    saveActivityToFirebase(updatedActivity);
  };

  const handleDeleteActivity = (activityId: string) => {
    deleteActivityFromFirebase(activityId);
    // Also cleanup activity records
    records
      .filter((r) => r.activityId === activityId)
      .forEach((r) => deleteRecordFromFirebase(r.id));
  };

  // Clear Dashboard Data in Firebase
  const handleResetData = async () => {
    if (window.confirm('Deseja esvaziar todos os alunos, atividades e registros do banco de dados? Esta ação limpa o painel mantendo a sincronização ativa.')) {
      await clearAllDashboardDataFromFirebase(currentUser?.email || 'admin');
    }
  };

  // Helper for status
  const getRecordStatus = (studentId: string, activityId: string): Status => {
    const r = records.find(
      (rec) => rec.studentId === studentId && rec.activityId === activityId
    );
    return r ? r.status : 'pendente';
  };

  // Unified Group, Search and Status Filtering Logic
  const groupFilteredStudents = scopeRestrictedStudents.filter(
    (s) => selectedGroup === 'ALL' || s.group === selectedGroup
  );

  const groupFilteredActivities = activities.filter(
    (a) =>
      selectedGroup === 'ALL' ||
      !a.targetGroup ||
      a.targetGroup === 'ALL' ||
      a.targetGroup === selectedGroup
  );

  const cleanSearch = search.trim().toLowerCase();

  let matchingStudentIds = new Set<string>();
  let matchingActivityIds = new Set<string>();

  if (!cleanSearch) {
    groupFilteredStudents.forEach((s) => matchingStudentIds.add(s.id));
    groupFilteredActivities.forEach((a) => matchingActivityIds.add(a.id));
  } else {
    const directMatchingStudents = groupFilteredStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(cleanSearch) ||
        s.group.toLowerCase().includes(cleanSearch)
    );

    const directMatchingActivities = groupFilteredActivities.filter(
      (a) =>
        a.title.toLowerCase().includes(cleanSearch) ||
        (a.subject && a.subject.toLowerCase().includes(cleanSearch)) ||
        (a.description && a.description.toLowerCase().includes(cleanSearch))
    );

    const matchingRecordList = records.filter(
      (r) => r.notes && r.notes.toLowerCase().includes(cleanSearch)
    );

    directMatchingStudents.forEach((s) => matchingStudentIds.add(s.id));
    directMatchingActivities.forEach((a) => matchingActivityIds.add(a.id));
    matchingRecordList.forEach((r) => {
      matchingStudentIds.add(r.studentId);
      matchingActivityIds.add(r.activityId);
    });

    if (
      matchingStudentIds.size > 0 &&
      directMatchingActivities.length === 0 &&
      matchingRecordList.length === 0
    ) {
      groupFilteredActivities.forEach((a) => matchingActivityIds.add(a.id));
    }

    if (
      matchingActivityIds.size > 0 &&
      directMatchingStudents.length === 0 &&
      matchingRecordList.length === 0
    ) {
      groupFilteredStudents.forEach((s) => matchingStudentIds.add(s.id));
    }
  }

  let filteredStudents = groupFilteredStudents.filter((s) =>
    matchingStudentIds.has(s.id)
  );

  let filteredActivities = groupFilteredActivities.filter((a) =>
    matchingActivityIds.has(a.id)
  );

  if (selectedStatus !== 'todos') {
    filteredStudents = filteredStudents.filter((s) =>
      filteredActivities.some((a) => getRecordStatus(s.id, a.id) === selectedStatus)
    );

    filteredActivities = filteredActivities.filter((a) =>
      filteredStudents.some((s) => getRecordStatus(s.id, a.id) === selectedStatus)
    );
  }

  const currentNoteRecord = activeNoteRecord
    ? records.find(
        (r) =>
          r.studentId === activeNoteRecord.studentId &&
          r.activityId === activeNoteRecord.activityId
      )
    : null;

  const currentStudentForNote = activeNoteRecord
    ? students.find((s) => s.id === activeNoteRecord.studentId)
    : null;

  const currentActivityForNote = activeNoteRecord
    ? activities.find((a) => a.id === activeNoteRecord.activityId)
    : null;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-4 sm:p-6 md:p-8 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Login Modal Overlay if not authenticated */}
      {!currentUser && (
        <LoginModal onLoginSuccess={handleLoginSuccess} />
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header and Filter Controls */}
        <HeaderControls
          currentUser={currentUser}
          search={search}
          onSearchChange={setSearch}
          selectedGroup={selectedGroup}
          onGroupChange={setSelectedGroup}
          groups={groups}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onOpenAddStudent={() => setIsAddStudentOpen(true)}
          onOpenAddActivity={() => setIsAddActivityOpen(true)}
          onOpenReport={() => setIsReportOpen(true)}
          onOpenUserAccessManager={() => setIsUserAccessManagerOpen(true)}
          onOpenSecurityAudit={() => setIsSecurityAuditOpen(true)}
          onLogout={handleLogout}
          onResetData={handleResetData}
        />


        {/* Scope Banner Notice for Viewers */}
        {currentUser?.role === 'viewer' && (
          <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-2xl flex items-center justify-between text-xs text-indigo-900 font-semibold">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-600 text-white rounded-lg font-bold">👀</span>
              <span>
                {currentUser.targetScope === 'SPECIFIC_GROUP'
                  ? `Visualização Restrita à Turma: ${currentUser.allowedGroup}`
                  : currentUser.targetScope === 'SPECIFIC_STUDENT'
                  ? `Visualização Restrita ao Aluno Selecionado`
                  : 'Visualização de Leitura (Todas as Turmas)'}
              </span>
            </div>
            <span className="text-[11px] text-indigo-700 bg-white px-2.5 py-1 rounded-lg border border-indigo-100 font-bold">
              Modo Leitor
            </span>
          </div>
        )}

        {/* Metrics Overview */}
        <StatsSummary
          students={filteredStudents}
          activities={filteredActivities}
          records={records}
        />

        {/* Main View Area */}
        {viewMode === 'matrix' && (
          <MatrixView
            students={filteredStudents}
            activities={filteredActivities}
            records={records}
            selectedStatus={selectedStatus}
            onToggleStatus={handleToggleStatus}
            onOpenNotes={(studentId, activityId) => setActiveNoteRecord({ studentId, activityId })}
            onEditActivity={(act) => setEditingActivity(act)}
            onEditStudent={(st) => setEditingStudent(st)}
            onOpenAddStudent={() => setIsAddStudentOpen(true)}
            onOpenAddActivity={() => setIsAddActivityOpen(true)}
          />
        )}

        {viewMode === 'students' && (
          <StudentView
            students={filteredStudents}
            activities={filteredActivities}
            records={records}
            selectedStatus={selectedStatus}
            onToggleStatus={handleToggleStatus}
            onOpenNotes={(studentId, activityId) => setActiveNoteRecord({ studentId, activityId })}
            onEditStudent={(st) => setEditingStudent(st)}
            onEditActivity={(act) => setEditingActivity(act)}
            onOpenAddStudent={() => setIsAddStudentOpen(true)}
          />
        )}

        {viewMode === 'activities' && (
          <ActivityView
            students={filteredStudents}
            activities={filteredActivities}
            records={records}
            selectedStatus={selectedStatus}
            onToggleStatus={handleToggleStatus}
            onOpenNotes={(studentId, activityId) => setActiveNoteRecord({ studentId, activityId })}
            onEditActivity={(act) => setEditingActivity(act)}
            onEditStudent={(st) => setEditingStudent(st)}
            onOpenAddActivity={() => setIsAddActivityOpen(true)}
          />
        )}

        {/* Modals */}
        <UserAccessManagerModal
          isOpen={isUserAccessManagerOpen}
          onClose={() => setIsUserAccessManagerOpen(false)}
          authorizedUsers={authorizedUsers}
          students={students}
          groups={groups}
          currentUserEmail={currentUser?.email || ''}
          onSaveUserPermission={handleSaveUserPermission}
          onDeleteUserPermission={handleDeleteUserPermission}
        />

        <AddStudentModal
          isOpen={isAddStudentOpen}
          onClose={() => setIsAddStudentOpen(false)}
          onAddStudent={handleAddStudent}
          existingGroups={groups}
        />

        <AddActivityModal
          isOpen={isAddActivityOpen}
          onClose={() => setIsAddActivityOpen(false)}
          onAddActivity={handleAddActivity}
          existingGroups={groups}
        />

        <EditStudentModal
          isOpen={!!editingStudent}
          onClose={() => setEditingStudent(null)}
          student={editingStudent}
          onSaveStudent={handleSaveStudent}
          onDeleteStudent={handleDeleteStudent}
          existingGroups={groups}
        />

        <EditActivityModal
          isOpen={!!editingActivity}
          onClose={() => setEditingActivity(null)}
          activity={editingActivity}
          students={students}
          existingGroups={groups}
          onSaveActivity={handleSaveActivity}
          onDeleteActivity={handleDeleteActivity}
        />

        <NoteModal
          isOpen={!!activeNoteRecord}
          onClose={() => setActiveNoteRecord(null)}
          student={currentStudentForNote || undefined}
          activity={currentActivityForNote || undefined}
          currentStatus={currentNoteRecord?.status || 'pendente'}
          currentNotes={currentNoteRecord?.notes || ''}
          onSave={(noteText, newStatus) => {
            if (activeNoteRecord) {
              handleSaveNote(
                activeNoteRecord.studentId,
                activeNoteRecord.activityId,
                noteText,
                newStatus
              );
            }
          }}
        />

        <ExportReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          students={filteredStudents}
          activities={filteredActivities}
          records={records}
        />

        <SecurityAuditModal
          isOpen={isSecurityAuditOpen}
          onClose={() => setIsSecurityAuditOpen(false)}
          currentUserEmail={currentUser?.email}
        />
      </div>
    </div>
  );
}

export default App;

