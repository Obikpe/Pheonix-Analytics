// Header.tsx
'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  ChevronDown,
  Menu,
  X,
  ArrowRight,
  Check,
  Mail,
  ShieldCheck,
  BookOpen,
  Sparkles,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
  'w-full border border-slate-200 bg-white rounded-lg px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#B8962E] focus:ring-4 focus:ring-[#B8962E]/10 transition disabled:opacity-50';

const labelClass =
  'block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 mb-2';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Header() {
  const [showModal, setShowModal] = useState(false);

  const [authMode, setAuthMode] =
    useState<AuthMode>('login');

  const [showMobileMenu, setShowMobileMenu] =
    useState(false);

  const [showBrowse, setShowBrowse] =
    useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [searchQuery, setSearchQuery] =
    useState('');

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
   * Escape to close + lock background scrolling.
   */
  useEffect(() => {
    if (!showModal) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };

    document.addEventListener(
      'keydown',
      onKey
    );

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

  /*
   * Close Browse dropdown when clicking elsewhere.
   */
  useEffect(() => {
    const handleClick = () => {
      setShowBrowse(false);
    };

    if (!showBrowse) return;

    document.addEventListener(
      'click',
      handleClick
    );

    return () =>
      document.removeEventListener(
        'click',
        handleClick
      );
  }, [showBrowse]);

  const scrollTo = (id: string) => {
    setShowMobileMenu(false);
    setShowBrowse(false);

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
    setShowBrowse(false);
    setAuthMode(mode);
    setError('');
    setPassword('');
    setSentEmail('');
    setShowModal(true);
  };

  /*
   * Search currently routes to the Library section.
   * This keeps the header functional without assuming
   * a future search backend/API.
   */
  const handleSearch = (
    e?: FormEvent
  ) => {
    e?.preventDefault();

    if (!searchQuery.trim()) {
      scrollTo('library');
      return;
    }

    scrollTo('library');

    window.dispatchEvent(
      new CustomEvent(
        'learnora-search',
        {
          detail: {
            query: searchQuery.trim(),
          },
        }
      )
    );
  };

  /*
   * Route authenticated accounts to their
   * isolated dashboard.
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
   * Save only authenticated sessions returned
   * by the backend.
   */
  const saveSession = (
    data: AuthResponse
  ) => {
    const token =
      data.token ||
      data.access_token ||
      '';

    if (
      !token ||
      !data.email ||
      !data.role
    ) {
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

    if (data.sub_status) {
      localStorage.setItem(
        'phx_plan',
        data.sub_status
      );
    }
  };

  /*
   * -----------------------------
   * REGISTRATION
   * -----------------------------
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
            'Content-Type':
              'application/json',
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

      setSentEmail(cleanEmail);
      setEmailSentType(
        'verification'
      );

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
            'Content-Type':
              'application/json',
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
      setEmailSentType(
        'password_reset'
      );
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

      if (
        !EMAIL_RE.test(
          cleanEmail
        )
      ) {
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
    if (
      authMode === 'register'
    ) {
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

      if (
        !EMAIL_RE.test(
          cleanEmail
        )
      ) {
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

    if (
      !EMAIL_RE.test(
        cleanEmail
      )
    ) {
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
            'Content-Type':
              'application/json',
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
   * Return from forgot password.
   */
  const backToLogin = () => {
    if (loading) return;

    setAuthMode('login');
    setError('');
    setPassword('');
    setSentEmail('');
  };

  /*
   * Return to login from email confirmation.
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
      {/* =========================================================
          HEADER
      ========================================================= */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="max-w-[1440px] mx-auto">

          {/* MAIN HEADER ROW */}
          <div className="h-[74px] px-5 sm:px-7 lg:px-10 flex items-center gap-5">

            {/* BRAND */}
            <button
              type="button"
              onClick={() =>
                window.scrollTo({
                  top: 0,
                  behavior: 'smooth',
                })
              }
              className="flex items-center gap-2.5 shrink-0 group"
              aria-label="Learnora ME home"
            >
              <span className="relative w-[38px] h-[38px] rounded-lg bg-[#111827] flex items-center justify-center overflow-hidden">
                <span className="absolute inset-0 bg-[radial-gradient(circle_at_70%_25%,rgba(242,212,119,0.55),transparent_45%)]" />

                <img
                  src="/logo.png"
                  alt=""
                  className="relative w-[30px] h-[30px] object-contain"
                />
              </span>

              <span className="text-left leading-none">
                <span
                  className="block text-[17px] sm:text-[19px] font-black tracking-[-0.045em] text-[#111827]"
                  style={{
                    fontFamily:
                      'Georgia, "Times New Roman", serif',
                  }}
                >
                  Learnora
                  <span className="text-[#B8962E]">
                    {' '}ME
                  </span>
                </span>

                <span className="hidden sm:block mt-0.5 text-[8px] font-bold uppercase tracking-[0.19em] text-slate-400">
                  Learn without limits
                </span>
              </span>
            </button>

            {/* BROWSE */}
            <div
              className="hidden lg:block relative"
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              <button
                type="button"
                onClick={() =>
                  setShowBrowse(
                    (prev) => !prev
                  )
                }
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-700 hover:text-[#111827] transition"
              >
                Browse
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    showBrowse
                      ? 'rotate-180'
                      : ''
                  }`}
                />
              </button>

              {showBrowse && (
                <div className="absolute top-full left-0 mt-3 w-[280px] rounded-xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.14)] p-2">
                  <button
                    type="button"
                    onClick={() =>
                      scrollTo(
                        'library'
                      )
                    }
                    className="w-full flex items-start gap-3 rounded-lg p-3 text-left hover:bg-slate-50 transition"
                  >
                    <span className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <BookOpen className="w-4 h-4 text-slate-700" />
                    </span>

                    <span>
                      <span className="block text-sm font-bold text-slate-900">
                        Explore courses
                      </span>

                      <span className="block mt-0.5 text-xs text-slate-500">
                        Discover skills and learning paths.
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      scrollTo(
                        'playground'
                      )
                    }
                    className="w-full flex items-start gap-3 rounded-lg p-3 text-left hover:bg-slate-50 transition"
                  >
                    <span className="w-9 h-9 rounded-lg bg-[#B8962E]/10 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-[#9A7920]" />
                    </span>

                    <span>
                      <span className="block text-sm font-bold text-slate-900">
                        Learning Playground
                      </span>

                      <span className="block mt-0.5 text-xs text-slate-500">
                        Practice what you learn interactively.
                      </span>
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* SEARCH */}
            <form
              onSubmit={handleSearch}
              className="hidden md:flex flex-1 max-w-[520px] mx-auto"
            >
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400 pointer-events-none" />

                <input
                  value={searchQuery}
                  onChange={(e) =>
                    setSearchQuery(
                      e.target.value
                    )
                  }
                  type="search"
                  placeholder="What do you want to learn?"
                  aria-label="Search courses"
                  className="w-full h-11 pl-11 pr-4 rounded-full border border-slate-300 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-slate-500 transition"
                />
              </div>
            </form>

            {/* DESKTOP NAV */}
            <nav className="hidden xl:flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() =>
                  scrollTo(
                    'playground'
                  )
                }
                className="px-3 py-2 text-sm font-semibold text-slate-600 hover:text-[#111827] transition"
              >
                Playground
              </button>

              <button
                type="button"
                onClick={() =>
                  scrollTo('pricing')
                }
                className="px-3 py-2 text-sm font-semibold text-slate-600 hover:text-[#111827] transition"
              >
                Pricing
              </button>
            </nav>

            {/* AUTH */}
            <div className="hidden md:flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() =>
                  openAuth('login')
                }
                className="px-4 py-2.5 rounded-lg text-sm font-bold text-[#111827] border border-slate-300 hover:bg-slate-50 transition"
              >
                Log in
              </button>

              <button
                type="button"
                onClick={() =>
                  openAuth('register')
                }
                className="px-4 py-2.5 rounded-lg bg-[#111827] text-white text-sm font-bold hover:bg-[#263244] transition shadow-sm"
              >
                Join for Free
              </button>
            </div>

            {/* MOBILE ACTIONS */}
            <div className="ml-auto flex md:hidden items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  openAuth('login')
                }
                className="hidden sm:block px-3 py-2 text-sm font-bold text-[#111827]"
              >
                Log in
              </button>

              <button
                type="button"
                onClick={() =>
                  setShowMobileMenu(
                    (prev) => !prev
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
                className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center text-[#111827] hover:bg-slate-50 transition"
              >
                {showMobileMenu ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* MOBILE SEARCH */}
          <div className="md:hidden px-5 pb-3">
            <form
              onSubmit={handleSearch}
            >
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-slate-400" />

                <input
                  value={searchQuery}
                  onChange={(e) =>
                    setSearchQuery(
                      e.target.value
                    )
                  }
                  type="search"
                  placeholder="What do you want to learn?"
                  className="w-full h-11 pl-10 pr-4 rounded-full border border-slate-300 bg-slate-50 text-sm outline-none focus:bg-white focus:border-slate-500 transition"
                />
              </div>
            </form>
          </div>

          {/* MOBILE MENU */}
          {showMobileMenu && (
            <div className="md:hidden border-t border-slate-200 bg-white px-5 py-5">
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() =>
                    scrollTo(
                      'library'
                    )
                  }
                  className="w-full flex items-center justify-between px-3 py-3 rounded-lg text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Explore courses
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    scrollTo(
                      'playground'
                    )
                  }
                  className="w-full flex items-center justify-between px-3 py-3 rounded-lg text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Playground
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    scrollTo('pricing')
                  }
                  className="w-full flex items-center justify-between px-3 py-3 rounded-lg text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Pricing
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    openAuth('login')
                  }
                  className="py-3 rounded-lg border border-slate-300 text-sm font-bold text-[#111827]"
                >
                  Log in
                </button>

                <button
                  type="button"
                  onClick={() =>
                    openAuth('register')
                  }
                  className="py-3 rounded-lg bg-[#111827] text-white text-sm font-bold"
                >
                  Join for Free
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* =========================================================
          AUTH MODAL
      ========================================================= */}
      {showModal && (
        <div
          className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
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
            className="relative w-full max-w-[920px] bg-white rounded-2xl overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.28)] border border-white"
          >
            {!loading && (
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close"
                className="absolute top-5 right-5 z-20 w-9 h-9 rounded-full bg-white/90 border border-slate-200 text-slate-600 hover:bg-white hover:text-slate-900 transition flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <div className="grid lg:grid-cols-[0.92fr_1.08fr]">

              {/* LEFT BRAND PANEL */}
              <div className="hidden lg:flex relative bg-[#111827] text-white p-10 flex-col justify-between overflow-hidden min-h-[600px]">
                <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-[#B8962E]/20 blur-3xl" />

                <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-[#B8962E]/10 blur-3xl" />

                <div className="relative">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
                      <img
                        src="/logo.png"
                        alt=""
                        className="w-8 h-8 object-contain"
                      />
                    </div>

                    <div>
                      <div
                        className="text-[19px] font-black tracking-[-0.04em]"
                        style={{
                          fontFamily:
                            'Georgia, "Times New Roman", serif',
                        }}
                      >
                        Learnora
                        <span className="text-[#F2D477]">
                          {' '}ME
                        </span>
                      </div>

                      <div className="text-[8px] uppercase tracking-[0.2em] text-slate-400 font-bold">
                        Learn without limits
                      </div>
                    </div>
                  </div>

                  <div className="mt-16">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] font-bold text-[#F2D477]">
                      <Sparkles className="w-3.5 h-3.5" />
                      Your learning journey
                    </div>

                    <h2 className="mt-5 text-[38px] leading-[1.08] font-extrabold tracking-[-0.04em]">
                      Build skills
                      <br />
                      that move you
                      <br />
                      forward.
                    </h2>

                    <p className="mt-5 max-w-[340px] text-sm leading-6 text-slate-300">
                      Learn practical skills,
                      explore new fields,
                      and build the confidence
                      to take your next step.
                    </p>
                  </div>
                </div>

                <div className="relative space-y-3">
                  {[
                    'Learn at your own pace',
                    'Practical, career-focused content',
                    'Build skills through practice',
                  ].map(
                    (item) => (
                      <div
                        key={item}
                        className="flex items-center gap-3 text-sm text-slate-200"
                      >
                        <span className="w-6 h-6 rounded-full bg-[#B8962E]/15 flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 text-[#F2D477]" />
                        </span>

                        {item}
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* RIGHT FORM PANEL */}
              <div className="p-7 sm:p-10 lg:p-12">
                {/* MOBILE BRAND */}
                <div className="lg:hidden flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-lg bg-[#111827] flex items-center justify-center">
                    <img
                      src="/logo.png"
                      alt=""
                      className="w-7 h-7 object-contain"
                    />
                  </div>

                  <div>
                    <div
                      className="text-[18px] font-black tracking-[-0.04em] text-[#111827]"
                      style={{
                        fontFamily:
                          'Georgia, "Times New Roman", serif',
                      }}
                    >
                      Learnora
                      <span className="text-[#B8962E]">
                        {' '}ME
                      </span>
                    </div>
                  </div>
                </div>

                {/* FORM HEADING */}
                <div className="mb-8">
                  <div className="text-[10px] uppercase tracking-[0.16em] font-bold text-[#B8962E]">
                    {authMode ===
                    'login'
                      ? 'Welcome back'
                      : authMode ===
                        'register'
                      ? 'Create your account'
                      : authMode ===
                        'forgot'
                      ? 'Account recovery'
                      : 'Almost there'}
                  </div>

                  <h3
                    id="auth-title"
                    className="mt-2 text-[28px] sm:text-[32px] font-extrabold tracking-[-0.04em] text-[#111827]"
                  >
                    {authMode ===
                    'login'
                      ? 'Continue learning.'
                      : authMode ===
                        'register'
                      ? 'Start learning today.'
                      : authMode ===
                        'forgot'
                      ? 'Reset your password.'
                      : emailSentType ===
                        'verification'
                      ? 'Check your email.'
                      : 'Check your inbox.'}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500 max-w-[500px]">
                    {authMode ===
                    'login'
                      ? 'Sign in to access your courses, projects and learning dashboard.'
                      : authMode ===
                        'register'
                      ? 'Create your Learnora ME account and start exploring.'
                      : authMode ===
                        'forgot'
                      ? 'Enter your email and we will send you a secure password reset link.'
                      : emailSentType ===
                        'verification'
                      ? 'Your account has been created. Verify your email to activate it.'
                      : 'If the account exists, we have sent password reset instructions to your email.'}
                  </p>
                </div>

                {/* EMAIL SENT */}
                {authMode ===
                  'emailSent' && (
                  <div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-7 text-center">
                      <div className="mx-auto w-14 h-14 rounded-xl bg-[#B8962E]/10 flex items-center justify-center">
                        {emailSentType ===
                        'verification' ? (
                          <Mail className="w-7 h-7 text-[#9A7920]" />
                        ) : (
                          <ShieldCheck className="w-7 h-7 text-[#9A7920]" />
                        )}
                      </div>

                      <h4 className="mt-5 text-lg font-extrabold text-[#111827]">
                        {emailSentType ===
                        'verification'
                          ? 'Check your inbox'
                          : 'Email sent'}
                      </h4>

                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        We sent instructions to{' '}
                        <span className="font-bold text-slate-700 break-all">
                          {sentEmail}
                        </span>
                        .
                      </p>

                      {emailSentType ===
                        'verification' && (
                        <p className="mt-3 text-xs leading-5 text-slate-400">
                          Click the verification
                          button in the email
                          to activate your
                          Learnora ME account.
                        </p>
                      )}

                      {emailSentType ===
                        'password_reset' && (
                        <p className="mt-3 text-xs leading-5 text-slate-400">
                          Follow the secure
                          link in the email
                          to create a new
                          password.
                        </p>
                      )}
                    </div>

                    {error && (
                      <div
                        role="alert"
                        className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-xs font-medium text-red-600"
                      >
                        {error}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={
                        backToLoginFromEmail
                      }
                      className="mt-5 w-full h-12 rounded-lg bg-[#111827] text-white font-bold text-sm hover:bg-[#263244] transition"
                    >
                      Back to Log in
                    </button>
                  </div>
                )}

                {/* FORM */}
                {authMode !==
                  'emailSent' && (
                  <form
                    onSubmit={
                      handleAuth
                    }
                    noValidate
                  >
                    <div className="space-y-5">

                      {/* NAME */}
                      {authMode ===
                        'register' && (
                        <div>
                          <label
                            htmlFor="auth-name"
                            className={
                              labelClass
                            }
                          >
                            Full name
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
                            value={
                              password
                            }
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

                    {/* FORGOT */}
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
                          className="text-xs font-bold text-slate-500 hover:text-[#9A7920] transition"
                        >
                          Forgot password?
                        </button>
                      </div>
                    )}

                    {/* ERROR */}
                    {error && (
                      <div
                        role="alert"
                        className="mt-5 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-xs font-medium text-red-600"
                      >
                        <span className="font-bold">
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
                      className="mt-6 w-full h-12 rounded-lg bg-[#111827] text-white font-bold text-sm hover:bg-[#263244] transition disabled:opacity-50"
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
                        'Create free account'
                      ) : (
                        'Send reset link'
                      )}
                    </button>

                    {/* SECURITY NOTE */}
                    {authMode ===
                      'register' && (
                      <div className="mt-4 flex items-start gap-2 text-[11px] leading-5 text-slate-400">
                        <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />

                        <span>
                          You'll need to verify
                          your email before
                          accessing your account.
                        </span>
                      </div>
                    )}

                    {/* BOTTOM NAV */}
                    <div className="mt-7 pt-5 border-t border-slate-100 text-center">
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
                          className="text-sm font-bold text-[#111827] hover:text-[#9A7920] transition"
                        >
                          ← Back to Log in
                        </button>
                      ) : (
                        <p className="text-sm text-slate-500">
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
                            className="font-bold text-[#111827] hover:text-[#9A7920] transition"
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
          </div>
        </div>
      )}
    </>
  );
}
