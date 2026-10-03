// HeroCentered.tsx

'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  Play,
  Sparkles,
  BarChart3,
  Code2,
  Database,
} from 'lucide-react';

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

      if (i > fullCode.length) {
        clearInterval(id);
      }
    }, 28);

    return () => clearInterval(id);
  }, []);

  const scrollTo = (id: string) => {
    document
      .getElementById(id)
      ?.scrollIntoView({
        behavior: 'smooth',
      });
  };

  return (
    <section className="relative overflow-hidden bg-white text-[#111827]">

      {/* =========================================================
          BACKGROUND
      ========================================================= */}

      <div className="absolute inset-0 pointer-events-none overflow-hidden">

        {/* Soft gold glow */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[500px] rounded-full bg-[#D7AD35]/10 blur-[110px]" />

        {/* Side glow */}
        <div className="absolute top-[30%] -right-40 w-[420px] h-[420px] rounded-full bg-slate-100 blur-[90px]" />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(#111827 1px, transparent 1px), linear-gradient(90deg, #111827 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />
      </div>

      {/* =========================================================
          HERO CONTENT
      ========================================================= */}

      <div className="relative z-10 max-w-[1440px] mx-auto px-5 sm:px-7 lg:px-10">

        <div className="min-h-[calc(100vh-74px)] py-20 sm:py-24 lg:py-28 flex flex-col items-center">

          {/* EYEBROW */}
          <motion.div
            initial={{
              opacity: 0,
              y: -12,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.5,
            }}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm"
          >
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#B8962E]/10">
              <Sparkles className="w-3 h-3 text-[#9A7920]" />
            </span>

            <span className="text-[11px] sm:text-xs font-bold tracking-[0.08em] text-slate-600">
              Learn practical skills. Build your future.
            </span>
          </motion.div>

          {/* MAIN HEADING */}
          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.65,
              delay: 0.08,
            }}
            className="text-center max-w-[950px] mt-8"
          >
            <h1 className="text-[46px] sm:text-[64px] lg:text-[82px] font-extrabold tracking-[-0.055em] leading-[0.98] text-[#111827]">
              Learn skills that
              <br />

              <span className="relative inline-block mt-2">
                <span className="bg-gradient-to-r from-[#8E6E18] via-[#C9A83D] to-[#8E6E18] bg-clip-text text-transparent">
                  move you forward.
                </span>

                <svg
                  className="absolute -bottom-3 left-[4%] w-[92%] h-3 text-[#D7AD35]"
                  viewBox="0 0 400 14"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M3 10C90 3 300 3 397 9"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            <p className="mt-8 mx-auto max-w-[700px] text-base sm:text-lg lg:text-xl leading-8 text-slate-500">
              Build practical skills in data, technology,
              business and more through structured learning,
              hands-on practice and real-world projects.
            </p>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{
              opacity: 0,
              y: 18,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.6,
              delay: 0.18,
            }}
            className="mt-9 flex flex-col sm:flex-row items-center gap-3"
          >
            <button
              type="button"
              onClick={() =>
                scrollTo('library')
              }
              className="group inline-flex items-center justify-center gap-2 min-w-[190px] px-7 py-3.5 rounded-lg bg-[#111827] text-white text-sm font-bold shadow-lg shadow-slate-900/10 hover:bg-[#263244] hover:-translate-y-0.5 transition-all"
            >
              Explore courses

              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              type="button"
              onClick={() =>
                scrollTo('pricing')
              }
              className="inline-flex items-center justify-center gap-2 min-w-[190px] px-7 py-3.5 rounded-lg border border-slate-300 bg-white text-[#111827] text-sm font-bold hover:bg-slate-50 transition-all"
            >
              Start free for 7 days
            </button>
          </motion.div>

          {/* TRUST POINTS */}
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              duration: 0.6,
              delay: 0.3,
            }}
            className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2"
          >
            {[
              '7-day free trial',
              'Learn at your own pace',
              'Practical projects',
            ].map((item) => (
              <span
                key={item}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-500"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#B8962E]" />
                {item}
              </span>
            ))}
          </motion.div>

          {/* =====================================================
              LEARNING PLATFORM PREVIEW
          ===================================================== */}

          <motion.div
            initial={{
              opacity: 0,
              y: 45,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.8,
              delay: 0.38,
            }}
            className="relative w-full max-w-[1120px] mt-20"
          >

            {/* Floating left card */}
            <motion.div
              initial={{
                opacity: 0,
                x: -25,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              transition={{
                duration: 0.6,
                delay: 0.8,
              }}
              className="hidden lg:block absolute -left-10 top-20 z-20"
            >
              <div className="w-[190px] rounded-xl border border-slate-200 bg-white p-4 shadow-[0_20px_50px_rgba(15,23,42,0.12)]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#111827] flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-[#F2D477]" />
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                      Learning
                    </p>

                    <p className="text-sm font-extrabold text-[#111827]">
                      Data Analytics
                    </p>
                  </div>
                </div>

                <div className="mt-4 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full w-[72%] rounded-full bg-[#B8962E]" />
                </div>

                <p className="mt-2 text-[10px] text-slate-400">
                  72% completed
                </p>
              </div>
            </motion.div>

            {/* Floating right card */}
            <motion.div
              initial={{
                opacity: 0,
                x: 25,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              transition={{
                duration: 0.6,
                delay: 0.9,
              }}
              className="hidden lg:block absolute -right-10 bottom-20 z-20"
            >
              <div className="w-[190px] rounded-xl border border-slate-200 bg-white p-4 shadow-[0_20px_50px_rgba(15,23,42,0.12)]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Code2 className="w-4 h-4 text-slate-700" />
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                      Practice
                    </p>

                    <p className="text-sm font-extrabold text-[#111827]">
                      Python
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-end gap-1 h-8">
                  {[30, 48, 38, 62, 50, 76, 65, 88].map(
                    (height, index) => (
                      <span
                        key={index}
                        className="flex-1 rounded-sm bg-[#111827]"
                        style={{
                          height: `${height}%`,
                          opacity:
                            0.35 +
                            index * 0.07,
                        }}
                      />
                    )
                  )}
                </div>

                <p className="mt-2 text-[10px] text-slate-400">
                  Interactive practice
                </p>
              </div>
            </motion.div>

            {/* Main platform window */}
            <div className="relative rounded-2xl border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.15)] overflow-hidden">

              {/* Window header */}
              <div className="h-12 border-b border-slate-200 bg-slate-50 flex items-center px-4 sm:px-5">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                </div>

                <div className="mx-auto hidden sm:flex items-center gap-2 text-[10px] font-semibold text-slate-400">
                  <span className="w-4 h-4 rounded bg-[#111827] flex items-center justify-center">
                    <img
                      src="/logo.png"
                      alt=""
                      className="w-3 h-3 object-contain"
                    />
                  </span>

                  Learnora ME
                </div>
              </div>

              {/* Platform body */}
              <div className="grid md:grid-cols-[190px_1fr] min-h-[390px]">

                {/* Sidebar */}
                <aside className="hidden md:block border-r border-slate-200 bg-slate-50/70 p-4">
                  <div className="text-[9px] uppercase tracking-[0.15em] font-bold text-slate-400 mb-3">
                    My learning
                  </div>

                  <div className="space-y-1">
                    {[
                      'Dashboard',
                      'My courses',
                      'Practice',
                      'Projects',
                    ].map(
                      (item, index) => (
                        <div
                          key={item}
                          className={`px-3 py-2.5 rounded-lg text-xs font-semibold ${
                            index === 1
                              ? 'bg-[#111827] text-white'
                              : 'text-slate-500'
                          }`}
                        >
                          {item}
                        </div>
                      )
                    )}
                  </div>

                  <div className="mt-8">
                    <div className="text-[9px] uppercase tracking-[0.15em] font-bold text-slate-400 mb-3">
                      Your progress
                    </div>

                    <div className="rounded-lg bg-white border border-slate-200 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500">
                          Weekly goal
                        </span>

                        <span className="text-[10px] font-bold text-[#9A7920]">
                          4/5
                        </span>
                      </div>

                      <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full w-[80%] bg-[#B8962E] rounded-full" />
                      </div>
                    </div>
                  </div>
                </aside>

                {/* Main dashboard */}
                <div className="p-5 sm:p-7 bg-white">

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.14em] font-bold text-[#B8962E]">
                        Continue learning
                      </p>

                      <h3 className="mt-1 text-xl sm:text-2xl font-extrabold tracking-[-0.03em] text-[#111827]">
                        Build your next skill.
                      </h3>
                    </div>

                    <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="w-6 h-6 rounded-full bg-[#111827]" />

                      <span className="text-[10px] font-bold text-slate-500">
                        Your learning
                      </span>
                    </div>
                  </div>

                  {/* Course cards */}
                  <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">

                    {/* Card 1 */}
                    <div className="group rounded-xl border border-slate-200 overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all">
                      <div className="relative h-28 bg-[#111827] overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(215,173,53,0.35),transparent_45%)]" />

                        <div className="absolute bottom-3 left-3">
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-white/10 border border-white/10 backdrop-blur px-2 py-1 text-[9px] font-bold text-white">
                            <BarChart3 className="w-3 h-3" />
                            ANALYTICS
                          </span>
                        </div>
                      </div>

                      <div className="p-3.5">
                        <h4 className="text-xs font-extrabold text-[#111827]">
                          Data Analytics Foundations
                        </h4>

                        <p className="mt-1 text-[10px] text-slate-400">
                          Excel · SQL · Power BI
                        </p>

                        <div className="mt-3 h-1 bg-slate-100 rounded-full">
                          <div className="h-full w-[68%] rounded-full bg-[#B8962E]" />
                        </div>
                      </div>
                    </div>

                    {/* Card 2 */}
                    <div className="group rounded-xl border border-slate-200 overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all">
                      <div className="relative h-28 bg-slate-100 overflow-hidden flex items-center justify-center">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(15,23,42,0.10),transparent_50%)]" />

                        <div className="relative w-20 h-14 rounded-lg border border-slate-300 bg-white shadow-sm p-2">
                          <div className="flex gap-1 mb-2">
                            <span className="w-2 h-2 rounded-full bg-slate-200" />
                            <span className="w-2 h-2 rounded-full bg-slate-200" />
                            <span className="w-2 h-2 rounded-full bg-slate-200" />
                          </div>

                          <div className="flex gap-1 items-end h-6">
                            <span className="w-2 h-3 bg-slate-300 rounded-sm" />
                            <span className="w-2 h-5 bg-[#111827] rounded-sm" />
                            <span className="w-2 h-4 bg-[#B8962E] rounded-sm" />
                            <span className="w-2 h-6 bg-slate-400 rounded-sm" />
                            <span className="w-2 h-4 bg-[#111827] rounded-sm" />
                          </div>
                        </div>
                      </div>

                      <div className="p-3.5">
                        <h4 className="text-xs font-extrabold text-[#111827]">
                          Python for Data Work
                        </h4>

                        <p className="mt-1 text-[10px] text-slate-400">
                          Python · Pandas · Projects
                        </p>

                        <div className="mt-3 h-1 bg-slate-100 rounded-full">
                          <div className="h-full w-[42%] rounded-full bg-[#111827]" />
                        </div>
                      </div>
                    </div>

                    {/* Card 3 */}
                    <div className="group rounded-xl border border-slate-200 overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all sm:hidden lg:block">
                      <div className="relative h-28 bg-[#F6F3EA] overflow-hidden flex items-center justify-center">
                        <Database className="w-12 h-12 text-[#B8962E]" strokeWidth={1.4} />
                      </div>

                      <div className="p-3.5">
                        <h4 className="text-xs font-extrabold text-[#111827]">
                          SQL & Databases
                        </h4>

                        <p className="mt-1 text-[10px] text-slate-400">
                          PostgreSQL · Queries
                        </p>

                        <div className="mt-3 h-1 bg-slate-100 rounded-full">
                          <div className="h-full w-[24%] rounded-full bg-slate-700" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Terminal preview */}
                  <div className="mt-5 rounded-xl bg-[#0B0F17] overflow-hidden border border-slate-800">
                    <div className="h-9 border-b border-white/10 px-3 flex items-center justify-between">
                      <div className="flex gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-600" />
                        <span className="w-2 h-2 rounded-full bg-slate-600" />
                        <span className="w-2 h-2 rounded-full bg-slate-600" />
                      </div>

                      <span className="text-[9px] font-mono text-slate-500">
                        learnora_terminal.py
                      </span>
                    </div>

                    <pre className="p-4 text-[9px] sm:text-[10px] font-mono leading-5 text-slate-300 whitespace-pre-wrap min-h-[118px]">
                      {code}
                      <span className="animate-pulse text-[#D7AD35]">
                        ▌
                      </span>
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* BOTTOM METRICS */}
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              duration: 0.7,
              delay: 0.55,
            }}
            className="mt-12 flex flex-wrap justify-center items-center gap-x-8 gap-y-5 text-center"
          >
            <div>
              <p className="text-xl font-extrabold tracking-tight text-[#111827]">
                16+
              </p>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                Learning tracks
              </p>
            </div>

            <div className="hidden sm:block w-px h-8 bg-slate-200" />

            <div>
              <p className="text-xl font-extrabold tracking-tight text-[#111827]">
                85+
              </p>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                Courses
              </p>
            </div>

            <div className="hidden sm:block w-px h-8 bg-slate-200" />

            <div>
              <p className="text-xl font-extrabold tracking-tight text-[#111827]">
                800+
              </p>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                Lessons
              </p>
            </div>

            <div className="hidden sm:block w-px h-8 bg-slate-200" />

            <div>
              <p className="text-xl font-extrabold tracking-tight text-[#111827]">
                7 days
              </p>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                Free trial
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}