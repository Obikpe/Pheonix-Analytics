// Pricing.tsx

'use client';

import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Check,
  Globe2,
  Lock,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

type Region = 'nigeria' | 'africa' | 'global';

export default function Pricing() {
  const [region, setRegion] = useState<Region>('global');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then((r) => r.json())
      .then((data) => {
        const country = data.country_code;

        if (country === 'NG') {
          setRegion('nigeria');
        } else {
          const africa = [
            'ZA',
            'KE',
            'GH',
            'EG',
            'RW',
            'UG',
            'TZ',
            'CM',
            'SN',
            'ET',
            'ZW',
            'BW',
            'MA',
            'DZ',
            'AO',
          ];

          if (africa.includes(country)) {
            setRegion('africa');
          } else {
            setRegion('global');
          }
        }
      })
      .catch(() => setRegion('global'))
      .finally(() => setLoading(false));
  }, []);

  const plans = {
    nigeria: {
      name: 'Nigeria Pro',
      price: '₦12,000',
      originalPrice: '₦45,000',
      sub: '/ month',
      detail: 'Powered by Paystack • ₦84,000/year',
      cta: 'Start your free trial',
      currency: 'NGN',
    },

    africa: {
      name: 'Africa Pro',
      price: '$15',
      originalPrice: '$29',
      sub: '/ month',
      detail: 'Powered by Flutterwave & Paystack',
      cta: 'Start your free trial',
      currency: 'USD',
    },

    global: {
      name: 'Global Pro',
      price: '$29',
      originalPrice: null,
      sub: '/ month',
      detail: 'Powered by Stripe • $228/year billing option',
      cta: 'Start your free trial',
      currency: 'USD',
    },
  };

  const plan = plans[region];
  const isNigeria = region === 'nigeria';

  const openRegistration = () => {
    window.dispatchEvent(
      new CustomEvent('open-auth', {
        detail: { mode: 'register' },
      })
    );
  };

  return (
    <section
      id="pricing"
      className="relative overflow-hidden bg-[#f7f8fa] px-6 py-24 text-[#172033] sm:px-8 lg:px-12"
    >
      {/* Background decoration */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[32rem] w-[50rem] -translate-x-1/2 rounded-full bg-[#d7ad35]/[0.07] blur-3xl" />

      <div className="relative z-10 mx-auto max-w-[1180px]">

        {/* Header */}
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d7ad35]/30 bg-white px-3.5 py-2 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-[#b78d16]" />

            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#8a6810]">
              Simple, flexible learning
            </span>
          </div>

          <h2 className="font-serif text-4xl font-bold leading-[1.08] tracking-[-0.035em] text-[#172033] sm:text-5xl">
            Invest in your{' '}
            <span className="text-[#b78d16]">next skill.</span>
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-7 text-[#667085] sm:text-base">
            Get access to the complete Learnora ME learning experience,
            including courses, practical projects, code practice and
            certificates.
          </p>
        </div>

        {/* Region indicator */}
        <div className="mb-8 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#e1e5eb] bg-white px-4 py-2.5 shadow-sm">
            <Globe2 className="h-3.5 w-3.5 text-[#7b8494]" />

            <span className="text-xs text-[#667085]">
              {loading
                ? 'Finding your local pricing...'
                : `Pricing shown for ${
                    region === 'nigeria'
                      ? 'Nigeria'
                      : region === 'africa'
                        ? 'Africa'
                        : 'your region'
                  }`}
            </span>

            {!loading && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            )}
          </div>
        </div>

        {/* Pricing layout */}
        <div className="grid items-stretch gap-6 lg:grid-cols-[1fr_1.4fr_1fr]">

          {/* Left information card */}
          <div className="hidden rounded-3xl border border-[#e1e5eb] bg-white p-7 shadow-sm lg:flex lg:flex-col">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f5f1e5]">
              <ShieldCheck className="h-5 w-5 text-[#9b7616]" />
            </div>

            <h3 className="mt-6 text-lg font-extrabold text-[#172033]">
              Learn without limits
            </h3>

            <p className="mt-3 text-sm leading-6 text-[#667085]">
              One membership gives you access to the tools and resources you
              need to move from learning concepts to applying them.
            </p>

            <div className="mt-auto space-y-4 pt-8">
              {[
                'Structured learning paths',
                'Practical projects',
                'Interactive coding',
                'Certificates',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f5f1e5]">
                    <Check className="h-3 w-3 text-[#9b7616]" />
                  </span>

                  <span className="text-xs font-semibold text-[#475467]">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Main pricing card */}
          <div className="relative overflow-hidden rounded-[28px] border-2 border-[#d7ad35]/50 bg-[#172033] p-7 text-white shadow-[0_25px_70px_rgba(23,32,51,0.16)] sm:p-9">

            {/* Popular badge */}
            <div className="absolute right-0 top-0 rounded-bl-2xl bg-[#d7ad35] px-5 py-2 text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#172033]">
              Full Access
            </div>

            <div className="mb-7">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#d7ad35]">
                Learnora ME Membership
              </p>

              <h3 className="mt-3 text-2xl font-extrabold">
                {plan.name}
              </h3>

              <p className="mt-2 text-sm leading-6 text-white/50">
                Everything you need to learn, practise and build.
              </p>
            </div>

            {/* Nigeria local pricing */}
            {isNigeria && (
              <div className="mb-6 rounded-2xl border border-[#d7ad35]/20 bg-[#d7ad35]/[0.07] p-4">
                <div className="flex items-center gap-2">
                  <Globe2 className="h-4 w-4 text-[#d7ad35]" />

                  <span className="text-xs font-bold text-[#e4c45d]">
                    Local pricing for Nigeria
                  </span>
                </div>

                <p className="mt-1.5 text-[11px] leading-5 text-white/45">
                  A regionally adjusted price is shown for learners accessing
                  Learnora ME from Nigeria.
                </p>
              </div>
            )}

            {/* Price */}
            <div className="border-y border-white/10 py-7">
              <div className="flex items-end justify-center gap-2">
                {plan.originalPrice && (
                  <span className="mb-2 text-sm font-semibold text-white/30 line-through">
                    {plan.originalPrice}
                  </span>
                )}

                <span className="text-5xl font-extrabold tracking-[-0.04em] sm:text-6xl">
                  {plan.price}
                </span>

                <span className="mb-2 text-xs font-semibold text-white/40">
                  {plan.sub}
                </span>
              </div>

              <p className="mt-3 text-center text-[11px] font-medium text-[#d7ad35]">
                {plan.detail}
              </p>
            </div>

            {/* Features */}
            <div className="mt-7 space-y-4">
              {[
                'Full access to 85+ courses and learning tracks',
                'Interactive coding and practice environments',
                'Hands-on projects and exercises',
                'Automated project grading and certificates',
                'Learn at your own pace',
              ].map((feature) => (
                <div
                  key={feature}
                  className="flex items-start gap-3"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d7ad35]/10">
                    <Check className="h-3 w-3 text-[#d7ad35]" />
                  </span>

                  <span className="text-xs leading-5 text-white/65">
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <button
              type="button"
              onClick={openRegistration}
              className="group mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-[#d7ad35] px-5 py-4 text-sm font-extrabold text-[#172033] transition-all hover:bg-[#e4c45d] active:scale-[0.99]"
            >
              {plan.cta}

              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>

            <p className="mt-4 text-center text-[10px] leading-5 text-white/35">
              7-day free trial. Cancel anytime. Beginner courses marked as
              free remain available without a membership.
            </p>

            {/* Security */}
            <div className="mt-6 flex items-center justify-center gap-2 border-t border-white/10 pt-5">
              <Lock className="h-3 w-3 text-white/30" />

              <span className="text-[9px] font-medium text-white/30">
                Secure payment processing
              </span>
            </div>
          </div>

          {/* Right information card */}
          <div className="hidden rounded-3xl border border-[#e1e5eb] bg-white p-7 shadow-sm lg:flex lg:flex-col">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#172033] text-white">
              <Sparkles className="h-5 w-5" />
            </div>

            <h3 className="mt-6 text-lg font-extrabold text-[#172033]">
              Start with 7 days
            </h3>

            <p className="mt-3 text-sm leading-6 text-[#667085]">
              Explore the platform before committing to a membership. Build
              your first lessons, try the playground and discover the learning
              paths available to you.
            </p>

            <div className="mt-6 rounded-2xl bg-[#f7f8fa] p-4">
              <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#98a1b2]">
                Your first week
              </p>

              <div className="mt-4 space-y-3">
                {[
                  'Explore the library',
                  'Start a learning path',
                  'Practice in the playground',
                ].map((item, index) => (
                  <div
                    key={item}
                    className="flex items-center gap-3"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-extrabold text-[#8a6810] shadow-sm">
                      {index + 1}
                    </span>

                    <span className="text-xs font-semibold text-[#475467]">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-auto pt-7 text-[10px] leading-5 text-[#98a1b2]">
              Payment options and currency are presented according to your
              detected region.
            </p>
          </div>
        </div>

        {/* Free learning note */}
        <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-[#e1e5eb] bg-white px-5 py-4 text-center shadow-sm">
          <p className="text-xs leading-5 text-[#667085]">
            <span className="font-bold text-[#172033]">
              Not ready to subscribe?
            </span>{' '}
            Selected beginner courses and learning resources can still be
            explored for free.
          </p>
        </div>
      </div>
    </section>
  );
}