'use client';
import { useEffect, useState } from 'react';

export default function Pricing() {
  const [region, setRegion] = useState<'nigeria' | 'africa' | 'global'>('global');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Detect location - uses free ipapi
    fetch('https://ipapi.co/json/')
      .then((r) => r.json())
      .then((data) => {
        const country = data.country_code;
        if (country === 'NG') setRegion('nigeria');
        else {
          const africa = ['ZA', 'KE', 'GH', 'EG', 'RW', 'UG', 'TZ', 'CM', 'SN', 'ET', 'ZW', 'BW', 'MA', 'DZ', 'AO'];
          if (africa.includes(country)) setRegion('africa');
          else setRegion('global');
        }
      })
      .catch(() => setRegion('global'))
      .finally(() => setLoading(false));
  }, []);

  const plans = {
    nigeria: { 
      name: 'Nigeria Pro 🇳🇬', 
      price: '₦12,000', 
      originalPrice: '$29 / ₦45,000',
      sub: '/month', 
      detail: 'Powered by Paystack • ₦84,000/yr (Save 30%)', 
      cta: 'Start Free Trial — Paystack' 
    },
    africa: { 
      name: 'Africa Pro 🌍', 
      price: '$15', 
      originalPrice: '$29',
      sub: '/month', 
      detail: 'Powered by Flutterwave & Paystack', 
      cta: 'Start Free Trial — $15/mo' 
    },
    global: { 
      name: 'Global Pro 🌐', 
      price: '$29', 
      originalPrice: null,
      sub: '/month', 
      detail: 'Powered by Stripe • $228/year billing option', 
      cta: 'Start Free Trial — $29/mo' 
    },
  };

  const plan = plans[region];
  const isNigeria = region === 'nigeria';

  return (
    <section id="pricing" className="py-24 px-6 bg-[#111827] text-white relative overflow-hidden">
      {/* Background Glow Accents */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(215,173,53,0.08),transparent_60%)] pointer-events-none" />

      <div className="max-w-[1280px] mx-auto relative z-10 text-center">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#D7AD35]/30 bg-[#D7AD35]/10 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D7AD35]" />
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#F2D477]">
              Investment in Your Future
            </span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Pricing — Built for Zero to Profit
          </h2>
          <p className="text-slate-400 mt-3 text-sm sm:text-base leading-relaxed">
            {loading
              ? 'Detecting your region for localized pricing...'
              : `Showing localized plan for ${plan.name} — geo-optimized to ensure fair regional access.`}
          </p>
        </div>

        {/* Pricing Card Wrapper */}
        <div className="max-w-md mx-auto">
          <div className="relative rounded-[32px] border-2 border-[#D7AD35]/60 bg-[#151D2A]/60 p-8 sm:p-10 shadow-[0_25px_60px_rgba(0,0,0,0.6)] backdrop-blur-xl overflow-hidden">
            
            {/* Top Highlight Badge */}
            <div className="absolute top-0 right-0 bg-gradient-to-l from-[#D7AD35] to-[#F2D477] text-[#111827] text-[10px] font-extrabold uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl">
              Most Popular
            </div>

            <h3 className="text-xl font-extrabold text-white">{plan.name}</h3>
            
            {/* Nigeria Special Subsidized Banner */}
            {isNigeria && (
              <div className="mt-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center animate-pulse">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-400">
                  <span>🇳🇬 I Love Nigeria! Subsidized Local Rate</span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Discounted from global price (<span className="line-through text-slate-400">~$29 / ₦45,000</span>) to support local tech talent.
                </p>
              </div>
            )}

            <div className="mt-6 flex items-baseline justify-center gap-1">
              {isNigeria && (
                <span className="text-sm font-semibold text-slate-500 line-through mr-2">₦45,000</span>
              )}
              <span className="text-5xl sm:text-6xl font-extrabold text-white tracking-tight">{plan.price}</span>
              <span className="text-sm font-semibold text-slate-400">{plan.sub}</span>
            </div>

            <p className="text-xs text-[#F2D477] font-medium mt-3">{plan.detail}</p>

            <div className="mt-8 space-y-3 text-left border-t border-white/10 pt-6 text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <span className="text-[#D7AD35] font-bold">✓</span> Full access to all 85+ industry courses & tracks
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-[#D7AD35] font-bold">✓</span> Unlimited live code execution sandbox
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-[#D7AD35] font-bold">✓</span> Automated project grading & certificates
              </div>
            </div>

            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('open-auth', { detail: { mode: 'register' } }))}
              className="mt-8 w-full group relative overflow-hidden bg-gradient-to-r from-[#D7AD35] to-[#F2D477] text-[#111827] py-4 rounded-2xl font-extrabold text-sm shadow-lg shadow-[#D7AD35]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {plan.cta}
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </span>
            </button>

            <p className="mt-5 text-[11px] leading-relaxed text-slate-400">
              7 days free trial. Secure card authorization, zero charge on Day 1. Cancel anytime. 10% beginner courses remain free forever.
            </p>
          </div>

          <p className="mt-6 text-[11px] text-slate-500 font-mono">
            Pricing locked via IP security to prevent regional arbitrage. Detected region: <strong className="text-slate-300">{region.toUpperCase()}</strong>
          </p>
        </div>

      </div>
    </section>
  );
}