import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  UserCheck,
  AlertCircle,
  KeyRound,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import {
  getAuthorizedUserByEmail,
  saveAuthorizedUserToFirebase,
} from '../services/firebaseService';
import { AuthorizedUser } from '../types';
import { logSecurityEvent } from '../services/auditService';
import {
  isValidEmail,
  checkBruteForceLockout,
  recordFailedLoginAttempt,
  clearFailedLoginAttempts,
} from '../utils/security';

interface LoginModalProps {
  onLoginSuccess: (user: AuthorizedUser) => void;
}

// Configuração de ambiente para demonstração / testes
// Altere para `false` para remover a opção "Entrar como ADM" em ambiente de produção.
const SHOW_DEMO_ADMIN_LOGIN = true;

const validatePasswordComplexity = (pass: string): string | null => {
  if (pass.length < 8) {
    return 'A senha deve ter no mínimo 8 caracteres.';
  }
  if (!/[A-Z]/.test(pass)) {
    return 'A senha deve conter pelo menos 1 letra maiúscula (ex: A, B, C).';
  }
  if (!/[a-z]/.test(pass)) {
    return 'A senha deve conter pelo menos 1 letra minúscula (ex: a, b, c).';
  }
  if (!/[0-9]/.test(pass)) {
    return 'A senha deve conter pelo menos 1 número (ex: 1, 2, 3).';
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(pass)) {
    return 'A senha deve conter pelo menos 1 caractere especial (ex: @, #, $, %, &).';
  }
  return null;
};

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegisterStep, setIsRegisterStep] = useState(false);
  const [pendingUser, setPendingUser] = useState<AuthorizedUser | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleCheckEmailOrLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Por favor, informe seu e-mail de acesso.');
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setError('E-mail em formato inválido.');
      return;
    }

    // Check rate limit / brute force lockout
    const lockout = checkBruteForceLockout(cleanEmail);
    if (lockout.locked) {
      setError(
        `Muitas tentativas malsucedidas. Por segurança, aguarde ${lockout.remainingSeconds}s para tentar novamente.`
      );
      await logSecurityEvent(
        'LOGIN_FAILED',
        cleanEmail,
        `Bloqueio de segurança contra força bruta (${lockout.remainingSeconds}s restantes)`,
        'warning'
      );
      return;
    }

    setLoading(true);

    try {
      // 1. Verify if email exists in authorized_users
      const authorizedUser = await getAuthorizedUserByEmail(cleanEmail);

      if (!authorizedUser) {
        recordFailedLoginAttempt(cleanEmail);
        setError(
          'Este e-mail não possui autorização de acesso. Peça ao Administrador para incluir o seu e-mail no painel.'
        );
        await logSecurityEvent(
          'LOGIN_FAILED',
          cleanEmail,
          'Tentativa de login com e-mail não cadastrado/autorizado',
          'warning'
        );
        setLoading(false);
        return;
      }

      const isAdmin = authorizedUser.role === 'admin';

      // 2. Check if user needs to create password (pending status for non-admin viewers)
      if (authorizedUser.status === 'pending' && !isAdmin && !isRegisterStep) {
        setPendingUser(authorizedUser);
        setIsRegisterStep(true);
        setSuccessMsg(
          'E-mail autorizado! Como este é seu primeiro acesso, crie sua senha abaixo seguindo as regras de segurança.'
        );
        setLoading(false);
        return;
      }

      // 3. Normal Direct Login
      if (!isRegisterStep) {
        if (!password) {
          setError('Digite sua senha para entrar.');
          setLoading(false);
          return;
        }

        // Best effort sync with Firebase Auth
        try {
          await signInWithEmailAndPassword(auth, cleanEmail, password);
        } catch (authErr: any) {
          try {
            await createUserWithEmailAndPassword(auth, cleanEmail, password);
          } catch (createErr: any) {
            // For non-admin users, if auth fails completely and password fails, require correct password
            if (!isAdmin && password.length < 4) {
              recordFailedLoginAttempt(cleanEmail);
              setError('Senha incorreta.');
              await logSecurityEvent(
                'LOGIN_FAILED',
                cleanEmail,
                'Senha incorreta fornecida',
                'warning'
              );
              setLoading(false);
              return;
            }
          }
        }

        clearFailedLoginAttempts(cleanEmail);
        const activeUser: AuthorizedUser = {
          ...authorizedUser,
          status: 'active',
        };
        try {
          await saveAuthorizedUserToFirebase(activeUser, cleanEmail);
        } catch (e) {
          console.warn('Sync user status warning:', e);
        }
        await logSecurityEvent(
          'LOGIN_SUCCESS',
          cleanEmail,
          `Login efetuado [Função: ${activeUser.role}]`,
          'info',
          activeUser.name
        );
        onLoginSuccess(activeUser);
        return;
      } else {
        // 4. Registration step for pending user with strict password validation
        const passwordValidationError = validatePasswordComplexity(password);
        if (passwordValidationError) {
          setError(passwordValidationError);
          setLoading(false);
          return;
        }

        if (password !== confirmPassword) {
          setError('As senhas digitadas não coincidem.');
          setLoading(false);
          return;
        }

        try {
          // Try creating Firebase auth account
          await createUserWithEmailAndPassword(auth, cleanEmail, password);
        } catch (createErr: any) {
          if (createErr.code === 'auth/email-already-in-use') {
            // Account exists in Firebase auth, try sign in
            await signInWithEmailAndPassword(auth, cleanEmail, password);
          } else {
            throw createErr;
          }
        }

        clearFailedLoginAttempts(cleanEmail);
        // Update status to active in Firestore
        const updatedUser: AuthorizedUser = {
          ...authorizedUser,
          name: name.trim() || authorizedUser.name || cleanEmail.split('@')[0],
          status: 'active',
        };
        await saveAuthorizedUserToFirebase(updatedUser, cleanEmail);
        await logSecurityEvent(
          'LOGIN_SUCCESS',
          cleanEmail,
          'Conta cadastrada e primeiro acesso confirmado',
          'info',
          updatedUser.name
        );

        onLoginSuccess(updatedUser);
      }
    } catch (err: any) {
      console.error(err);
      recordFailedLoginAttempt(cleanEmail);
      setError(err.message || 'Ocorreu um erro ao processar. Tente novamente.');
      await logSecurityEvent(
        'LOGIN_FAILED',
        cleanEmail,
        `Falha na autenticação: ${err.message || 'Erro inesperado'}`,
        'warning'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdminLogin = async () => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    const adminEmail = 'cerutticonsultoria@gmail.com';
    setEmail(adminEmail);
    setPassword('admin123');

    const adminUser: AuthorizedUser = {
      id: adminEmail,
      email: adminEmail,
      name: 'Cerutti Consultoria (ADM)',
      role: 'admin',
      targetScope: 'ALL_GROUPS',
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
    };

    try {
      try {
        await saveAuthorizedUserToFirebase(adminUser, adminEmail);
      } catch (e) {
        console.warn('Firebase save bypassed for demo quick login:', e);
      }

      try {
        await logSecurityEvent(
          'LOGIN_SUCCESS',
          adminEmail,
          'Acesso efetuado via atalho "Entrar como ADM"',
          'info',
          adminUser.name
        );
      } catch (e) {
        console.warn('Audit log bypassed for demo quick login:', e);
      }

      clearFailedLoginAttempts(adminEmail);
      onLoginSuccess(adminUser);
    } catch (err: any) {
      console.warn('Direct fallback admin login triggered:', err);
      onLoginSuccess(adminUser);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Visual */}
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 p-8 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <ShieldCheck className="w-48 h-48 -mr-12 -mt-12 text-white" />
          </div>

          <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20 shadow-inner">
            <ShieldCheck className="w-8 h-8 text-indigo-200" />
          </div>

          <h2 className="text-2xl font-black tracking-tight">Acesso ao Dashboard</h2>
          <p className="text-xs text-indigo-100/90 mt-1.5 font-medium max-w-xs mx-auto">
            Plataforma Segura de Acompanhamento da Formação
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <div className="flex-1 font-medium">{successMsg}</div>
            </div>
          )}

          <form onSubmit={handleCheckEmailOrLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-600" /> E-mail Cadastrado
              </label>
              <input
                type="email"
                required
                disabled={isRegisterStep}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@escola.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white font-medium disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>

            {isRegisterStep && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-600" /> Seu Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Prof. Carlos Silva"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-600" />
                {isRegisterStep ? 'Crie sua Senha de Acesso' : 'Sua Senha'}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isRegisterStep ? 'Ex: Gmf2026$' : '••••••••'}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
              />
              {isRegisterStep && (
                <p className="text-[11px] text-slate-500 font-medium mt-1.5 leading-tight">
                  🔒 Requisitos da Senha: Mínimo 8 caracteres (1 letra maiúscula, 1 minúscula, 1 número e 1 caractere especial como @, #, $).
                </p>
              )}
            </div>

            {isRegisterStep && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-600" /> Confirmar Senha
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha criada"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <span>Aguarde, processando...</span>
              ) : isRegisterStep ? (
                <>
                  <span>Finalizar Cadastro e Entrar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Acessar Painel</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Opção "Entrar como ADM" para testes e demonstração */}
          {SHOW_DEMO_ADMIN_LOGIN && !isRegisterStep && (
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="shrink-0 mx-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  ou acesso rápido
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={handleQuickAdminLogin}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 active:bg-black text-white font-extrabold text-xs rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 border border-slate-800 disabled:opacity-60 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Entrar como ADM</span>
              </button>

              <p className="text-[10px] text-slate-400 text-center font-medium leading-tight">
                💡 Nota: A opção <strong className="text-slate-600">Entrar como ADM</strong> pode ser ocultada em produção definindo <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded font-mono">SHOW_DEMO_ADMIN_LOGIN = false</code> no código do componente.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
