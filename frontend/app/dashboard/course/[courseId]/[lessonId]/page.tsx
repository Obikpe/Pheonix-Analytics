export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

// Initialize Marked with syntax highlighting
const markedInstance = new Marked(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';

      return hljs.highlight(code, {
        language,
      }).value;
    },
  })
);

type Props = {
  params: Promise<{
    courseId: string;
    lessonId: string;
  }>;
  searchParams: Promise<{
    type?: string;
  }>;
};

type DashboardType = 'general' | 'witstart' | 'admin';

function getDashboardType(type?: string): DashboardType {
  if (type === 'witstart') return 'witstart';
  if (type === 'admin') return 'admin';

  return 'general';
}

export default async function LessonPage({
  params,
  searchParams,
}: Props) {
  const { courseId, lessonId } = await params;
  const { type } = await searchParams;

  /*
   * IMPORTANT:
   * Preserve the dashboard the learner originally came from.
   *
   * If the lesson was opened from WitStart:
   * type = "witstart"
   *
   * If it was opened from Admin:
   * type = "admin"
   *
   * Otherwise:
   * type = "general"
   */
  const dashboardType = getDashboardType(type);

  /*
   * Build the query string once and reuse it everywhere.
   *
   * This prevents the dashboard type from being accidentally
   * dropped when navigating between lessons or back to the course.
   */
  const typeQuery = `?type=${dashboardType}`;

  const base = path.join(process.cwd(), 'data', 'lessons');

  let folder = '';

  try {
    const all = fs.readdirSync(base);
    folder = all.find((f) => f.startsWith(courseId)) || '';
  } catch {
    folder = '';
  }

  if (!folder) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-950 text-stone-400">
        <div className="text-center p-8 bg-stone-900 border border-stone-800 rounded-3xl">
          <h2 className="text-xl font-extrabold mb-2 text-white">
            Folder Not Found
          </h2>

          <p className="text-xs text-stone-400">
            Could not find course files for {courseId}
          </p>
        </div>
      </div>
    );
  }

  const num = (
    lessonId.match(/_l(\d+)$/)?.[1] || '01'
  ).padStart(2, '0');

  const file = path.join(
    base,
    folder,
    `${num}-lesson.md`
  );

  if (!fs.existsSync(file)) {
    return notFound();
  }

  const raw = fs.readFileSync(file, 'utf8');

  /*
   * Extract lesson title
   */
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const titleLine =
    lines.find((l) => l.startsWith('#')) ||
    lines[0] ||
    'Lesson';

  let title = titleLine
    .replace(/^#+\s*/, '')
    .trim();

  if (title.includes(' - ')) {
    title = title
      .split(' - ')
      .slice(1)
      .join(' - ')
      .trim();
  }

  /*
   * Remove lesson metadata from the rendered body
   */
  const filteredLines = raw
    .split('\n')
    .filter((l) => {
      const t = l.trim();

      if (t.startsWith('# Lesson')) return false;
      if (t.includes('**Course:**')) return false;
      if (t.includes('Course:') && t.includes('ID:')) return false;
      if (t.startsWith('**ID:**')) return false;
      if (t.startsWith('ID:')) return false;

      return true;
    });

  const body = filteredLines.join('\n').trim();

  /*
   * Reading statistics
   */
  const wordCount = body
    .split(/\s+/)
    .filter(Boolean)
    .length;

  const readingSpeedWPM = 200;

  const mins = Math.max(
    1,
    Math.ceil(wordCount / readingSpeedWPM)
  );

  /*
   * Get all lesson files for sidebar navigation
   */
  const lessonFolder = path.join(base, folder);

  const allFiles = fs
    .readdirSync(lessonFolder)
    .filter((f) => f.endsWith('-lesson.md'))
    .sort();

  const lessonsList = allFiles.map((f, idx) => {
    const filePath = path.join(
      lessonFolder,
      f
    );

    const content = fs.readFileSync(
      filePath,
      'utf8'
    );

    const lLines = content
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const lTitleLine =
      lLines.find((l) => l.startsWith('#')) ||
      lLines[0] ||
      `Lesson ${idx + 1}`;

    let lTitle = lTitleLine
      .replace(/^#+\s*/, '')
      .trim();

    if (lTitle.includes(' - ')) {
      lTitle = lTitle
        .split(' - ')
        .slice(1)
        .join(' - ')
        .trim();
    }

    const mMatch = f.match(/^(\d+)/);

    const mNum = mMatch
      ? mMatch[1]
      : String(idx + 1).padStart(2, '0');

    return {
      id: `${courseId}_l${mNum}`,
      num: mNum,
      title: lTitle || `Lesson ${mNum}`,
      isActive: mNum === num,
    };
  });

  /*
   * Previous / next lesson
   */
  const idx = allFiles.findIndex(
    (f) => f.startsWith(`${num}-`)
  );

  const prevNum =
    idx > 0
      ? allFiles[idx - 1]
          .match(/^(\d+)/)?.[1]
          ?.padStart(2, '0') || null
      : null;

  const nextNum =
    idx >= 0 && idx < allFiles.length - 1
      ? allFiles[idx + 1]
          .match(/^(\d+)/)?.[1]
          ?.padStart(2, '0') || null
      : null;

  /*
   * Split SVG blocks from markdown so they can be
   * rendered directly.
   */
  const svgRegex = /(<svg[\s\S]*?<\/svg>)/gi;

  const parts = body.split(svgRegex);

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-slate-900 flex flex-col selection:bg-[#d7ad35] selection:text-white">

      {/* =========================================================
          TOP NAVBAR
      ========================================================= */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-30 px-6 py-4 flex items-center justify-between gap-4 shadow-md">

        <div className="flex items-center gap-3">

          {/* =====================================================
              BACK TO COURSE

              IMPORTANT:
              Preserve ?type=witstart / general / admin
          ===================================================== */}
          <Link
            href={`/dashboard/course/${courseId}${typeQuery}`}
            className="group flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#b58b1f] transition bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 shadow-sm"
          >
            <span>←</span>
            Curriculum
          </Link>

          <span className="text-xs text-slate-400 hidden sm:inline">
            /
          </span>

          <span className="text-xs font-extrabold text-slate-900 truncate max-w-xs sm:max-w-md">
            {title}
          </span>

        </div>

        <div className="flex items-center gap-3">

          <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#8a6810] bg-[#f7edc9] px-3 py-1.5 rounded-full border border-[#ead79b]">
            Lesson {num} of {allFiles.length}
          </span>

        </div>

      </header>


      {/* =========================================================
          MAIN WORKSPACE
      ========================================================= */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 items-start">

        {/* =======================================================
            LEFT SIDEBAR
        ======================================================= */}
        <aside className="hidden lg:block lg:col-span-3 sticky top-[73px] h-[calc(100vh-73px)] overflow-y-auto border-r border-slate-200 bg-white p-6 space-y-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-stone-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#d7ad35]/100">

          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-4 px-2">
            Course Modules
          </p>

          <nav className="space-y-1.5">

            {lessonsList.map((l) => (
              <Link
                key={l.id}
                href={`/dashboard/course/${courseId}/${l.id}${typeQuery}`}
                className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition flex items-center gap-3 block ${
                  l.isActive
                    ? 'bg-gradient-to-r from-[#c89d2c] to-[#e1bf55] text-slate-950 shadow-lg shadow-[#c89d2c]/25'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >

                <span
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-extrabold shrink-0 ${
                    l.isActive
                      ? 'bg-white/30 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {l.num}
                </span>

                <span className="truncate">
                  {l.title}
                </span>

              </Link>
            ))}

          </nav>

        </aside>


        {/* =======================================================
            CENTER READING CANVAS
        ======================================================= */}
        <main className="col-span-1 lg:col-span-9 p-5 sm:p-8 lg:p-12 xl:p-14 max-w-6xl mx-auto w-full">

          <div className="bg-white border border-slate-200 rounded-[2rem] p-8 sm:p-14 shadow-[0_24px_70px_rgba(15,23,42,0.08)] relative overflow-hidden">

            {/* Subtle Glow Accent */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#d7ad35]/10 rounded-full blur-3xl pointer-events-none" />


            {/* ===================================================
                LESSON TITLE
            =================================================== */}
            <div className="mb-10 pb-8 border-b border-slate-200 relative z-10">

              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#b58b1f] mb-3">

                <span>
                  Interactive Lesson
                </span>

                <span>
                  •
                </span>

                <span>
                  {mins} Minute Read
                </span>

                <span>
                  •
                </span>

                <span>
                  {wordCount} words
                </span>

              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight">
                {title}
              </h1>

            </div>


            {/* ===================================================
                MARKDOWN BODY
            =================================================== */}
            <div className="prose prose-invert max-w-none leading-relaxed space-y-6 text-slate-600 text-base sm:text-lg relative z-10 [&>h2]:text-slate-950 [&>h2]:font-extrabold [&>h2]:text-2xl [&>h2]:mt-10 [&>h2]:mb-4 [&>h3]:text-stone-100 [&>h3]:font-bold [&>h3]:text-xl [&>h3]:mt-8 [&>h3]:mb-3 [&>p]:leading-relaxed [&>ul]:space-y-2 [&>ol]:space-y-2 [&>strong]:text-[#9a7515] [&>a]:text-[#a77d12] [&>a]:underline">

              {parts.map((part, i) => {

                const trimmed = part.trim();

                if (
                  trimmed
                    .toLowerCase()
                    .startsWith('<svg')
                ) {
                  return (
                    <div
                      key={i}
                      className="my-8 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-6 flex justify-center shadow-inner"
                      dangerouslySetInnerHTML={{
                        __html: trimmed,
                      }}
                    />
                  );
                }

                const htmlContent =
                  markedInstance.parse(part) as string;

                return (
                  <div
                    key={i}
                    dangerouslySetInnerHTML={{
                      __html: htmlContent,
                    }}
                  />
                );
              })}

            </div>


            {/* ===================================================
                BOTTOM LESSON NAVIGATION
            =================================================== */}
            <div className="mt-16 pt-8 border-t border-stone-800 grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">

              {/* PREVIOUS LESSON */}
              {prevNum ? (
                <Link
                  href={`/dashboard/course/${courseId}/${courseId}_l${prevNum}${typeQuery}`}
                  className="px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition flex items-center gap-3 cursor-pointer w-full justify-start"
                >

                  <span className="text-base text-[#b58b1f]">
                    ←
                  </span>

                  <div className="truncate">

                    <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-normal">
                      Previous
                    </span>

                    <span className="truncate">
                      Previous Lesson
                    </span>

                  </div>

                </Link>
              ) : (
                <div />
              )}


              {/* NEXT LESSON */}
              {nextNum ? (
                <Link
                  href={`/dashboard/course/${courseId}/${courseId}_l${nextNum}${typeQuery}`}
                  className="px-6 py-4 rounded-2xl bg-gradient-to-r from-[#c89d2c] to-[#e1bf55] text-slate-950 text-xs font-bold hover:brightness-110 shadow-lg shadow-[#c89d2c]/20 transition flex items-center justify-between gap-3 cursor-pointer w-full sm:col-start-2"
                >

                  <div className="truncate text-left">

                    <span className="block text-[10px] text-[#fff3c4] uppercase tracking-widest font-semibold">
                      Next Up
                    </span>

                    <span className="truncate">
                      Next Lesson
                    </span>

                  </div>

                  <span className="text-base">
                    →
                  </span>

                </Link>
              ) : (

                /*
                 * IMPORTANT:
                 * Even "Complete Course" preserves the dashboard type.
                 */
                <Link
                  href={`/dashboard/course/${courseId}${typeQuery}`}
                  className="px-6 py-4 rounded-2xl bg-emerald-600 text-white text-xs font-black hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-3 cursor-pointer w-full sm:col-start-2"
                >
                  Complete Course 🎉
                </Link>

              )}

            </div>

          </div>

        </main>

      </div>

    </div>
  );
}