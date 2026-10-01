'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function HeroCentered() {
  const [code, setCode] = useState('');
  const fullCode = `import pandas as pd
from learnora import Analytics

df = Analytics.load('sales_q4.csv')
insights = df.analyze()
insights.visualize()
# Your future in data starts here`;

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      setCode(fullCode.slice(0, i));
      i++;
      if (i > fullCode.length) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 pt-16 pb-24 overflow-hidden bg-[#111827] text-white">
      {/* Luxurious Multi-layered Background Glow & Grid Accents */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(215,173,53,0.14),transparent_55%),radial-gradient(circle_at_15%_85%,rgba(255,255,255,0.03),transparent_35%)] pointer-events-none" />
      <div 
        className="absolute inset-0 opacity-[0.025] pointer-events-none" 
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D7AD35' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} 
      />

      <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center">
        
        {/* Top Badge / Status Pill */}
        <motion.div 
          initial={{ opacity: 0, y: -15 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-[#D7AD35]/30 bg-[#D7AD35]/10 backdrop-blur-md mb-8 shadow-sm"
        >
          <span className="w-2 h-2 rounded-full bg-[#D7AD35] animate-pulse" />
          <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#F2D477]">
            Platform 2.0 Live • 16 Tracks & 85 Courses
          </span>
        </motion.div>

        {/* Main Hero Content */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6, delay: 0.1 }} 
          className="text-center max-w-3xl mx-auto"
        >
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-[-0.03em] text-white leading-[1.08]">
            Learn. Build. <br />
            <span className="bg-gradient-to-r from-[#D7AD35] via-[#F2D477] to-[#D7AD35] bg-clip-text text-transparent">
              Get Hired.
            </span>
          </h1>
          
          <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Master analytics with 800+ interactive lessons. One curriculum shared everywhere—notes and data frameworks built for modern data pros.
          </p>

          {/* Action Buttons */}
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <button 
              onClick={() => scrollTo('pricing')}
              className="group relative overflow-hidden bg-gradient-to-r from-[#D7AD35] to-[#F2D477] text-[#111827] px-8 py-4 rounded-xl font-extrabold text-sm shadow-xl shadow-[#D7AD35]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <span className="relative z-10 flex items-center gap-2">
                Start Free Trial — 7 Days
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </span>
            </button>

            <button 
              onClick={() => scrollTo('library')}
              className="px-8 py-4 rounded-xl border border-white/15 bg-white/[0.04] text-white text-sm font-bold backdrop-blur-md hover:bg-white/[0.08] hover:border-white/30 transition-all"
            >
              Explore Library
            </button>
          </div>
        </motion.div>

        {/* Interactive Code Terminal Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.7, delay: 0.3 }}
          className="w-full max-w-2xl mt-14"
        >
          <div className="rounded-2xl border border-white/10 bg-[#0A0E17]/90 p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <div className="flex gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase">
                learnora_terminal.py
              </span>
            </div>
            <pre className="text-xs sm:text-sm text-slate-200 font-mono whitespace-pre-wrap min-h-[140px] leading-relaxed">
              {code}
              <span className="animate-pulse text-[#D7AD35]">▌</span>
            </pre>
          </div>
        </motion.div>

      </div>
    </section>
  );
}