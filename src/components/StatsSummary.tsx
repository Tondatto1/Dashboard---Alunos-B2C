import React from 'react';
import { Student, Activity, StudentActivityRecord } from '../types';
import { CheckCircle2, Clock, AlertCircle, TrendingUp, Users, BookOpen } from 'lucide-react';

interface StatsSummaryProps {
  students: Student[];
  activities: Activity[];
  records: StudentActivityRecord[];
}

export const StatsSummary: React.FC<StatsSummaryProps> = ({
  students,
  activities,
  records,
}) => {
  const totalPossible = students.length * activities.length;

  const completedCount = records.filter((r) => r.status === 'concluido').length;
  const inProgressCount = records.filter((r) => r.status === 'em_progresso').length;
  const pendingCount = totalPossible - completedCount - inProgressCount;

  const completionRate = totalPossible > 0 ? Math.round((completedCount / totalPossible) * 100) : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {/* Alunos */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider">Alunos</span>
          <Users className="w-4 h-4 text-slate-400" />
        </div>
        <div>
          <div className="text-xl font-extrabold text-slate-900">{students.length}</div>
          <div className="text-[10px] text-slate-500 font-medium">Cadastrados</div>
        </div>
      </div>

      {/* Atividades */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider">Atividades</span>
          <BookOpen className="w-4 h-4 text-indigo-500" />
        </div>
        <div>
          <div className="text-xl font-extrabold text-slate-900">{activities.length}</div>
          <div className="text-[10px] text-slate-500 font-medium">Cadastradas</div>
        </div>
      </div>

      {/* Taxa de Conclusão */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider">Progresso Geral</span>
          <TrendingUp className="w-4 h-4 text-emerald-500" />
        </div>
        <div>
          <div className="text-xl font-extrabold text-emerald-600">{completionRate}%</div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Concluídas */}
      <div className="bg-emerald-50/60 rounded-xl border border-emerald-100 p-3.5 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-emerald-800 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider">Concluídas</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        </div>
        <div>
          <div className="text-xl font-extrabold text-emerald-900">{completedCount}</div>
          <div className="text-[10px] text-emerald-700 font-medium">Entregas Validadas</div>
        </div>
      </div>

      {/* Em Progresso */}
      <div className="bg-amber-50/60 rounded-xl border border-amber-100 p-3.5 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-amber-800 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider">Em Progresso</span>
          <Clock className="w-4 h-4 text-amber-600" />
        </div>
        <div>
          <div className="text-xl font-extrabold text-amber-900">{inProgressCount}</div>
          <div className="text-[10px] text-amber-700 font-medium">Em Andamento</div>
        </div>
      </div>

      {/* Pendentes */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-3.5 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-600 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider">Pendentes</span>
          <AlertCircle className="w-4 h-4 text-slate-400" />
        </div>
        <div>
          <div className="text-xl font-extrabold text-slate-800">{Math.max(0, pendingCount)}</div>
          <div className="text-[10px] text-slate-500 font-medium">Aguardando Início</div>
        </div>
      </div>
    </div>
  );
};
