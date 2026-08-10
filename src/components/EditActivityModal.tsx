import React, { useState, useEffect } from 'react';
import { X, Edit3, Trash2, Users, Check } from 'lucide-react';
import { Activity, Student } from '../types';

interface EditActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: Activity | null;
  students: Student[];
  existingGroups: string[];
  onSaveActivity: (updated: Activity) => void;
  onDeleteActivity: (activityId: string) => void;
}

export const EditActivityModal: React.FC<EditActivityModalProps> = ({
  isOpen,
  onClose,
  activity,
  students,
  existingGroups,
  onSaveActivity,
  onDeleteActivity,
}) => {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [targetGroup, setTargetGroup] = useState('ALL');
  const [customGroup, setCustomGroup] = useState('');
  const [assignedStudentIds, setAssignedStudentIds] = useState<string[]>([]);
  const [isConfirmDelete, setIsConfirmDelete] = useState(false);

  useEffect(() => {
    if (activity) {
      setTitle(activity.title);
      setDueDate(activity.dueDate || '');
      setDescription(activity.description || '');
      setTargetGroup(activity.targetGroup || 'ALL');
      setCustomGroup('');
      setAssignedStudentIds(activity.assignedStudentIds || []);
      setIsConfirmDelete(false);
    }
  }, [activity, isOpen]);

  if (!isOpen || !activity) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = title.trim();

    if (!finalTitle) return;

    const finalTargetGroup = targetGroup === 'NEW' ? customGroup.trim() : targetGroup;

    onSaveActivity({
      ...activity,
      title: finalTitle,
      dueDate: dueDate || undefined,
      description: description.trim() || undefined,
      targetGroup: finalTargetGroup || 'ALL',
      assignedStudentIds: assignedStudentIds.length === 0 || assignedStudentIds.length === students.length ? undefined : assignedStudentIds,
    });
    onClose();
  };

  const toggleStudentAssignment = (studentId: string) => {
    setAssignedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const selectAllStudents = () => {
    setAssignedStudentIds([]);
  };

  const handleDelete = () => {
    onDeleteActivity(activity.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
            <Edit3 className="w-5 h-5 text-indigo-600" />
            <span>Editar Atividade</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label htmlFor="edit-activity-title" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Título da Atividade *
            </label>
            <input
              id="edit-activity-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="edit-activity-group-select" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              Turma Alvo *
            </label>
            <select
              id="edit-activity-group-select"
              value={targetGroup}
              onChange={(e) => setTargetGroup(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="ALL">Todas as Turmas (Geral)</option>
              {existingGroups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
              <option value="NEW">+ Criar Nova Turma...</option>
            </select>
          </div>

          {targetGroup === 'NEW' && (
            <div>
              <label htmlFor="edit-custom-activity-group" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Nome da Nova Turma *
              </label>
              <input
                id="edit-custom-activity-group"
                type="text"
                required
                value={customGroup}
                onChange={(e) => setCustomGroup(e.target.value)}
                placeholder="Ex: Turma 03"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          <div>
            <label htmlFor="edit-activity-duedate" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Data Limite de Entrega
            </label>
            <input
              id="edit-activity-duedate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="edit-activity-description" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Instruções / Descrição
            </label>
            <textarea
              id="edit-activity-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Assigned Participants Selector */}
          <div className="border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-indigo-600" /> Atribuído a quais alunos?
              </label>
              <button
                type="button"
                onClick={selectAllStudents}
                className="text-xs text-indigo-600 hover:underline font-medium"
              >
                {assignedStudentIds.length === 0 ? '✓ Todos Atribuídos' : 'Atribuir a Todos'}
              </button>
            </div>

            <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-slate-50/50 p-2 space-y-1">
              {students.map((st) => {
                const isSelected = assignedStudentIds.length === 0 || assignedStudentIds.includes(st.id);
                return (
                  <div
                    key={st.id}
                    onClick={() => toggleStudentAssignment(st.id)}
                    className="flex items-center justify-between p-2 rounded cursor-pointer hover:bg-white transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full ${st.avatarColor} text-white font-bold text-[10px] flex items-center justify-center`}>
                        {st.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{st.name}</p>
                        <p className="text-[10px] text-slate-400">{st.group}</p>
                      </div>
                    </div>

                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                      isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Danger zone / Confirm delete */}
          {isConfirmDelete ? (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
              <p className="text-xs font-bold text-rose-800">Tem certeza que deseja excluir esta atividade?</p>
              <p className="text-[11px] text-rose-600">Todos os registros e notas associadas serão removidos permanentemente.</p>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsConfirmDelete(false)}
                  className="px-3 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-1 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700"
                >
                  Sim, Excluir Definitivamente
                </button>
              </div>
            </div>
          ) : null}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 shrink-0">
            {!isConfirmDelete && (
              <button
                type="button"
                onClick={() => setIsConfirmDelete(true)}
                className="text-xs font-medium text-rose-600 hover:text-rose-700 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Excluir Atividade
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-2xs transition-colors"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
