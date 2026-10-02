'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = 'https://learnora-backend.vercel.app';

type LoginRole =
  | 'normal'
  | 'witstart'
  | 'super_admin'
  | 'staff_admin'
  | 'witstart_admin';

type AuthResponse = {
  access_token?: string;
  token?: string;
  email?: string;
  role?: LoginRole;
  name?: string;
  account_type?: 'learner' | 'admin';
  sub_status?: string | null;
  is_paid?: boolean;
  allowed?: string;
};

type AuthMode =
  | 'login'
  | 'register'
  | 'forgot'
  | 'emailSent';

const inputClass =
  'w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-[#D7AD35] focus:ring-4 focus:ring-[#D7AD35]/10 transition disabled:opacity-50';

const labelClass =
  'block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Header() {
  const [showModal, setShowModal] = useState(false);

  const [authMode, setAuthMode] =
    useState<AuthMode>('login');

  const [showMobileMenu, setShowMobileMenu] =
    useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [emailSentType, setEmailSentType] =
    useState<'verification' | 'password_reset'>(
      'verification'
    );

  const [sentEmail, setSentEmail] = useState('');

  const router = useRouter();

  const closeModal = useCallback(() => {
    if (loading) return;

    setShowModal(false);
    setPassword('');
    setError('');
    setAuthMode('login');
    setSentEmail('');
    setEmailSentType('verification');
  }, [loading]);

  /*
   * Open authentication modal from anywhere via:
   *
   * window.dispatchEvent(
   *   new CustomEvent('open-auth', {
   *     detail: { mode: 'login' }
   *   })
   * )
   *
   * or:
   *
   * detail: { mode: 'register' }
   */
  useEffect(() => {
    const handleOpenAuth = (e: Event) => {
      const detail = (e as CustomEvent).detail;

      const requestedMode =
        detail?.mode === 'register'
          ? 'register'
          : 'login';

      setAuthMode(requestedMode);
      setError('');
      setPassword('');
      setSentEmail('');
      setShowModal(true);
    };

    window.addEventListener(
      'open-auth',
      handleOpenAuth
    );

    return () =>
      window.removeEventListener(
        'open-auth',
        handleOpenAuth
      );
  }, []);

  /*
   * Escape to close + lock background scrolling
   * while authentication modal is open.
   */
  useEffect(() => {
    if (!showModal) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };

    document.addEventListener('keydown', onKey);

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener(
        'keydown',
        onKey
      );

      document.body.style.overflow =
        previousOverflow;
    };
  }, [showModal, closeModal]);

  const scrollTo = (id: string) => {
    setShowMobileMenu(false);

    document
      .getElementById(id)
      ?.scrollIntoView({
        behavior: 'smooth',
      });
  };

  const openAuth = (
    mode: 'login' | 'register'
  ) => {
    setShowMobileMenu(false);
    setAuthMode(mode);
    setError('');
    setPassword('');
    setSentEmail('');
    setShowModal(true);
  };

  /*
   * Route authenticated accounts to their actual
   * isolated dashboard.
   *
   * Learners:
   *   normal   -> /dashboard/general
   *   witstart -> /dashboard/witstart
   *
   * Administrators:
   *   super_admin    -> /dashboard/admin/super_admin
   *   staff_admin    -> /dashboard/admin/staff_admin
   *   witstart_admin -> /dashboard/admin/witstart_admin
   */
  const routeByRole = (role: string) => {
    switch (role) {
      case 'super_admin':
        router.replace(
          '/dashboard/admin/super_admin'
        );
        return;

      case 'staff_admin':
        router.replace(
          '/dashboard/admin/staff_admin'
        );
        return;

      case 'witstart_admin':
        router.replace(
          '/dashboard/admin/witstart_admin'
        );
        return;

      case 'witstart':
        router.replace('/dashboard/witstart');
        return;

      case 'normal':
        router.replace('/dashboard/general');
        return;

      default:
        router.replace('/');
        return;
    }
  };

  /*
   * Save only the authenticated session returned
   * by the backend.
   *
   * Registration does NOT call this function because
   * registration does not authenticate the user.
   *
   * EmailVerification.tsx handles the session created
   * after successful email verification.
   */
  const saveSession = (data: AuthResponse) => {
    const token =
      data.token ||
      data.access_token ||
      '';

    if (!token || !data.email || !data.role) {
      throw new Error(
        'The server returned an incomplete authentication response.'
      );
    }

    localStorage.setItem(
      'phx_token',
      token
    );

    localStorage.setItem(
      'phx_email',
      data.email
    );

    localStorage.setItem(
      'phx_role',
      data.role
    );

    localStorage.setItem(
      'phx_name',
      data.name || ''
    );

    if (data.account_type) {
      localStorage.setItem(
        'phx_account_type',
        data.account_type
      );
    }

    /*
     * Keep plan information synchronized when
     * the backend provides it.
     */
    if (data.sub_status) {
      localStorage.setItem(
        'phx_plan',
        data.sub_status
      );
    }

    /*
     * A verified account should no longer carry
     * an old trial timestamp from a previous session.
     *
     * The authoritative entitlement remains the backend.
     */
  };

  /*
   * -----------------------------
   * REGISTRATION
   * -----------------------------
   *
   * Registration:
   * - creates the learner
   * - hashes the password
   * - creates verification token
   * - sends verification email
   * - does NOT authenticate the user
   */
  const handleRegistration = async (
    cleanEmail: string,
    cleanName: string
  ) => {
    try {
      const res = await fetch(
        `${API_URL}/api/auth/register`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            name: cleanName,
            email: cleanEmail,
            password,
          }),
        }
      );

      const data = await res
        .json()
        .catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            'Registration failed. Please try again.'
        );
      }

      /*
       * Do NOT save a token.
       *
       * The user must click the verification
       * link sent by email.
       */
      setSentEmail(cleanEmail);
      setEmailSentType('verification');

      setPassword('');
      setError('');
      setLoading(false);
      setAuthMode('emailSent');
    } catch (err: any) {
      setError(
        err?.message ||
          'Could not create your account. Please try again.'
      );

      setLoading(false);
    }
  };

  /*
   * -----------------------------
   * FORGOT PASSWORD
   * -----------------------------
   *
   * Backend:
   * POST /api/auth/forgot-password
   */
  const handleForgotPassword = async (
    cleanEmail: string
  ) => {
    try {
      const res = await fetch(
        `${API_URL}/api/auth/forgot-password`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            email: cleanEmail,
          }),
        }
      );

      const data = await res
        .json()
        .catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            'Unable to process the password reset request.'
        );
      }

      setError('');
      setSentEmail(cleanEmail);
      setEmailSentType('password_reset');
      setLoading(false);
      setAuthMode('emailSent');
    } catch (err: any) {
      setError(
        err?.message ||
          'Could not send the password reset email. Please try again.'
      );

      setLoading(false);
    }
  };

  /*
   * -----------------------------
   * LOGIN / REGISTER / FORGOT
   * -----------------------------
   */
  const handleAuth = async (
    e?: FormEvent
  ) => {
    e?.preventDefault();

    if (loading) return;

    const cleanEmail =
      email.trim().toLowerCase();

    const cleanName =
      name.trim();

    /*
     * FORGOT PASSWORD
     */
    if (authMode === 'forgot') {
      if (!cleanEmail) {
        setError(
          'Please enter your email address.'
        );
        return;
      }

      if (!EMAIL_RE.test(cleanEmail)) {
        setError(
          'Please enter a valid email address.'
        );
        return;
      }

      setLoading(true);
      setError('');

      await handleForgotPassword(
        cleanEmail
      );

      return;
    }

    /*
     * REGISTER
     */
    if (authMode === 'register') {
      if (
        !cleanEmail ||
        !cleanName ||
        !password
      ) {
        setError(
          'Please fill in all fields.'
        );
        return;
      }

      if (!EMAIL_RE.test(cleanEmail)) {
        setError(
          'Please enter a valid email address.'
        );
        return;
      }

      if (password.length < 8) {
        setError(
          'Password must be at least 8 characters.'
        );
        return;
      }

      setLoading(true);
      setError('');

      await handleRegistration(
        cleanEmail,
        cleanName
      );

      return;
    }

    /*
     * LOGIN
     */
    if (
      !cleanEmail ||
      !password
    ) {
      setError(
        'Please enter your email and password.'
      );
      return;
    }

    if (!EMAIL_RE.test(cleanEmail)) {
      setError(
        'Please enter a valid email address.'
      );
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(
        `${API_URL}/api/auth/login`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            email: cleanEmail,
            password,
          }),
        }
      );

      const data: AuthResponse =
        await res
          .json()
          .catch(
            () =>
              ({} as AuthResponse)
          );

      if (!res.ok) {
        throw new Error(
          (data as any)?.detail ||
            (data as any)?.message ||
            'Authentication failed.'
        );
      }

      saveSession(data);

      setShowModal(false);
      setPassword('');
      setError('');
      setLoading(false);
      setSentEmail('');

      routeByRole(
        data.role || ''
      );
    } catch (err: any) {
      setError(
        err?.message ||
          'Could not reach the server. Please try again.'
      );

      setLoading(false);
    }
  };

  /*
   * Switch between login and registration.
   */
  const toggleAuthMode = () => {
    setAuthMode((prev) =>
      prev === 'login'
        ? 'register'
        : 'login'
    );

    setError('');
    setPassword('');
    setSentEmail('');
  };

  /*
   * Return from forgot password to login.
   */
  const backToLogin = () => {
    if (loading) return;

    setAuthMode('login');
    setError('');
    setPassword('');
    setSentEmail('');
  };

  /*
   * Return to login from the email-sent
   * confirmation screen.
   */
  const backToLoginFromEmail = () => {
    if (loading) return;

    setAuthMode('login');
    setError('');
    setPassword('');
    setSentEmail('');
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl shadow-[0_1px_18px_rgba(15,23,42,0.05)]">
        <div className="max-w-[1440px] mx-auto h-[76px] px-5 sm:px-7 lg:px-10 flex items-center justify-between gap-6">

          {/* BRAND */}
          <button
            type="button"
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: 'smooth',
              })
            }
            className="flex items-center gap-3 shrink-0 group"
            aria-label="Learnora Me home"
          >
            <span className="relative w-10 h-10 rounded-xl bg-[#111827] flex items-center justify-center overflow-hidden shadow-lg shadow-slate-900/10">
              <span className="absolute inset-0 bg-[radial-gradient(circle_at_70%_25%,rgba(242,212,119,0.45),transparent_42%)]" />

              <img
                src="/logo.png"
                alt="Learnora Me"
                className="relative w-8 h-8 object-contain"
              />
            </span>

            <span className="text-left leading-none whitespace-nowrap">
              <span className="block text-[13px] sm:text-[15px] font-extrabold tracking-[0.055em] text-[#111827]">
                LEARNORA ME
              </span>
            </span>
          </button>

          {/* DESKTOP NAVIGATION */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-full p-1">
            {[
              'library',
              'playground',
              'pricing',
            ].map((id) => (
              <button
                key={id}
                onClick={() =>
                  scrollTo(id)
                }
                className="px-5 py-2.5 rounded-full text-sm font-semibold text-slate-600 hover:text-[#111827] hover:bg-white transition-all capitalize"
              >
                {id}
              </button>
            ))}
          </nav>

          {/* DESKTOP AUTH */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() =>
                openAuth('login')
              }
              className="text-sm font-bold text-slate-700 px-4 py-2.5 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Log in
            </button>

            <button
              onClick={() =>
                openAuth('register')
              }
              className="group relative overflow-hidden bg-[#111827] text-white text-sm font-bold px-5 py-3 rounded-xl shadow-lg shadow-slate-900/10 hover:-translate-y-0.5 transition-all"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-[#D7AD35] to-[#F2D477] opacity-0 group-hover:opacity-100 transition-opacity" />

              <span className="relative group-hover:text-[#111827] transition-colors">
                Start Free Trial{' '}
                <span className="ml-1">
                  →
                </span>
              </span>
            </button>
          </div>

          {/* MOBILE MENU BUTTON */}
          <button
            onClick={() =>
              setShowMobileMenu(
                !showMobileMenu
              )
            }
            aria-label={
              showMobileMenu
                ? 'Close menu'
                : 'Open menu'
            }
            aria-expanded={
              showMobileMenu
            }
            className="md:hidden w-11 h-11 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-[#111827] hover:bg-slate-50 transition"
          >
            <span className="flex flex-col gap-1.5">
              <span
                className={`block w-5 h-0.5 bg-current transition-transform ${
                  showMobileMenu
                    ? 'translate-y-2 rotate-45'
                    : ''
                }`}
              />

              <span
                className={`block w-5 h-0.5 bg-current transition-opacity ${
                  showMobileMenu
                    ? 'opacity-0'
                    : ''
                }`}
              />

              <span
                className={`block w-5 h-0.5 bg-current transition-transform ${
                  showMobileMenu
                    ? '-translate-y-2 -rotate-45'
                    : ''
                }`}
              />
            </span>
          </button>
        </div>

        {/* MOBILE MENU */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-slate-200 bg-white px-5 py-4 shadow-xl">
            <nav className="space-y-1">
              {[
                'library',
                'playground',
                'pricing',
              ].map((id) => (
                <button
                  key={id}
                  onClick={() =>
                    scrollTo(id)
                  }
                  className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 capitalize"
                >
                  {id}
                </button>
              ))}
            </nav>

            <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
              <button
                onClick={() =>
                  openAuth('login')
                }
                className="py-3 rounded-xl text-sm font-bold text-slate-700 border border-slate-200"
              >
                Log in
              </button>

              <button
                onClick={() =>
                  openAuth('register')
                }
                className="py-3 rounded-xl text-sm font-bold bg-[#111827] text-white"
              >
                Start Free Trial
              </button>
            </div>
          </div>
        )}
      </header>

      {/* AUTH MODAL */}
      {showModal && (
        <div
          className="fixed inset-0 z-[100] bg-[#020617]/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          onMouseDown={(e) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-title"
            className="relative bg-white w-full max-w-[430px] rounded-[28px] shadow-2xl shadow-black/30 overflow-hidden border border-white/20"
          >
            {/* MODAL HEADER */}
            <div className="relative bg-[#111827] px-7 sm:px-9 pt-8 pb-9 overflow-hidden">
              <div className="absolute -right-16 -top-20 w-48 h-48 rounded-full bg-[#D7AD35]/20 blur-2xl" />

              <div className="absolute -left-20 -bottom-28 w-56 h-56 rounded-full bg-[#D7AD35]/10 blur-3xl" />

              {!loading && (
                <button
                  type="button"
                  onClick={closeModal}
                  aria-label="Close"
                  className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition flex items-center justify-center text-lg"
                >
                  ×
                </button>
              )}

              <div className="relative flex items-center gap-3 mb-7">
                <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
                  <img
                    src="/logo.png"
                    alt=""
                    className="w-8 h-8 object-contain"
                  />
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#F2D477]">
                    {authMode ===
                    'login'
                      ? 'Welcome back'
                      : authMode ===
                        'register'
                      ? 'Start your journey'
                      : authMode ===
                        'forgot'
                      ? 'Account recovery'
                      : 'Check your email'}
                  </p>

                  <p className="text-sm font-bold text-white">
                    Learnora Me
                  </p>
                </div>
              </div>

              <div className="relative">
                <h3
                  id="auth-title"
                  className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white"
                >
                  {authMode ===
                  'login'
                    ? 'Continue learning.'
                    : authMode ===
                      'register'
                    ? 'Create Account.'
                    : authMode ===
                      'forgot'
                    ? 'Reset your password.'
                    : emailSentType ===
                      'verification'
                    ? 'Check your email.'
                    : 'Check your inbox.'}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {authMode ===
                  'login'
                    ? 'Sign in to access your courses, projects and learning dashboard.'
                    : authMode ===
                      'register'
                    ? 'Create your Learnora Me account and verify your email to continue.'
                    : authMode ===
                      'forgot'
                    ? 'Enter your email and we will send you a secure password reset link.'
                    : emailSentType ===
                      'verification'
                    ? 'Your account has been created. Verify your email to activate it.'
                    : 'If the account exists, we have sent password reset instructions to your email.'}
                </p>
              </div>
            </div>

            {/* EMAIL SENT */}
            {authMode ===
              'emailSent' && (
              <div className="p-7 sm:p-9">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-[#D7AD35]/10 border border-[#D7AD35]/20 flex items-center justify-center mb-5">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="w-8 h-8 text-[#B08A1E]"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path
                      d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11Z"
                    />
                    <path
                      d="m5 6 7 6 7-6"
                    />
                  </svg>
                </div>

                <div className="text-center">
                  <h4 className="text-lg font-extrabold text-[#111827]">
                    {emailSentType ===
                    'verification'
                      ? 'Check your inbox'
                      : 'Email sent'}
                  </h4>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {sentEmail ? (
                      <>
                        We sent instructions to{' '}
                        <span className="font-bold text-slate-700 break-all">
                          {sentEmail}
                        </span>
                        .
                      </>
                    ) : (
                      'Please check your email for the next step.'
                    )}
                  </p>

                  {emailSentType ===
                    'verification' && (
                    <p className="mt-3 text-xs leading-5 text-slate-400">
                      Click the verification button
                      in the email. The verification
                      link will open Learnora Me and
                      complete your account activation.
                    </p>
                  )}

                  {emailSentType ===
                    'password_reset' && (
                    <p className="mt-3 text-xs leading-5 text-slate-400">
                      Follow the secure link in the
                      email to create a new password.
                    </p>
                  )}
                </div>

                {error && (
                  <div
                    role="alert"
                    className="mt-5 flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-xs font-medium text-red-600"
                  >
                    <span className="mt-0.5">
                      !
                    </span>

                    <span>
                      {error}
                    </span>
                  </div>
                )}

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={
                      backToLoginFromEmail
                    }
                    className="w-full py-3.5 rounded-xl bg-[#111827] text-white font-bold text-sm shadow-lg shadow-slate-900/10 hover:bg-[#1f2937] hover:-translate-y-0.5 transition-all"
                  >
                    Back to Log in
                  </button>
                </div>
              </div>
            )}

            {/* FORM */}
            {authMode !==
              'emailSent' && (
              <form
                className="p-7 sm:p-9"
                onSubmit={
                  handleAuth
                }
                noValidate
              >
                <div className="space-y-4">

                  {/* REGISTRATION NAME */}
                  {authMode ===
                    'register' && (
                    <div>
                      <label
                        htmlFor="auth-name"
                        className={
                          labelClass
                        }
                      >
                        Full Name
                      </label>

                      <input
                        id="auth-name"
                        value={name}
                        onChange={(
                          e
                        ) => {
                          setName(
                            e.target
                              .value
                          );
                          setError(
                            ''
                          );
                        }}
                        placeholder="Ade Doe"
                        type="text"
                        autoComplete="name"
                        disabled={
                          loading
                        }
                        className={
                          inputClass
                        }
                      />
                    </div>
                  )}

                  {/* EMAIL */}
                  <div>
                    <label
                      htmlFor="auth-email"
                      className={
                        labelClass
                      }
                    >
                      Email address
                    </label>

                    <input
                      id="auth-email"
                      value={email}
                      onChange={(
                        e
                      ) => {
                        setEmail(
                          e.target
                            .value
                        );
                        setError(
                          ''
                        );
                      }}
                      placeholder="you@example.com"
                      type="email"
                      autoComplete="email"
                      disabled={
                        loading
                      }
                      className={
                        inputClass
                      }
                    />
                  </div>

                  {/* PASSWORD */}
                  {(authMode ===
                    'login' ||
                    authMode ===
                      'register') && (
                    <div>
                      <label
                        htmlFor="auth-password"
                        className={
                          labelClass
                        }
                      >
                        Password
                      </label>

                      <input
                        id="auth-password"
                        value={password}
                        onChange={(
                          e
                        ) => {
                          setPassword(
                            e.target
                              .value
                          );
                          setError(
                            ''
                          );
                        }}
                        type="password"
                        autoComplete={
                          authMode ===
                          'register'
                            ? 'new-password'
                            : 'current-password'
                        }
                        disabled={
                          loading
                        }
                        placeholder={
                          authMode ===
                          'register'
                            ? 'At least 8 characters'
                            : 'Enter your password'
                        }
                        className={
                          inputClass
                        }
                      />
                    </div>
                  )}
                </div>

                {/* FORGOT PASSWORD */}
                {authMode ===
                  'login' && (
                  <div className="mt-3 text-right">
                    <button
                      type="button"
                      disabled={
                        loading
                      }
                      onClick={() => {
                        setAuthMode(
                          'forgot'
                        );
                        setError(
                          ''
                        );
                        setPassword(
                          ''
                        );
                      }}
                      className="text-xs font-bold text-slate-500 hover:text-[#B08A1E] transition disabled:opacity-50"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {/* ERROR */}
                {error && (
                  <div
                    role="alert"
                    className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-xs font-medium text-red-600"
                  >
                    <span className="mt-0.5">
                      !
                    </span>

                    <span>
                      {error}
                    </span>
                  </div>
                )}

                {/* SUBMIT */}
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-6 w-full py-3.5 rounded-xl bg-[#111827] text-white font-bold text-sm shadow-lg shadow-slate-900/10 hover:bg-[#1f2937] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />

                      {authMode ===
                      'login'
                        ? 'Signing in...'
                        : authMode ===
                          'register'
                        ? 'Creating account...'
                        : 'Sending email...'}
                    </span>
                  ) : authMode ===
                    'login' ? (
                    'Continue'
                  ) : authMode ===
                    'register' ? (
                    'Create Account'
                  ) : (
                    'Send Reset Link'
                  )}
                </button>

                {/* BOTTOM NAVIGATION */}
                <div className="mt-5 text-center">
                  {authMode ===
                    'forgot' ? (
                    <button
                      type="button"
                      onClick={
                        backToLogin
                      }
                      disabled={
                        loading
                      }
                      className="text-xs font-bold text-[#111827] hover:text-[#D7AD35] transition disabled:opacity-50"
                    >
                      ← Back to Log in
                    </button>
                  ) : (
                    <p className="text-xs text-slate-500">
                      {authMode ===
                      'login'
                        ? "Don't have an account? "
                        : 'Already have an account? '}

                      <button
                        type="button"
                        onClick={
                          toggleAuthMode
                        }
                        disabled={
                          loading
                        }
                        className="font-bold text-[#111827] hover:text-[#D7AD35] transition disabled:opacity-50"
                      >
                        {authMode ===
                        'login'
                          ? 'Sign up free'
                          : 'Log in instead'}
                      </button>
                    </p>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}