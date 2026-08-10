import React, { useState, useEffect } from 'react';
import { X, UserCheck, Trash2 } from 'lucide-react';
import { Student } from '../types';

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onSaveStudent: (updated: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  existingGroups: string[];
}

export const EditStudentModal: React.FC<EditStudentModalProps> = ({
  isOpen,
  onClose,
  student,
  onSaveStudent,
  onDeleteStudent,
  existingGroups,
}) => {
  const [name, setName] = useState('');
  const [group, setGroup] = useState('');
  const [customGroup, setCustomGroup] = useState('');
  const [isConfirmDelete, setIsConfirmDelete] = useState(false);

  useEffect(() => {
    if (student) {
      setName(student.name);
      setGroup(existingGroups.includes(student.group) ? student.group : 'NEW');
      if (!existingGroups.includes(student.group)) {
        setCustomGroup(student.group);
      }
      setIsConfirmDelete(false);
    }
  }, [student, existingGroups, isOpen]);

  if (!isOpen || !student) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim();
    const finalGroup = group === 'NEW' ? customGroup.trim() : group;

    if (!finalName || !finalGroup) return;

    onSaveStudent({
      ...student,
      name: finalName,
      group: finalGroup,
    });
    onClose();
  };

  const handleDelete = () => {
    onDeleteStudent(student.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            <span>Editar Aluno</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="edit-student-name" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nome do Aluno *
            </label>
            <input
              id="edit-student-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="edit-student-group" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Turma *
            </label>
            <select
              id="edit-student-group"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {existingGroups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
              <option value="NEW">+ Criar Nova Turma...</option>
            </select>
          </div>

          {group === 'NEW' && (
            <div>
              <label htmlFor="edit-student-customgroup" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Nome da Nova Turma *
              </label>
              <input
                id="edit-student-customgroup"
                type="text"
                required
                value={customGroup}
                onChange={(e) => setCustomGroup(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Confirm delete warning */}
          {isConfirmDelete ? (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
              <p className="text-xs font-bold text-rose-800">Tem certeza que deseja remover este aluno?</p>
              <p className="text-[11px] text-rose-600">O histórico de tarefas deste aluno será excluído permanentemente.</p>
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
                  Sim, Remover Aluno
                </button>
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {!isConfirmDelete && (
              <button
                type="button"
                onClick={() => setIsConfirmDelete(true)}
                className="text-xs font-medium text-rose-600 hover:text-rose-700 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remover Aluno
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
