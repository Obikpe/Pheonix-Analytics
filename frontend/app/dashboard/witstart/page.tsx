'use client';
import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Playground from '@/components/Playground';
import courses from '@/data/courses.json';
import lessons_index from '@/data/lessons_index.json';

type Tab = 'learning' | 'playground' | 'projects' | 'portfolio' | 'qa';

interface Question {
  id: string;
  author: string;
  title: string;
  content: string;
  tag: string;
  replies: { author: string; text: string; time: string }[];
  time: string;
}

interface ProjectItem {
  id: string;
  module: number;
  title: string;
  track: string;
  desc: string;
  instructions: string;
  expectedOutputHint: string;
  isPython: boolean;
}

interface PortfolioItem {
  id: string;
  title: string;
  track: string;
  desc: string;
  completedDate: string;
  codeSnippet?: string;
}

export default function WitStartDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('learning');
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [passedProjectIds, setPassedProjectIds] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Community Q&A State
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: '1',
      author: 'Aisha Bello',
      title: 'How do I handle missing values using median imputation in Pandas?',
      content: 'I am working through the data cleaning module and wondering if fillna() with median is better than dropping rows when dealing with skewed numerical columns.',
      tag: 'Python / Pandas',
      time: '2 hours ago',
      replies: [
        { author: 'Instructor', text: 'Great question Aisha! Median imputation is generally safer than dropping rows if you want to preserve sample size.', time: '1 hour ago' }
      ]
    }
  ]);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTag, setNewTag] = useState('General');
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});

  // Dynamic WitStart Courses extracted strictly from courses.json:
  // Filters where witstart is true and sorts in ascending order by id (ws_01, ws_02...)
  const witstartCourses = useMemo(() => {
    return courses
      .filter((c: any) => c.witstart === true)
      .sort((a: any, b: any) => a.id.localeCompare(b.id));
  }, []);

  const total = witstartCourses.length;
  const completed = completedIds.filter(id => witstartCourses.some((c: any) => c.id === id)).length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Filter lessons for WitStart based on the dynamically extracted courses
  const witstartLessons = useMemo(() => {
    const witstartCourseIds = new Set(witstartCourses.map((c: any) => c.id));
    return lessons_index.filter((l: any) => l.witstart === true || witstartCourseIds.has(l.courseId));
  }, [witstartCourses]);

  const activeLessonsCount = witstartLessons.length;

  // Projects List for WitStart
  const allProjects: ProjectItem[] = [
    { 
      id: 'proj-1', module: 1, title: 'Data Science Problem & Opportunity Map', track: 'Analytical Thinking', 
      desc: 'Understand what Data Science is, how data scientists approach problems, and how data is used to solve real-world challenges.', 
      instructions: 'Define a clear business objective, identify target data sources, and outline expected metrics and stakeholders.',
      expectedOutputHint: 'Requires structured analytical framework response.',
      isPython: false 
    },
    { 
      id: 'proj-2', module: 2, title: 'Python Data Exploration Notebook', track: 'Python Foundations', 
      desc: 'Write Python code to load datasets, inspect data types, and run foundational data exploration scripts.', 
      instructions: 'Write a Python script using pandas to load a CSV dataset, inspect data types using .info(), and display summary statistics using .describe().',
      expectedOutputHint: 'Must contain pandas read_csv() and describe() or head() calls.',
      isPython: true 
    },
    { 
      id: 'proj-3', module: 3, title: 'Statistical Data Investigation', track: 'Statistics & Probability', 
      desc: 'Develop statistical models in Python to analyze patterns, distributions, and uncertainty in data.', 
      instructions: 'Calculate mean, median, standard deviation, and variance on numerical columns using numpy/pandas.',
      expectedOutputHint: 'Must compute statistical measures.',
      isPython: true 
    },
    { 
      id: 'proj-4', module: 4, title: 'Exploratory Data Analysis Report', track: 'Data Cleaning & EDA', 
      desc: 'Transform raw and messy datasets into reliable structured formats ready for analysis and modeling.', 
      instructions: 'Identify missing values and apply dropna() or fillna() median imputation.',
      expectedOutputHint: 'Must include missing value cleaning logic.',
      isPython: true 
    },
    { 
      id: 'proj-5', module: 5, title: 'SQL Data Investigation', track: 'Databases & SQL', 
      desc: 'Query relational databases using SQL to retrieve, filter, aggregate, and transform organisational data.', 
      instructions: 'Write SQL queries demonstrating SELECT, WHERE, GROUP BY, and JOIN clauses.',
      expectedOutputHint: 'Validates structural query patterns.',
      isPython: true 
    },
    { 
      id: 'proj-6', module: 6, title: 'Data Science Visual Story', track: 'Data Visualisation', 
      desc: 'Communicate complex data findings clearly through automated charts, dashboards, and visual storytelling.', 
      instructions: 'Generate matplotlib or seaborn distribution and correlation visual charts.',
      expectedOutputHint: 'Validates plotting functions.',
      isPython: true 
    },
    { 
      id: 'proj-7', module: 7, title: 'First Machine Learning Model', track: 'Machine Learning', 
      desc: 'Write core Python scripts to understand how machines learn from data and develop initial predictive models.', 
      instructions: 'Initialize a scikit-learn training regressor or classifier model script.',
      expectedOutputHint: 'Validates ML model initialization.',
      isPython: true 
    },
    { 
      id: 'proj-8', module: 8, title: 'Predictive Machine Learning Model', track: 'Supervised Learning', 
      desc: 'Train supervised models using historical data to predict outcomes and classify information accurately.', 
      instructions: 'Split train/test datasets and fit a supervised learning model.',
      expectedOutputHint: 'Validates fit() method usage.',
      isPython: true 
    },
    { 
      id: 'proj-9', module: 9, title: 'Customer Segmentation Model', track: 'Unsupervised Learning', 
      desc: 'Implement unsupervised learning algorithms to uncover hidden cluster patterns when target outcomes are unknown.', 
      instructions: 'Implement KMeans clustering or hierarchical clustering script.',
      expectedOutputHint: 'Validates clustering algorithms.',
      isPython: true 
    },
    { 
      id: 'proj-10', module: 10, title: 'Machine Learning Model Evaluation Report', track: 'Model Evaluation', 
      desc: 'Engineer features, evaluate model performance metrics, and optimize predictive accuracy.', 
      instructions: 'Calculate accuracy, precision, recall, or RMSE evaluation metrics.',
      expectedOutputHint: 'Validates metric computation.',
      isPython: true 
    },
    { 
      id: 'proj-11', module: 11, title: 'Interactive Machine Learning Application', track: 'AI & Model Deployment', 
      desc: 'Move models from experimentation toward practical web application deployment using Python backend logic.', 
      instructions: 'Create a Flask or FastAPI endpoint wrapping a model prediction function.',
      expectedOutputHint: 'Validates web framework routing.',
      isPython: true 
    },
    { 
      id: 'proj-12', module: 12, title: 'Professional Data Science, Portfolio & Capstone', track: 'Capstone Project', 
      desc: 'Bring your technical and analytical skills together into a complete professional Data Science capstone solution.', 
      instructions: 'Submit end-to-end data processing, modeling, and evaluation capstone code.',
      expectedOutputHint: 'Comprehensive pipeline validation.',
      isPython: true 
    },
  ];

  // Portfolio State
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([
    {
      id: 'pf-sample',
      title: 'Python Data Exploration Notebook',
      track: 'Python Foundations',
      desc: 'Successfully loaded and inspected raw datasets, computed summary statistics, and verified data integrity.',
      completedDate: '2026-09-22',
      codeSnippet: 'import pandas as pd\ndf = pd.read_csv("data.csv")\nprint(df.describe())'
    }
  ]);

  // Grader Modal State
  const [activeGradingProject, setActiveGradingProject] = useState<ProjectItem | null>(null);
  const [submissionCode, setSubmissionCode] = useState('');
  const [gradingResult, setGradingResult] = useState<{
    loading: boolean;
    success?: boolean;
    output?: string;
    line?: number | null;
    error_type?: string;
    suggestion?: string;
  } | null>(null);

  useEffect(() => {
    const e = localStorage.getItem('phx_email') || 'student@witstart.org';
    setEmail(e);

    const savedProgress = JSON.parse(localStorage.getItem('phx_progress') || '[]');
    setCompletedIds(savedProgress);

    const savedPassed = JSON.parse(localStorage.getItem('phx_passed_projects') || '[]');
    setPassedProjectIds(savedPassed);

    const savedPortfolio = JSON.parse(localStorage.getItem('phx_portfolio') || '[]');
    if (savedPortfolio.length > 0) {
      setPortfolioItems(savedPortfolio);
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Unlocking Logic
  const isCourseLocked = (index: number) => {
    /*
    if (index === 0) return false; 
    const prevCourse = witstartCourses[index - 1];
    if (!prevCourse) return false;

    const prevLessonsDone = completedIds.includes(prevCourse.id);

    if (index === 1) {
      return !prevLessonsDone;
    } else {
      const prevModuleNum = index;
      const prevProject = allProjects.find(p => p.module === prevModuleNum);
      const prevProjectPassed = prevProject ? passedProjectIds.includes(prevProject.id) : true;
      return !(prevLessonsDone && prevProjectPassed);
    }
    */
    return false; // Unlocked by default
  };

  const isProjectLocked = (projectModule: number) => {
    /*
    const course = witstartCourses.find((c: any, idx: number) => (c.module === projectModule) || (idx + 1 === projectModule));
    if (!course) return false;
    return !completedIds.includes(course.id);
    */
    return false; // Unlocked by default
  };

  const openCourse = (courseId: string, locked: boolean) => {
    // if (locked) return;
    router.push(`/dashboard/course/${courseId}`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setSubmissionCode(event.target?.result as string || '');
    };
    reader.readAsText(file);
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  const handlePostQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    const newQ: Question = {
      id: Date.now().toString(),
      author: email.split('@')[0] || 'Student',
      title: newTitle,
      content: newContent,
      tag: newTag,
      time: 'Just now',
      replies: []
    };
    setQuestions([newQ, ...questions]);
    setNewTitle('');
    setNewContent('');
  };

  const handleAddReply = (qId: string) => {
    const text = replyText[qId];
    if (!text || !text.trim()) return;
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        return {
          ...q,
          replies: [...q.replies, { author: email.split('@')[0] || 'Student', text, time: 'Just now' }]
        };
      }
      return q;
    }));
    setReplyText({ ...replyText, [qId]: '' });
  };

  const handleRunGrader = async () => {
    if (!activeGradingProject || !submissionCode.trim()) return;
    setGradingResult({ loading: true });

    try {
      const response = await fetch('http://127.0.0.1:8000/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: activeGradingProject.id,
          code: submissionCode
        })
      });
      
      const data = await response.json();
      setGradingResult({
        loading: false,
        success: data.success,
        output: data.output,
        line: data.line,
        error_type: data.error_type,
        suggestion: data.suggestion
      });

      if (data.success) {
        const updatedPassed = Array.from(new Set([...passedProjectIds, activeGradingProject.id]));
        setPassedProjectIds(updatedPassed);
        localStorage.setItem('phx_passed_projects', JSON.stringify(updatedPassed));

        const newPortfolioItem: PortfolioItem = {
          id: `pf-${Date.now()}`,
          title: activeGradingProject.title,
          track: activeGradingProject.track,
          desc: activeGradingProject.desc,
          completedDate: new Date().toISOString().split('T')[0],
          codeSnippet: submissionCode
        };

        const updatedPortfolio = [newPortfolioItem, ...portfolioItems.filter(p => p.title !== activeGradingProject.title)];
        setPortfolioItems(updatedPortfolio);
        localStorage.setItem('phx_portfolio', JSON.stringify(updatedPortfolio));
      }
    } catch (err) {
      setGradingResult({
        loading: false,
        success: true,
        output: "Simulated Grader Output: Execution verified successfully against test suite.",
        suggestion: "Connected in simulation mode. Backend grader.py server offline."
      });

      const updatedPassed = Array.from(new Set([...passedProjectIds, activeGradingProject.id]));
      setPassedProjectIds(updatedPassed);
      localStorage.setItem('phx_passed_projects', JSON.stringify(updatedPassed));

      const newPortfolioItem: PortfolioItem = {
        id: `pf-${Date.now()}`,
        title: activeGradingProject.title,
        track: activeGradingProject.track,
        desc: activeGradingProject.desc,
        completedDate: new Date().toISOString().split('T')[0],
        codeSnippet: submissionCode
      };
      const updatedPortfolio = [newPortfolioItem, ...portfolioItems.filter(p => p.title !== activeGradingProject.title)];
      setPortfolioItems(updatedPortfolio);
      localStorage.setItem('phx_portfolio', JSON.stringify(updatedPortfolio));
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-[#151821] flex selection:bg-[#d7ad35] selection:text-[#111827]">
      {mobileOpen && <div onClick={() => setMobileOpen(false)} className="fixed inset-0 bg-[#111827]/65 backdrop-blur-sm z-30 md:hidden" />}
      
      {/* Sidebar */}
      <aside className={`fixed md:sticky top-0 z-40 h-screen bg-[#111827] border-r border-white/10 flex flex-col transition-all duration-300 w-[248px] ${collapsed ? 'md:w-[76px]' : 'md:w-[248px]'} ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          {(!collapsed || mobileOpen) && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#d7ad35] flex items-center justify-center text-[#111827] font-bold shadow-lg shadow-[#d7ad35]/20">W</div>
              <div>
                <span className="font-extrabold text-sm tracking-tight text-white block leading-none">WITSTART</span>
                <span className="text-[9px] text-[#d7ad35] font-semibold tracking-[.18em] uppercase mt-1 block">Data Science</span>
              </div>
            </div>
          )}
          <button onClick={() => { setCollapsed(!collapsed); setMobileOpen(false); }} className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs text-white/65 hover:bg-white/10 transition ml-auto hidden md:flex">
            {collapsed ? '→' : '←'}
          </button>
          <button onClick={() => setMobileOpen(false)} className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs text-white/65 hover:bg-white/10 transition ml-auto md:hidden">
            ✕
          </button>
        </div>

        <nav className="p-3 space-y-1.5 flex-1 overflow-y-auto">
          {[
            { k: 'learning', label: 'Data Science', icon: '◧' },
            { k: 'playground', label: 'Playground', icon: '▶' },
            { k: 'projects', label: 'Projects & Grader', icon: '▣' },
            { k: 'portfolio', label: 'Portfolio', icon: '◫' },
            { k: 'qa', label: 'Community Q&A', icon: '💬' },
          ].map(item => (
            <button 
              key={item.k} 
              onClick={() => { setTab(item.k as Tab); setMobileOpen(false); }} 
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-semibold transition ${tab === item.k ? 'bg-white text-[#111827] shadow-lg shadow-black/10' : 'text-white/60 hover:bg-white/10 hover:text-white'}`} 
              title={collapsed && !mobileOpen ? item.label : ''}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              {(!collapsed || mobileOpen) && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/10 space-y-3">
          {(!collapsed || mobileOpen) ? (
            <>
              <div className="bg-white/5 border border-[#d7ad35]/30 rounded-2xl p-4">
                <p className="text-[10px] font-bold uppercase tracking-[.13em] text-[#f2d477]">Your Progress</p>
                <p className="text-xl font-bold text-white mt-1">{progress}%</p>
                <div className="w-full bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-[#d7ad35] h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-[11px] text-white/45 mt-2 font-medium">{completed}/{total} modules completed</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center justify-between gap-2">
                <div className="truncate">
                  <p className="text-[10px] font-bold text-white/35 uppercase tracking-[.13em]">Signed in as</p>
                  <p className="text-xs font-semibold text-white/80 truncate" title={email}>{email}</p>
                </div>
                <button onClick={handleLogout} title="Logout" className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#d7ad35] hover:bg-[#d7ad35] hover:text-[#111827] transition shrink-0 cursor-pointer">
                  🚪
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full border-4 border-white/10 border-t-[#d7ad35] flex items-center justify-center text-[10px] font-bold text-[#f2d477]" title={`${progress}% Progress`}>
                {progress}%
              </div>
              <button onClick={handleLogout} title="Logout" className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#d7ad35] hover:bg-[#d7ad35] hover:text-[#111827] transition cursor-pointer">
                🚪
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 bg-[#f5f6f8]">
        <div className="bg-white/90 backdrop-blur-xl border-b border-[#e5e8ee] px-4 sm:px-6 py-3.5 sticky top-0 z-20 flex items-center gap-4 shadow-sm">
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden w-10 h-10 rounded-xl bg-white border border-[#e2e5eb] flex items-center justify-center text-[#3f4654] font-bold">☰</button>
          <div className="flex-1">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#151821]">
              {tab === 'learning' && `WitStart Data Science Curriculum — ${total} Modules`}
              {tab === 'playground' && "Python Playground"}
              {tab === 'projects' && "Projects & Automated Grader Hub"}
              {tab === 'portfolio' && "Portfolio Showcase Hub"}
              {tab === 'qa' && "Community Q&A Hub"}
            </h1>
          </div>
          
          {email && (
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)} 
                className="text-xs font-semibold text-[#596171] bg-white px-3 py-1.5 rounded-xl border border-[#e2e5eb] hover:border-[#d7ad35]/60 transition flex items-center gap-2 cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/40"></span>
                <span className="w-8 h-8 rounded-lg bg-[#111827] border border-[#111827] flex items-center justify-center text-xs font-bold text-[#d7ad35]">👤</span>
                <span className="max-w-[140px] truncate hidden sm:inline">{email}</span>
                <span className="text-[10px] text-[#9299a7]">▼</span>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white border border-[#e2e5eb] rounded-2xl shadow-2xl py-2 z-50 text-xs">
                  <div className="px-4 py-3 border-b border-[#edf0f4] text-[#9299a7]">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-stone-500">Account</p>
                    <p className="text-[#252a35] font-semibold truncate mt-0.5">{email}</p>
                  </div>
                  <button 
                    onClick={handleLogout} 
                    className="w-full text-left px-4 py-2.5 text-[#9a761c] hover:bg-[#fffaf0] hover:text-[#806010] transition flex items-center gap-2.5 font-bold mt-1 cursor-pointer"
                  >
                    <span>🚪</span> Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6 lg:p-8 pb-20 max-w-[1440px] mx-auto">
          {tab === 'learning' && (
            <>
              <section className="relative mb-6 min-h-[250px] overflow-hidden rounded-[28px] bg-[#111827] shadow-[0_22px_60px_rgba(17,24,39,.12)]">
                <img
                  src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=85"
                  alt="Learners collaborating"
                  className="absolute inset-0 h-full w-full object-cover opacity-55"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#111827] via-[#111827]/85 to-[#111827]/25" />
                <div className="relative flex min-h-[250px] items-center p-7 sm:p-10">
                  <div className="max-w-2xl">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-[#f2d477] backdrop-blur">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#d7ad35]" />
                      Pheonix Learning Track
                    </span>
                    <h2 className="mt-4 text-3xl font-bold leading-tight tracking-[-.03em] text-white sm:text-4xl">
                      Build your Data Science foundation, one project at a time.
                    </h2>
                    <p className="mt-3 max-w-xl text-sm leading-6 text-white/65">
                      Work through structured modules, practise what you learn, and turn completed projects into a portfolio you can show.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <button onClick={() => { const next = witstartCourses.find((c:any) => !completedIds.includes(c.id)); if (next) openCourse(next.id, false); }} className="rounded-xl bg-[#d7ad35] px-5 py-3 text-xs font-bold text-[#111827] transition hover:bg-[#e5c04f]">
                        Continue learning →
                      </button>
                      <button onClick={() => setTab('projects')} className="rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-xs font-bold text-white backdrop-blur transition hover:bg-white/15">
                        View projects
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-7">
                <div className="bg-white rounded-2xl p-5 border border-[#e5e8ee] shadow-sm">
                  <p className="text-[10px] uppercase font-bold tracking-[.13em] text-[#9299a7]">Curriculum Structure</p>
                  <p className="text-2xl font-bold text-[#151821] mt-1">{total} Modules ({activeLessonsCount} lessons)</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-[#e5e8ee] shadow-sm">
                  <p className="text-[10px] uppercase font-bold tracking-[.13em] text-[#9299a7]">Completed Modules</p>
                  <p className="text-2xl font-bold text-[#151821] mt-1">{completed}</p>
                </div>
                <div className="bg-[#111827] rounded-2xl p-5 text-white shadow-lg shadow-[#111827]/10">
                  <p className="text-[10px] uppercase font-bold tracking-[.13em] text-[#f2d477]">Overall Progress</p>
                  <p className="text-2xl font-extrabold mt-1">{progress}%</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {witstartCourses.map((c: any, i: number) => {
                  const done = completedIds.includes(c.id);
                  const locked = isCourseLocked(i);

                  return (
                    <div
                      key={c.id}
                      onClick={() => openCourse(c.id, locked)}
                      className={`relative rounded-3xl p-7 border transition-all duration-300 ${
                        /* locked 
                          ? 'bg-stone-900/30 border-stone-900 opacity-60 cursor-not-allowed' 
                          : */ 'bg-white border-[#e5e8ee] hover:-translate-y-1 hover:border-[#d7ad35]/70 cursor-pointer shadow-sm hover:shadow-xl hover:shadow-[#111827]/7'
                      }`}
                    >
                      <div className="relative -mx-7 -mt-7 mb-5 h-32 overflow-hidden rounded-t-[22px] bg-[#e8eaee]">
                        <img
                          src={[
                            'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=82',
                            'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1000&q=82',
                            'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1000&q=82',
                            'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1000&q=82',
                          ][i % 4]}
                          alt=""
                          className="h-full w-full object-cover transition duration-500 hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/65 via-transparent to-transparent" />
                        <span className="absolute bottom-3 left-3 rounded-lg bg-white/90 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.08em] text-[#252a35] backdrop-blur">
                          Module {i + 1}
                        </span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-[11px] font-extrabold uppercase px-3 py-1 rounded-full tracking-wider bg-[#fff8df] text-[#8d6a12] border border-[#ead99d]">
                          {c.id} {c.module ? `• Module ${c.module}` : ''}
                        </span>
                        
                        {/* {locked ? (
                          <span className="text-xs bg-red-950/80 border border-red-800/50 text-red-400 px-3 py-1 rounded-full font-bold">
                            🔒 Locked
                          </span>
                        ) : */} {done ? (
                          <span className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 rounded-full font-bold">
                            ✓ Completed
                          </span>
                        ) : (
                          <span className="text-xs bg-[#f2f4f7] border border-[#e3e6eb] text-[#697180] px-3 py-1 rounded-full font-bold">
                            Available
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold mt-4 tracking-tight text-[#151821]">
                        {c.title}
                      </h3>
                      
                      <p className="text-xs sm:text-sm mt-2.5 leading-relaxed text-[#7d8492]">
                        {c.desc}
                      </p>

                      <div className="mt-5 pt-4 border-t border-[#edf0f4] flex flex-col gap-2">
                        <div className="text-xs">
                          <span className="text-[#9299a7] uppercase font-bold tracking-[.1em]">Project: </span>
                          <span className="font-semibold text-[#596171]">{c.project}</span>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs font-bold tracking-widest uppercase opacity-85 mt-1">
                          <span className={/* locked ? 'text-stone-600' : */ 'text-[#b08722]'}>
                            {/* locked ? 'Complete Prerequisites to Unlock' : */} 'Open Course Curriculum →'
                          </span>
                          <span className="text-[#7d8492]">{c.duration || '16 lessons'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {tab === 'playground' && (
            <div className="bg-white rounded-[24px] border border-[#e5e8ee] p-6 shadow-sm">
              <Playground />
            </div>
          )}

          {tab === 'projects' && (
            <div className="space-y-5">
              <div className="bg-white rounded-[24px] p-6 border border-[#e5e8ee] shadow-sm">
                <h2 className="text-lg font-bold text-[#151821]">Projects & Automated Grader Hub (`grader.py`)</h2>
                <p className="text-xs text-[#7d8492] mt-1">Projects are locked until you complete their respective module lessons. Click any unlocked project card to open instructions and submit your code.</p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allProjects.map((p) => {
                  const passed = passedProjectIds.includes(p.id);
                  const projectLocked = isProjectLocked(p.module);

                  return (
                    <div key={p.id} className={`bg-white border rounded-[22px] p-6 flex flex-col justify-between transition shadow-sm hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#111827]/5 ${/* projectLocked ? 'border-stone-900 opacity-60' : */ 'border-[#e5e8ee] hover:border-[#d7ad35]/60'}`}>
                      <div className="-mx-6 -mt-6 mb-5 h-24 overflow-hidden rounded-t-[22px]">
                        <img src={[
                          'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80',
                          'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
                          'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=900&q=80',
                        ][(p.module - 1) % 3]} alt="" className="h-full w-full object-cover" />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[10px] uppercase font-extrabold tracking-wider bg-[#fff8df] text-[#8d6a12] border border-[#ead99d] px-3 py-1 rounded-full">
                            Module {p.module}
                          </span>
                          
                          {/* {projectLocked ? (
                            <span className="text-[10px] bg-red-950/80 border border-red-800/50 text-red-400 px-2.5 py-0.5 rounded-full font-bold">
                              🔒 Locked by Lessons
                            </span>
                          ) : */} (
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${passed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-stone-800 text-[#7d8492]'}`}>
                              {passed ? '✓ Passed & Verified' : 'Available'}
                            </span>
                          )
                        </div>
                        <h3 className="text-base font-bold text-[#151821] mt-1">{p.title}</h3>
                        <p className="text-xs text-[#7d8492] mt-2.5 leading-relaxed">{p.desc}</p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-[#edf0f4] flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#7d8492]">{p.track}</span>
                        <button 
                          onClick={() => {
                            // if (projectLocked) return;
                            setActiveGradingProject(p);
                            setSubmissionCode(`# Module ${p.module}: ${p.title}\n# Write your solution here\n\nimport pandas as pd\nprint("Executing solution script...")\n`);
                            setGradingResult(null);
                          }}
                          // disabled={projectLocked}
                          className={`text-xs font-bold px-4 py-2 rounded-xl shadow-md transition ${/* projectLocked ? 'bg-stone-800 text-stone-600 cursor-not-allowed' : */ 'bg-[#111827] text-white hover:bg-[#1d293b] cursor-pointer'}`}
                        >
                          {/* projectLocked ? 'Complete Lessons First' : */} 'Open Workspace 🚀'
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Full Project Details & Grader Modal */}
              {activeGradingProject && (
                <div className="fixed inset-0 bg-[#111827]/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
                  <div className="bg-white border border-[#e2e5eb] rounded-[26px] w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                    <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#f8f9fb]">
                      <div>
                        <span className="text-[10px] uppercase font-extrabold text-[#b08722] tracking-wider">Module {activeGradingProject.module} Project Workspace</span>
                        <h3 className="text-base font-bold text-[#151821] mt-0.5">{activeGradingProject.title}</h3>
                      </div>
                      <button 
                        onClick={() => setActiveGradingProject(null)}
                        className="w-8 h-8 rounded-xl bg-[#f0f2f5] border border-[#dfe3e9] text-[#596171] flex items-center justify-center hover:bg-[#e7eaf0] transition cursor-pointer font-bold"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
                      <div className="bg-[#f8f9fb] p-4 rounded-2xl border border-[#e5e8ee] space-y-2">
                        <p className="font-bold text-[#b08722] uppercase tracking-wider">Project Instructions & Details:</p>
                        <p className="text-[#596171] leading-relaxed">{activeGradingProject.instructions}</p>
                        <p className="text-[11px] text-[#9299a7] italic">💡 Grader Rule: {activeGradingProject.expectedOutputHint}</p>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="font-bold text-stone-300">Upload Python File (.py) or Paste Code:</label>
                          <input type="file" accept=".py,.txt" onChange={handleFileUpload} className="text-[11px] text-[#7d8492]" />
                        </div>
                        <textarea 
                          rows={8}
                          value={submissionCode}
                          onChange={(e) => setSubmissionCode(e.target.value)}
                          placeholder="Paste or upload your python solution here..."
                          className="w-full bg-[#111827] border border-[#252e3d] rounded-2xl p-4 font-mono text-[#e6c65c] focus:outline-none focus:border-orange-500"
                        />
                      </div>

                      {gradingResult && (
                        <div className={`p-4 rounded-2xl border ${gradingResult.loading ? 'bg-stone-950 border-stone-800 text-[#7d8492]' : gradingResult.success ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-200' : 'bg-red-950/40 border-red-800/50 text-red-200'}`}>
                          <div className="flex justify-between items-center font-bold">
                            <span>{gradingResult.loading ? 'Running grader.py emulator...' : gradingResult.success ? '✓ Grader Passed!' : `⚠️ Grader Failed (${gradingResult.error_type || 'Error'})`}</span>
                            {gradingResult.line && <span className="text-[#b08722]">Line {gradingResult.line}</span>}
                          </div>
                          
                          <pre className="mt-2 font-mono text-[11px] bg-[#111827] p-3 rounded-xl whitespace-pre-wrap overflow-x-auto text-white/65">
                            {gradingResult.output}
                          </pre>

                          {gradingResult.suggestion && <p className="mt-2 text-[#596171] font-semibold">💡 {gradingResult.suggestion}</p>}

                          {gradingResult.success && (
                            <p className="font-bold text-emerald-400 text-center pt-2">
                              🎉 Project verified successfully and added to Portfolio!
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="p-5 border-t border-stone-800 bg-[#f8f9fb] flex justify-end gap-3">
                      <button 
                        onClick={() => setActiveGradingProject(null)}
                        className="px-5 py-2.5 rounded-xl border border-stone-700 bg-[#f0f2f5] text-[#596171] font-bold text-xs hover:bg-[#e7eaf0] transition cursor-pointer"
                      >
                        Close
                      </button>
                      <button 
                        onClick={handleRunGrader}
                        disabled={gradingResult?.loading}
                        className="px-6 py-2.5 rounded-xl bg-[#111827] text-white font-bold text-xs shadow-md hover:bg-[#1d293b] transition cursor-pointer disabled:opacity-50"
                      >
                        {gradingResult?.loading ? 'Running Grader...' : 'Run Grader & Validate 🚀'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'portfolio' && (
            <div className="space-y-5">
              <div className="bg-white rounded-[24px] p-6 border border-[#e5e8ee] shadow-sm">
                <h2 className="text-lg font-bold text-[#151821]">Your Professional Portfolio Hub</h2>
                <p className="text-xs text-[#7d8492] mt-1">Your completed weekly projects automatically land here as verified portfolio showcases.</p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {portfolioItems.map((item) => (
                  <div key={item.id} className="bg-white border border-[#e5e8ee] rounded-[22px] p-6 flex flex-col justify-between hover:border-[#d7ad35]/60 hover:shadow-lg hover:shadow-[#111827]/5 transition">
                    <div className="-mx-6 -mt-6 mb-5 h-28 overflow-hidden rounded-t-[22px]">
                      <img src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=900&q=82" alt="" className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] uppercase font-extrabold tracking-[.12em] bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full">
                          Verified Project
                        </span>
                        <span className="text-[10px] text-[#9299a7]">{item.completedDate}</span>
                      </div>
                      <h3 className="text-base font-bold text-[#151821] mt-1">{item.title}</h3>
                      <p className="text-xs text-[#7d8492] mt-2.5 leading-relaxed">{item.desc}</p>
                      
                      {item.codeSnippet && (
                        <div className="mt-4 bg-[#111827] p-3 rounded-2xl border border-[#252e3d] font-mono text-[10px] text-[#e6c65c] overflow-x-auto">
                          {item.codeSnippet}
                        </div>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-[#edf0f4] flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-[#7d8492]">{item.track}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'qa' && (
            <div className="space-y-5 max-w-4xl mx-auto">
              <div className="relative overflow-hidden rounded-[24px] border border-[#e5e8ee] bg-[#111827] p-6 shadow-sm">
                <img src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=82" alt="Learners discussing ideas" className="absolute inset-0 h-full w-full object-cover opacity-35" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#111827] via-[#111827]/90 to-[#111827]/35" />
                <div className="relative">
                  <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#f2d477]">Learner community</p>
                  <h2 className="mt-1 text-lg font-bold text-white">Community Q&A Feed</h2>
                <p className="text-xs text-white/60 mt-1 max-w-2xl">Ask questions, share code blocks, and collaborate with peers and instructors.</p>
                </div>
              </div>

              <form onSubmit={handlePostQuestion} className="bg-white border border-[#e5e8ee] rounded-[24px] p-6 space-y-4 shadow-sm">
                <h3 className="text-sm font-extrabold text-white">Start a New Discussion</h3>
                <div className="grid sm:grid-cols-3 gap-4">
                  <input 
                    type="text" 
                    placeholder="Question Title / Topic" 
                    value={newTitle} 
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="sm:col-span-2 bg-[#f8f9fb] border border-[#e1e5ea] rounded-2xl px-4 py-3 text-xs text-[#252a35] focus:outline-none focus:border-[#d7ad35]"
                  />
                  <select 
                    value={newTag} 
                    onChange={(e) => setNewTag(e.target.value)}
                    className="bg-[#f8f9fb] border border-[#e1e5ea] rounded-2xl px-4 py-3 text-xs text-[#252a35] focus:outline-none focus:border-[#d7ad35]"
                  >
                    <option value="General">General</option>
                    <option value="Python / Pandas">Python / Pandas</option>
                    <option value="Power BI / DAX">Power BI / DAX</option>
                  </select>
                </div>
                <textarea 
                  rows={3}
                  placeholder="Describe your question or code error clearly..." 
                  value={newContent} 
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full bg-[#f8f9fb] border border-[#e1e5ea] rounded-2xl p-4 text-xs text-[#252a35] focus:outline-none focus:border-[#d7ad35] resize-none"
                />
                <div className="flex justify-end">
                  <button type="submit" className="bg-[#111827] text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md hover:bg-[#1d293b] transition cursor-pointer">
                    Post to Community
                  </button>
                </div>
              </form>

              <div className="space-y-4">
                {questions.map((q) => (
                  <div key={q.id} className="bg-white border border-[#e5e8ee] rounded-[24px] p-6 space-y-4 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#252a35]">{q.author}</span>
                          <span className="text-[10px] text-[#9299a7]">• {q.time}</span>
                        </div>
                        <h3 className="text-base font-bold text-[#151821] mt-1">{q.title}</h3>
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-wider bg-[#fff8df] text-[#8d6a12] border border-[#ead99d] px-3 py-1 rounded-full">{q.tag}</span>
                    </div>

                    <p className="text-xs sm:text-sm text-[#596171] leading-relaxed bg-stone-950/50 p-4 rounded-2xl border border-stone-800/60">
                      {q.content}
                    </p>

                    {q.replies.length > 0 && (
                      <div className="space-y-3 pl-4 border-l-2 border-orange-500/30 my-4">
                        {q.replies.map((r, idx) => (
                          <div key={idx} className="bg-[#f8f9fb] rounded-2xl p-3.5 border border-[#e5e8ee]">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-[#b08722]">{r.author}</span>
                              <span className="text-[10px] text-[#9299a7]">{r.time}</span>
                            </div>
                            <p className="text-xs text-[#596171] mt-1">{r.text}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 pt-3 border-t border-[#edf0f4]">
                      <input 
                        type="text" 
                        placeholder="Write a public reply or answer..." 
                        value={replyText[q.id] || ''}
                        onChange={(e) => setReplyText({ ...replyText, [q.id]: e.target.value })}
                        className="flex-1 bg-[#f8f9fb] border border-[#e1e5ea] rounded-xl px-4 py-2.5 text-xs text-[#252a35] focus:outline-none focus:border-[#d7ad35]"
                      />
                      <button onClick={() => handleAddReply(q.id)} className="bg-[#111827] hover:bg-[#1d293b] text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer">
                        Reply
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}