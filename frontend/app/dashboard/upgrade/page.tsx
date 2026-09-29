// app/dashboard/upgrade/page.tsx
'use client';
export const dynamic = 'force-dynamic';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import myLogo from '@/public/logo.png';

export default function UpgradePricingPage() {
  const router = useRouter();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annually'>('annually');

  const handleSelectPlan = (tierKey: string) => {
    // Process payment intent orchestration (e.g., Stripe Checkout redirect)
    alert(`Selected Tier: ${tierKey} (${billingPeriod})`);
    
    // Update local context mock status for the demo state
    localStorage.setItem('phx_plan', 'pro');
    router.push('/dashboard/general');
  };

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-[#151821] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Brand Return Header */}
        <div className="flex items-center justify-between mb-12">
          <button 
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-xs font-bold text-[#687080] hover:text-[#151821]"
          >
            ← Back to Dashboard
          </button>
          <div className="flex items-center gap-2">
            <Image src={myLogo} alt="Phoenix Logo" width={32} height={32} />
            <span className="font-bold text-xs uppercase tracking-wider">Phoenix System</span>
          </div>
        </div>

        {/* Value Proposition */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#111827]">
            Unlock the Full Path to Mastery
          </h1>
          <p className="mt-3 text-sm text-[#7d8492]">
            Gain absolute access to structured learning maps, production projects, certs, and premium core tools.
          </p>

          {/* Toggle Engine */}
          <div className="inline-flex items-center bg-[#edf0f4] p-1 rounded-xl mt-6">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition ${billingPeriod === 'monthly' ? 'bg-white text-[#111827] shadow' : 'text-[#687080]'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annually')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${billingPeriod === 'annually' ? 'bg-white text-[#111827] shadow' : 'text-[#687080]'}`}
            >
              Annually
              <span className="bg-[#fff7dc] text-[#96731d] px-1.5 py-0.5 rounded text-[9px] font-black uppercase">Save 20%</span>
            </button>
          </div>
        </div>

        {/* Pricing Matrix Tier Containers */}
        <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto items-stretch">
          
          {/* Base Tier Container */}
          <div className="bg-white border border-[#e5e8ee] rounded-[24px] p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#151821]">Standard Access</h3>
              <p className="text-xs text-[#7d8492] mt-1">Perfect for trying out standard paths.</p>
              <div className="mt-4 flex items-baseline text-[#111827]">
                <span className="text-3xl font-black tracking-tight">\$0</span>
                <span className="text-xs font-medium text-[#7d8492] ml-1">/ 7-day limited trial</span>
              </div>
              <ul className="mt-6 space-y-3 border-t border-[#edf0f4] pt-4">
                {['Core Catalog Browsing', 'Basic Community Read Access', 'Standard Web IDE Access'].map((feat) => (
                  <li key={feat} className="flex items-center gap-2 text-xs text-[#596171]">
                    <span className="text-emerald-500 font-bold">✓</span> {feat}
                  </li>
                ))}
              </ul>
            </div>
            <button 
              onClick={() => router.push('/dashboard')}
              className="mt-8 w-full rounded-xl border border-[#e2e5eb] py-3 text-xs font-bold text-[#3f4654] hover:bg-[#fafbfc]"
            >
              Currently Active
            </button>
          </div>

          {/* Premium Tier Container */}
          <div className="bg-[#111827] text-white border-2 border-[#d7ad35] rounded-[24px] p-6 flex flex-col justify-between shadow-2xl relative">
            <span className="absolute -top-3 right-6 bg-[#d7ad35] text-[#111827] px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
              Most Popular
            </span>
            <div>
              <h3 className="text-lg font-bold">Phoenix Pro</h3>
              <p className="text-xs text-white/60 mt-1">Accelerate your technical deployment speed.</p>
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-black tracking-tight">
                  {billingPeriod === 'annually' ? '\$29' : '\$39'}
                </span>
                <span className="text-xs font-medium text-white/50 ml-1">/ month, billed {billingPeriod}</span>
              </div>
              <ul className="mt-6 space-y-3 border-t border-white/10 pt-4">
                {[
                  'Unlimited Sequential Path Unlocks',
                  'Priority Live Community Q&A Response',
                  'Verified Digital Skill Certificates',
                  'Downloadable Asset Packs & Source Code',
                  'Dedicated Group Mentorship Sessions'
                ].map((feat) => (
                  <li key={feat} className="flex items-center gap-2 text-xs text-white/80">
                    <span className="text-[#d7ad35] font-bold">✓</span> {feat}
                  </li>
                ))}
              </ul>
            </div>
            <button 
              onClick={() => handleSelectPlan('phoenix-pro')}
              className="mt-8 w-full rounded-xl bg-[#d7ad35] py-3 text-xs font-bold text-[#111827] hover:bg-[#e5c04f] transition shadow-lg shadow-[#d7ad35]/10"
            >
              Upgrade Now
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}