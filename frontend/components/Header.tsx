'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = 'https://learnora-backend.vercel.app';
const PAYSTACK_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '';
// Paystack's `new PaystackPop().newTransaction()` API only exists in the V2 script.
const PAYSTACK_SRC = 'https://js.paystack.co/v2/inline.js';

type Interval = 'monthly' | 'yearly';
type Region = 'NG' | 'AFR' | 'US';

// Amounts are in the smallest unit (kobo / cents). When a plan code is passed,
// Paystack charges the plan's amount, so these MUST match the plans on your dashboard.
const PRICING: Record<
  Region,
  Record<
    Interval,
    { currency: 'NGN' | 'USD'; amount: number; plan?: string }
  >
> = {
  NG: {
    monthly: {
      currency: 'NGN',
      amount: 1200000,
      plan: process.env.NEXT_PUBLIC_PAYSTACK_PLAN_NGN_MONTHLY,
    },
    yearly: {
      currency: 'NGN',
      amount: 12000000,
      plan: process.env.NEXT_PUBLIC_PAYSTACK_PLAN_NGN_YEARLY,
    },
  },
  AFR: {
    monthly: {
      currency: 'USD',
      amount: 1000,
      plan: process.env.NEXT_PUBLIC_PAYSTACK_PLAN_AFR_MONTHLY,
    },
    yearly: {
      currency: 'USD',
      amount: 10000,
      plan: process.env.NEXT_PUBLIC_PAYSTACK_PLAN_AFR_YEARLY,
    },
  },
  US: {
    monthly: {
      currency: 'USD',
      amount: 1500,
      plan: process.env.NEXT_PUBLIC_PAYSTACK_PLAN_US_MONTHLY,
    },
    yearly: {
      currency: 'USD',
      amount: 15000,
      plan: process.env.NEXT_PUBLIC_PAYSTACK_PLAN_US_YEARLY,
    },
  },
};

const inputClass =
  'w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-[#D7AD35] focus:ring-4 focus:ring-[#D7AD35]/10 transition disabled:opacity-50';

const labelClass =
  'block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getRegion(): Region {
  if (typeof window === 'undefined') return 'NG';

  const c = localStorage.getItem('phx_country');

  return c === 'AFR' || c === 'US' || c === 'NG' ? c : 'NG';
}

function loadPaystackScript(): Promise<any> {
  return new Promise((resolve, reject) => {
    const w = window as any;

    // Only reuse if the V2 class is already loaded
    // (V1 is a plain object, not a constructor).
    if (typeof w.PaystackPop === 'function') {
      return resolve(w.PaystackPop);
    }

    const existing = document.getElementById(
      'paystack-v2'
    ) as HTMLScriptElement | null;

    if (existing) existing.remove();

    const script = document.createElement('script');
    script.id = 'paystack-v2';
    script.src = PAYSTACK_SRC;
    script.async = true;

    script.onload = () =>
      typeof w.PaystackPop === 'function'
        ? resolve(w.PaystackPop)
        : reject(new Error('Paystack V2 failed to initialise'));

    script.onerror = () =>
      reject(new Error('Failed to load Paystack script'));

    document.body.appendChild(script);
  });
}

