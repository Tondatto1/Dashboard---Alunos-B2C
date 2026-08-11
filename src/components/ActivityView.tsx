import React from 'react';
import { Student, Activity, StudentActivityRecord, Status } from '../types';
import { StatusBadge } from './StatusBadge';
import { Edit3, MessageSquare, Calendar, CheckCircle2, Clock, AlertCircle, FilePlus, BookOpen } from 'lucide-react';

interface ActivityViewProps {
  students: Student[];
  activities: Activity[];
  records: StudentActivityRecord[];
  selectedStatus?: Status | 'todos';
  onToggleStatus: (studentId: string, activityId: string) => void;
  onOpenNotes: (studentId: string, activityId: string) => void;
  onEditActivity: (activity: Activity) => void;
  onEditStudent: (student: Student) => void;
  onOpenAddActivity?: () => void;
}

export const ActivityView: React.FC<ActivityViewProps> = ({
  students,
  activities,
  records,
  selectedStatus,
  onToggleStatus,
  onOpenNotes,
  onEditActivity,
  onOpenAddActivity,
}) => {
  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 p-10 md:p-14 text-center shadow-xs my-4 space-y-4 max-w-xl mx-auto">
        <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto text-indigo-600 shadow-2xs">
          <BookOpen className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900">Nenhuma Atividade Cadastrada</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Não há atividades nesta visão ou filtro. Cadastre a primeira atividade da formação para iniciar.
          </p>
        </div>
        {onOpenAddActivity && (
          <button
            type="button"
            onClick={onOpenAddActivity}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all inline-flex items-center gap-2 cursor-pointer mt-2"
          >
            <FilePlus className="w-4 h-4" />
            <span>Cadastrar Atividade</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 mb-6">
      {activities.map((activity) => {
        const activityRecords = records.filter((r) => r.activityId === activity.id);
        const completed = activityRecords.filter((r) => r.status === 'concluido').length;
        const inProgress = activityRecords.filter((r) => r.status === 'em_progresso').length;
        const pending = students.length - completed - inProgress;
        const percentage = students.length > 0 ? Math.round((completed / students.length) * 100) : 0;

        return (
          <div
            key={activity.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-shadow"
          >
            {/* Activity Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                    👥 {activity.targetGroup && activity.targetGroup !== 'ALL' ? activity.targetGroup : 'Todas as Turmas'}
                  </span>
                  {activity.dueDate && (
                    <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> Prazo: {activity.dueDate}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  {activity.title}
                </h3>
                {activity.description && (
                  <p className="text-xs text-slate-600 mt-1">{activity.description}</p>
                )}
              </div>

              {/* Edit button and completion badge */}
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => onEditActivity(activity)}
                  className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                  title="Editar Atividade"
                >
                  <Edit3 className="w-4 h-4" /> Editar
                </button>

                <div className="text-right bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                  <div className="text-xs font-extrabold text-indigo-600">{percentage}% Concluído</div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    {completed}/{students.length} alunos
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats Bar for this Activity */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-emerald-50/80 border border-emerald-100 rounded-lg p-2 text-center">
                <span className="text-[10px] font-bold text-emerald-800 uppercase flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Concluídos
                </span>
                <span className="text-sm font-extrabold text-emerald-900">{completed}</span>
              </div>

              <div className="bg-amber-50/80 border border-amber-100 rounded-lg p-2 text-center">
                <span className="text-[10px] font-bold text-amber-800 uppercase flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3 text-amber-600" /> Em Progresso
                </span>
                <span className="text-sm font-extrabold text-amber-900">{inProgress}</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center">
                <span className="text-[10px] font-bold text-slate-700 uppercase flex items-center justify-center gap-1">
                  <AlertCircle className="w-3 h-3 text-slate-400" /> Pendentes
                </span>
                <span className="text-sm font-extrabold text-slate-800">{Math.max(0, pending)}</span>
              </div>
            </div>

            {/* Checklist per Student */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {students.map((student) => {
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
                    key={student.id}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-7 h-7 rounded-full ${student.avatarColor} text-white font-bold text-[11px] flex items-center justify-center shrink-0`}>
                          {student.name.charAt(0)}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-800 truncate">{student.name}</p>
                          <p className="text-[10px] text-slate-500 truncate">{student.group}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => onToggleStatus(student.id, activity.id)}
                          className="cursor-pointer focus:outline-hidden"
                        >
                          <StatusBadge status={status} interactive size="sm" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenNotes(student.id, activity.id)}
                          className={`p-1 rounded text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer ${
                            notes ? 'text-amber-700 bg-amber-100 border border-amber-300' : 'hover:bg-slate-200/50'
                          }`}
                          title={notes || 'Adicionar observação'}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {notes && (
                      <p
                        onClick={() => onOpenNotes(student.id, activity.id)}
                        className="text-[10px] text-amber-900 bg-amber-50 border border-amber-200/90 px-2 py-1 rounded-md font-medium cursor-pointer hover:bg-amber-100 truncate"
                        title={notes}
                      >
                        📝 {notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
