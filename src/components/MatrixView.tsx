import React from 'react';
import { Student, Activity, StudentActivityRecord, Status } from '../types';
import { StatusBadge } from './StatusBadge';
import { Edit3, MessageSquare, Calendar, UserPlus, FilePlus } from 'lucide-react';

interface MatrixViewProps {
  students: Student[];
  activities: Activity[];
  records: StudentActivityRecord[];
  selectedStatus?: Status | 'todos';
  onToggleStatus: (studentId: string, activityId: string) => void;
  onOpenNotes: (studentId: string, activityId: string) => void;
  onEditActivity: (activity: Activity) => void;
  onEditStudent: (student: Student) => void;
  onOpenAddStudent?: () => void;
  onOpenAddActivity?: () => void;
}

export const MatrixView: React.FC<MatrixViewProps> = ({
  students,
  activities,
  records,
  selectedStatus,
  onToggleStatus,
  onOpenNotes,
  onEditActivity,
  onEditStudent,
  onOpenAddStudent,
  onOpenAddActivity,
}) => {
  const getRecord = (studentId: string, activityId: string) => {
    return records.find((r) => r.studentId === studentId && r.activityId === activityId);
  };

  const getStudentStats = (studentId: string) => {
    const studentRecords = records.filter((r) => r.studentId === studentId);
    const completed = studentRecords.filter((r) => r.status === 'concluido').length;
    const total = activities.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  };

  if (students.length === 0 || activities.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 p-10 md:p-14 text-center shadow-xs my-4 space-y-5 max-w-2xl mx-auto">
        <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto text-indigo-600 shadow-2xs">
          <Calendar className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-900">
            {students.length === 0 && activities.length === 0
              ? 'Painel Pronto e Limpo no Banco de Dados'
              : students.length === 0
              ? 'Nenhum Aluno Cadastrado'
              : 'Nenhuma Atividade Cadastrada'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            {students.length === 0 && activities.length === 0
              ? 'Sua base de dados está completamente sincronizada no Firebase. Cadastre novos alunos e atividades para iniciar o acompanhamento.'
              : students.length === 0
              ? 'Adicione alunos ao sistema para acompanhar as entregas das atividades.'
              : 'Crie atividades para que possam ser atribuídas aos alunos nas turmas.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {onOpenAddStudent && (
            <button
              type="button"
              onClick={onOpenAddStudent}
              className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-indigo-600" />
              <span>Cadastrar Aluno</span>
            </button>
          )}

          {onOpenAddActivity && (
            <button
              type="button"
              onClick={onOpenAddActivity}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
            >
              <FilePlus className="w-4 h-4" />
              <span>Cadastrar Atividade</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden mb-6">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200">
              {/* Participant Column Header */}
              <th className="p-4 text-xs font-bold text-slate-700 uppercase tracking-wider sticky left-0 bg-slate-50 z-20 min-w-[220px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                Aluno / Turma
              </th>

              {/* Activity Column Headers */}
              {activities.map((activity) => (
                <th
                  key={activity.id}
                  className="p-3 text-xs font-semibold text-slate-700 border-l border-slate-200/80 min-w-[170px] max-w-[220px] group relative"
                >
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className="font-bold text-slate-900 text-xs line-clamp-2 leading-snug">
                      {activity.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => onEditActivity(activity)}
                      className="text-slate-400 hover:text-indigo-600 p-1 rounded hover:bg-slate-200/60 transition-colors shrink-0 opacity-80 group-hover:opacity-100"
                      title="Editar Atividade"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100/80">
                      👥 {activity.targetGroup && activity.targetGroup !== 'ALL' ? activity.targetGroup : 'Todas'}
                    </span>

                    {activity.dueDate && (
                      <span className="text-[10px] text-slate-400 font-medium flex items-center gap-0.5">
                        <Calendar className="w-2.5 h-2.5" /> {activity.dueDate}
                      </span>
                    )}
                  </div>
                </th>
              ))}

              {/* Progress Summary Header */}
              <th className="p-4 text-xs font-bold text-slate-700 uppercase tracking-wider text-center border-l border-slate-200 min-w-[110px]">
                Progresso
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {students.map((student) => {
              const stats = getStudentStats(student.id);

              return (
                <tr key={student.id} className="hover:bg-slate-50/60 transition-colors">
                  {/* Student Cell */}
                  <td className="p-3.5 sticky left-0 bg-white group-hover:bg-slate-50/90 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] border-r border-slate-100">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-full ${student.avatarColor} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs`}>
                          {student.name.charAt(0)}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-900 truncate">{student.name}</p>
                          <p className="text-[10px] text-slate-500 truncate">{student.group}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onEditStudent(student)}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100 transition-colors shrink-0"
                        title="Editar Aluno"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>

                  {/* Activity Cell Matrix */}
                  {activities.map((activity) => {
                    const record = getRecord(student.id, activity.id);
                    const currentStatus: Status = record ? record.status : 'pendente';
                    const hasNotes = !!record?.notes && record.notes.trim().length > 0;
                    const isMatchStatus =
                      !selectedStatus || selectedStatus === 'todos' || currentStatus === selectedStatus;

                    return (
                      <td
                        key={activity.id}
                        className={`p-2.5 text-center border-l border-slate-100/80 align-middle transition-opacity ${
                          !isMatchStatus ? 'opacity-30' : 'opacity-100'
                        }`}
                      >
                        <div className="flex flex-col items-center justify-center gap-1">
                          <StatusBadge
                            status={currentStatus}
                            interactive
                            size="sm"
                            onClick={() => onToggleStatus(student.id, activity.id)}
                          />

                          {/* Action for Note / Comments */}
                          <button
                            type="button"
                            onClick={() => onOpenNotes(student.id, activity.id)}
                            className={`text-[10px] px-2 py-0.5 rounded-md font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                              hasNotes
                                ? 'bg-amber-100 text-amber-900 font-bold hover:bg-amber-200 border border-amber-300/80'
                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            }`}
                            title={record?.notes || 'Adicionar observação'}
                          >
                            <MessageSquare className="w-3 h-3 text-amber-700" />
                            {hasNotes ? 'Obs' : '+ Nota'}
                          </button>

                          {/* Display note snippet below status */}
                          {hasNotes && (
                            <span
                              onClick={() => onOpenNotes(student.id, activity.id)}
                              className="text-[10px] text-amber-900 bg-amber-50 border border-amber-200/90 px-1.5 py-0.5 rounded max-w-[140px] truncate cursor-pointer hover:bg-amber-100 font-medium block mt-0.5"
                              title={record.notes}
                            >
                              📝 {record.notes}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}

                  {/* Student Completion Rate Bar */}
                  <td className="p-3 text-center border-l border-slate-200 align-middle">
                    <div className="font-bold text-xs text-slate-800 mb-1">
                      {stats.percentage}%
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${stats.percentage}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-slate-400 font-medium">
                      {stats.completed}/{stats.total}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
