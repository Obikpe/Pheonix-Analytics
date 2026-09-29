'use client';
export const dynamic = 'force-dynamic';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import courses from '@/data/courses.json';
import myImage from '@/public/logo.png';

interface CourseRecord {
  id?: string;
  slug?: string;
  title?: string;
  name?: string;
  track?: string;
  track_description?: string;
  progress?: number;
}

interface TrackCard {
  track: string;
  count: number;
  description: string;
  progress: number;
  image: string;
}

type PlanTier = 'trial' | 'pro';
type ActiveView = 'overview' | 'tracks' | 'community';

const TRIAL_LENGTH_DAYS = 7;

/* -------------------------------------------------------------------------- */
/*  Visual system                                                             */
/* -------------------------------------------------------------------------- */

const trackVisuals = [
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=82',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=82',
  'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=82',
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=82',
  'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=82',
  'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=82',
];

const learningScenes = [
  {
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1500&q=85',
    eyebrow: 'Learn together',
    title: 'Build skills with people who are learning too.',
  },
  {
    image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1500&q=85',
    eyebrow: 'Learn by doing',
    title: 'Turn every lesson into something you can actually build.',
  },
  {
    image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1500&q=85',
    eyebrow: 'Keep moving',
    title: 'A focused learning space for your next career move.',
  },
];

const iconStroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const Icon = ({
  children,
  className = 'w-5 h-5',
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <svg viewBox="0 0 24 24" className={className} {...iconStroke}>
    {children}
  </svg>
);

const IconGrid = (p: { className?: string }) => (
  <Icon className={p.className}><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></Icon>
);
const IconMessage = (p: { className?: string }) => (
  <Icon className={p.className}><path d="M4 5.5h16v11H9.5L5 20v-3.5H4v-11Z" /></Icon>
);
const IconAward = (p: { className?: string }) => (
  <Icon className={p.className}><circle cx="12" cy="8.5" r="4.5" /><path d="M9 12.2 7.5 20l4.5-2.3 4.5 2.3-1.5-7.8" /></Icon>
);
const IconGear = (p: { className?: string }) => (
  <Icon className={p.className}><circle cx="12" cy="12" r="3" /><path d="M19.4 13.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.04 1.56v.08a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.1-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06A2 2 0 1 1 4.17 15.6l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.04H2.7a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.56-1.1 1.7 1.7 0 0 0-.34-1.87l-.06-.06A2 2 0 1 1 6.78 2.77l.06.06a1.7 1.7 0 0 0 1.87.34H8.8a1.7 1.7 0 0 0 1.04-1.56V1.5a2 2 0 1 1 4 0v.09c0 .68.41 1.29 1.04 1.56.63.26 1.36.13 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.09c.27.63.88 1.04 1.56 1.04h.09a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.56 1.06Z" /></Icon>
);
const IconSearch = (p: { className?: string }) => (
  <Icon className={p.className}><circle cx="10.5" cy="10.5" r="6.5" /><path d="m20 20-4.35-4.35" /></Icon>
);
const IconBell = (p: { className?: string }) => (
  <Icon className={p.className}><path d="M6 9a6 6 0 1 1 12 0c0 4.2 1.2 5.6 2 6.5H4c.8-.9 2-2.3 2-6.5Z" /><path d="M10 19.5a2 2 0 0 0 4 0" /></Icon>
);
const IconChevron = (p: { className?: string }) => (
  <Icon className={p.className}><path d="m6 9 6 6 6-6" /></Icon>
);
const IconArrow = (p: { className?: string }) => (
  <Icon className={p.className}><path d="M5 12h14M13 6l6 6-6 6" /></Icon>
);
const IconPlay = (p: { className?: string }) => (
  <Icon className={p.className}><path d="m9 6 9 6-9 6V6Z" fill="currentColor" stroke="none" /></Icon>
);
const IconClock = (p: { className?: string }) => (
  <Icon className={p.className}><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.5 2" /></Icon>
);
const IconMenu = (p: { className?: string }) => (
  <Icon className={p.className}><path d="M4 6h16M4 12h16M4 18h16" /></Icon>
);
const IconClose = (p: { className?: string }) => (
  <Icon className={p.className}><path d="m6 6 12 12M18 6 6 18" /></Icon>
);
const IconSpark = (p: { className?: string }) => (
  <Icon className={p.className}><path d="m12 3 1.5 6.5L20 11l-6.5 1.5L12 19l-1.5-6.5L4 11l6.5-1.5L12 3Z" /></Icon>
);
const IconLogout = (p: { className?: string }) => (
  <Icon className={p.className}><path d="M13 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4" /><path d="M3 12h12M11 8l4 4-4 4" /></Icon>
);

const logo = myImage;

export default function GeneralDashboard() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>('overview');
  const [plan, setPlan] = useState<PlanTier>('trial');
  const [trialDaysLeft, setTrialDaysLeft] = useState(TRIAL_LENGTH_DAYS);
  const [query, setQuery] = useState('');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedEmail = localStorage.getItem('phx_email') || 'learner@example.com';
    setEmail(storedEmail);

    const storedPlan = (localStorage.getItem('phx_plan') as PlanTier) || 'trial';
    setPlan(storedPlan);

    if (storedPlan === 'trial') {
      let startedAt = localStorage.getItem('phx_trial_started_at');
      if (!startedAt) {
        startedAt = new Date().toISOString();
        localStorage.setItem('phx_trial_started_at', startedAt);
      }
      const elapsedDays = Math.floor(
        (Date.now() - new Date(startedAt).getTime()) / 86_400_000,
      );
      setTrialDaysLeft(Math.max(TRIAL_LENGTH_DAYS - elapsedDays, 0));
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCarouselIndex((current) => (current + 1) % learningScenes.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, []);

  const courseList = courses as CourseRecord[];

  const tracksList: TrackCard[] = useMemo(() => {
    const trackMap: Record<string, { count: number; description: string; progress: number }> = {};

    courseList.forEach((course) => {
      if (!course.track) return;
      if (!trackMap[course.track]) {
        trackMap[course.track] = {
          count: 0,
          description:
            course.track_description ||
            'Structured lessons, practical projects and guided learning.',
          progress: 0,
        };
      }
      trackMap[course.track].count += 1;
      trackMap[course.track].progress = Math.max(
        trackMap[course.track].progress,
        typeof course.progress === 'number' ? Math.min(100, Math.max(0, course.progress)) : 0,
      );
    });

    return Object.keys(trackMap).map((track, index) => ({
      track,
      count: trackMap[track].count,
      description: trackMap[track].description,
      progress: trackMap[track].progress,
      image: trackVisuals[index % trackVisuals.length],
    }));
  }, [courseList]);

  const filteredTracks = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return tracksList;
    return tracksList.filter(
      (item) =>
        item.track.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term),
    );
  }, [query, tracksList]);

  const continueCourse = useMemo(() => {
    const lastId =
      typeof window !== 'undefined' ? localStorage.getItem('phx_last_course_id') : null;
    const match = lastId
      ? courseList.find((course) => course.id === lastId || course.slug === lastId)
      : null;
    return match || courseList[0] || null;
  }, [courseList]);

  const continueTitle =
    continueCourse?.title ||
    continueCourse?.name ||
    continueCourse?.track ||
    'Choose your first learning track';
  const continueTrack = continueCourse?.track || 'Your learning path';
  const continueProgress =
    typeof continueCourse?.progress === 'number'
      ? Math.max(0, Math.min(100, continueCourse.progress))
      : 0;

  const totalLessons = courseList.length;
  const completedLessons = courseList.filter(
    (course) => typeof course.progress === 'number' && course.progress >= 100,
  ).length;
  const activeTracks = tracksList.filter((track) => track.progress > 0).length;
  const trialPct = Math.round((trialDaysLeft / TRIAL_LENGTH_DAYS) * 100);

