// EmailVerification.tsx
'use client';

import {
  FormEvent,
  useEffect,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Inbox,
  LockKeyhole,
  Mail,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  XCircle,
} from 'lucide-react';

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
  };

  /*
   * Verify the token as soon as the page loads.
   */
  useEffect(() => {
    let cancelled = false;

    const verifyEmail = async () => {
      try {
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
   * Resend verification email.
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
   * Shared Learnora ME branding.
   */
  const Brand = () => (
    <div className="flex items-center justify-center gap-1.5">
      <span className="font-serif text-xl font-bold tracking-[-0.04em] text-[#172033]">
        Learnora
      </span>

      <span className="font-serif text-xl font-bold tracking-[-0.04em] text-[#b78d16]">
        ME
      </span>
    </div>
  );

  /*
   * Shared resend form.
   */
  const ResendForm = () => (
    <form
      onSubmit={resendVerification}
      className="mt-8"
    >
      <label
        htmlFor="verification-email"
        className="mb-2 block text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#667085]"
      >
        Email address
      </label>

      <div className="relative">
        <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98a1b2]" />

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
          className="w-full rounded-xl border border-[#dfe3e9] bg-[#f8f9fa] py-3.5 pl-11 pr-4 text-sm text-[#172033] outline-none transition placeholder:text-[#a3aab7] focus:border-[#d7ad35] focus:bg-white focus:ring-4 focus:ring-[#d7ad35]/10"
        />
      </div>

      {error && (
        <div
          role="alert"
          className="mt-3 flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-xs font-medium leading-5 text-red-600"
        >
          <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={state === 'resending'}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#172033] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#25324a] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {state === 'resending' ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4" />
            Resend verification email
          </>
        )}
      </button>
    </form>
  );

  /*
   * Shared page shell.
   */
  const PageShell = ({
    children,
  }: {
    children: React.ReactNode;
  }) => (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f5f7fa] px-5 py-10 sm:px-8">
      {/* Background */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[30rem] w-[45rem] -translate-x-1/2 rounded-full bg-[#d7ad35]/[0.07] blur-3xl" />

      <div className="pointer-events-none absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-[#e8edf5] blur-3xl" />

      <div className="relative z-10 w-full max-w-[520px]">
        {children}
      </div>
    </main>
  );

  /*
   * SUCCESS
   */
  if (state === 'success') {
    return (
      <PageShell>
        <div className="overflow-hidden rounded-[28px] border border-[#e1e5eb] bg-white shadow-[0_25px_70px_rgba(23,32,51,0.08)]">
          <div className="h-1.5 bg-[#d7ad35]" />

          <div className="p-8 text-center sm:p-10">
            <Brand />

            <div className="mx-auto mt-9 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>

            <div className="mt-7">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.16em] text-emerald-700">
                <Check className="h-3 w-3" />
                Verification complete
              </div>

              <h1 className="mt-4 font-serif text-3xl font-bold tracking-[-0.03em] text-[#172033] sm:text-4xl">
                You're all set.
              </h1>

              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#667085]">
                Your email has been verified successfully.
                Your Learnora ME account is now ready.
              </p>
            </div>

            <div className="mt-7 flex items-center justify-center gap-2 text-xs text-[#98a1b2]">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              Taking you to your dashboard...
            </div>
          </div>
        </div>
      </PageShell>
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
      <PageShell>
        <div className="overflow-hidden rounded-[28px] border border-[#e1e5eb] bg-white shadow-[0_25px_70px_rgba(23,32,51,0.08)]">
          <div className="h-1.5 bg-[#d7ad35]" />

          <div className="p-8 text-center sm:p-10">
            <Brand />

            <div className="mx-auto mt-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f7f1df]">
              <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-[#d7ad35]/25 border-t-[#b78d16]" />
            </div>

            <h1 className="mt-7 font-serif text-3xl font-bold tracking-[-0.03em] text-[#172033]">
              Verifying your email
            </h1>

            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#667085]">
              We're securely confirming your email address.
              This should only take a moment.
            </p>

            <div className="mt-8 flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#98a1b2]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Secure account verification
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  /*
   * EXPIRED
   */
  if (state === 'expired') {
    return (
      <PageShell>
        <div className="overflow-hidden rounded-[28px] border border-[#e1e5eb] bg-white shadow-[0_25px_70px_rgba(23,32,51,0.08)]">
          <div className="h-1.5 bg-[#d7ad35]" />

          <div className="p-8 sm:p-10">
            <Brand />

            <div className="mt-9 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50">
                <Clock3 className="h-8 w-8 text-amber-600" />
              </div>

              <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.16em] text-amber-700">
                Verification expired
              </div>

              <h1 className="mt-4 font-serif text-3xl font-bold tracking-[-0.03em] text-[#172033]">
                Let's send you a new link.
              </h1>

              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#667085]">
                {message}
              </p>
            </div>

            <ResendForm />
          </div>
        </div>
      </PageShell>
    );
  }

  /*
   * RESEND SUCCESS
   */
  if (state === 'resent') {
    return (
      <PageShell>
        <div className="overflow-hidden rounded-[28px] border border-[#e1e5eb] bg-white shadow-[0_25px_70px_rgba(23,32,51,0.08)]">
          <div className="h-1.5 bg-[#d7ad35]" />

          <div className="p-8 text-center sm:p-10">
            <Brand />

            <div className="mx-auto mt-9 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f7f1df]">
              <Inbox className="h-8 w-8 text-[#b78d16]" />
            </div>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.16em] text-emerald-700">
              <Check className="h-3 w-3" />
              Email sent
            </div>

            <h1 className="mt-4 font-serif text-3xl font-bold tracking-[-0.03em] text-[#172033]">
              Check your inbox.
            </h1>

            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#667085]">
              {message}
            </p>

            <div className="mt-6 rounded-2xl bg-[#f7f8fa] p-4 text-left">
              <div className="flex gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#b78d16]" />

                <div>
                  <p className="text-xs font-bold text-[#344054]">
                    What to do next
                  </p>

                  <p className="mt-1 text-[11px] leading-5 text-[#7b8494]">
                    Open the newest email from Learnora ME
                    and click the verification button.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  /*
   * ALREADY VERIFIED
   */
  if (
    state === 'already_verified'
  ) {
    return (
      <PageShell>
        <div className="overflow-hidden rounded-[28px] border border-[#e1e5eb] bg-white shadow-[0_25px_70px_rgba(23,32,51,0.08)]">
          <div className="h-1.5 bg-[#d7ad35]" />

          <div className="p-8 text-center sm:p-10">
            <Brand />

            <div className="mx-auto mt-9 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
              <ShieldCheck className="h-8 w-8 text-blue-600" />
            </div>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.16em] text-blue-700">
              Already verified
            </div>

            <h1 className="mt-4 font-serif text-3xl font-bold tracking-[-0.03em] text-[#172033]">
              Your email is already verified.
            </h1>

            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#667085]">
              {message}
            </p>

            <button
              type="button"
              onClick={() =>
                router.push('/')
              }
              className="group mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-[#172033] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#25324a]"
            >
              Return to Learnora ME
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  /*
   * MISSING / INVALID / RESEND ERROR
   */
  return (
    <PageShell>
      <div className="overflow-hidden rounded-[28px] border border-[#e1e5eb] bg-white shadow-[0_25px_70px_rgba(23,32,51,0.08)]">
        <div className="h-1.5 bg-[#d7ad35]" />

        <div className="p-8 sm:p-10">
          <Brand />

          <div className="mt-9 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.16em] text-red-600">
              Verification unavailable
            </div>

            <h1 className="mt-4 font-serif text-3xl font-bold tracking-[-0.03em] text-[#172033]">
              We couldn't verify this link.
            </h1>

            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#667085]">
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
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#dfe3e9] px-5 py-3.5 text-sm font-bold text-[#475467] transition hover:bg-[#f8f9fa]"
          >
            Return to Learnora ME
          </button>
        </div>
      </div>

      {/* Security footer */}
      <div className="mt-6 flex items-center justify-center gap-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#98a1b2]">
        <LockKeyhole className="h-3 w-3" />
        Secure email verification
      </div>
    </PageShell>
  );
}