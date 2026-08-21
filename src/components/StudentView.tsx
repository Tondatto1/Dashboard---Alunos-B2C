import React from 'react';
import { Student, Activity, StudentActivityRecord, Status } from '../types';
import { StatusBadge } from './StatusBadge';
import { Edit3, MessageSquare, Calendar, Users, UserPlus } from 'lucide-react';

interface StudentViewProps {
  students: Student[];
  activities: Activity[];
  records: StudentActivityRecord[];
  selectedStatus?: Status | 'todos';
  onToggleStatus: (studentId: string, activityId: string) => void;
  onOpenNotes: (studentId: string, activityId: string) => void;
  onEditStudent: (student: Student) => void;
  onEditActivity: (activity: Activity) => void;
  onOpenAddStudent?: () => void;
}

export const StudentView: React.FC<StudentViewProps> = ({
  students,
  activities,
  records,
  selectedStatus,
  onToggleStatus,
  onOpenNotes,
  onEditStudent,
  onOpenAddStudent,
}) => {
  if (students.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 p-10 md:p-14 text-center shadow-xs my-4 space-y-4 max-w-xl mx-auto">
        <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto text-indigo-600 shadow-2xs">
          <Users className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900">Nenhum Aluno Encontrado</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Não há alunos cadastrados nesta visão ou filtro. Cadastre seu primeiro aluno para iniciar.
          </p>
        </div>
        {onOpenAddStudent && (
          <button
            type="button"
            onClick={onOpenAddStudent}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all inline-flex items-center gap-2 cursor-pointer mt-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Cadastrar Aluno</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      {students.map((student) => {
        const studentRecords = records.filter((r) => r.studentId === student.id);
        const completed = studentRecords.filter((r) => r.status === 'concluido').length;
        const total = activities.length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        return (
          <div
            key={student.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            {/* Student Header */}
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${student.avatarColor} text-white font-bold text-sm flex items-center justify-center shadow-2xs`}>
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      {student.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {student.group}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onEditStudent(student)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors"
                    title="Editar Aluno"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <div className="text-right">
                    <span className="text-xs font-bold text-indigo-600">{percentage}%</span>
                    <p className="text-[10px] text-slate-400 font-medium">{completed}/{total} concluídas</p>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-4">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {/* Activity Checklist for this student */}
              <div className="space-y-2.5">
                {activities.map((activity) => {
                  const record = records.find(
                    (r) => r.studentId === student.id && r.activityId === activity.id
                  );
                  const status: Status = record ? record.status : 'pendente';
                  const notes = record?.notes;
                  const isMatchStatus =
                    !selectedStatus || selectedStatus === 'todos' || status === selectedStatus;

                  if (!isMatchStatus) return null;

                  return (
                    <div
                      key={activity.id}
                      className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-start justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                            👥 {activity.targetGroup && activity.targetGroup !== 'ALL' ? activity.targetGroup : 'Todas'}
                          </span>
                          {activity.dueDate && (
                            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-0.5">
                              <Calendar className="w-3 h-3" /> {activity.dueDate}
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-slate-800 text-xs leading-snug">
                          {activity.title}
                        </p>
                        {notes && (
                          <p
                            onClick={() => onOpenNotes(student.id, activity.id)}
                            className="text-[11px] text-amber-900 bg-amber-50 p-1.5 rounded-lg border border-amber-200 mt-1.5 font-medium cursor-pointer hover:bg-amber-100 transition-colors flex items-center gap-1"
                            title="Clique para editar a observação"
                          >
                            <span className="font-bold shrink-0">📝 Nota:</span>
                            <span className="truncate">{notes}</span>
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <StatusBadge
                          status={status}
                          interactive
                          size="sm"
                          onClick={() => onToggleStatus(student.id, activity.id)}
                        />

                        <button
                          type="button"
                          onClick={() => onOpenNotes(student.id, activity.id)}
                          className="text-[10px] text-slate-500 hover:text-indigo-600 font-medium flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-3 h-3 text-amber-600" />
                          {notes ? 'Editar Nota' : '+ Nota'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
