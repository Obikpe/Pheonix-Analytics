'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  Code2,
  Copy,
  Play,
  RotateCcw,
  Terminal,
  Zap,
} from 'lucide-react';

export default function Playground() {
  const [code, setCode] = useState(`name = "Ade"
age = input("Enter age: ")

print(f"{name} is {age} years old — welcome to Learnora ME!")`);

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
        body: JSON.stringify({
          language: 'python',
          code,
          stdin,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Execution failed');
      }

      setOutput(data.output || 'Process completed with no output.');
    } catch (e: any) {
      setOutput(
        `[Error]: Backend offline or execution error.\n\nEnsure your local grading service is running at http://localhost:8000\n\nDetails: ${e.message}`
      );
    }

    setLoading(false);
  };

  const resetCode = () => {
    setCode(`name = "Ade"
age = input("Enter age: ")

print(f"{name} is {age} years old — welcome to Learnora ME!")`);
    setStdin('25');
    setOutput('');
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Clipboard access may be unavailable in some browsers.
    }
  };

  return (
    <section
      id="playground"
      className="relative overflow-hidden bg-[#172033] px-6 py-24 text-white sm:px-8 lg:px-12"
    >
      {/* Background decoration */}
      <div className="pointer-events-none absolute -left-48 top-20 h-[32rem] w-[32rem] rounded-full bg-[#d7ad35]/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-48 bottom-0 h-[32rem] w-[32rem] rounded-full bg-white/[0.04] blur-3xl" />

      <div className="relative z-10 mx-auto max-w-[1280px]">

        {/* Section heading */}
        <div className="mb-12 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-2">
              <Code2 className="h-3.5 w-3.5 text-[#d7ad35]" />
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#e4c45d]">
                Learn by doing
              </span>
            </div>

            <h2 className="font-serif text-4xl font-bold leading-[1.08] tracking-[-0.035em] text-white sm:text-5xl">
              Write code.
              <br />
              <span className="text-[#d7ad35]">See what happens.</span>
            </h2>

            <p className="mt-5 max-w-xl text-[15px] leading-7 text-white/60 sm:text-base">
              Practice what you learn directly inside Learnora ME. Write
              Python, provide input, run your code and see the result without
              leaving the learning environment.
            </p>
          </div>

          {/* Environment status */}
          <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/10">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>

            <div>
              <p className="text-xs font-bold text-white">
                Python environment
              </p>
              <p className="mt-0.5 text-[10px] text-emerald-400">
                Ready to run
              </p>
            </div>
          </div>
        </div>

        {/* Playground shell */}
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#101722] shadow-[0_30px_90px_rgba(0,0,0,0.28)]">

          {/* Top application bar */}
          <div className="flex flex-col gap-4 border-b border-white/10 bg-[#141c29] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-4">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ef6461]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#e8b949]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#52b788]" />
              </div>

              <div className="flex items-center gap-2 border-l border-white/10 pl-4">
                <Code2 className="h-4 w-4 text-[#d7ad35]" />
                <span className="font-mono text-xs font-bold text-white">
                  main.py
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyCode}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-[11px] font-bold text-white/60 transition hover:bg-white/[0.05] hover:text-white"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy
              </button>

              <button
                type="button"
                onClick={resetCode}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-[11px] font-bold text-white/60 transition hover:bg-white/[0.05] hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>

              <button
                type="button"
                onClick={runCode}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-[#d7ad35] px-4 py-2 text-[11px] font-extrabold text-[#172033] transition hover:bg-[#e4c45d] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                {loading ? 'Running...' : 'Run code'}
              </button>
            </div>
          </div>

          {/* Editor / output */}
          <div className="grid lg:grid-cols-2">

            {/* Code editor */}
            <div className="border-b border-white/10 lg:border-b-0 lg:border-r">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#d7ad35]" />
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/45">
                    Code editor
                  </span>
                </div>

                <span className="font-mono text-[10px] text-white/30">
                  Python 3.11
                </span>
              </div>

              <div className="p-4 sm:p-5">
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1018]">
                  <div className="flex min-h-[300px]">
                    {/* Line numbers */}
                    <div className="select-none border-r border-white/[0.06] bg-white/[0.015] px-3 py-4 text-right font-mono text-[12px] leading-6 text-white/20">
                      {code.split('\n').map((_, index) => (
                        <div key={index}>{index + 1}</div>
                      ))}
                    </div>

                    <textarea
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      spellCheck={false}
                      className="min-h-[300px] w-full resize-none bg-transparent p-4 font-mono text-[13px] leading-6 text-[#e7ebf2] outline-none placeholder:text-white/20"
                      aria-label="Python code editor"
                    />
                  </div>
                </div>

                {/* stdin */}
                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/45">
                      Program input
                    </label>

                    <span className="text-[10px] text-white/25">
                      stdin
                    </span>
                  </div>

                  <div className="flex items-center overflow-hidden rounded-xl border border-white/10 bg-[#0b1018] focus-within:border-[#d7ad35]/60">
                    <span className="px-3 font-mono text-xs text-[#d7ad35]">
                      &gt;
                    </span>

                    <input
                      value={stdin}
                      onChange={(e) => setStdin(e.target.value)}
                      placeholder="Enter values for input()..."
                      className="w-full bg-transparent px-2 py-3 font-mono text-xs text-white outline-none placeholder:text-white/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Output */}
            <div>
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
                <div className="flex items-center gap-2">
                  <Terminal className="h-3.5 w-3.5 text-[#d7ad35]" />
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/45">
                    Output
                  </span>
                </div>

                <span className="font-mono text-[10px] text-white/30">
                  stdout / stderr
                </span>
              </div>

              <div className="p-4 sm:p-5">
                <div className="min-h-[300px] overflow-auto rounded-2xl border border-white/10 bg-[#0b1018] p-5 font-mono text-xs">
                  {output ? (
                    <pre className="whitespace-pre-wrap leading-6 text-[#dce2eb]">
                      {output}
                    </pre>
                  ) : (
                    <div className="flex min-h-[260px] flex-col items-center justify-center px-6 text-center">
                      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d7ad35]/20 bg-[#d7ad35]/10">
                        <Terminal className="h-5 w-5 text-[#d7ad35]" />
                      </div>

                      <p className="text-sm font-bold text-white">
                        Your output will appear here
                      </p>

                      <p className="mt-2 max-w-xs text-[11px] leading-5 text-white/35">
                        Write some Python and press{' '}
                        <span className="text-white/60">Run code</span> to
                        execute it in the sandbox.
                      </p>
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className="mt-4 flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[10px] font-semibold text-white/45">
                      Sandbox available
                    </span>
                  </div>

                  <span className="text-[10px] text-white/25">
                    Python 3.11
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Learning tip footer */}
          <div className="border-t border-white/10 bg-[#141c29] px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#d7ad35]/10">
                  <Zap className="h-3.5 w-3.5 text-[#d7ad35]" />
                </div>

                <div>
                  <p className="text-[11px] font-bold text-white">
                    Practice as you learn
                  </p>
                  <p className="mt-0.5 text-[10px] text-white/35">
                    Experiment with the code from your lessons before moving
                    on to the next concept.
                  </p>
                </div>
              </div>

              <a
                href="#library"
                className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-extrabold text-[#d7ad35] transition hover:text-[#e4c45d]"
              >
                Explore courses
                <ChevronRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Feature points */}
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            {
              title: 'Real code execution',
              text: 'Run Python against the learning sandbox.',
            },
            {
              title: 'Interactive input',
              text: 'Test programs that use input() and stdin.',
            },
            {
              title: 'Learn by experimenting',
              text: 'Change the code and immediately see what happens.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"
            >
              <p className="text-xs font-bold text-white">{item.title}</p>
              <p className="mt-1.5 text-[11px] leading-5 text-white/35">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}