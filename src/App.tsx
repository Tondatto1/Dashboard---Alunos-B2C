import React, { useState, useEffect, useRef } from 'react';
import {
  Student,
  Activity,
  StudentActivityRecord,
  Status,
  ViewMode,
  AuthorizedUser,
  Turma,
  UserPreference,
} from './types';
import {
  subscribeStudents,
  subscribeActivities,
  subscribeRecords,
  subscribeTurmas,
  subscribeAuthorizedUsers,
  subscribeUserPreferences,
  ensureMasterAdminExists,
  clearAllDashboardDataFromFirebase,
  saveStudentToFirebase,
  deleteStudentFromFirebase,
  saveActivityToFirebase,
  deleteActivityFromFirebase,
  saveRecordToFirebase,
  deleteRecordFromFirebase,
  saveTurmaToFirebase,
  renameTurmaInFirebase,
  deleteTurmaFromFirebase,
  saveAuthorizedUserToFirebase,
  deleteAuthorizedUserFromFirebase,
  saveUserPreferenceToFirebase,
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
import { ManageGroupsModal } from './components/ManageGroupsModal';
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

  // Primary Data State synced with Firestore Real-time
  const [students, setStudents] = useState<Student[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [records, setRecords] = useState<StudentActivityRecord[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [isFirebaseLoading, setIsFirebaseLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Filters & View Mode State
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState<Status | 'todos'>('todos');
  const [viewMode, setViewMode] = useState<ViewMode>('matrix');
  const isPreferencesLoaded = useRef(false);

  // Modals
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isAddActivityOpen, setIsAddActivityOpen] = useState(false);
  const [isManageGroupsOpen, setIsManageGroupsOpen] = useState(false);
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
    let unsubTurmas: (() => void) | null = null;
    let unsubUsers: (() => void) | null = null;

    async function initFirebase() {
      await ensureMasterAdminExists();

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

      unsubTurmas = subscribeTurmas((data) => {
        setTurmas(data);
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
      if (unsubTurmas) unsubTurmas();
      if (unsubUsers) unsubUsers();
    };
  }, []);

  // Subscribe to user preferences in Firestore when user logs in
  useEffect(() => {
    if (!currentUser?.email) return;

    const unsubPref = subscribeUserPreferences(currentUser.email, (pref) => {
      if (pref && !isPreferencesLoaded.current) {
        if (pref.selectedGroup) setSelectedGroup(pref.selectedGroup);
        if (pref.selectedStatus) setSelectedStatus(pref.selectedStatus);
        if (pref.viewMode) setViewMode(pref.viewMode);
        if (pref.search !== undefined) setSearch(pref.search);
        isPreferencesLoaded.current = true;
      }
    });

    return () => {
      unsubPref();
    };
  }, [currentUser?.email]);

  // Sync preference changes to Firestore (debounced for search)
  useEffect(() => {
    if (!currentUser?.email || !isPreferencesLoaded.current) return;

    const timeout = setTimeout(() => {
      const prefData: UserPreference = {
        id: currentUser.email.toLowerCase(),
        email: currentUser.email.toLowerCase(),
        selectedGroup,
        selectedStatus,
        viewMode,
        search,
        updatedAt: new Date().toISOString(),
      };
      saveUserPreferenceToFirebase(prefData, currentUser.email);
    }, 600);

    return () => clearTimeout(timeout);
  }, [selectedGroup, selectedStatus, viewMode, search, currentUser?.email]);

  // Update session storage when logged user changes
  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem(USER_SESSION_KEY, JSON.stringify(currentUser));
    } else {
      sessionStorage.removeItem(USER_SESSION_KEY);
      isPreferencesLoaded.current = false;
    }
  }, [currentUser]);

  // Keep currentUser in sync if ADM updates permissions
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
    setIsSaving(true);
    try {
      await saveAuthorizedUserToFirebase(
        user,
        currentUser?.email || 'admin',
        currentUser?.name || 'Administrador'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUserPermission = async (userId: string) => {
    setIsSaving(true);
    try {
      await deleteAuthorizedUserFromFirebase(
        userId,
        currentUser?.email || 'admin',
        currentUser?.name || 'Administrador'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Derived Unified Groups List from Firestore `turmas` collection + students
  const turmaNames = turmas.map((t) => t.name);
  const studentGroupNames = students.map((s) => s.group);
  const groups = Array.from(
    new Set([...turmaNames, ...studentGroupNames].filter(Boolean))
  ).sort();

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
  const handleToggleStatus = async (studentId: string, activityId: string) => {
    const existing = records.find(
      (r) => r.studentId === studentId && r.activityId === activityId
    );

    const statusCycle: Record<Status, Status> = {
      pendente: 'em_progresso',
      em_progresso: 'concluido',
      concluido: 'pendente',
    };

    const now = new Date().toISOString().split('T')[0];

    setIsSaving(true);
    try {
      if (existing) {
        const updatedRecord: StudentActivityRecord = {
          ...existing,
          status: statusCycle[existing.status],
          updatedAt: now,
        };
        await saveRecordToFirebase(
          updatedRecord,
          currentUser?.email || 'admin',
          currentUser?.name || 'Administrador'
        );
      } else {
        const newRecord: StudentActivityRecord = {
          id: `${studentId}_${activityId}`,
          studentId,
          activityId,
          status: 'em_progresso',
          updatedAt: now,
        };
        await saveRecordToFirebase(
          newRecord,
          currentUser?.email || 'admin',
          currentUser?.name || 'Administrador'
        );
      }
    } catch (err) {
      console.error('Error toggling status in Firebase:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Handlers for Notes
  const handleSaveNote = async (
    studentId: string,
    activityId: string,
    noteText: string,
    newStatus?: Status
  ) => {
    const existing = records.find(
      (r) => r.studentId === studentId && r.activityId === activityId
    );
    const now = new Date().toISOString().split('T')[0];

    setIsSaving(true);
    try {
      if (existing) {
        const updatedRecord: StudentActivityRecord = {
          ...existing,
          notes: noteText,
          status: newStatus || existing.status,
          updatedAt: now,
        };
        await saveRecordToFirebase(
          updatedRecord,
          currentUser?.email || 'admin',
          currentUser?.name || 'Administrador'
        );
      } else {
        const newRecord: StudentActivityRecord = {
          id: `${studentId}_${activityId}`,
          studentId,
          activityId,
          status: newStatus || 'pendente',
          updatedAt: now,
          notes: noteText,
        };
        await saveRecordToFirebase(
          newRecord,
          currentUser?.email || 'admin',
          currentUser?.name || 'Administrador'
        );
      }
    } catch (err) {
      console.error('Error saving note in Firebase:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // CRUD Student
  const handleAddStudent = async (newStudentData: Omit<Student, 'id'>) => {
    const newStudent: Student = {
      ...newStudentData,
      id: `st-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setIsSaving(true);
    try {
      await saveStudentToFirebase(
        newStudent,
        currentUser?.email || 'admin',
        currentUser?.name || 'Administrador'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveStudent = async (updatedStudent: Student) => {
    setIsSaving(true);
    try {
      await saveStudentToFirebase(
        updatedStudent,
        currentUser?.email || 'admin',
        currentUser?.name || 'Administrador'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    setIsSaving(true);
    try {
      await deleteStudentFromFirebase(
        studentId,
        currentUser?.email || 'admin',
        currentUser?.name || 'Administrador'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // CRUD Activity
  const handleAddActivity = async (newActivityData: Omit<Activity, 'id'>) => {
    const newActivity: Activity = {
      ...newActivityData,
      id: `act-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setIsSaving(true);
    try {
      await saveActivityToFirebase(
        newActivity,
        currentUser?.email || 'admin',
        currentUser?.name || 'Administrador'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveActivity = async (updatedActivity: Activity) => {
    setIsSaving(true);
    try {
      await saveActivityToFirebase(
        updatedActivity,
        currentUser?.email || 'admin',
        currentUser?.name || 'Administrador'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    setIsSaving(true);
    try {
      await deleteActivityFromFirebase(
        activityId,
        currentUser?.email || 'admin',
        currentUser?.name || 'Administrador'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // CRUD Turmas / Groups
  const handleSaveTurma = async (name: string, description?: string) => {
    const newTurma: Turma = {
      id: `turma-${Date.now()}`,
      name,
      description,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setIsSaving(true);
    try {
      await saveTurmaToFirebase(
        newTurma,
        currentUser?.email || 'admin',
        currentUser?.name || 'Administrador'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleRenameTurma = async (
    turmaId: string,
    oldName: string,
    newName: string
  ) => {
    setIsSaving(true);
    try {
      await renameTurmaInFirebase(
        turmaId,
        oldName,
        newName,
        currentUser?.email || 'admin',
        currentUser?.name || 'Administrador'
      );
      if (selectedGroup === oldName) {
        setSelectedGroup(newName);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTurma = async (turmaId: string, name: string) => {
    setIsSaving(true);
    try {
      await deleteTurmaFromFirebase(
        turmaId,
        name,
        currentUser?.email || 'admin',
        currentUser?.name || 'Administrador'
      );
      if (selectedGroup === name) {
        setSelectedGroup('ALL');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Clear Dashboard Data in Firebase
  const handleResetData = async () => {
    if (
      window.confirm(
        'Deseja esvaziar todos os alunos, atividades, turmas e registros do banco de dados? Esta ação limpa o painel mantendo a sincronização ativa.'
      )
    ) {
      setIsSaving(true);
      try {
        await clearAllDashboardDataFromFirebase(
          currentUser?.email || 'admin',
          currentUser?.name || 'Administrador'
        );
        setSelectedGroup('ALL');
        setSelectedStatus('todos');
        setSearch('');
      } catch (err: any) {
        alert('Erro ao esvaziar banco de dados: ' + (err.message || 'Erro inesperado'));
      } finally {
        setIsSaving(false);
      }
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
    (s) => selectedGroup === 'ALL' || s.group.toLowerCase() === selectedGroup.toLowerCase()
  );

  const groupFilteredActivities = activities.filter(
    (a) =>
      selectedGroup === 'ALL' ||
      !a.targetGroup ||
      a.targetGroup === 'ALL' ||
      a.targetGroup.toLowerCase() === selectedGroup.toLowerCase()
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
      {!currentUser && <LoginModal onLoginSuccess={handleLoginSuccess} />}

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
          onOpenManageGroups={() => setIsManageGroupsOpen(true)}
          onOpenReport={() => setIsReportOpen(true)}
          onOpenUserAccessManager={() => setIsUserAccessManagerOpen(true)}
          onOpenSecurityAudit={() => setIsSecurityAuditOpen(true)}
          onLogout={handleLogout}
          onResetData={handleResetData}
          isSaving={isSaving}
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
            onOpenNotes={(studentId, activityId) =>
              setActiveNoteRecord({ studentId, activityId })
            }
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
            onOpenNotes={(studentId, activityId) =>
              setActiveNoteRecord({ studentId, activityId })
            }
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
            onOpenNotes={(studentId, activityId) =>
              setActiveNoteRecord({ studentId, activityId })
            }
            onEditActivity={(act) => setEditingActivity(act)}
            onEditStudent={(st) => setEditingStudent(st)}
            onOpenAddActivity={() => setIsAddActivityOpen(true)}
          />
        )}

        {/* Modals */}
        <ManageGroupsModal
          isOpen={isManageGroupsOpen}
          onClose={() => setIsManageGroupsOpen(false)}
          turmas={turmas}
          students={students}
          activities={activities}
          onSaveTurma={handleSaveTurma}
          onRenameTurma={handleRenameTurma}
          onDeleteTurma={handleDeleteTurma}
        />

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
