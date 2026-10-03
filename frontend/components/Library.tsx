// Library.tsx

'use client';

import { useMemo, useState } from 'react';

import courses from '../data/courses.json';

import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Filter,
  Lock,
  Sparkles,
} from 'lucide-react';

type Props = {
  role?: string;
};

type CourseRecord = {
  id?: string;
  module?: number | string;
  track?: string;
  duration?: string;
  title?: string;
  desc?: string;
  topics?: string[];
  project?: string;
  witstart?: boolean;
};

export default function Library({ role = 'normal' }: Props) {
  /*
   * IMPORTANT:
   *
   * The landing-page library must show the complete Learnora ME
   * catalogue regardless of whether the currently detected role
   * is "normal" or "witstart".
   *
   * WitStart-specific course filtering belongs inside the
   * WitStart dashboard, not this public library.
   */

  void role;

  const allCourses = courses as CourseRecord[];

  const [activeTrack, setActiveTrack] = useState('All Courses');

  /*
   * Build the filter list dynamically from courses.json.
   *
   * This means if you later add:
   *
   * - Cybersecurity
   * - Cloud Computing
   * - UI/UX Design
   * - Digital Marketing
   * - Product Management
   *
   * to courses.json, they automatically appear here.
   */
  const tracks = useMemo(() => {
    const uniqueTracks = Array.from(
      new Set(
        allCourses
          .map((course) => course.track?.trim())
          .filter((track): track is string => Boolean(track))
      )
    );

    return uniqueTracks.sort((a, b) =>
      a.localeCompare(b, undefined, {
        sensitivity: 'base',
      })
    );
  }, [allCourses]);

  /*
   * Number of courses in each track.
   */
  const trackCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    allCourses.forEach((course) => {
      const track = course.track?.trim();

      if (!track) return;

      counts[track] = (counts[track] || 0) + 1;
    });

    return counts;
  }, [allCourses]);

  /*
   * Actually filter the catalogue.
   */
  const filteredCourses = useMemo(() => {
    if (activeTrack === 'All Courses') {
      return allCourses;
    }

    return allCourses.filter(
      (course) =>
        course.track?.trim() === activeTrack
    );
  }, [activeTrack, allCourses]);

  /*
   * Landing page intentionally shows a manageable preview
   * rather than rendering the entire catalogue.
   *
   * When a specific track is selected, show up to 6 courses
   * from that track.
   *
   * When "All Courses" is selected, show the first 5 courses
   * plus the Explore card.
   */
  const previewCourses = useMemo(() => {
    return filteredCourses.slice(
      0,
      activeTrack === 'All Courses' ? 5 : 6
    );
  }, [filteredCourses, activeTrack]);

  const totalCourses = allCourses.length;

  const activeTrackCount =
    activeTrack === 'All Courses'
      ? totalCourses
      : trackCounts[activeTrack] || 0;

  return (
    <section
      id="library"
      className="relative overflow-hidden bg-[#f7f8fa] px-6 py-24 text-[#172033] sm:px-8 lg:px-12"
    >
      {/* Background decoration */}
      <div className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-[#d7ad35]/10 blur-3xl" />

      <div className="pointer-events-none absolute -right-40 bottom-0 h-[28rem] w-[28rem] rounded-full bg-[#e8edf5] blur-3xl" />

      <div className="relative z-10 mx-auto max-w-[1280px]">

        {/* ===================================================== */}
        {/* HEADER                                                 */}
        {/* ===================================================== */}

        <div className="mb-12 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">

          <div className="max-w-2xl">

            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d7ad35]/30 bg-white px-3.5 py-2 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-[#b78d16]" />

              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#8a6810]">
                Explore Learnora ME
              </span>
            </div>

            <h2 className="font-serif text-4xl font-bold leading-[1.08] tracking-[-0.035em] text-[#172033] sm:text-5xl">
              Learn something{' '}
              <span className="text-[#b78d16]">
                worth knowing.
              </span>
            </h2>

            <p className="mt-5 max-w-xl text-[15px] leading-7 text-[#667085] sm:text-base">
              Explore practical courses across technology,
              data, business and more. Build real skills,
              complete projects, and move confidently from
              learning to doing.
            </p>

          </div>

          {/* Catalogue summary */}

          <div className="flex shrink-0 items-center gap-5 rounded-2xl border border-[#e2e6ec] bg-white px-5 py-4 shadow-sm">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#172033] text-white">
              <BookOpen className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm font-bold text-[#172033]">
                {totalCourses}+ courses available
              </p>

              <p className="mt-0.5 text-xs text-[#7b8494]">
                Across {tracks.length} learning tracks
              </p>
            </div>

          </div>

        </div>

        {/* ===================================================== */}
        {/* TRACK FILTER                                          */}
        {/* ===================================================== */}

        <div className="mb-10">

          <div className="mb-4 flex items-center gap-2">
            <Filter className="h-4 w-4 text-[#8a6810]" />

            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#667085]">
              Browse by track
            </p>
          </div>

          {/* 
            Mobile:
            Horizontal scrolling remains available, but the scrollbar
            is completely hidden.

            Desktop:
            Buttons wrap onto multiple lines so the section feels like
            a proper course marketplace filter rather than a scrolling
            strip.
          */}
          <div
            className="
              flex gap-2 overflow-x-auto pb-1
              [scrollbar-width:none]
              [&::-webkit-scrollbar]:hidden
              lg:flex-wrap
              lg:overflow-visible
              lg:pb-0
            "
          >

            {/* ALL COURSES */}

            <button
              type="button"
              onClick={() => setActiveTrack('All Courses')}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-bold transition-all ${
                activeTrack === 'All Courses'
                  ? 'border-[#172033] bg-[#172033] text-white shadow-sm'
                  : 'border-[#dfe3e9] bg-white text-[#667085] hover:border-[#b8bec8] hover:text-[#172033]'
              }`}
            >
              <span>All Courses</span>

              <span
                className={`rounded-full px-2 py-0.5 text-[9px] ${
                  activeTrack === 'All Courses'
                    ? 'bg-white/15 text-white'
                    : 'bg-[#f1f3f5] text-[#7b8494]'
                }`}
              >
                {totalCourses}
              </span>
            </button>

            {/* DYNAMIC TRACKS */}

            {tracks.map((track) => {
              const isActive = activeTrack === track;

              return (
                <button
                  key={track}
                  type="button"
                  onClick={() => setActiveTrack(track)}
                  className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-bold transition-all ${
                    isActive
                      ? 'border-[#172033] bg-[#172033] text-white shadow-sm'
                      : 'border-[#dfe3e9] bg-white text-[#667085] hover:border-[#b8bec8] hover:text-[#172033]'
                  }`}
                >
                  <span>{track}</span>

                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] ${
                      isActive
                        ? 'bg-white/15 text-white'
                        : 'bg-[#f1f3f5] text-[#7b8494]'
                    }`}
                  >
                    {trackCounts[track]}
                  </span>
                </button>
              );
            })}
          </div>

        </div>
        {/* ===================================================== */}
        {/* ACTIVE FILTER SUMMARY                                 */}
        {/* ===================================================== */}

        <div className="mb-6 flex items-center justify-between gap-4">

          <div>
            <p className="text-sm font-bold text-[#172033]">
              {activeTrack}
            </p>

            <p className="mt-1 text-xs text-[#7b8494]">
              Showing {activeTrackCount}{' '}
              {activeTrackCount === 1
                ? 'course'
                : 'courses'}{' '}
              in this catalogue
            </p>
          </div>

          {activeTrack !== 'All Courses' && (
            <button
              type="button"
              onClick={() => setActiveTrack('All Courses')}
              className="text-xs font-extrabold text-[#8a6810] transition hover:text-[#5f490c]"
            >
              View all courses
            </button>
          )}

        </div>

        {/* ===================================================== */}
        {/* COURSE GRID                                           */}
        {/* ===================================================== */}

        {previewCourses.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

            {previewCourses.map((course, index) => (

              <article
                key={course.id || index}
                className="group flex min-h-[410px] flex-col overflow-hidden rounded-2xl border border-[#e1e5eb] bg-white shadow-[0_8px_30px_rgba(23,32,51,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-[#d2b45b] hover:shadow-[0_18px_45px_rgba(23,32,51,0.10)]"
              >

                {/* Course visual */}

                <div className="relative h-40 overflow-hidden bg-[#172033]">

                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(215,173,53,0.35),transparent_38%),radial-gradient(circle_at_85%_85%,rgba(255,255,255,0.08),transparent_35%)]" />

                  <div className="absolute right-6 top-6 h-24 w-24 rotate-6 rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-sm" />

                  <div className="absolute right-12 top-10 h-24 w-24 -rotate-6 rounded-2xl border border-[#d7ad35]/30 bg-[#d7ad35]/10" />

                  {/* Track */}

                  <div className="absolute bottom-5 left-5">
                    <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.16em] text-white backdrop-blur-md">
                      {course.track || 'Course'}
                    </span>
                  </div>

                  <div className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white backdrop-blur-md">
                    <BookOpen className="h-4 w-4" />
                  </div>

                </div>

                {/* Course content */}

                <div className="flex flex-1 flex-col p-6">

                  <div className="mb-3 flex flex-wrap items-center gap-4 text-[11px] font-medium text-[#7b8494]">

                    {course.duration && (
                      <span className="flex items-center gap-1.5">
                        <Clock3 className="h-3.5 w-3.5" />
                        {course.duration}
                      </span>
                    )}

                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#b78d16]" />
                      Practical
                    </span>

                  </div>

                  <h3 className="text-[17px] font-extrabold leading-6 text-[#172033] transition-colors group-hover:text-[#8a6810]">
                    {course.title || 'Untitled Course'}
                  </h3>

                  <p className="mt-2.5 line-clamp-3 text-[13px] leading-6 text-[#667085]">
                    {course.desc ||
                      'Build practical knowledge through structured lessons and hands-on learning.'}
                  </p>

                  {/* Topics */}

                  {course.topics &&
                    course.topics.length > 0 && (
                      <div className="mt-5 flex flex-wrap gap-1.5">

                        {course.topics
                          .slice(0, 3)
                          .map((topic, topicIndex) => (
                            <span
                              key={topicIndex}
                              className="rounded-md bg-[#f4f5f7] px-2.5 py-1.5 text-[10px] font-semibold text-[#667085]"
                            >
                              {topic}
                            </span>
                          ))}

                      </div>
                    )}

                  {/* Bottom information */}

                  <div className="mt-auto border-t border-[#edf0f3] pt-5">

                    <div className="flex items-end justify-between gap-4">

                      <div className="min-w-0">

                        <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-[#98a1b2]">
                          Project Lab
                        </p>

                        <p className="mt-1 truncate text-xs font-bold text-[#344054]">
                          {course.project ||
                            'Hands-on Exercise'}
                        </p>

                      </div>

                      <span className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-[#f8f9fa] px-2.5 py-1.5 text-[10px] font-bold text-[#7b8494]">
                        <Lock className="h-3 w-3" />
                        Preview
                      </span>

                    </div>

                  </div>

                </div>

              </article>

            ))}

            {/* ================================================= */}
            {/* EXPLORE ALL CARD                                  */}
            {/* ================================================= */}

            <div className="relative flex min-h-[410px] flex-col justify-between overflow-hidden rounded-2xl bg-[#172033] p-7 text-white shadow-[0_15px_45px_rgba(23,32,51,0.15)]">

              <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#d7ad35]/20 blur-3xl" />

              <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-white/5 blur-3xl" />

              <div className="relative z-10">

                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d7ad35] text-[#172033]">
                  <Sparkles className="h-5 w-5" />
                </div>

                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#d7ad35]">
                  {activeTrack === 'All Courses'
                    ? 'Your learning journey'
                    : activeTrack}
                </p>

                <h3 className="mt-3 font-serif text-3xl font-bold leading-tight">
                  {activeTrack === 'All Courses'
                    ? 'There is more to explore.'
                    : `Explore ${activeTrack}.`}
                </h3>

                <p className="mt-4 max-w-xs text-sm leading-6 text-white/65">
                  {activeTrack === 'All Courses'
                    ? 'Discover the complete Learnora ME catalogue with courses, projects, practice environments and structured learning paths.'
                    : `Explore all ${activeTrack} courses and continue building practical skills through structured learning.`}
                </p>

              </div>

              <div className="relative z-10">

                <div className="mb-5 grid grid-cols-3 gap-2">

                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-lg font-extrabold">
                      {activeTrackCount}
                    </p>

                    <p className="mt-1 text-[9px] uppercase tracking-wider text-white/45">
                      Courses
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-lg font-extrabold">
                      {tracks.length}
                    </p>

                    <p className="mt-1 text-[9px] uppercase tracking-wider text-white/45">
                      Tracks
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-lg font-extrabold">
                      7
                    </p>

                    <p className="mt-1 text-[9px] uppercase tracking-wider text-white/45">
                      Free Days
                    </p>
                  </div>

                </div>

                <a
                  href="#pricing"
                  className="group/cta flex w-full items-center justify-between rounded-xl bg-[#d7ad35] px-5 py-3.5 text-sm font-extrabold text-[#172033] transition hover:bg-[#e4c45d]"
                >
                  <span>
                    Explore the full library
                  </span>

                  <ArrowRight className="h-4 w-4 transition-transform group-hover/cta:translate-x-1" />
                </a>

              </div>

            </div>

          </div>
        ) : (

          /* =================================================== */
          /* NO RESULTS                                          */
          /* =================================================== */

          <div className="rounded-2xl border border-[#e1e5eb] bg-white px-6 py-20 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f3f4f6] text-[#7b8494]">
              <BookOpen className="h-6 w-6" />
            </div>

            <h3 className="mt-5 text-lg font-extrabold text-[#172033]">
              No courses found
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#7b8494]">
              There are currently no courses assigned to this
              learning track.
            </p>

            <button
              type="button"
              onClick={() =>
                setActiveTrack('All Courses')
              }
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#172033] px-5 py-3 text-xs font-extrabold text-white transition hover:bg-[#25304a]"
            >
              View all courses
              <ArrowRight className="h-3.5 w-3.5" />
            </button>

          </div>
        )}

        {/* ===================================================== */}
        {/* BOTTOM NOTE                                           */}
        {/* ===================================================== */}

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-[#e1e5eb] pt-7 text-center sm:flex-row sm:text-left">

          <p className="text-xs leading-5 text-[#7b8494]">
            Showing a preview of the Learnora ME catalogue.
            Full lessons, projects and practice environments
            are available to members.
          </p>

          <a
            href="#pricing"
            className="inline-flex shrink-0 items-center gap-2 text-xs font-extrabold text-[#8a6810] transition hover:text-[#5f490c]"
          >
            Start your 7-day trial
            <ArrowRight className="h-3.5 w-3.5" />
          </a>

        </div>

      </div>
    </section>
  );
}