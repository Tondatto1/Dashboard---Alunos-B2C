import React, { useState } from 'react';
import {
  X,
  UserPlus,
  ShieldAlert,
  Users,
  User,
  Trash2,
  CheckCircle2,
  Clock,
  KeyRound,
  Filter,
} from 'lucide-react';
import { Student, AuthorizedUser, ScopeType, UserRole } from '../types';

interface UserAccessManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  authorizedUsers: AuthorizedUser[];
  students: Student[];
  groups: string[];
  currentUserEmail: string;
  onSaveUserPermission: (user: AuthorizedUser) => Promise<void>;
  onDeleteUserPermission: (userId: string) => Promise<void>;
}

export const UserAccessManagerModal: React.FC<UserAccessManagerModalProps> = ({
  isOpen,
  onClose,
  authorizedUsers,
  students,
  groups,
  currentUserEmail,
  onSaveUserPermission,
  onDeleteUserPermission,
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('viewer');
  const [targetScope, setTargetScope] = useState<ScopeType>('SPECIFIC_GROUP');
  const [allowedGroup, setAllowedGroup] = useState<string>(groups[0] || 'Turma 01');
  const [allowedStudentId, setAllowedStudentId] = useState<string>(
    students[0]?.id || ''
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddOrUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Informe um e-mail válido.');
      return;
    }

    setLoading(true);

    try {
      const now = new Date().toISOString().split('T')[0];

      const existingUser = authorizedUsers.find(
        (u) => u.email.toLowerCase() === cleanEmail
      );

      const newAuthorizedUser: AuthorizedUser = {
        id: cleanEmail,
        email: cleanEmail,
        name: name.trim() || cleanEmail.split('@')[0],
        role,
        targetScope: role === 'admin' ? 'ALL_GROUPS' : targetScope,
        allowedGroup:
          role === 'viewer' && targetScope === 'SPECIFIC_GROUP'
            ? allowedGroup
            : undefined,
        allowedStudentId:
          role === 'viewer' && targetScope === 'SPECIFIC_STUDENT'
            ? allowedStudentId
            : undefined,
        status: existingUser ? existingUser.status : 'pending',
        createdAt: existingUser ? existingUser.createdAt : now,
        invitedBy: currentUserEmail,
      };

      await onSaveUserPermission(newAuthorizedUser);

      setSuccess(`E-mail ${cleanEmail} autorizado com sucesso!`);
      setEmail('');
      setName('');
      setRole('viewer');
      setTargetScope('SPECIFIC_GROUP');
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar permissão.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: string, targetEmail: string) => {
    if (targetEmail.toLowerCase() === currentUserEmail.toLowerCase()) {
      alert('Você não pode remover seu próprio acesso administrativo!');
      return;
    }

    if (
      window.confirm(
        `Tem certeza que deseja revogar o acesso do usuário ${targetEmail}?`
      )
    ) {
      try {
        await onDeleteUserPermission(userId);
      } catch (err: any) {
        alert('Erro ao excluir autorização.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
            <UserPlus className="w-5 h-5 text-indigo-600" />
            <span>Gerenciar Permissões de Acesso (ADM)</span>
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
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Add User Section */}
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-indigo-600" />
              Autorizar Novo Usuário / Definir Escopo
            </h3>

            <p className="text-[11px] text-slate-500 font-medium">
              💡 Ao autorizar um e-mail, o usuário criará a própria senha no primeiro login. A senha exigirá no mínimo 8 caracteres (com letra maiúscula, minúscula, número e caractere especial).
            </p>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium">
                {success}
              </div>
            )}

            <form onSubmit={handleAddOrUpdateUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    E-mail a Autorizar *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="professor@escola.com"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome / Apelido (Opcional)
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Prof. Roberto"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Role select */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Função de Acesso *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-bold bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="viewer">Visualizador (Acesso Restrito)</option>
                    <option value="admin">Administrador (Acesso Total + Gestão)</option>
                  </select>
                </div>

                {/* Scope select if Viewer */}
                {role === 'viewer' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Escopo de Visualização *
                    </label>
                    <select
                      value={targetScope}
                      onChange={(e) => setTargetScope(e.target.value as ScopeType)}
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-bold bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="SPECIFIC_GROUP">Turma Específica</option>
                      <option value="SPECIFIC_STUDENT">Aluno Específico</option>
                      <option value="ALL_GROUPS">Todas as Turmas (Apenas Leitura)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Scope parameters */}
              {role === 'viewer' && targetScope === 'SPECIFIC_GROUP' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-indigo-600" />
                    Selecione a Turma Permitida:
                  </label>
                  <select
                    value={allowedGroup}
                    onChange={(e) => setAllowedGroup(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-semibold bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    {groups.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {role === 'viewer' && targetScope === 'SPECIFIC_STUDENT' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-indigo-600" />
                    Selecione o Aluno Permitido:
                  </label>
                  <select
                    value={allowedStudentId}
                    onChange={(e) => setAllowedStudentId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-semibold bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    {students.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.group})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                <span>Autorizar e Salvar Permissão</span>
              </button>
            </form>
          </div>

          {/* List of Authorized Users */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span>Usuários Autorizados Cadastrados ({authorizedUsers.length})</span>
            </h4>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
              {authorizedUsers.map((usr) => {
                const targetStudentName =
                  usr.targetScope === 'SPECIFIC_STUDENT'
                    ? students.find((s) => s.id === usr.allowedStudentId)?.name || 'Aluno Desconhecido'
                    : '';

                return (
                  <div
                    key={usr.id}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">
                          {usr.name || usr.email}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          ({usr.email})
                        </span>

                        {usr.role === 'admin' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                            ADM Master
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                            Visualizador
                          </span>
                        )}

                        {usr.status === 'pending' ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" /> Aguardando 1º acesso
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Ativo
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-600 flex items-center gap-2">
                        <span className="font-semibold text-slate-700">Permissão de Visão:</span>
                        {usr.role === 'admin' ? (
                          <span className="text-slate-800">Acesso Total a Todas as Turmas e Alunos</span>
                        ) : usr.targetScope === 'SPECIFIC_GROUP' ? (
                          <span className="text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">
                            👥 Turma: {usr.allowedGroup || 'Não especificada'}
                          </span>
                        ) : usr.targetScope === 'SPECIFIC_STUDENT' ? (
                          <span className="text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">
                            👤 Aluno: {targetStudentName}
                          </span>
                        ) : (
                          <span className="text-slate-700 font-medium">Todas as Turmas (Leitura)</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDelete(usr.id, usr.email)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Revogar Acesso"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
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
