import React, { useState } from 'react';
import {
  X,
  Users,
  Plus,
  Edit2,
  Trash2,
  Check,
  AlertCircle,
  FolderPlus,
  BookOpen,
} from 'lucide-react';
import { Turma, Student, Activity } from '../types';

interface ManageGroupsModalProps {
  isOpen: boolean;
  onClose: () => void;
  turmas: Turma[];
  students: Student[];
  activities: Activity[];
  onSaveTurma: (name: string, description?: string) => Promise<void>;
  onRenameTurma: (turmaId: string, oldName: string, newName: string) => Promise<void>;
  onDeleteTurma: (turmaId: string, name: string) => Promise<void>;
}

export const ManageGroupsModal: React.FC<ManageGroupsModalProps> = ({
  isOpen,
  onClose,
  turmas,
  students,
  activities,
  onSaveTurma,
  onRenameTurma,
  onDeleteTurma,
}) => {
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [editingTurmaId, setEditingTurmaId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateTurma = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newGroupName.trim();
    if (!cleanName) {
      setError('Informe o nome da turma.');
      return;
    }

    if (turmas.some((t) => t.name.toLowerCase() === cleanName.toLowerCase())) {
      setError('Já existe uma turma cadastrada com este nome.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await onSaveTurma(cleanName, newGroupDescription.trim() || undefined);
      setNewGroupName('');
      setNewGroupDescription('');
      setSuccess(`Turma "${cleanName}" criada com sucesso no banco de dados!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar turma no Firebase.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (t: Turma) => {
    setEditingTurmaId(t.id);
    setEditName(t.name);
    setError(null);
  };

  const handleSaveRename = async (t: Turma) => {
    const cleanNewName = editName.trim();
    if (!cleanNewName) {
      setError('O nome da turma não pode ficar vazio.');
      return;
    }

    if (cleanNewName === t.name) {
      setEditingTurmaId(null);
      return;
    }

    if (
      turmas.some(
        (other) =>
          other.id !== t.id &&
          other.name.toLowerCase() === cleanNewName.toLowerCase()
      )
    ) {
      setError('Já existe outra turma com esse nome.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await onRenameTurma(t.id, t.name, cleanNewName);
      setEditingTurmaId(null);
      setSuccess(`Turma renomeada para "${cleanNewName}" e sincronizada em todos os alunos e atividades!`);
      setTimeout(() => setSuccess(null), 3500);
    } catch (err: any) {
      setError(err.message || 'Erro ao renomear turma.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (t: Turma) => {
    const studentCount = students.filter(
      (s) => s.group.toLowerCase() === t.name.toLowerCase()
    ).length;

    const confirmMsg =
      studentCount > 0
        ? `Atenção: A turma "${t.name}" possui ${studentCount} aluno(s) vinculados. Deseja remover esta turma do cadastro de turmas?`
        : `Deseja remover a turma "${t.name}"?`;

    if (window.confirm(confirmMsg)) {
      setLoading(true);
      setError(null);
      try {
        await onDeleteTurma(t.id, t.name);
        setSuccess(`Turma "${t.name}" removida com sucesso!`);
        setTimeout(() => setSuccess(null), 3000);
      } catch (err: any) {
        setError(err.message || 'Erro ao remover turma.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
            <Users className="w-5 h-5 text-indigo-600" />
            <span>Gerenciar Turmas e Grupos</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          {/* Create New Group Card */}
          <div className="p-4.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <FolderPlus className="w-4 h-4 text-indigo-600" />
              Cadastrar Nova Turma
            </h3>

            <form onSubmit={handleCreateTurma} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome da Turma *
                  </label>
                  <input
                    type="text"
                    required
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Ex: Turma 01 - Comercial Sul"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Descrição (Opcional)
                  </label>
                  <input
                    type="text"
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                    placeholder="Ex: RTVs e Representantes RS/SC"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Criar Turma</span>
                </button>
              </div>
            </form>
          </div>

          {/* List of Registered Groups */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span>Turmas Cadastradas ({turmas.length})</span>
            </h4>

            {turmas.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl text-xs">
                Nenhuma turma cadastrada ainda. Crie a primeira turma acima ou ao cadastrar um aluno.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                {turmas.map((t) => {
                  const studentCount = students.filter(
                    (s) => s.group.toLowerCase() === t.name.toLowerCase()
                  ).length;
                  const activityCount = activities.filter(
                    (a) =>
                      !a.targetGroup ||
                      a.targetGroup === 'ALL' ||
                      a.targetGroup.toLowerCase() === t.name.toLowerCase()
                  ).length;

                  const isEditing = editingTurmaId === t.id;

                  return (
                    <div
                      key={t.id}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                    >
                      {isEditing ? (
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1 px-3 py-1.5 rounded-lg border border-indigo-400 text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveRename(t)}
                            disabled={loading}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" /> Salvar
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingTurmaId(null)}
                            className="px-3 py-1.5 bg-slate-200 text-slate-700 font-bold text-xs rounded-lg cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">
                              {t.name}
                            </span>
                            {t.description && (
                              <span className="text-[11px] text-slate-500">
                                — {t.description}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-slate-500">
                            <span className="flex items-center gap-1 font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                              <Users className="w-3 h-3" /> {studentCount} aluno(s)
                            </span>
                            <span className="flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-medium">
                              <BookOpen className="w-3 h-3" /> {activityCount} atividade(s)
                            </span>
                          </div>
                        </div>
                      )}

                      {!isEditing && (
                        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(t)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Renomear Turma"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(t)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Remover Turma"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
