'use client';
export const dynamic = 'force-dynamic';
import { Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import courses from '@/data/courses.json';
import myLogo from '@/public/logo.png';

interface CourseRecord {
  id: string;
  title: string;
  desc: string;
  level: string;
  duration: string;
  type: string;
  project: string;
  track: string;
  color: string;
  lesson_count: number;
  total_minutes: number;
  module?: number;
}

function TrackOverviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // 1. Grab the active track name from the URL string
  const trackName = searchParams.get('track') || '';

  // 2. Filter and sort courses matching this track into ordered modules
  const trackCourses = useMemo(() => {
    const list = (courses as CourseRecord[]).filter(
      (c) => c.track.toLowerCase() === trackName.toLowerCase()
    );
    
    // Sort chronologically by module number if present, otherwise fallback to ID
    return list.sort((a, b) => (a.module || 0) - (b.module || 0));
  }, [trackName]);

  // Calculate high-level track statistics dynamically
  const stats = useMemo(() => {
    const totalCourses = trackCourses.length;
    const totalLessons = trackCourses.reduce((acc, c) => acc + (c.lesson_count || 0), 0);
    const totalMin = trackCourses.reduce((acc, c) => acc + (c.total_minutes || 0), 0);
    const totalHours = (totalMin / 60).toFixed(1);

    return { totalCourses, totalLessons, totalHours };
  }, [trackCourses]);

  if (!trackName || trackCourses.length === 0) {
    return (
      <div className="min-h-screen bg-[#f6f7fb] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold text-[#151821]">Track Not Found</h2>
        <p className="text-xs text-[#7d8492] mt-1">We couldn't find any courses under the requested learning path.</p>
        <button 
          onClick={() => router.push('/dashboard/general')}
          className="mt-4 px-4 py-2 bg-[#111827] text-white text-xs font-bold rounded-xl"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-[#151821] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Navigation Breadcrumb Header */}
        <header className="flex items-center justify-between mb-8">
          <button 
            onClick={() => router.push('/dashboard/general')}
            className="flex items-center gap-2 text-xs font-bold text-[#687080] hover:text-[#151821] transition cursor-pointer"
          >
            ← Back to Dashboard
          </button>
          <div className="flex items-center gap-2">
            <Image src={myLogo} alt="Phoenix Logo" width={28} height={28} className="object-contain" />
            <span className="font-bold text-xs uppercase tracking-wider text-[#687080]">Phoenix Hub</span>
          </div>
        </header>

        {/* Learning Path Hero Banner */}
        <div className="bg-[#111827] text-white rounded-[24px] p-6 sm:p-8 shadow-xl mb-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-1/3 h-full opacity-10 bg-gradient-to-l from-white to-transparent pointer-events-none" />
          <span className="text-[10px] font-bold uppercase tracking-[.15em] text-[#d7ad35]">
            Structured Learning Path
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1 text-white">
            {trackName}
          </h1>
          <p className="text-xs text-white/60 mt-2 max-w-xl leading-relaxed">
            Follow this sequential curriculum designed by industry experts to take you from core fundamentals to job-ready portfolio placement.
          </p>

          {/* Quick Dynamic Stats Strip */}
          <div className="flex flex-wrap gap-4 sm:gap-6 mt-6 pt-6 border-t border-white/10 text-xs">
            <div>
              <span className="text-white/40 block text-[10px] uppercase font-bold tracking-wider">Modules</span>
              <span className="font-bold text-white text-sm">{stats.totalCourses} Steps</span>
            </div>
            <div>
              <span className="text-white/40 block text-[10px] uppercase font-bold tracking-wider">Total Content</span>
              <span className="font-bold text-white text-sm">{stats.totalLessons} Lessons</span>
            </div>
            <div>
              <span className="text-white/40 block text-[10px] uppercase font-bold tracking-wider">Estimated Time</span>
              <span className="font-bold text-white text-sm">{stats.totalHours} Hours</span>
            </div>
          </div>
        </div>

        {/* Module Timeline Sequential Cards List */}
        <div className="space-y-4 relative before:absolute before:inset-y-4 before:left-6 before:w-0.5 before:bg-[#e5e8ee] sm:before:left-8">
          {trackCourses.map((course, index) => {
            const moduleNumber = course.module || index + 1;
            
            return (
              <div 
                key={course.id} 
                className="relative pl-14 sm:pl-20 group"
              >
                {/* Visual Timeline Node Connector Button Icon Counter */}
                <div className="absolute left-2 top-4 w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-white border-2 border-[#e5e8ee] flex items-center justify-center font-bold text-xs shadow-sm transition group-hover:border-[#d7ad35] group-hover:bg-[#fffcf2] text-[#151821]">
                  {moduleNumber < 10 ? `0${moduleNumber}` : moduleNumber}
                </div>

                {/* Module Interactive Card Layout Box Container */}
                <div className="bg-white border border-[#e5e8ee] rounded-[20px] p-5 shadow-sm transition hover:shadow-md hover:border-[#d2ae47] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        course.level === 'Beginner' ? 'bg-emerald-50 text-emerald-700' :
                        course.level === 'Intermediate' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                      }`}>
                        {course.level}
                      </span>
                      <span className="text-[11px] text-[#9299a7]">• {course.duration}</span>
                      <span className="text-[11px] text-[#9299a7]">• {course.type}</span>
                    </div>

                    <h3 className="text-[15px] font-bold tracking-tight text-[#151821] group-hover:text-[#9a761c] transition">
                      {course.title}
                    </h3>
                    <p className="text-xs text-[#7d8492] leading-relaxed line-clamp-2">
                      {course.desc}
                    </p>

                    {course.project && (
                      <div className="pt-2 flex items-center gap-1.5 text-[11px] text-[#8d6a12] font-semibold">
                        <span className="px-1.5 py-0.5 rounded bg-[#fff7dc] text-[10px] uppercase font-bold">Project</span>
                        <span className="truncate">{course.project}</span>
                      </div>
                    )}
                  </div>

                  {/* Clean Routing Action Button Trigger */}
                  <Link 
                    href={`/dashboard/course/${course.id}`}
                    className="w-full sm:w-auto text-center shrink-0 inline-flex items-center justify-center gap-1.5 bg-[#111827] hover:bg-[#1c273a] text-white font-bold text-xs px-4 py-3 rounded-xl transition"
                  >
                    Start Module
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-current stroke-[2]" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}

export default function TrackOverviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#111827] flex items-center justify-center text-white"><p>Loading track overview...</p></div>}>
      <TrackOverviewContent />
    </Suspense>
  );
}