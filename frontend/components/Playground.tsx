'use client';
import { useState } from 'react';

export default function Playground() {
  const [code, setCode] = useState(`name = "Ade"
age = input("Enter age: ")

print(f"{name} is {age} years old — welcome to Phoenix Analytics!")`);
  const [stdin, setStdin] = useState('25');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const runCode = async () => {
    setLoading(true);
    setOutput('Executing code in sandbox environment...');
    try {
      const res = await fetch('http://localhost:8000/api/grading/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: 'python', code, stdin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Execution failed');
      setOutput(data.output || 'Process completed with no output.');
    } catch (e: any) {
      setOutput(`[Error]: Backend offline or execution error.\nEnsure your local grading service is running at http://localhost:8000\nDetails: ${e.message}`);
    }
    setLoading(false);
  };

  return (
    <section id="playground" className="py-24 px-6 bg-[#111827] text-white relative overflow-hidden">
      {/* Background Glow Accents */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(215,173,53,0.06),transparent_60%)] pointer-events-none" />

      <div className="max-w-[1280px] mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="mb-12 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#D7AD35]/30 bg-[#D7AD35]/10 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D7AD35]" />
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#F2D477]">
                Interactive Playground
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Code & Test Live
            </h2>
            <p className="text-slate-400 mt-2 max-w-2xl text-sm leading-relaxed">
              Experiment with Python code instantly. Fully supports interactive <code className="text-[#F2D477] font-mono">input()</code> streams and automated sandbox testing.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-lg shadow-emerald-500/5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Python 3.11 Ready
            </span>
          </div>
        </div>

        {/* IDE Layout Container */}
        <div className="grid lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left Editor Console (7 Cols) */}
          <div className="lg:col-span-7 rounded-3xl border border-white/10 bg-[#151D2A]/60 p-5 sm:p-7 flex flex-col shadow-2xl backdrop-blur-xl">
            {/* Editor Header Bar */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-xs font-mono tracking-wider text-[#F2D477] bg-[#D7AD35]/10 px-3 py-1 rounded-lg border border-[#D7AD35]/30">
                  main.py
                </span>
              </div>

              <button
                onClick={runCode}
                disabled={loading}
                className="group relative overflow-hidden bg-gradient-to-r from-[#D7AD35] to-[#F2D477] text-[#111827] px-5 py-2.5 rounded-xl font-extrabold text-xs shadow-lg shadow-[#D7AD35]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                <span className="relative z-10 flex items-center gap-1.5">
                  {loading ? (
                    <>
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-[#111827]/30 border-t-[#111827] animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>▶ Run Script</>
                  )}
                </span>
              </button>
            </div>

            {/* Code Textarea */}
            <div className="relative flex-1 min-h-[220px]">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-full bg-[#0B0F17] text-slate-200 text-sm leading-6 font-mono p-4 rounded-2xl border border-white/10 outline-none resize-none focus:border-[#D7AD35] focus:ring-2 focus:ring-[#D7AD35]/20 transition"
                spellCheck={false}
              />
            </div>

            {/* Program Input Drawer */}
            <div className="mt-5 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-[#F2D477]">
                  Standard Input (stdin)
                </label>
                <span className="text-[10px] text-slate-500">Passed to input() calls</span>
              </div>
              <input
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                placeholder="Enter input values..."
                className="w-full bg-[#0B0F17] border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-200 font-mono outline-none focus:border-[#D7AD35] transition"
              />
            </div>
          </div>

          {/* Right Output Console (5 Cols) */}
          <div className="lg:col-span-5 rounded-3xl border border-white/10 bg-[#151D2A]/60 p-5 sm:p-7 flex flex-col shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#F2D477]">
                Execution Terminal Output
              </span>
              <span className="text-[10px] font-mono text-slate-500">stdout / stderr</span>
            </div>

            <div className="relative flex-1 bg-[#0B0F17] rounded-2xl border border-white/10 p-4 font-mono text-xs text-slate-200 overflow-auto min-h-[280px]">
              {output ? (
                <pre className="whitespace-pre-wrap leading-relaxed">{output}</pre>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 p-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#D7AD35]/10 border border-[#D7AD35]/30 flex items-center justify-center text-lg mb-3 text-[#F2D477]">
                    ⚡
                  </div>
                  <p className="text-xs font-bold text-slate-300">Ready for execution</p>
                  <p className="text-[11px] text-slate-500 mt-1">Click "Run Script" to test your code logic live against the backend grading API.</p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
              <span>Status: <strong className="text-emerald-400">Connected</strong></span>
              <span>Python Sandbox v3.11</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}