const handleTrackClick = (trackName: string) => {
  // Find the first course belonging to this track from your JSON data asset
  const targetCourse = courseList.find(c => c.track === trackName);
  
  // Use the found item's ID or dynamic slug string, falling back to a default value if empty
  const targetId = targetCourse?.id || targetCourse?.slug || 'overview';

  // Notice the correct use of curly braces {} instead of square brackets []
  router.push(`/dashboard/course/${targetId}?track=${encodeURIComponent(trackName)}`);
};


  const handleResume = () => {
    const target = continueCourse?.id || continueCourse?.slug;
    router.push(target ? `/dashboard/course/${target}` : '/dashboard/course');
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  const goTo = (view: ActiveView) => {
    setActiveView(view);
    setMobileNavOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-[#151821]">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col border-r border-[#e7e9ef] bg-[#111827] text-white lg:flex">
        <div className="flex h-[76px] items-center gap-3 border-b border-white/10 px-6">
          <Image
            src={logo}
            alt="Phoenix logo"
            className="h-10 w-10 shrink-0 object-contain"
          />
          <div>
            <div className="text-[15px] font-bold tracking-tight">The Phoenix Hub</div>
            <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-[.18em] text-white/45">
              Learn. Build. Grow.
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-5">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[.16em] text-white/35">
            Workspace
          </p>

          <nav className="space-y-1">
            {[
              { id: 'overview' as ActiveView, label: 'Overview', icon: <IconGrid className="h-[18px] w-[18px]" /> },
              { id: 'tracks' as ActiveView, label: 'Learning tracks', icon: <IconPlay className="h-[18px] w-[18px]" /> },
              { id: 'community' as ActiveView, label: 'Community', icon: <IconMessage className="h-[18px] w-[18px]" /> },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => goTo(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-[13px] font-medium transition ${
                  activeView === item.id
                    ? 'bg-white text-[#111827] shadow-lg shadow-black/10'
                    : 'text-white/65 hover:bg-white/7 hover:text-white'
                }`}
              >
                {item.icon}
                {item.label}
                {item.id === 'community' && (
                  <span className="ml-auto rounded-full bg-[#d7ad35] px-2 py-0.5 text-[9px] font-bold text-[#111827]">
                    LIVE
                  </span>
                )}
              </button>
            ))}
          </nav>

          <p className="mt-8 px-3 pb-2 text-[10px] font-bold uppercase tracking-[.16em] text-white/35">
            Your learning
          </p>

          <nav className="space-y-1">
            <button
              onClick={handleResume}
              className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-[13px] font-medium text-white/65 transition hover:bg-white/7 hover:text-white"
            >
              <IconClock className="h-[18px] w-[18px]" />
              Continue learning
            </button>
            <button className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-[13px] font-medium text-white/35">
              <IconAward className="h-[18px] w-[18px]" />
              Certificates
              <span className="ml-auto text-[9px] uppercase tracking-wide">Soon</span>
            </button>
            <button className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-[13px] font-medium text-white/35">
              <IconGear className="h-[18px] w-[18px]" />
              Settings
              <span className="ml-auto text-[9px] uppercase tracking-wide">Soon</span>
            </button>
          </nav>
        </div>

        {plan === 'trial' && (
          <div className="m-3 rounded-2xl border border-[#d7ad35]/30 bg-[#d7ad35]/10 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#f2d477]">
                Free trial
              </span>
              <span className="text-[10px] font-semibold text-white/65">{trialDaysLeft} days</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-[#d7ad35] transition-all" style={{ width: `${trialPct}%` }} />
            </div>
            <button
              onClick={() => router.push('/dashboard/upgrade')}
              className="mt-3 w-full rounded-xl bg-[#d7ad35] py-2.5 text-xs font-bold text-[#111827] transition hover:bg-[#e4bf50]"
            >
              Unlock full access
            </button>
          </div>
        )}

        <div className="border-t border-white/10 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium text-white/45 hover:bg-white/7 hover:text-white"
          >
            <IconLogout className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close menu"
            onClick={() => setMobileNavOpen(false)}
            className="absolute inset-0 bg-[#111827]/60 backdrop-blur-sm"
          />
          <aside className="relative flex h-full w-[285px] flex-col bg-[#111827] text-white shadow-2xl">
            <div className="flex h-[76px] items-center justify-between border-b border-white/10 px-5">
              <div className="flex items-center gap-3">
                <Image
                  src={logo}
                  alt="Phoenix logo"
                  className="h-10 w-10 shrink-0 object-contain"
                />
                <span className="font-bold">The Phoenix Hub</span>
              </div>
              <button onClick={() => setMobileNavOpen(false)} className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white">
                <IconClose className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-1 p-3">
              {[
                ['overview', 'Overview', <IconGrid className="h-5 w-5" />],
                ['tracks', 'Learning tracks', <IconPlay className="h-5 w-5" />],
                ['community', 'Community', <IconMessage className="h-5 w-5" />],
              ].map(([id, label, icon]) => (
                <button
                  key={id as string}
                  onClick={() => goTo(id as ActiveView)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-medium ${
                    activeView === id ? 'bg-white text-[#111827]' : 'text-white/65 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {icon}
                  {label as string}
                </button>
              ))}
            </div>
          </aside>
        </div>
      )}

      <div className="lg:pl-[248px]">
        {/* Top navigation */}
        <header className="sticky top-0 z-30 border-b border-[#e7e9ef] bg-[#f6f7fb]/90 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1440px] items-center gap-3">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="rounded-xl border border-[#e2e5eb] bg-white p-2.5 text-[#3f4654] lg:hidden"
            >
              <IconMenu className="h-5 w-5" />
            </button>

            <div className="relative max-w-[590px] flex-1">
              <IconSearch className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#9299a7]" />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  if (event.target.value) setActiveView('tracks');
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') setActiveView('tracks');
                }}
                type="search"
                placeholder="Search thousands of courses, tracks and skills..."
                className="h-11 w-full rounded-xl border border-[#e2e5eb] bg-white pl-11 pr-4 text-[13px] font-medium text-[#151821] outline-none transition placeholder:text-[#a2a8b4] focus:border-[#c9a12c] focus:ring-4 focus:ring-[#c9a12c]/10"
              />
            </div>

            <div className="ml-auto flex items-center gap-2">
              <div className="hidden rounded-full border border-[#d7ad35]/30 bg-[#fff8df] px-3 py-2 text-[10px] font-bold text-[#8d6a12] sm:flex sm:items-center sm:gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#d7ad35]" />
                {plan === 'trial' ? `${trialDaysLeft} days left` : 'Phoenix Pro'}
              </div>

              <button className="relative rounded-xl border border-[#e2e5eb] bg-white p-2.5 text-[#606878] hover:text-[#151821]">
                <IconBell className="h-[18px] w-[18px]" />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#c99627]" />
              </button>

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((open) => !open)}
                  className="flex items-center gap-2 rounded-xl border border-[#e2e5eb] bg-white p-1.5 pr-2.5"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#111827] text-xs font-bold uppercase text-white">
                    {email.charAt(0) || 'L'}
                  </span>
                  <IconChevron className="hidden h-3.5 w-3.5 text-[#9299a7] sm:block" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-[#e2e5eb] bg-white py-1 shadow-2xl shadow-[#111827]/10">
                    <div className="border-b border-[#eef0f4] px-4 py-3">
                      <p className="text-[9px] font-bold uppercase tracking-[.14em] text-[#9aa0ad]">Signed in as</p>
                      <p className="mt-1 truncate text-xs font-semibold text-[#252a35]">{email}</p>
                    </div>
                    {plan === 'trial' && (
                      <button
                        onClick={() => router.push('/dashboard/upgrade')}
                        className="w-full px-4 py-3 text-left text-xs font-semibold text-[#8d6a12] hover:bg-[#fff9e9]"
                      >
                        Upgrade to Phoenix Pro
                      </button>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-3 text-left text-xs font-semibold text-[#a9483b] hover:bg-[#fff3f1]"
                    >
                      <IconLogout className="h-4 w-4" /> Log out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {/* Hero */}
          <section className="relative min-h-[310px] overflow-hidden rounded-[28px] bg-[#111827] shadow-[0_22px_60px_rgba(17,24,39,.12)]">
            {learningScenes.map((scene, index) => (
              <div
                key={scene.image}
                className={`absolute inset-0 transition-opacity duration-1000 ${index === carouselIndex ? 'opacity-100' : 'opacity-0'}`}
              >
                <img src={scene.image} alt="" className="h-full w-full object-cover opacity-45" />
              </div>
            ))}
            <div className="absolute inset-0 bg-gradient-to-r from-[#111827] via-[#111827]/90 to-[#111827]/25" />
            <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-gradient-to-l from-[#111827]/10 to-transparent lg:block" />

            <div className="relative flex min-h-[310px] flex-col justify-center p-7 sm:p-10 lg:max-w-[700px] lg:p-12">
              <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.13em] text-[#f2d477] backdrop-blur">
                <IconSpark className="h-3.5 w-3.5" />
                {learningScenes[carouselIndex].eyebrow}
              </div>
              <h1 className="max-w-2xl text-3xl font-bold leading-[1.08] tracking-[-.035em] text-white sm:text-4xl lg:text-[46px]">
                {learningScenes[carouselIndex].title}
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-white/65 sm:text-[15px]">
                Welcome back. Continue a course, explore a new track, or ask the community when you get stuck.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  onClick={handleResume}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#d7ad35] px-5 py-3 text-xs font-bold text-[#111827] transition hover:bg-[#e5c04f]"
                >
                  <IconPlay className="h-4 w-4" />
                  {continueProgress > 0 ? 'Resume learning' : 'Start learning'}
                </button>
                <button
                  onClick={() => goTo('tracks')}
                  className="rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-xs font-bold text-white backdrop-blur transition hover:bg-white/15"
                >
                  Explore tracks
                </button>
              </div>
            </div>

            <div className="absolute bottom-5 right-6 flex gap-1.5">
              {learningScenes.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCarouselIndex(index)}
                  aria-label={`Show learning scene ${index + 1}`}
                  className={`h-1.5 rounded-full transition-all ${index === carouselIndex ? 'w-7 bg-[#d7ad35]' : 'w-1.5 bg-white/40'}`}
                />
              ))}
            </div>
          </section>

          {/* Status strip */}
          <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Courses available', value: totalLessons.toLocaleString(), detail: 'in your catalogue' },
              { label: 'Tracks started', value: activeTracks.toString(), detail: 'based on your progress' },
              { label: 'Completed', value: completedLessons.toString(), detail: 'courses finished' },
              { label: plan === 'trial' ? 'Trial access' : 'Membership', value: plan === 'trial' ? `${trialDaysLeft}d` : 'PRO', detail: plan === 'trial' ? 'remaining' : 'active' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-[#e5e8ee] bg-white px-4 py-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[.1em] text-[#9299a7]">{stat.label}</p>
                <div className="mt-1 flex items-end gap-2">
                  <span className="text-xl font-bold tracking-tight text-[#151821]">{stat.value}</span>
                  <span className="pb-0.5 text-[10px] font-medium text-[#9299a7]">{stat.detail}</span>
                </div>
              </div>
            ))}
          </section>

          <div className="mt-7 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0">
              {activeView === 'community' ? (
                <CommunityPanel />
              ) : activeView === 'tracks' ? (
                <TracksPanel
                  tracks={filteredTracks}
                  query={query}
                  onTrack={handleTrackClick}
                />
              ) : (
                <>
                  {/* Continue learning */}
                  <section className="overflow-hidden rounded-[24px] border border-[#e5e8ee] bg-white shadow-sm">
                    <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
                      <div className="relative h-[155px] w-full shrink-0 overflow-hidden rounded-2xl bg-[#dfe3ea] sm:w-[245px]">
                        <img
                          src={trackVisuals[0]}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/70 via-transparent to-transparent" />
                        <div className="absolute bottom-3 left-3 rounded-lg bg-white/90 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.1em] text-[#111827] backdrop-blur">
                          {continueTrack}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#b08722]">
                            Continue where you left off
                          </p>
                          <span className="text-xs font-bold text-[#596171]">{continueProgress}%</span>
                        </div>
                        <h2 className="mt-2 line-clamp-2 text-xl font-bold tracking-tight text-[#151821] sm:text-2xl">
                          {continueTitle}
                        </h2>
                        <p className="mt-2 text-xs leading-5 text-[#7d8492]">
                          Pick up your next lesson and keep your learning streak moving.
                        </p>
                        <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#edf0f4]">
                          <div
                            className="h-full rounded-full bg-[#c99e2c] transition-all"
                            style={{ width: `${Math.max(continueProgress, 2)}%` }}
                          />
                        </div>
                        <button
                          onClick={handleResume}
                          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#111827] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#1c273a]"
                        >
                          {continueProgress > 0 ? 'Resume lesson' : 'Open course'}
                          <IconArrow className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </section>

                  {/* Tracks */}
                  <section className="mt-7">
                    <div className="mb-4 flex items-end justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#b08722]">Explore the hub</p>
                        <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#151821]">Learning tracks</h2>
                      </div>
                      <button
                        onClick={() => goTo('tracks')}
                        className="hidden text-xs font-bold text-[#687080] hover:text-[#151821] sm:block"
                      >
                        View all →
                      </button>
                    </div>

                    <TracksPanel
                      tracks={filteredTracks.slice(0, 6)}
                      query={query}
                      onTrack={handleTrackClick}
                    />
                  </section>
                </>
              )}
            </div>

            {/* Right rail */}
            <aside className="space-y-5">
              {/* Trial status */}
              <div className={`overflow-hidden rounded-[24px] border p-5 shadow-sm ${plan === 'trial' ? 'border-[#ead99d] bg-[#fffaf0]' : 'border-[#d9dee7] bg-white'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[.13em] text-[#8d6a12]">
                      {plan === 'trial' ? 'Free trial' : 'Membership'}
                    </p>
                    <h3 className="mt-1 text-lg font-bold tracking-tight text-[#151821]">
                      {plan === 'trial' ? `${trialDaysLeft} days remaining` : 'Phoenix Pro'}
                    </h3>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide ${plan === 'trial' ? 'bg-[#f5e7b6] text-[#806010]' : 'bg-[#111827] text-white'}`}>
                    {plan === 'trial' ? 'Trial' : 'Active'}
                  </span>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-[#c99e2c]" style={{ width: `${plan === 'trial' ? trialPct : 100}%` }} />
                </div>
                <p className="mt-3 text-[11px] leading-5 text-[#81765b]">
                  {plan === 'trial'
                    ? 'Your trial gives you access to learning tracks and the learner community. Upgrade to keep uninterrupted access.'
                    : 'Your Pro membership keeps your learning workspace fully unlocked.'}
                </p>
                {plan === 'trial' && (
                  <button
                    onClick={() => router.push('/dashboard/upgrade')}
                    className="mt-4 w-full rounded-xl bg-[#111827] py-2.5 text-xs font-bold text-white transition hover:bg-[#1c273a]"
                  >
                    Upgrade to Pro
                  </button>
                )}
              </div>

              {/* Community card */}
              <div className="rounded-[24px] border border-[#e5e8ee] bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <p className="text-[10px] font-bold uppercase tracking-[.13em] text-[#747c8c]">Learner community</p>
                    </div>
                    <h3 className="mt-2 text-lg font-bold tracking-tight text-[#151821]">Learn out loud.</h3>
                  </div>
                  <IconMessage className="h-5 w-5 text-[#b28c2a]" />
                </div>
                <p className="mt-2 text-xs leading-5 text-[#7d8492]">
                  Ask questions, explain what you know, and find people working through the same problems.
                </p>
                <button
                  onClick={() => goTo('community')}
                  className="mt-4 flex w-full items-center justify-between rounded-xl border border-[#e5e8ee] px-3.5 py-3 text-xs font-bold text-[#303644] transition hover:border-[#c9a12c] hover:bg-[#fffcf2]"
                >
                  Open community
                  <IconArrow className="h-4 w-4" />
                </button>
              </div>

              {/* Learning image reel */}
              <div className="group relative h-[205px] overflow-hidden rounded-[24px] bg-[#111827]">
                <img
                  src={learningScenes[(carouselIndex + 1) % learningScenes.length].image}
                  alt="People learning together"
                  className="h-full w-full object-cover opacity-75 transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-[#111827]/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="text-[9px] font-bold uppercase tracking-[.14em] text-[#f2d477]">The Phoenix mindset</p>
                  <p className="mt-1 text-base font-bold leading-snug text-white">
                    Small lessons. Real projects. Visible progress.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </main>

        <footer className="border-t border-[#e7e9ef] px-6 py-7 text-center text-[10px] font-medium text-[#9aa0ad]">
          © {new Date().getFullYear()} The Phoenix Hub · A learning platform by Phoenix
        </footer>
      </div>
    </div>
  );
}

function TracksPanel({
  tracks,
  query,
  onTrack,
}: {
  tracks: TrackCard[];
  query: string;
  onTrack: (track: string) => void;
}) {
  if (tracks.length === 0) {
    return (
      <div className="rounded-[24px] border border-dashed border-[#d9dee7] bg-white p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f0f2f6] text-[#6d7584]">
          <IconSearch className="h-5 w-5" />
        </div>
        <h3 className="mt-4 text-sm font-bold text-[#151821]">No tracks found</h3>
        <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-[#8a919e]">
          {query ? `Nothing matches “${query}”. Try another skill or track name.` : 'New learning tracks will appear here as they are published.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {tracks.map((item) => (
        <button
          key={item.track}
          onClick={() => onTrack(item.track)}
          className="group overflow-hidden rounded-[22px] border border-[#e5e8ee] bg-white text-left shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-[#d2ae47] hover:shadow-lg hover:shadow-[#111827]/5"
        >
          <div className="relative h-32 overflow-hidden bg-[#e7e9ee]">
            <img
              src={item.image}
              alt=""
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/75 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <span className="rounded-lg bg-white/90 px-2 py-1 text-[9px] font-bold text-[#202632] backdrop-blur">
                {item.count} {item.count === 1 ? 'course' : 'courses'}
              </span>
              {item.progress > 0 && (
                <span className="rounded-lg bg-[#d7ad35] px-2 py-1 text-[9px] font-bold text-[#111827]">
                  {item.progress}% done
                </span>
              )}
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-[15px] font-bold tracking-tight text-[#151821] group-hover:text-[#9a761c]">
                {item.track}
              </h3>
              <IconArrow className="mt-0.5 h-4 w-4 shrink-0 text-[#a7adba] transition group-hover:translate-x-1 group-hover:text-[#b08722]" />
            </div>
            <p className="mt-1.5 line-clamp-2 text-[11px] leading-5 text-[#818897]">
              {item.description}
            </p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#edf0f4]">
              <div className="h-full rounded-full bg-[#c9a12c]" style={{ width: `${Math.max(item.progress, item.progress > 0 ? 2 : 0)}%` }} />
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

function CommunityPanel() {
  const [isAsking, setIsAsking] = useState(false);
  const [questionText, setQuestionText] = useState('');

  const handleSubmitQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    alert(`Question submitted successfully: "${questionText}"`);
    setQuestionText('');
    setIsAsking(false);
  };

  return (
    <section className="rounded-[24px] border border-[#e5e8ee] bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 border-b border-[#edf0f4] pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#737b8a]">Community</p>
          </div>
          <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-[#151821]">Learn together.</h2>
          <p className="mt-1 text-xs leading-5 text-[#858c99]">
            Questions, explanations, project feedback and conversations around your learning.
          </p>
        </div>
        <button 
          onClick={() => setIsAsking(!isAsking)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#111827] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#1c273a]"
        >
          <IconMessage className="h-4 w-4" />
          {isAsking ? 'Cancel' : 'Ask a question'}
        </button>
      </div>

      {isAsking && (
        <form onSubmit={handleSubmitQuestion} className="mt-4 p-4 rounded-2xl bg-[#fafbfc] border border-[#d7ad35]/30">
          <label className="block text-xs font-bold text-[#252a35] mb-2">What is your question?</label>
          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Type your question here... Include errors or links if relevant."
            className="w-full min-h-[100px] p-3 text-xs rounded-xl border border-[#e2e5eb] bg-white outline-none focus:border-[#c9a12c] focus:ring-2 focus:ring-[#c9a12c]/10 text-[#151821]"
            required
          />
          <button type="submit" className="mt-3 rounded-xl bg-[#d7ad35] px-4 py-2 text-xs font-bold text-[#111827] hover:bg-[#e5c04f] transition">
            Post to Feed
          </button>
        </form>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {[
          ['Ask', 'Stuck on a lesson? Ask the community and include your code, screenshot or what you have tried.'],
          ['Answer', 'Know the solution? Help another learner and reinforce your own understanding.'],
          ['Discuss', 'Share project ideas, useful resources and practical approaches with other learners.'],
          ['Build', 'Find people working on similar projects and turn learning into something real.'],
        ].map(([title, description], index) => (
          <div key={title} className="rounded-2xl border border-[#edf0f4] bg-[#fafbfc] p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#fff7dc] text-[10px] font-bold text-[#96731d]">
                0{index + 1}
              </span>
              <h3 className="text-sm font-bold text-[#252a35]">{title}</h3>
            </div>
            <p className="mt-3 text-xs leading-5 text-[#7d8492]">{description}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-2xl bg-[#111827] p-5 text-white">
        <p className="text-[9px] font-bold uppercase tracking-[.14em] text-[#d7ad35]">Community feed</p>
        <h3 className="mt-1 text-lg font-bold">Your discussion space is ready.</h3>
        <p className="mt-1 max-w-lg text-xs leading-5 text-white/55">
          Connect this view to your community API and every new question, answer, vote and reply can flow into this learner dashboard without changing the layout.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {['Questions', 'Answers', 'Projects', 'Study groups'].map((tag) => (
            <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-semibold text-white/70">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}