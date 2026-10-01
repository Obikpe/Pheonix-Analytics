export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import coursesData from '@/data/courses.json';

type Props = {
  params: Promise<{ courseId: string }>;
  searchParams?: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
};

export default async function CourseLessonsPage({
  params,
  searchParams,
}: Props) {
  const { courseId } = await params;

  const resolvedSearchParams = searchParams
    ? await searchParams
    : {};

  // ---------------------------------------------------------
  // Determine which dashboard the learner came from.
  //
  // Expected URLs:
  // /dashboard/course/[courseId]?type=general
  // /dashboard/course/[courseId]?type=witstart
  // /dashboard/course/[courseId]?type=admin
  //
  // If no type is provided, default to the normal/general
  // dashboard.
  // ---------------------------------------------------------

  const typeParam =
    resolvedSearchParams.type ||
    resolvedSearchParams.from ||
    resolvedSearchParams.ref;

  const dashboardType =
    typeof typeParam === 'string'
      ? typeParam.toLowerCase()
      : 'general';

  // Only allow known dashboard types.
  // Anything unknown safely falls back to general.
  const validDashboardTypes = ['general', 'witstart', 'admin'];

  const safeDashboardType = validDashboardTypes.includes(dashboardType)
    ? dashboardType
    : 'general';

  let dashboardHref = '/dashboard/general';

  if (safeDashboardType === 'witstart') {
    dashboardHref = '/dashboard/witstart';
  } else if (safeDashboardType === 'admin') {
    dashboardHref = '/dashboard/admin';
  }

  // ---------------------------------------------------------
  // Find the course
  // ---------------------------------------------------------

  const course = (coursesData as any[]).find(
    (c) => c.id === courseId
  );

  if (!course) {
    return notFound();
  }

  // ---------------------------------------------------------
  // Find the course lesson folder
  // ---------------------------------------------------------

  const base = path.join(
    process.cwd(),
    'data',
    'lessons'
  );

  let targetFolder = '';

  try {
    const allEntries = fs.readdirSync(base, {
      withFileTypes: true,
    });

    const matchedDir = allEntries.find(
      (entry) =>
        entry.isDirectory() &&
        entry.name
          .toLowerCase()
          .startsWith(courseId.toLowerCase())
    );

    if (matchedDir) {
      targetFolder = path.join(
        base,
        matchedDir.name
      );
    }
  } catch (error) {
    targetFolder = '';
  }

  // ---------------------------------------------------------
  // Load lessons
  // ---------------------------------------------------------

  let lessons: any[] = [];

  if (
    targetFolder &&
    fs.existsSync(targetFolder)
  ) {
    const lessonFiles = fs
      .readdirSync(targetFolder)
      .filter((f) => f.endsWith('-lesson.md'))
      .sort();

    lessons = lessonFiles.map((file, idx) => {
      const filePath = path.join(
        targetFolder,
        file
      );

      const raw = fs.readFileSync(
        filePath,
        'utf8'
      );

      const lines = raw
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

      const titleLine =
        lines.find((l) => l.startsWith('#')) ||
        lines[0] ||
        `Lesson ${idx + 1}`;

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

      const wordCount = raw
        .split(/\s+/)
        .filter(Boolean)
        .length;

      const mins = Math.max(
        1,
        Math.ceil(wordCount / 200)
      );

      const matchResult = file.match(/^(\d+)/);

      const numMatch = matchResult
        ? matchResult[1]
        : String(idx + 1).padStart(2, '0');

      const lessonId = `${courseId}_l${numMatch}`;

      return {
        id: lessonId,
        courseId,
        order: parseInt(numMatch, 10),
        title:
          title || `Lesson ${numMatch}`,
        duration: `${mins} min read`,
        wordCount,
      };
    });
  }

  // ---------------------------------------------------------
  // Course totals
  // ---------------------------------------------------------

  const totalWords = lessons.reduce(
    (sum, lesson) =>
      sum + lesson.wordCount,
    0
  );

  const totalMinutes = lessons.reduce(
    (sum, lesson) => {
      const minutes = parseInt(
        lesson.duration,
        10
      );

      return (
        sum +
        (Number.isFinite(minutes)
          ? minutes
          : 0)
      );
    },
    0
  );

  // ---------------------------------------------------------
  // Page
  // ---------------------------------------------------------

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-[#111827] pb-24 selection:bg-[#D7AD35] selection:text-[#111827]">

      {/* Premium Course Hero */}
      <section className="relative overflow-hidden bg-[#111827] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(215,173,53,0.18),transparent_32%),radial-gradient(circle_at_8%_100%,rgba(255,255,255,0.05),transparent_28%)] pointer-events-none" />

        <div className="absolute -right-32 -top-40 h-[480px] w-[480px] rounded-full border border-[#D7AD35]/10" />

        <div className="absolute right-[-80px] top-[-90px] h-[330px] w-[330px] rounded-full border border-[#F2D477]/10" />

        <div className="relative z-10 mx-auto max-w-[1280px] px-5 py-8 sm:px-8 sm:py-12 lg:px-10 lg:py-14">

          <div className="mb-10 flex flex-wrap items-center justify-between gap-4">

            {/* Back to correct dashboard */}
            <Link
              href={dashboardHref}
              className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-xs font-bold text-slate-200 backdrop-blur hover:border-[#D7AD35]/40 hover:bg-white/[0.1] hover:text-white transition"
            >
              <span className="text-[#F2D477] transition-transform group-hover:-translate-x-1">
                ←
              </span>

              Back to Dashboard
            </Link>

            {course.track && (
              <span className="rounded-full border border-[#D7AD35]/25 bg-[#D7AD35]/10 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#F2D477]">
                {course.track}
              </span>
            )}
          </div>

          <div className="grid gap-10 lg:grid-cols-[1fr_320px] lg:items-end">

            <div className="max-w-4xl">

              <div className="mb-4 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#F2D477]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#D7AD35]" />
                Course Curriculum
              </div>

              <h1 className="max-w-4xl text-3xl font-extrabold tracking-[-0.03em] text-white sm:text-5xl lg:text-6xl lg:leading-[1.05]">
                {course.title}
              </h1>

              {course.desc && (
                <p className="mt-6 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                  {course.desc}
                </p>
              )}

              <div className="mt-8 flex flex-wrap gap-2.5">

                <div className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                    Lessons
                  </p>

                  <p className="mt-1 text-sm font-extrabold text-white">
                    {lessons.length}
                  </p>
                </div>

                {course.duration && (
                  <div className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                      Course duration
                    </p>

                    <p className="mt-1 text-sm font-extrabold text-white">
                      {course.duration}
                    </p>
                  </div>
                )}

                {course.level && (
                  <div className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                      Level
                    </p>

                    <p className="mt-1 text-sm font-extrabold text-white">
                      {course.level}
                    </p>
                  </div>
                )}

                <div className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                    Reading
                  </p>

                  <p className="mt-1 text-sm font-extrabold text-white">
                    {totalMinutes} min
                  </p>
                </div>

              </div>
            </div>

            <div className="hidden lg:block">
              <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-md">

                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#F2D477]">
                  Your curriculum
                </p>

                <p className="mt-3 text-3xl font-extrabold text-white">
                  {lessons.length}
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Lessons are generated directly from the course lesson files.
                </p>

                <div className="mt-5 h-px bg-white/10" />

                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    Content volume
                  </span>

                  <span className="font-bold text-slate-200">
                    {totalWords.toLocaleString()} words
                  </span>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Curriculum */}
      <main className="mx-auto max-w-[1120px] px-5 pt-10 sm:px-8 sm:pt-14 lg:px-10">

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#B08A1E]">
              Learning path
            </p>

            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#111827] sm:text-3xl">
              Course lessons
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Work through the curriculum in sequence or jump directly into a lesson.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm">

            <span className="h-2 w-2 rounded-full bg-[#D7AD35]" />

            {lessons.length}{' '}
            {lessons.length === 1
              ? 'lesson'
              : 'lessons'}

          </div>
        </div>

        {lessons.length === 0 ? (

          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
              ○
            </div>

            <h3 className="mt-5 text-lg font-extrabold text-[#111827]">
              No lessons available
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              This course does not currently contain any lesson files. Add lesson content to the course data before publishing it to learners.
            </p>

          </div>

        ) : (

          <div className="relative">

            <div className="absolute left-[23px] top-7 bottom-7 hidden w-px bg-gradient-to-b from-[#D7AD35] via-slate-200 to-slate-200 sm:block" />

            <div className="space-y-4">

              {lessons.map(
                (lesson: any, idx: number) => {

                  const num =
                    lesson.order ||
                    idx + 1;

                  // Preserve the dashboard type when
                  // opening the individual lesson.
                  //
                  // Examples:
                  // ?type=general
                  // ?type=witstart
                  // ?type=admin
                  const lessonHref =
                    `/dashboard/course/${courseId}/${lesson.id}?type=${safeDashboardType}`;

                  return (
                    <Link
                      key={lesson.id}
                      href={lessonHref}
                      className="group relative block"
                    >

                      <article className="relative flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_6px_24px_rgba(15,23,42,0.045)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D7AD35]/60 hover:shadow-[0_16px_38px_rgba(15,23,42,0.09)] sm:min-h-[112px] sm:flex-row sm:items-center sm:p-6">

                        <div className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#D7AD35]/30 bg-[#FFF9E8] text-xs font-extrabold text-[#8B6B12] shadow-sm">
                          {String(num).padStart(
                            2,
                            '0'
                          )}
                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="mb-2 flex flex-wrap items-center gap-2">

                            <span className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#B08A1E]">
                              Lesson{' '}
                              {String(num).padStart(
                                2,
                                '0'
                              )}
                            </span>

                            <span className="h-1 w-1 rounded-full bg-slate-300" />

                            <span className="text-[11px] font-semibold text-slate-400">
                              {lesson.duration}
                            </span>

                            {lesson.wordCount >
                              0 && (
                              <>
                                <span className="h-1 w-1 rounded-full bg-slate-300" />

                                <span className="text-[11px] font-semibold text-slate-400">
                                  {lesson.wordCount.toLocaleString()}{' '}
                                  words
                                </span>
                              </>
                            )}

                          </div>

                          <h3 className="text-base font-extrabold leading-6 text-[#111827] transition-colors group-hover:text-[#A27B10] sm:text-lg">
                            {lesson.title}
                          </h3>

                        </div>

                        <div className="flex shrink-0 items-center justify-between gap-4 border-t border-slate-100 pt-4 sm:border-0 sm:pt-0">

                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                            Open lesson
                          </span>

                          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-lg font-bold text-slate-500 transition-all group-hover:border-[#111827] group-hover:bg-[#111827] group-hover:text-white">
                            →
                          </span>

                        </div>

                      </article>

                    </Link>
                  );
                }
              )}

            </div>
          </div>
        )}
      </main>
    </div>
  );
}