'use client';

import {
  FormEvent,
  useEffect,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';

const API_URL =
  'https://learnora-backend.vercel.app';

type VerificationResponse = {
  access_token?: string;
  token?: string;
  email?: string;
  role?: string;
  name?: string;
  account_type?: 'learner' | 'admin';
  sub_status?: string | null;
  is_paid?: boolean;
  allowed?: string;
};

type VerificationState =
  | 'loading'
  | 'success'
  | 'expired'
  | 'invalid'
  | 'missing'
  | 'already_verified'
  | 'resending'
  | 'resent'
  | 'resend_error';

export default function EmailVerification() {
  const router = useRouter();

  const [state, setState] =
    useState<VerificationState>('loading');

  const [message, setMessage] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  /*
   * Save the authenticated session returned
   * by the verification endpoint.
   */
  const saveSession = (
    data: VerificationResponse
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
        'The verification response is incomplete.'
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

    /*
     * A newly verified normal learner will
     * enter the general dashboard.
     *
     * The backend remains authoritative for
     * entitlement and account status.
     */
  };

  /*
   * Verify the token as soon as the page loads.
   */
  useEffect(() => {
    let cancelled = false;

    const verifyEmail = async () => {
      try {
        /*
         * Read the token directly from the browser URL.
         *
         * Expected URL:
         *
         * /verify_email?token=...
         */
        const params =
          new URLSearchParams(
            window.location.search
          );

        const token =
          params.get('token');

        if (!token) {
          if (!cancelled) {
            setState('missing');
            setMessage(
              'No verification token was found in this link.'
            );
            setLoading(false);
          }

          return;
        }

        const res = await fetch(
          `${API_URL}/api/auth/verify-email`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              token,
            }),
          }
        );

        const data =
          await res
            .json()
            .catch(
              () => ({})
            );

        if (!res.ok) {
          const detail =
            data?.detail ||
            data?.message ||
            'We could not verify this email address.';

          const normalized =
            String(detail).toLowerCase();

          if (
            normalized.includes(
              'expired'
            )
          ) {
            if (!cancelled) {
              setState('expired');
              setMessage(
                'This verification link has expired. Request a new verification email below.'
              );
              setLoading(false);
            }

            return;
          }

          if (
            normalized.includes(
              'already verified'
            ) ||
            normalized.includes(
              'already been verified'
            )
          ) {
            if (!cancelled) {
              setState(
                'already_verified'
              );
              setMessage(
                'This email address has already been verified.'
              );
              setLoading(false);
            }

            return;
          }

          if (!cancelled) {
            setState('invalid');
            setMessage(detail);
            setLoading(false);
          }

          return;
        }

        /*
         * Backend successfully verified the
         * email and issued an authenticated JWT.
         */
        saveSession(data);

        if (!cancelled) {
          setState('success');
          setLoading(false);

          /*
           * Give the success state a moment to
           * render before routing.
           */
          setTimeout(() => {
            router.replace(
              '/dashboard/general'
            );
          }, 1200);
        }
      } catch (err: any) {
        if (cancelled) return;

        setState('invalid');

        setMessage(
          err?.message ||
            'Something went wrong while verifying your email.'
        );

        setLoading(false);
      }
    };

    verifyEmail();

    return () => {
      cancelled = true;
    };
  }, [router]);

  /*
   * Resend a verification email.
   *
   * The backend expects:
   *
   * POST /api/auth/resend-verification
   *
   * {
   *   email: "..."
   * }
   */
  const resendVerification = async (
    e?: FormEvent
  ) => {
    e?.preventDefault();

    const cleanEmail =
      email.trim().toLowerCase();

    if (!cleanEmail) {
      setError(
        'Please enter the email address you used to create your account.'
      );
      return;
    }

    setState('resending');
    setError('');
    setMessage('');

    try {
      const res = await fetch(
        `${API_URL}/api/auth/resend-verification`,
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

      const data =
        await res
          .json()
          .catch(
            () => ({})
          );

      if (!res.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            'Unable to resend the verification email.'
        );
      }

      setState('resent');

      setMessage(
        'If your account requires verification, a new verification email has been sent.'
      );
    } catch (err: any) {
      setState('resend_error');

      setError(
        err?.message ||
          'Unable to resend the verification email. Please try again.'
      );
    }
  };

  /*
   * Shared resend form.
   */
  const ResendForm = () => (
    <form
      onSubmit={resendVerification}
      className="mt-7 space-y-4"
    >
      <div>
        <label
          htmlFor="verification-email"
          className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2"
        >
          Email address
        </label>

        <input
          id="verification-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError('');
          }}
          placeholder="you@example.com"
          autoComplete="email"
          className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-[#D7AD35] focus:ring-4 focus:ring-[#D7AD35]/10 transition"
        />
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-xs font-medium text-red-600"
        >
          <span className="mt-0.5">
            !
          </span>

          <span>
            {error}
          </span>
        </div>
      )}

      <button
        type="submit"
        disabled={
          state === 'resending'
        }
        className="w-full py-3.5 rounded-xl bg-[#111827] text-white font-bold text-sm shadow-lg shadow-slate-900/10 hover:bg-[#1f2937] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
      >
        {state === 'resending'
          ? 'Sending...'
          : 'Resend verification email'}
      </button>
    </form>
  );

  /*
   * SUCCESS
   */
  if (state === 'success') {
    return (
      <main className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-5">
        <div className="w-full max-w-[500px] bg-white rounded-[28px] border border-slate-200 shadow-xl shadow-slate-900/5 p-8 sm:p-10 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-6">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-8 h-8 text-emerald-600"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="m5 12 4 4L19 6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#B08A1E]">
            Learnora Me
          </p>

          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">
            Email verified!
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Your email has been verified
            successfully. Your Learnora Me
            account is now active.
          </p>

          <p className="mt-5 text-xs text-slate-400">
            Taking you to your dashboard...
          </p>
        </div>
      </main>
    );
  }

  /*
   * INITIAL VERIFICATION LOADING
   */
  if (
    state === 'loading' &&
    loading
  ) {
    return (
      <main className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-5">
        <div className="w-full max-w-[500px] bg-white rounded-[28px] border border-slate-200 shadow-xl shadow-slate-900/5 p-8 sm:p-10 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#D7AD35]/10 border border-[#D7AD35]/20 flex items-center justify-center mb-6">
            <span className="w-7 h-7 rounded-full border-[3px] border-[#D7AD35]/30 border-t-[#B08A1E] animate-spin" />
          </div>

          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#B08A1E]">
            Learnora Me
          </p>

          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">
            Verifying your email
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Please wait while we verify
            your email address.
          </p>
        </div>
      </main>
    );
  }

  /*
   * EXPIRED
   */
  if (state === 'expired') {
    return (
      <main className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-5">
        <div className="w-full max-w-[500px] bg-white rounded-[28px] border border-slate-200 shadow-xl shadow-slate-900/5 p-8 sm:p-10">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-6">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-8 h-8 text-amber-600"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="8.5"
                />
                <path
                  d="M12 7v5l3 2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#B08A1E]">
              Learnora Me
            </p>

            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">
              Verification link expired
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              {message}
            </p>
          </div>

          <ResendForm />
        </div>
      </main>
    );
  }

  /*
   * RESEND SUCCESS
   */
  if (state === 'resent') {
    return (
      <main className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-5">
        <div className="w-full max-w-[500px] bg-white rounded-[28px] border border-slate-200 shadow-xl shadow-slate-900/5 p-8 sm:p-10 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-6">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-8 h-8 text-emerald-600"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11Z"
              />

              <path
                d="m5 6 7 6 7-6"
              />

              <path
                d="m9 15 2 2 4-4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#B08A1E]">
            Learnora Me
          </p>

          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">
            Check your inbox
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            {message}
          </p>

          <p className="mt-3 text-xs leading-5 text-slate-400">
            Open the newest verification
            email and click the verification
            button.
          </p>
        </div>
      </main>
    );
  }

  /*
   * ALREADY VERIFIED
   */
  if (
    state === 'already_verified'
  ) {
    return (
      <main className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-5">
        <div className="w-full max-w-[500px] bg-white rounded-[28px] border border-slate-200 shadow-xl shadow-slate-900/5 p-8 sm:p-10 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-6">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-8 h-8 text-blue-600"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                d="M5 12.5 9.5 17 19 7.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <path
                d="M4 4h16v16H4z"
                opacity="0"
              />
            </svg>
          </div>

          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#B08A1E]">
            Learnora Me
          </p>

          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">
            Email already verified
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            {message}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push('/')
            }
            className="mt-7 w-full py-3.5 rounded-xl bg-[#111827] text-white font-bold text-sm hover:bg-[#1f2937] transition"
          >
            Return to Learnora Me
          </button>
        </div>
      </main>
    );
  }

  /*
   * MISSING / INVALID / RESEND ERROR
   */
  return (
    <main className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-5">
      <div className="w-full max-w-[500px] bg-white rounded-[28px] border border-slate-200 shadow-xl shadow-slate-900/5 p-8 sm:p-10">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mb-6">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-8 h-8 text-red-500"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <circle
                cx="12"
                cy="12"
                r="8.5"
              />

              <path
                d="M9 9l6 6M15 9l-6 6"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#B08A1E]">
            Learnora Me
          </p>

          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">
            Verification link unavailable
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            {message ||
              'This verification link is invalid or can no longer be used.'}
          </p>
        </div>

        <ResendForm />

        <button
          type="button"
          onClick={() =>
            router.push('/')
          }
          className="mt-3 w-full py-3.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition"
        >
          Return to Learnora Me
        </button>
      </div>
    </main>
  );
}