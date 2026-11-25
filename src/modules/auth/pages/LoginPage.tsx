import React, { useState } from 'react';
import { useAuth, TEST_USER, isTestUserEnabled } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/ui/Logo';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  Lock,
  Mail,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Sun,
  Moon,
  ShoppingCart,
  FileText,
  Building2,
  LineChart,
  ShieldCheck,
  UserCog,
  MonitorSmartphone,
  CheckCircle2,
  TrendingUp,
  PackageCheck,
} from 'lucide-react';

const REMEMBER_KEY = 'lynus.login.email';

const features = [
  { icon: ShoppingCart, title: 'Frente de caixa ágil', text: 'Atalhos de teclado e leitor de código.' },
  { icon: FileText, title: 'Fiscal integrado', text: 'NFC-e, NF-e e importação de XML.' },
  { icon: Building2, title: 'Multiempresa', text: 'Matriz e filiais em um só painel.' },
  { icon: LineChart, title: 'Financeiro & DRE', text: 'Fluxo de caixa e resultado em tempo real.' },
];

const quickAccess = [
  { label: 'Admin Empresa', email: 'admin@lynustech.com.br', icon: UserCog },
  { label: 'Operador PDV', email: 'caixa@lynustech.com.br', icon: MonitorSmartphone },
];

function readRemembered(): string {
  try {
    return localStorage.getItem(REMEMBER_KEY) ?? '';
  } catch {
    return '';
  }
}

