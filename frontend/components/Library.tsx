'use client';
import courses from '../data/courses.json';

type Props = { role?: string };

export default function Library({ role = 'normal' }: Props) {
  const isWitstart = role === 'witstart';

  // Select only the first 5 flagship courses for the landing preview
  const previewCourses = (isWitstart ? courses.filter((c: any) => c.witstart === true) : courses).slice(0, 5);

  return (
    <section id="library" className="py-24 px-6 bg-[#111827] text-white relative overflow-hidden">
      {/* Background Glow Accents */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(215,173,53,0.08),transparent_40%),radial-gradient(circle_at_90%_80%,rgba(255,255,255,0.02),transparent_40%)] pointer-events-none" />

      <div className="max-w-[1280px] mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="mb-14 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#D7AD35]/30 bg-[#D7AD35]/10 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D7AD35]" />
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#F2D477]">
              Curriculum Preview
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            {isWitstart ? 'Data Science Track Preview' : `Explore Sample Modules — 85+ Total Courses`}
          </h2>
          <p className="text-slate-400 mt-3 text-sm sm:text-base leading-relaxed">
            A small glimpse into our rigorous engineering and analytics curriculum. Log in or sign up to unlock full interactive access to all tracks, code sandboxes, and live projects.
          </p>
        </div>

        {/* Clean 5-Course Grid (Non-interactive preview) */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {previewCourses.map((c: any, i: number) => (
            <div
              key={c.id || i}
              className="relative rounded-3xl p-7 border border-white/10 bg-[#151D2A]/60 backdrop-blur-xl flex flex-col justify-between cursor-default group hover:border-[#D7AD35]/40 transition-all duration-300"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-extrabold tracking-widest uppercase px-3 py-1 rounded-full bg-[#D7AD35]/15 text-[#F2D477] border border-[#D7AD35]/30">
                    {c.module ? `Module ${c.module}` : c.track}
                  </span>
                  <span className="text-xs font-medium text-slate-400">{c.duration}</span>
                </div>

                <h3 className="text-lg font-extrabold leading-snug text-white">
                  {c.title}
                </h3>

                <p className="text-xs text-slate-300 mt-2.5 leading-relaxed line-clamp-3">
                  {c.desc}
                </p>

                {c.topics && (
                  <ul className="mt-5 space-y-2 text-xs text-slate-400 border-t border-white/10 pt-4">
                    {c.topics.slice(0, 3).map((t: string, idx: number) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D7AD35]" />
                        <span className="truncate">{t}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500">
                    Project Lab
                  </p>
                  <p className="text-xs font-bold text-slate-200 mt-0.5 truncate max-w-[180px]">
                    {c.project || 'Hands-on Exercise'}
                  </p>
                </div>
                {/* Non-clickable badge for landing page */}
                <span className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-white/5 text-slate-400 border border-white/10 flex items-center gap-1.5">
                  🔒 Member Locked
                </span>
              </div>
            </div>
          ))}

          {/* Call to Action Card as the 6th grid item */}
          <div className="rounded-3xl p-7 border-2 border-dashed border-[#D7AD35]/30 bg-[#D7AD35]/[0.02] backdrop-blur-xl flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#D7AD35]/10 border border-[#D7AD35]/30 flex items-center justify-center text-xl mb-4">
              🚀
            </div>
            <h3 className="text-base font-extrabold text-white">Unlock All 85+ Courses</h3>
            <p className="text-xs text-slate-400 mt-1 mb-6 max-w-xs">
              Get full access to every module, code playground, and verified certification path.
            </p>
            <a
              href="#pricing"
              className="text-xs font-extrabold px-6 py-3 rounded-xl bg-gradient-to-r from-[#D7AD35] to-[#F2D477] text-[#111827] shadow-lg shadow-[#D7AD35]/20 hover:scale-105 transition-all"
            >
              Get Full Access →
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}