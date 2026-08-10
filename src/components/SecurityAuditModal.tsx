import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Info,
  X,
  Lock,
  RefreshCw,
  Search,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { SecurityAuditLog } from '../types';
import { subscribeSecurityAuditLogs } from '../services/auditService';

interface SecurityAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail?: string;
}

export const SecurityAuditModal: React.FC<SecurityAuditModalProps> = ({
  isOpen,
  onClose,
  currentUserEmail,
}) => {
  const [logs, setLogs] = useState<SecurityAuditLog[]>([]);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    const unsubscribe = subscribeSecurityAuditLogs((newLogs) => {
      setLogs(newLogs);
    });
    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter((log) => {
    const matchesSeverity =
      filterSeverity === 'all' || log.severity === filterSeverity;
    const matchesSearch =
      !searchTerm ||
      log.actorEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  const getSeverityBadge = (severity: SecurityAuditLog['severity']) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" /> Crítico
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> Alerta
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <Info className="w-3.5 h-3.5 text-blue-500" /> Info
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight flex items-center gap-2 text-white">
                Central de Auditoria & Segurança Cyber
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                  Protegido & Auditado
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Registro imutável de eventos de acesso, logins e modificações de dados no Firestore.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 border-b border-slate-200">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Regras Firestore</p>
              <p className="text-xs font-extrabold text-slate-800">Autenticação Obrigatoriamente Ativa</p>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Proteção XSS & Anti-Brute</p>
              <p className="text-xs font-extrabold text-slate-800">Sanitização & Rate-Limiting Ativo</p>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Logs Registrados</p>
              <p className="text-xs font-extrabold text-slate-800">{logs.length} Eventos em Tempo Real</p>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-4 bg-white border-b border-slate-200 flex flex-wrap gap-3 items-center justify-between">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por e-mail, ação ou detalhe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Severidade:</span>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Todos os Eventos</option>
              <option value="info">Informação (Info)</option>
              <option value="warning">Alertas de Segurança</option>
              <option value="critical">Críticos</option>
            </select>
          </div>
        </div>

        {/* Log List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-slate-50/50 min-h-[300px]">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <ShieldCheck className="w-12 h-12 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
              <p className="text-sm font-bold text-slate-600">Nenhum evento registrado com esse filtro.</p>
              <p className="text-xs text-slate-400 mt-1">Todos os acessos e alterações serão listados aqui em tempo real.</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getSeverityBadge(log.severity)}
                    <span className="text-xs font-extrabold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md font-mono">
                      {log.action}
                    </span>
                    <span className="text-xs font-bold text-indigo-700">
                      {log.actorEmail}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium pl-0.5">
                    {log.details}
                  </p>
                </div>

                <div className="text-right shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 block font-mono">
                    {new Date(log.timestamp).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-500">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Auditoria Criptografada e Gravada no Firebase Firestore</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
          >
            Fechar Painel
          </button>
        </div>
      </div>
    </div>
  );
};