export function LoginPage() {
  const { signIn } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const remembered = readRemembered();
  const [view, setView] = useState<'login' | 'forgot'>('login');
  const [email, setEmail] = useState(remembered);
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(!!remembered);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const doLogin = async (loginEmail: string, loginPassword: string) => {
    setError(null);
    setInfo(null);
    setIsLoading(true);
    try {
      const { error } = await signIn(loginEmail, loginPassword);
      if (error) {
        setError(
          /invalid login credentials/i.test(error.message) ? 'E-mail ou senha incorretos.' : error.message
        );
        return;
      }
      try {
        if (remember) localStorage.setItem(REMEMBER_KEY, loginEmail);
        else localStorage.removeItem(REMEMBER_KEY);
      } catch {
        /* ignore */
      }
      navigate('/');
    } catch {
      setError('Não foi possível entrar. Verifique sua conexão e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doLogin(email.trim(), password);
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!email.trim()) return setError('Informe o e-mail cadastrado.');
    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/login`,
        });
        if (error) throw error;
      }
      setInfo(`Se ${email.trim()} estiver cadastrado, você receberá um link para redefinir a senha.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar o e-mail de recuperação.');
    } finally {
      setIsLoading(false);
    }
  };

  const detectCaps = (e: React.KeyboardEvent<HTMLInputElement>) =>
    setCapsLock(e.getModifierState?.('CapsLock') ?? false);

  const switchView = (v: 'login' | 'forgot') => {
    setView(v);
    setError(null);
    setInfo(null);
  };

  return (
    <div className="min-h-screen flex bg-surface dark:bg-slate-950">
      {/* ===== Painel da marca ===== */}
      <aside className="dark hidden lg:flex relative w-[46%] xl:w-1/2 overflow-hidden bg-brand-950 text-white">
        {/* Fundo: brilhos + grade que esmaece nas bordas */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_15%_0%,rgba(58,133,144,0.55),transparent_70%),radial-gradient(ellipse_55%_45%_at_100%_100%,rgba(30,144,255,0.28),transparent_70%)]" />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            maskImage: 'radial-gradient(ellipse 75% 65% at 50% 45%, #000 30%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 75% 65% at 50% 45%, #000 30%, transparent 100%)',
          }}
        />

        <div className="relative z-10 flex flex-col w-full px-10 xl:px-16 py-10">
          <div className="flex-1 flex flex-col justify-center w-full max-w-xl mx-auto gap-10">
            {/* Título */}
            <div className="space-y-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-300/90">
                ERP + PDV em uma única plataforma
              </p>
              <h2 className="text-3xl xl:text-[2.6rem] font-black leading-[1.1] tracking-tight">
                Gestão completa do seu negócio,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-sky-200 to-brand-200">
                  do caixa ao fiscal.
                </span>
              </h2>
              <p className="text-sm text-brand-100/75 leading-relaxed max-w-md">
                Automação comercial e ERP multiempresa para varejo, food service e serviços.
              </p>
            </div>

            {/* Prévia ilustrativa do produto */}
            <div className="relative pr-6 xl:pr-10" aria-hidden="true">
              <div className="rounded-2xl bg-white/[0.07] border border-white/10 backdrop-blur-md p-5 shadow-2xl shadow-black/30">
                <div>
                  <p className="text-[11px] font-semibold text-brand-100/70">Vendas de hoje</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-2xl font-black tracking-tight">R$ 12.480,90</p>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 text-emerald-300 px-2 py-0.5 text-[11px] font-bold">
                      <TrendingUp className="w-3 h-3" /> 18%
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex gap-2">
                  {[38, 52, 45, 63, 58, 74, 92].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                      <div className="w-full h-20 flex items-end">
                        <div
                          className={
                            i === 6
                              ? 'w-full rounded-md bg-gradient-to-t from-sky-600 to-sky-300'
                              : 'w-full rounded-md bg-white/15'
                          }
                          style={{ height: `${h}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-brand-100/50">
                        {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'][i]}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 pb-6 border-t border-white/10 grid grid-cols-3 gap-3">
                  {[
                    ['Cupons', '214'],
                    ['Ticket médio', 'R$ 58,32'],
                    ['Itens vendidos', '1.032'],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-[10px] text-brand-100/60">{label}</p>
                      <p className="text-sm font-bold mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Avisos flutuantes */}
              <div className="lynus-float absolute -top-6 -right-2 flex items-center gap-2 rounded-xl bg-slate-900/90 border border-white/10 px-3 py-2 shadow-xl">
                <span className="w-7 h-7 rounded-lg bg-emerald-400/15 text-emerald-300 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
                <span>
                  <span className="block text-[11px] font-bold">NFC-e autorizada</span>
                  <span className="block text-[10px] text-brand-100/60">Cupom #001284 · SEFAZ</span>
                </span>
              </div>
              <div className="lynus-float lynus-float-delay absolute -bottom-6 left-1/2 flex items-center gap-2 rounded-xl bg-slate-900/90 border border-white/10 px-3 py-2 shadow-xl">
                <span className="w-7 h-7 rounded-lg bg-sky-400/15 text-sky-300 flex items-center justify-center">
                  <PackageCheck className="w-4 h-4" />
                </span>
                <span>
                  <span className="block text-[11px] font-bold">Estoque atualizado</span>
                  <span className="block text-[10px] text-brand-100/60">Entrada via XML · 35 itens</span>
                </span>
              </div>
            </div>

            {/* Recursos */}
            <ul className="grid grid-cols-2 gap-x-6 gap-y-5 pt-2">
              {features.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-3">
                  <span className="w-8 h-8 shrink-0 rounded-lg bg-white/[0.08] border border-white/10 text-sky-200 flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </span>
                  <span>
                    <span className="block text-[13px] font-bold">{title}</span>
                    <span className="block text-[11px] text-brand-100/65 mt-0.5 leading-relaxed">{text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="w-full max-w-xl mx-auto flex items-center justify-between gap-4 pt-8 text-[11px] text-brand-100/55">
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Conexão criptografada · Dados isolados por empresa
            </span>
            <span className="font-mono">v1.0</span>
          </div>
        </div>
      </aside>

      {/* ===== Formulário ===== */}
      <main className="relative flex-1 flex flex-col items-center justify-center px-4 py-10 sm:px-8 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(44,111,123,0.12),transparent)]">
        <button
          type="button"
          onClick={toggleTheme}
          className="absolute top-5 right-5 w-10 h-10 rounded-xl bg-white dark:bg-slate-900 shadow-soft flex items-center justify-center text-slate-500 hover:text-brand-700 dark:text-slate-300 transition-colors"
          title={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
        >
          {theme === 'dark' ? <Sun className="w-[18px] h-[18px] text-amber-400" /> : <Moon className="w-[18px] h-[18px]" />}
        </button>

        <div className="w-full max-w-[400px] space-y-8">
          <div className="flex justify-center">
            <Logo size="lg" stacked />
          </div>

          {view === 'login' ? (
            <>
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {error && (
                  <div
                    role="alert"
                    className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400 text-xs flex items-center gap-2"
                  >
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Input
                  label="E-mail ou usuário"
                  type="text"
                  autoComplete="username"
                  autoFocus={!remembered}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@empresa.com.br ou admin"
                  leftIcon={<Mail className="w-4 h-4" />}
                  className="h-11"
                />

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Senha
                    </label>
                    <button
                      type="button"
                      onClick={() => switchView('forgot')}
                      className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-300 dark:hover:text-brand-200 transition-colors"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    autoFocus={!!remembered}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyUp={detectCaps}
                    onKeyDown={detectCaps}
                    onBlur={() => setCapsLock(false)}
                    placeholder="Digite sua senha"
                    leftIcon={<Lock className="w-4 h-4" />}
                    className="h-11"
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />
                  {capsLock && (
                    <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400">Caps Lock está ativado.</p>
                  )}
                </div>

                <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 cursor-pointer select-none w-fit">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 accent-brand-600"
                  />
                  Lembrar meu e-mail neste computador
                </label>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full font-bold"
                  isLoading={isLoading}
                  disabled={!email.trim() || !password}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Entrar no sistema
                </Button>
              </form>

              {isTestUserEnabled && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                    Usuário de teste
                    <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-2xl border border-dashed border-brand-200 dark:border-brand-800 bg-brand-50/60 dark:bg-brand-900/20">
                    <span className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-300 flex items-center justify-center shrink-0 shadow-soft">
                      <UserCog className="w-5 h-5" />
                    </span>
                    <dl className="flex-1 min-w-0 grid grid-cols-[auto_1fr] gap-x-2 text-xs">
                      <dt className="text-slate-500 dark:text-slate-400">Usuário:</dt>
                      <dd className="font-mono font-bold text-slate-800 dark:text-slate-100">{TEST_USER.login}</dd>
                      <dt className="text-slate-500 dark:text-slate-400">Senha:</dt>
                      <dd className="font-mono font-bold text-slate-800 dark:text-slate-100">{TEST_USER.password}</dd>
                    </dl>
                    <Button
                      type="button"
                      size="sm"
                      disabled={isLoading}
                      onClick={() => {
                        setEmail(TEST_USER.login);
                        setPassword(TEST_USER.password);
                        doLogin(TEST_USER.login, TEST_USER.password);
                      }}
                    >
                      Entrar
                    </Button>
                  </div>
                </div>
              )}

              {!isSupabaseConfigured && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                    Acesso rápido · homologação
                    <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {quickAccess.map(({ label, email: demoEmail, icon: Icon }) => (
                      <button
                        key={demoEmail}
                        type="button"
                        disabled={isLoading}
                        onClick={() => {
                          setEmail(demoEmail);
                          setPassword('123456');
                          doLogin(demoEmail, '123456');
                        }}
                        className="group flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-soft text-left transition-all disabled:opacity-50"
                      >
                        <span className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-slate-800 text-brand-600 dark:text-brand-300 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{label}</span>
                          <span className="block text-[10px] text-slate-400 truncate">Entrar direto</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => switchView('login')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-3"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao login
                </button>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                  Recuperar senha
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Informe seu e-mail e enviaremos um link para criar uma nova senha.
                </p>
              </div>

              <form onSubmit={handleForgot} className="space-y-4" noValidate>
                {error && (
                  <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400 text-xs flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                {info && (
                  <div role="status" className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-300 text-xs flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-px" />
                    <span>{info}</span>
                  </div>
                )}
                <Input
                  label="E-mail corporativo"
                  type="email"
                  autoComplete="username"
                  autoFocus
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@empresa.com.br"
                  leftIcon={<Mail className="w-4 h-4" />}
                  className="h-11"
                />
                <Button type="submit" variant="primary" size="lg" className="w-full font-bold" isLoading={isLoading}>
                  Enviar link de recuperação
                </Button>
              </form>
            </>
          )}

          <p className="text-center text-[11px] text-slate-400">
            Lynus PDV © {new Date().getFullYear()} · Todos os direitos reservados
          </p>
        </div>
      </main>
    </div>
  );
}
