import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { Student } from '../types';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStudent: (studentData: Omit<Student, 'id'>) => void;
  existingGroups: string[];
}

const AVATAR_COLORS = [
  'bg-emerald-600',
  'bg-blue-600',
  'bg-amber-600',
  'bg-purple-600',
  'bg-teal-600',
  'bg-rose-600',
  'bg-indigo-600',
  'bg-orange-600',
];

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  onAddStudent,
  existingGroups,
}) => {
  const [name, setName] = useState('');
  const [group, setGroup] = useState(existingGroups[0] || 'NEW');
  const [customGroup, setCustomGroup] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim();
    const finalGroup = group === 'NEW' ? customGroup.trim() : group;

    if (!finalName || !finalGroup) return;

    const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

    onAddStudent({
      name: finalName,
      group: finalGroup,
      avatarColor: randomColor,
    });

    setName('');
    setCustomGroup('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
            <UserPlus className="w-5 h-5 text-indigo-600" />
            <span>Cadastrar Aluno</span>
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
            <label htmlFor="student-name-input" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nome do Aluno *
            </label>
            <input
              id="student-name-input"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Maria Silva"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="student-group-select" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Turma *
            </label>
            <select
              id="student-group-select"
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

          {(group === 'NEW' || existingGroups.length === 0) && (
            <div>
              <label htmlFor="custom-group-input" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Nome da Nova Turma *
              </label>
              <input
                id="custom-group-input"
                type="text"
                required
                value={customGroup}
                onChange={(e) => setCustomGroup(e.target.value)}
                placeholder="Ex: Turma 2026.1"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
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
              Salvar Aluno
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