export default function Header() {
  const [showModal, setShowModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [billingInterval, setBillingInterval] =
    useState<Interval>('monthly');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();

  const closeModal = useCallback(() => {
    if (loading) return;

    setShowModal(false);
    setPassword('');
    setError('');
  }, [loading]);

  // Open modal from anywhere via window event
  useEffect(() => {
    const handleOpenAuth = (e: Event) => {
      const detail = (e as CustomEvent).detail;

      setAuthMode(detail?.mode === 'register' ? 'register' : 'login');
      setError('');
      setShowModal(true);
    };

    window.addEventListener('open-auth', handleOpenAuth);

    return () => window.removeEventListener('open-auth', handleOpenAuth);
  }, []);

  // Escape to close + lock background scroll while modal is open
  useEffect(() => {
    if (!showModal) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };

    document.addEventListener('keydown', onKey);

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [showModal, closeModal]);

  const scrollTo = (id: string) => {
    setShowMobileMenu(false);

    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: 'smooth' });
  };

  const openAuth = (mode: 'login' | 'register') => {
    setShowMobileMenu(false);
    setAuthMode(mode);
    setError('');
    setShowModal(true);
  };

  const routeByRole = (role: string) => {
    if (role === 'admin') {
      router.push('/dashboard/admin');
    } else if (role === 'witstart') {
      router.push('/dashboard/witstart');
    } else {
      router.push('/dashboard/general');
    }
  };

  const saveSession = (data: {
    access_token: string;
    email: string;
    role: string;
  }) => {
    // NOTE: localStorage tokens are readable by any XSS.
    // Prefer an httpOnly cookie set by the API.
    localStorage.setItem('phx_token', data.access_token);
    localStorage.setItem('phx_email', data.email);
    localStorage.setItem('phx_role', data.role);
  };

  const launchPaystackModal = async (
    userEmail: string,
    userName: string,
    userPass: string
  ) => {
    if (!PAYSTACK_KEY) {
      setError(
        'Payments are temporarily unavailable. Please try again later.'
      );

      console.error(
        'NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY is missing'
      );

      setLoading(false);
      return;
    }

    const region = getRegion();
    const { currency, amount, plan } =
      PRICING[region][billingInterval];

    if (!plan) {
      setError(
        'This plan is temporarily unavailable. Please try again later.'
      );

      console.error(
        `Missing Paystack plan code for ${region}/${billingInterval}`
      );

      setLoading(false);
      return;
    }

    try {
      const PaystackPop = await loadPaystackScript();
      const paystack = new PaystackPop();

      paystack.newTransaction({
        key: PAYSTACK_KEY,
        email: userEmail,
        amount,
        currency,
        plan,

        metadata: {
          billing_interval: billingInterval,
          region,

          custom_fields: [
            {
              display_name: 'Customer Name',
              variable_name: 'customer_name',
              value: userName,
            },
          ],
        },

        onSuccess: async (response: { reference: string }) => {
          try {
            // Verify Paystack BEFORE registering.
            // Backend verifies reference with secret key.
            const regRes = await fetch(
              `${API_URL}/api/billing/verify-and-register`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  name: userName,
                  email: userEmail,
                  password: userPass,
                  reference: response.reference,
                  billing_interval: billingInterval,
                  region,
                  plan_code: plan,
                }),
              }
            );

            const regData = await regRes.json().catch(() => ({}));

            if (!regRes.ok) {
              throw new Error(
                (regData.detail || 'Registration failed') +
                  `. Your payment reference is ${response.reference} - please contact support.`
              );
            }

            saveSession(regData);

            setShowModal(false);
            setPassword('');
            setLoading(false);

            routeByRole(regData.role);
          } catch (regErr: any) {
            setError(regErr.message);
            setLoading(false);
          }
        },

        onCancel: () => {
          setLoading(false);
          setError(
            'Card setup was cancelled. Account was not created.'
          );
        },

        onError: (err: { message?: string }) => {
          setLoading(false);
          setError(
            err?.message || 'Payment failed. Please try again.'
          );
        },
      });
    } catch (err) {
      console.error(err);

      setError(
        'Failed to load the payment window. Check your connection and try again.'
      );

      setLoading(false);
    }
  };

  const handleAuth = async (e?: FormEvent) => {
    e?.preventDefault();

    if (loading) return;

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (
      !cleanEmail ||
      !password ||
      (authMode === 'register' && !cleanName)
    ) {
      setError('Please fill in all fields.');
      return;
    }

    if (!EMAIL_RE.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (authMode === 'register' && password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    setError('');

    if (authMode === 'login') {
      try {
        const res = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: cleanEmail,
            password,
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(
            data.detail || 'Authentication failed'
          );
        }

        saveSession(data);

        setShowModal(false);
        setPassword('');
        setLoading(false);

        routeByRole(data.role);
      } catch (err: any) {
        setError(
          err.message ||
            'Could not reach the server. Please try again.'
        );

        setLoading(false);
      }
    } else {
      await launchPaystackModal(
        cleanEmail,
        cleanName,
        password
      );
    }
  };

  const toggleAuthMode = () => {
    setAuthMode((prev) =>
      prev === 'login' ? 'register' : 'login'
    );

    setError('');
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

            {/* Single wordmark — no separate "The" span */}
            <span className="text-left leading-none whitespace-nowrap">
              <span className="block text-[13px] sm:text-[15px] font-extrabold tracking-[0.055em] text-[#111827]">
                LEARNORA ME
              </span>
            </span>
          </button>

          {/* DESKTOP NAVIGATION */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-full p-1">
            {['library', 'playground', 'pricing'].map((id) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="px-5 py-2.5 rounded-full text-sm font-semibold text-slate-600 hover:text-[#111827] hover:bg-white transition-all capitalize"
              >
                {id}
              </button>
            ))}
          </nav>

          {/* DESKTOP AUTH */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => openAuth('login')}
              className="text-sm font-bold text-slate-700 px-4 py-2.5 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Log in
            </button>

            <button
              onClick={() => openAuth('register')}
              className="group relative overflow-hidden bg-[#111827] text-white text-sm font-bold px-5 py-3 rounded-xl shadow-lg shadow-slate-900/10 hover:-translate-y-0.5 transition-all"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-[#D7AD35] to-[#F2D477] opacity-0 group-hover:opacity-100 transition-opacity" />

              <span className="relative group-hover:text-[#111827] transition-colors">
                Start Free Trial <span className="ml-1">→</span>
              </span>
            </button>
          </div>

          {/* MOBILE MENU BUTTON */}
          <button
            onClick={() =>
              setShowMobileMenu(!showMobileMenu)
            }
            aria-label={
              showMobileMenu ? 'Close menu' : 'Open menu'
            }
            aria-expanded={showMobileMenu}
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
                  showMobileMenu ? 'opacity-0' : ''
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
              {['library', 'playground', 'pricing'].map(
                (id) => (
                  <button
                    key={id}
                    onClick={() => scrollTo(id)}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 capitalize"
                  >
                    {id}
                  </button>
                )
              )}
            </nav>

            <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
              <button
                onClick={() => openAuth('login')}
                className="py-3 rounded-xl text-sm font-bold text-slate-700 border border-slate-200"
              >
                Log in
              </button>

              <button
                onClick={() => openAuth('register')}
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
            if (e.target === e.currentTarget) {
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
                    {authMode === 'login'
                      ? 'Welcome back'
                      : 'Start your journey'}
                  </p>

                  {/* Updated brand name */}
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
                  {authMode === 'login'
                    ? 'Continue learning.'
                    : 'Create Account.'}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {authMode === 'login'
                    ? 'Sign in to access your courses, projects and learning dashboard.'
                    : '7 days free trial. Secure card setup via Paystack required.'}
                </p>
              </div>
            </div>

            {/* FORM */}
            <form
              className="p-7 sm:p-9"
              onSubmit={handleAuth}
              noValidate
            >
              <div className="space-y-4">
                {authMode === 'register' && (
                  <div className="mb-4">
                    <span className={labelClass}>
                      Billing Plan Interval
                    </span>

                    <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                      {(['monthly', 'yearly'] as Interval[]).map(
                        (iv) => (
                          <button
                            key={iv}
                            type="button"
                            disabled={loading}
                            aria-pressed={
                              billingInterval === iv
                            }
                            onClick={() =>
                              setBillingInterval(iv)
                            }
                            className={`py-2 text-xs font-bold rounded-lg transition-all ${
                              billingInterval === iv
                                ? 'bg-white text-[#111827] shadow-sm'
                                : 'text-slate-500 hover:text-slate-900'
                            }`}
                          >
                            {iv === 'monthly' ? (
                              'Monthly Billing'
                            ) : (
                              <>
                                Yearly{' '}
                                <span className="text-[10px] text-[#B08A1E] font-extrabold">
                                  (Save more)
                                </span>
                              </>
                            )}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}

                {authMode === 'register' && (
                  <div>
                    <label
                      htmlFor="auth-name"
                      className={labelClass}
                    >
                      Full Name
                    </label>

                    <input
                      id="auth-name"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setError('');
                      }}
                      placeholder="Ade Doe"
                      type="text"
                      autoComplete="name"
                      disabled={loading}
                      className={inputClass}
                    />
                  </div>
                )}

                <div>
                  <label
                    htmlFor="auth-email"
                    className={labelClass}
                  >
                    Email address
                  </label>

                  <input
                    id="auth-email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    placeholder="you@example.com"
                    type="email"
                    autoComplete="email"
                    disabled={loading}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="auth-password"
                    className={labelClass}
                  >
                    Password
                  </label>

                  <input
                    id="auth-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    type="password"
                    autoComplete={
                      authMode === 'register'
                        ? 'new-password'
                        : 'current-password'
                    }
                    disabled={loading}
                    placeholder={
                      authMode === 'register'
                        ? 'At least 8 characters'
                        : 'Enter your password'
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-xs font-medium text-red-600"
                >
                  <span className="mt-0.5">!</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full py-3.5 rounded-xl bg-[#111827] text-white font-bold text-sm shadow-lg shadow-slate-900/10 hover:bg-[#1f2937] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />

                    {authMode === 'login'
                      ? 'Signing in...'
                      : 'Launching Paystack...'}
                  </span>
                ) : authMode === 'login' ? (
                  'Continue'
                ) : (
                  `Start Free Trial (${billingInterval}) — Setup Card`
                )}
              </button>

              <div className="mt-5 text-center">
                <p className="text-xs text-slate-500">
                  {authMode === 'login'
                    ? "Don't have an account? "
                    : 'Already have an account? '}

                  <button
                    type="button"
                    onClick={toggleAuthMode}
                    disabled={loading}
                    className="font-bold text-[#111827] hover:text-[#D7AD35] transition disabled:opacity-50"
                  >
                    {authMode === 'login'
                      ? 'Sign up free'
                      : 'Log in instead'}
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}