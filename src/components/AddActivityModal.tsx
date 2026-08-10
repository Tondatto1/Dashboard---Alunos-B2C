import React, { useState } from 'react';
import { X, BookPlus, Users } from 'lucide-react';
import { Activity } from '../types';

interface AddActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddActivity: (activityData: Omit<Activity, 'id'>) => void;
  existingGroups: string[];
}

export const AddActivityModal: React.FC<AddActivityModalProps> = ({
  isOpen,
  onClose,
  onAddActivity,
  existingGroups,
}) => {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [targetGroup, setTargetGroup] = useState('ALL');
  const [customGroup, setCustomGroup] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = title.trim();

    if (!finalTitle) return;

    const finalTargetGroup =
      targetGroup === 'NEW' ? customGroup.trim() : targetGroup;

    onAddActivity({
      title: finalTitle,
      dueDate: dueDate || undefined,
      description: description.trim() || undefined,
      targetGroup: finalTargetGroup || 'ALL',
    });

    setTitle('');
    setDescription('');
    setDueDate('');
    setTargetGroup('ALL');
    setCustomGroup('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
            <BookPlus className="w-5 h-5 text-indigo-600" />
            <span>Nova Atividade da Formação</span>
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
            <label htmlFor="activity-title-input" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Título da Atividade *
            </label>
            <input
              id="activity-title-input"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Atividade 01 - Diagnóstico Inicial"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="activity-group-select" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              Turma Alvo *
            </label>
            <select
              id="activity-group-select"
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
            <p className="text-[11px] text-slate-500 mt-1">
              Selecione a turma específica a qual esta atividade se destina.
            </p>
          </div>

          {targetGroup === 'NEW' && (
            <div>
              <label htmlFor="custom-activity-group-input" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Nome da Nova Turma *
              </label>
              <input
                id="custom-activity-group-input"
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
            <label htmlFor="activity-duedate-input" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Data Limite de Entrega (Opcional)
            </label>
            <input
              id="activity-duedate-input"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="activity-description-input" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Instruções / Descrição (Opcional)
            </label>
            <textarea
              id="activity-description-input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes ou orientações sobre a execução da atividade..."
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

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
              Criar Atividade
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
