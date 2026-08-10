import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Trash2 } from 'lucide-react';
import { Student, Activity, Status } from '../types';
import { StatusBadge } from './StatusBadge';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  student?: Student;
  activity?: Activity;
  currentStatus: Status;
  currentNotes?: string;
  onSave: (notes: string, newStatus: Status) => void;
}

export const NoteModal: React.FC<NoteModalProps> = ({
  isOpen,
  onClose,
  student,
  activity,
  currentStatus,
  currentNotes = '',
  onSave,
}) => {
  const [notes, setNotes] = useState(currentNotes);
  const [status, setStatus] = useState<Status>(currentStatus);

  useEffect(() => {
    setNotes(currentNotes || '');
    setStatus(currentStatus);
  }, [currentNotes, currentStatus, isOpen]);

  if (!isOpen || !student || !activity) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(notes.trim(), status);
    onClose();
  };

  const handleRemoveNote = () => {
    setNotes('');
    onSave('', status);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            <span>Observação & Status</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Aluno:</p>
            <p className="text-sm font-bold text-slate-800">{student.name} <span className="font-normal text-slate-500">({student.group})</span></p>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider pt-2">Atividade:</p>
            <p className="text-sm font-bold text-slate-800">{activity.title} <span className="font-normal text-slate-500">[{activity.subject}]</span></p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Status Atual:
            </label>
            <div className="flex items-center gap-2">
              {(['pendente', 'em_progresso', 'concluido'] as Status[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatus(st)}
                  className={`flex-1 py-1.5 px-2 rounded-lg border text-xs font-semibold transition-all ${
                    status === st
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <StatusBadge status={st} interactive={false} size="sm" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="note-text-area" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Anotação / Feedback do Professor
            </label>
            <textarea
              id="note-text-area"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Entregou com 1 dia de atraso; necessita reforço na questão 3."
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {currentNotes ? (
              <button
                type="button"
                onClick={handleRemoveNote}
                className="text-xs font-medium text-rose-600 hover:text-rose-700 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remover anotação
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
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
