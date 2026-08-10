import React, { useState } from 'react';
import { X, Download, Printer, FileText, Filter, User, Users } from 'lucide-react';
import { Student, Activity, StudentActivityRecord } from '../types';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  activities: Activity[];
  records: StudentActivityRecord[];
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  students,
  activities,
  records,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('ALL');

  if (!isOpen) return null;

  // Derive unique groups
  const groups = Array.from(new Set(students.map((s) => s.group))).sort();

  // Filter students based on group and student selection
  const availableStudentsForGroup =
    selectedGroup === 'ALL'
      ? students
      : students.filter((s) => s.group === selectedGroup);

  const filteredStudents =
    selectedStudentId === 'ALL'
      ? availableStudentsForGroup
      : availableStudentsForGroup.filter((s) => s.id === selectedStudentId);

  // Group selection change handler resets student selection if needed
  const handleGroupChange = (group: string) => {
    setSelectedGroup(group);
    setSelectedStudentId('ALL');
  };

  const handleExportCSV = () => {
    // UTF-8 BOM (Byte Order Mark) forces Excel (desktop & mobile) to read UTF-8 properly
    const BOM = '\uFEFF';

    const headers = [
      'Aluno',
      'Turma do Aluno',
      'Atividade',
      'Turma Alvo da Atividade',
      'Data Limite',
      'Status',
      'Última Atualização',
      'Observações',
    ];

    const statusMap: Record<string, string> = {
      concluido: 'Concluído',
      em_progresso: 'Em Progresso',
      pendente: 'Pendente',
    };

    const rows: string[] = [headers.join(';')];

    filteredStudents.forEach((student) => {
      // Activities relevant to this student
      const relevantActivities = activities.filter(
        (act) =>
          !act.targetGroup ||
          act.targetGroup === 'ALL' ||
          act.targetGroup === student.group
      );

      relevantActivities.forEach((activity) => {
        const record = records.find(
          (r) => r.studentId === student.id && r.activityId === activity.id
        );
        const rawStatus = record ? record.status : 'pendente';
        const formattedStatus = statusMap[rawStatus] || 'Pendente';
        const updatedAt = record?.updatedAt || '-';
        const notes = record?.notes ? record.notes.replace(/"/g, '""') : '';

        const row = [
          `"${student.name.replace(/"/g, '""')}"`,
          `"${student.group.replace(/"/g, '""')}"`,
          `"${activity.title.replace(/"/g, '""')}"`,
          `"${(activity.targetGroup && activity.targetGroup !== 'ALL' ? activity.targetGroup : 'Todas').replace(/"/g, '""')}"`,
          `"${activity.dueDate || ''}"`,
          `"${formattedStatus}"`,
          `"${updatedAt}"`,
          `"${notes}"`,
        ];

        rows.push(row.join(';'));
      });
    });

    const csvContent = BOM + rows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const groupLabel =
      selectedGroup === 'ALL' ? 'Geral' : selectedGroup.replace(/\s+/g, '_');
    const studentLabel =
      selectedStudentId === 'ALL'
        ? ''
        : `_${(filteredStudents[0]?.name || '').replace(/\s+/g, '_')}`;

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Relatorio_Formacao_${groupLabel}${studentLabel}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  // Calculate stats for current filter
  const totalStudents = filteredStudents.length;
  let totalRelevantDeliveries = 0;
  let completedDeliveries = 0;

  filteredStudents.forEach((st) => {
    const studentActivities = activities.filter(
      (act) =>
        !act.targetGroup || act.targetGroup === 'ALL' || act.targetGroup === st.group
    );
    totalRelevantDeliveries += studentActivities.length;
    studentActivities.forEach((act) => {
      const rec = records.find((r) => r.studentId === st.id && r.activityId === act.id);
      if (rec && rec.status === 'concluido') {
        completedDeliveries++;
      }
    });
  });

  const overallPercentage =
    totalRelevantDeliveries > 0
      ? Math.round((completedDeliveries / totalRelevantDeliveries) * 100)
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
            <FileText className="w-5 h-5 text-indigo-600" />
            <span>Relatório Consolidado / Exportação</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Report Preview */}
        <div className="p-6 overflow-y-auto space-y-6 print:p-0">
          {/* Export Filter Controls */}
          <div className="bg-slate-100/80 border border-slate-200 p-4 rounded-xl space-y-3 print:hidden">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <Filter className="w-4 h-4 text-indigo-600" /> Opções de Filtragem do Relatório
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Select Turma */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-500" /> Selecionar Turma:
                </label>
                <select
                  value={selectedGroup}
                  onChange={(e) => handleGroupChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">Todas as Turmas</option>
                  {groups.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Aluno */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-500" /> Selecionar Aluno:
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">
                    {selectedGroup === 'ALL'
                      ? 'Todos os Alunos'
                      : `Todos os Alunos da ${selectedGroup}`}
                  </option>
                  {availableStudentsForGroup.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.group})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Report Summary Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Resumo do Relatório</h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                {selectedGroup === 'ALL' ? 'Geral' : selectedGroup}
                {selectedStudentId !== 'ALL' &&
                  ` • ${filteredStudents[0]?.name}`}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-2 border-t border-slate-200/60">
              <div>
                <span className="text-slate-500 font-medium">Alunos em Exibição:</span>
                <p className="font-extrabold text-slate-900 text-sm">{totalStudents}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Total de Entregas:</span>
                <p className="font-extrabold text-slate-900 text-sm">{totalRelevantDeliveries}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Concluídas:</span>
                <p className="font-extrabold text-emerald-600 text-sm">{completedDeliveries}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Taxa da Seleção:</span>
                <p className="font-extrabold text-indigo-600 text-sm">{overallPercentage}%</p>
              </div>
            </div>
          </div>

          {/* Detailed Student Progress List */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Detalhamento de Desempenho
            </h4>

            {filteredStudents.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                Nenhum aluno localizado para o filtro selecionado.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                {filteredStudents.map((student) => {
                  const studentActivities = activities.filter(
                    (act) =>
                      !act.targetGroup ||
                      act.targetGroup === 'ALL' ||
                      act.targetGroup === student.group
                  );

                  const studentRecords = records.filter(
                    (r) => r.studentId === student.id
                  );
                  const completed = studentActivities.filter((act) => {
                    const rec = studentRecords.find((r) => r.activityId === act.id);
                    return rec && rec.status === 'concluido';
                  }).length;

                  const percentage =
                    studentActivities.length > 0
                      ? Math.round((completed / studentActivities.length) * 100)
                      : 0;

                  return (
                    <div key={student.id} className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900 text-xs">
                            {student.name}
                          </span>
                          <span className="text-[11px] text-slate-500 ml-2 font-medium">
                            ({student.group})
                          </span>
                        </div>
                        <span className="text-xs font-bold text-indigo-600">
                          {completed}/{studentActivities.length} concluídas ({percentage}%)
                        </span>
                      </div>

                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      {/* Detail list of tasks for individual student preview */}
                      <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-slate-100">
                        {studentActivities.map((act) => {
                          const rec = studentRecords.find((r) => r.activityId === act.id);
                          const st = rec ? rec.status : 'pendente';
                          const statusLabels: Record<string, { label: string; color: string }> = {
                            concluido: { label: 'Concluído', color: 'text-emerald-700 bg-emerald-50' },
                            em_progresso: { label: 'Em Progresso', color: 'text-amber-700 bg-amber-50' },
                            pendente: { label: 'Pendente', color: 'text-slate-600 bg-slate-100' },
                          };

                          return (
                            <div
                              key={act.id}
                              className="flex items-center justify-between text-[11px] py-1 px-2 rounded hover:bg-slate-50"
                            >
                              <span className="text-slate-800 font-medium truncate max-w-[320px]">
                                {act.title}
                              </span>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusLabels[st].color}`}
                                >
                                  {statusLabels[st].label}
                                </span>
                                {rec?.notes && (
                                  <span className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                    Obs: {rec.notes}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0 print:hidden">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredStudents.length === 0}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> Exportar Planilha (CSV)
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={filteredStudents.length === 0}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Printer className="w-4 h-4" /> Imprimir
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs rounded-lg transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

