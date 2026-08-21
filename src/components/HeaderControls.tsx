import React from 'react';
import { ViewMode, Status, AuthorizedUser } from '../types';
import {
  LayoutGrid,
  Users,
  BookOpen,
  Search,
  Plus,
  RotateCcw,
  FileText,
  Filter,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  LogOut,
  UserPlus,
} from 'lucide-react';

interface HeaderControlsProps {
  currentUser: AuthorizedUser | null;
  search: string;
  onSearchChange: (val: string) => void;
  selectedGroup: string;
  onGroupChange: (val: string) => void;
  groups: string[];
  selectedStatus: Status | 'todos';
  onStatusChange: (val: Status | 'todos') => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenAddStudent: () => void;
  onOpenAddActivity: () => void;
  onOpenManageGroups: () => void;
  onOpenReport: () => void;
  onOpenUserAccessManager: () => void;
  onOpenSecurityAudit: () => void;
  onLogout: () => void;
  onResetData: () => void;
  isSaving?: boolean;
}

export const HeaderControls: React.FC<HeaderControlsProps> = ({
  currentUser,
  search,
  onSearchChange,
  selectedGroup,
  onGroupChange,
  groups,
  selectedStatus,
  onStatusChange,
  viewMode,
  onViewModeChange,
  onOpenAddStudent,
  onOpenAddActivity,
  onOpenManageGroups,
  onOpenReport,
  onOpenUserAccessManager,
  onOpenSecurityAudit,
  onLogout,
  onResetData,
  isSaving = false,
}) => {
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs mb-6 space-y-4">
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-lg shadow-2xs">
              🎓
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Acompanhamento de Atividades da Formação
                </h1>
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-semibold text-emerald-800">
                  <span className={`w-2 h-2 rounded-full ${isSaving ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`} />
                  <span>{isSaving ? 'Gravando no Firebase...' : 'Firebase Conectado & Sincronizado'}</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Gestão e monitoramento individual e por turma das entregas dos alunos com persistência em nuvem em tempo real.
              </p>
            </div>
          </div>
        </div>

        {/* User Identity & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Logged User Badge */}
          {currentUser && (
            <div className="flex items-center gap-2 bg-slate-100 border border-slate-200/80 rounded-xl px-3 py-1.5 text-xs">
              {isAdmin ? (
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
              ) : (
                <UserCheck className="w-4 h-4 text-indigo-600 shrink-0" />
              )}
              <div>
                <span className="font-bold text-slate-900 block leading-none">
                  {currentUser.name || currentUser.email}
                </span>
                <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                  {isAdmin ? 'Administrador Master' : 'Visualizador Autorizado'}
                </span>
              </div>

              <button
                type="button"
                onClick={onLogout}
                title="Sair do Sistema"
                className="ml-1.5 p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Security Audit Button (Only for Admin) */}
          {isAdmin && (
            <button
              type="button"
              onClick={onOpenSecurityAudit}
              className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              title="Ver Central de Segurança e Auditoria"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Auditoria Cyber</span>
            </button>
          )}

          {/* Admin User Access Manager Button */}
          {isAdmin && (
            <button
              type="button"
              onClick={onOpenUserAccessManager}
              className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Gerenciar Acessos</span>
            </button>
          )}

          {/* Turmas Management Button (Only for Admin) */}
          {isAdmin && (
            <button
              type="button"
              onClick={onOpenManageGroups}
              id="btn-manage-groups"
              className="px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              title="Criar, renomear ou remover turmas no Firebase"
            >
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Turmas</span>
            </button>
          )}

          {/* Add Student & Add Activity buttons (Only for Admin) */}
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={onOpenAddStudent}
                id="btn-add-student"
                className="px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              >
                <Plus className="w-4 h-4 text-slate-500" />
                + Aluno
              </button>

              <button
                type="button"
                onClick={onOpenAddActivity}
                id="btn-add-activity"
                className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                + Atividade
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onOpenReport}
            id="btn-open-report"
            className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            Relatório / Exportar
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={onResetData}
              title="Esvaziar e resetar dados do banco de dados"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter & View Mode Controls Row */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search & Select Filters */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search bar */}
          <div className="relative min-w-[200px] flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar aluno ou atividade..."
              className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 text-xs bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          {/* Filter Turma */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedGroup}
              onChange={(e) => onGroupChange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">Todas as Turmas</option>
              {groups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Status */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <select
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value as Status | 'todos')}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="todos">Todos os Status</option>
              <option value="pendente">Pendentes</option>
              <option value="em_progresso">Em Progresso</option>
              <option value="concluido">Concluídos</option>
            </select>
          </div>
        </div>

        {/* View Mode Segmented Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start lg:self-auto border border-slate-200/60 shrink-0">
          <button
            type="button"
            onClick={() => onViewModeChange('matrix')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'matrix'
                ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Matriz Geral
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('students')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'students'
                ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Por Aluno
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('activities')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'activities'
                ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Por Atividade
          </button>
        </div>
      </div>
    </div>
  );
};

