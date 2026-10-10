"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpen, CircleDollarSign, Plus, Send, Sparkles } from "lucide-react";
import Shell from "../../../components/dashboard/Shell";
import SectionHeader from "../../../components/dashboard/SectionHeader";
import EmptyState from "../../../components/feedback/EmptyState";
import { request } from "../../../lib/api/client";

export default function CreatorStudio() {
  const [workspace, setWorkspace] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [courseForm, setCourseForm] = useState({ title: "", slug: "", short_description: "", description: "", level: "beginner" });
  const [editCourseForm, setEditCourseForm] = useState({ title: "", slug: "", short_description: "", description: "", level: "beginner" });
  const [moduleForm, setModuleForm] = useState({ title: "", description: "" });
  const [lessonForm, setLessonForm] = useState({ module_id: "", title: "", description: "", content: "", duration_minutes: "10" });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const me = await request<any>("/creator/me");
      setWorkspace(me);
      if (me.creator && ["approved", "active"].includes(me.creator.status)) {
        const [courseResult, earningsResult] = await Promise.all([request<any>("/creator/courses"), request<any>("/creator/earnings")]);
        const nextCourses = courseResult.courses || [];
        setCourses(nextCourses);
        setLedger(earningsResult.ledger || []);
        setSelectedId(old => nextCourses.some((course: any) => String(course.id) === old) ? old : (nextCourses[0]?.id || ""));
      } else {
        setCourses([]);
        setLedger([]);
        setSelectedId("");
      }
    } catch (e: any) {
      setError(e.message || "Creator workspace could not be loaded.");
      if (/401|unauthor/i.test(e.message || "")) location.href = "/login";
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);
  const selectedCourse = useMemo(() => courses.find(course => String(course.id) === String(selectedId)), [courses, selectedId]);
  useEffect(() => { if (selectedCourse) setEditCourseForm({ title: selectedCourse.title || "", slug: selectedCourse.slug || "", short_description: selectedCourse.short_description || "", description: selectedCourse.description || "", level: selectedCourse.level || "beginner" }); }, [selectedCourse?.id]);
  const isApproved = Boolean(workspace?.creator && workspace.creator.status === "approved");
  const application = workspace?.application;

  async function createCourse(event: any) {
    event.preventDefault();
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await request<any>("/creator/courses", { method: "POST", body: JSON.stringify(courseForm) });
      setCourseForm({ title: "", slug: "", short_description: "", description: "", level: "beginner" });
      setNotice("Draft course created. Add a module and at least one written lesson before publishing.");
      await load();
      if (result.course?.id) setSelectedId(String(result.course.id));
    } catch (e: any) { setError(e.message || "Course draft could not be created."); }
    finally { setBusy(false); }
  }

  async function createModule(event: any) {
    event.preventDefault(); if (!selectedCourse) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await request("/creator/courses/" + encodeURIComponent(selectedCourse.id) + "/modules", { method: "POST", body: JSON.stringify({ ...moduleForm, order_index: (selectedCourse.modules || []).length }) });
      setModuleForm({ title: "", description: "" }); setNotice("Module added to the draft course."); await load();
    } catch (e: any) { setError(e.message || "Module could not be created."); }
    finally { setBusy(false); }
  }

  async function createLesson(event: any) {
    event.preventDefault(); if (!lessonForm.module_id) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await request("/creator/modules/" + encodeURIComponent(lessonForm.module_id) + "/lessons", {
        method: "POST", body: JSON.stringify({ title: lessonForm.title, description: lessonForm.description, content: lessonForm.content, lesson_type: "article", duration_minutes: lessonForm.duration_minutes ? Number(lessonForm.duration_minutes) : null, order_index: (selectedCourse?.modules?.find((m: any) => String(m.id) === lessonForm.module_id)?.lessons || []).length }),
      });
      setLessonForm({ module_id: "", title: "", description: "", content: "", duration_minutes: "10" }); setNotice("Written lesson added to the draft course."); await load();
    } catch (e: any) { setError(e.message || "Lesson could not be created."); }
    finally { setBusy(false); }
  }

  async function updateCourse(event: any) {
    event.preventDefault();
    if (!selectedCourse) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await request<any>("/creator/courses/" + encodeURIComponent(selectedCourse.id), { method: "PATCH", body: JSON.stringify(editCourseForm) });
      if (result.course) setEditCourseForm({ title: result.course.title || "", slug: result.course.slug || "", short_description: result.course.short_description || "", description: result.course.description || "", level: result.course.level || "beginner" });
      setNotice("Draft course details saved.");
      await load();
    } catch (e: any) { setError(e.message || "Course details could not be saved."); }
    finally { setBusy(false); }
  }

  async function publishCourse() {
    if (!selectedCourse) return;
    setBusy(true); setError(""); setNotice("");
    try { await request("/creator/courses/" + encodeURIComponent(selectedCourse.id) + "/publish", { method: "POST" }); setNotice("Course published. It can now appear in the public catalogue."); await load(); }
    catch (e: any) { setError(e.message || "Course could not be published."); }
    finally { setBusy(false); }
  }

  function formatMoney(amount: unknown, currency: string) {
    const value = Number(amount || 0) / 100;
    try { return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "NGN" }).format(value); }
    catch { return `${currency || "NGN"} ${value.toFixed(2)}`; }
  }

  return <Shell active="creator">
    <SectionHeader eyebrow="Teach on Learnora" title="Creator studio" description="Build practical, text-based courses, publish free learning and review recorded creator earnings."/>
    {(error || notice) && <div role={error ? "alert" : "status"} className={"mt-6 rounded-xl border p-4 text-sm " + (error ? "border-red-400/20 bg-red-400/[.05] text-red-200" : "border-emerald-400/20 bg-emerald-400/[.05] text-emerald-200")}>{error || notice}</div>}
    {loading ? <div className="mt-7 rounded-2xl border border-white/10 bg-[#0e1319] p-6 text-sm text-slate-500">Loading creator records…</div> : !isApproved ? <section className="mt-7 rounded-2xl border border-white/[.08] bg-[#0e1319] p-6 sm:p-8">
      <div className="flex items-start gap-4"><div className="rounded-2xl bg-[#d7ad35]/10 p-3"><Sparkles className="gold" size={22}/></div><div><h2 className="text-xl font-semibold">{application?.status === "submitted" || application?.status === "under_review" ? "Your application is in review" : application?.status === "declined" ? "You can apply again" : "Share what you know"}</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">{application?.status === "submitted" || application?.status === "under_review" ? "Your application has been recorded. Creator tools become available after Learnora approves the account." : "Apply to become a Learnora creator. Applications are reviewed before course publishing and public discovery are enabled."}</p>{application?.status && <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs capitalize text-slate-300"><span className="h-1.5 w-1.5 rounded-full bg-[#d7ad35]"/>{application.status.replaceAll("_", " ")}</p>}{(!application || application.status === "declined") && <a href="/apply-to-teach" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#d7ad35] px-4 py-3 text-sm font-bold text-black">Apply to teach <ArrowRight size={15}/></a>}</div></div>
    </section> : <>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Courses" value={courses.length}/><Stat label="Published" value={courses.filter(c => c.status === "published").length}/><Stat label="Drafts" value={courses.filter(c => c.status === "draft").length}/><Stat label="Ledger entries" value={ledger.length}/>
      </div>
      <div className="mt-6 grid gap-5 xl:grid-cols-[.85fr_1.15fr]">
        <section className="h-fit rounded-2xl border border-white/[.08] bg-[#0e1319] p-5 sm:p-6"><div className="flex items-center gap-3"><BookOpen className="gold" size={20}/><div><h2 className="font-semibold">Create a course</h2><p className="mt-1 text-xs text-slate-500">Starts as a private draft.</p></div></div>
          <form onSubmit={createCourse} className="mt-5 space-y-4"><label className="block text-xs text-slate-400">Course title<input required minLength={2} maxLength={200} value={courseForm.title} onChange={e => setCourseForm(old => ({ ...old, title: e.target.value, slug: e.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") }))} className={inputClass}/></label><label className="block text-xs text-slate-400">Slug<input required minLength={2} maxLength={160} value={courseForm.slug} onChange={e => setCourseForm(old => ({ ...old, slug: e.target.value }))} className={inputClass}/></label>
          <label className="block text-xs text-slate-400">Level<select value={courseForm.level} onChange={e => setCourseForm(old => ({ ...old, level: e.target.value }))} className={inputClass}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option><option value="mixed">Mixed</option></select></label><label className="block text-xs text-slate-400">Short description<textarea rows={2} maxLength={500} value={courseForm.short_description} onChange={e => setCourseForm(old => ({ ...old, short_description: e.target.value }))} className={inputClass}/></label><label className="block text-xs text-slate-400">Course description<textarea rows={4} maxLength={10000} value={courseForm.description} onChange={e => setCourseForm(old => ({ ...old, description: e.target.value }))} className={inputClass}/></label>
          <button disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-[#d7ad35] px-4 py-3 text-sm font-bold text-black disabled:opacity-50"><Plus size={15}/>{busy ? "Saving…" : "Create draft course"}</button></form>
          <p className="mt-4 text-[11px] leading-5 text-slate-600">This studio currently publishes free courses with written lessons. Paid checkout and video uploads are not represented as available here.</p>
        </section>
        <section className="rounded-2xl border border-white/[.08] bg-[#0e1319] p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="font-semibold">Your courses</h2><p className="mt-1 text-xs text-slate-500">Drafts stay private until you publish them.</p></div><BookOpen className="gold" size={20}/></div>
          {courses.length ? <div className="mt-5 space-y-3">{courses.map(course => <button key={course.id} onClick={() => setSelectedId(String(course.id))} className={"w-full rounded-xl border p-4 text-left transition " + (String(course.id) === String(selectedId) ? "border-[#d7ad35]/30 bg-[#d7ad35]/[.04]" : "border-white/[.07] hover:border-white/20")}><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">{course.title}</h3><span className={"rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[.12em] " + (course.status === "published" ? "bg-emerald-300/[.08] text-emerald-200" : "bg-white/[.06] text-slate-400")}>{course.status}</span></div><p className="mt-2 text-xs text-slate-500">{(course.modules || []).length} modules · {(course.modules || []).reduce((n: number, m: any) => n + (m.lessons || []).length, 0)} lessons</p></button>)}</div> : <EmptyState title="No courses created yet" message="Create a draft course, then add a module and written lesson before publishing."/>}
        </section>
      </div>
      {selectedCourse && <section className="mt-5 rounded-2xl border border-white/[.08] bg-[#0e1319] p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[.16em] gold">Course builder</p><h2 className="mt-2 text-2xl font-semibold">{selectedCourse.title}</h2><p className="mt-2 text-sm text-slate-500">Add modules and written lessons. Publishing checks that each module contains at least one lesson.</p></div><div className="flex flex-wrap gap-2">{selectedCourse.status === "published" ? <a href={"/courses/" + selectedCourse.id} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-200">View public course <ArrowRight size={14}/></a> : <button onClick={() => void publishCourse()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-[#d7ad35] px-4 py-3 text-sm font-bold text-black disabled:opacity-50"><Send size={14}/>{busy ? "Publishing…" : "Publish course"}</button>}</div></div>
        <form onSubmit={updateCourse} className="mt-6 grid gap-4 rounded-xl border border-white/[.07] p-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><h3 className="font-semibold">Draft course details</h3><p className="mt-1 text-xs text-slate-500">Update the title and description before publishing.</p></div>
          <label className="block text-xs text-slate-400">Title<input required minLength={2} maxLength={200} value={editCourseForm.title} onChange={e => setEditCourseForm(old => ({ ...old, title: e.target.value }))} disabled={selectedCourse.status !== "draft"} className={inputClass}/></label>
          <label className="block text-xs text-slate-400">Slug<input required minLength={2} maxLength={160} value={editCourseForm.slug} onChange={e => setEditCourseForm(old => ({ ...old, slug: e.target.value }))} disabled={selectedCourse.status !== "draft"} className={inputClass}/></label>
          <label className="block text-xs text-slate-400">Level<select value={editCourseForm.level} onChange={e => setEditCourseForm(old => ({ ...old, level: e.target.value }))} disabled={selectedCourse.status !== "draft"} className={inputClass}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option><option value="mixed">Mixed</option></select></label>
          <label className="block text-xs text-slate-400">Short description<textarea rows={2} maxLength={500} value={editCourseForm.short_description} onChange={e => setEditCourseForm(old => ({ ...old, short_description: e.target.value }))} disabled={selectedCourse.status !== "draft"} className={inputClass}/></label>
          <label className="block text-xs text-slate-400 sm:col-span-2">Course description<textarea rows={4} maxLength={10000} value={editCourseForm.description} onChange={e => setEditCourseForm(old => ({ ...old, description: e.target.value }))} disabled={selectedCourse.status !== "draft"} className={inputClass}/></label>
          <div className="sm:col-span-2"><button disabled={busy || selectedCourse.status !== "draft"} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold disabled:opacity-40">Save draft details</button></div>
        </form>
        <div className="mt-6 grid gap-5 lg:grid-cols-2"><form onSubmit={createModule} className="rounded-xl border border-white/[.07] p-4"><h3 className="font-semibold">Add a module</h3><label className="mt-4 block text-xs text-slate-400">Module title<input required minLength={2} value={moduleForm.title} onChange={e => setModuleForm(old => ({ ...old, title: e.target.value }))} disabled={selectedCourse.status !== "draft"} className={inputClass}/></label><label className="mt-3 block text-xs text-slate-400">Description<textarea rows={2} value={moduleForm.description} onChange={e => setModuleForm(old => ({ ...old, description: e.target.value }))} disabled={selectedCourse.status !== "draft"} className={inputClass}/></label><button disabled={busy || selectedCourse.status !== "draft"} className="mt-4 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold disabled:opacity-40">Add module</button></form>
        <form onSubmit={createLesson} className="rounded-xl border border-white/[.07] p-4"><h3 className="font-semibold">Add a written lesson</h3><label className="mt-4 block text-xs text-slate-400">Module<select required value={lessonForm.module_id} onChange={e => setLessonForm(old => ({ ...old, module_id: e.target.value }))} disabled={selectedCourse.status !== "draft"} className={inputClass}><option value="">Choose a module</option>{(selectedCourse.modules || []).map((module: any) => <option key={module.id} value={module.id}>{module.title}</option>)}</select></label><label className="mt-3 block text-xs text-slate-400">Lesson title<input required minLength={2} value={lessonForm.title} onChange={e => setLessonForm(old => ({ ...old, title: e.target.value }))} disabled={selectedCourse.status !== "draft"} className={inputClass}/></label><label className="mt-3 block text-xs text-slate-400">Short description<textarea rows={2} value={lessonForm.description} onChange={e => setLessonForm(old => ({ ...old, description: e.target.value }))} disabled={selectedCourse.status !== "draft"} className={inputClass}/></label><label className="mt-3 block text-xs text-slate-400">Lesson content<textarea required minLength={20} maxLength={20000} rows={6} value={lessonForm.content} onChange={e => setLessonForm(old => ({ ...old, content: e.target.value }))} disabled={selectedCourse.status !== "draft"} className={inputClass} placeholder="Write the explanation, example and practical steps…"/></label><label className="mt-3 block text-xs text-slate-400">Estimated minutes<input type="number" min={0} value={lessonForm.duration_minutes} onChange={e => setLessonForm(old => ({ ...old, duration_minutes: e.target.value }))} disabled={selectedCourse.status !== "draft"} className={inputClass}/></label><button disabled={busy || selectedCourse.status !== "draft" || !(selectedCourse.modules || []).length} className="mt-4 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold disabled:opacity-40">Add lesson</button></form></div>
        <div className="mt-6 space-y-3">{(selectedCourse.modules || []).map((module: any) => <article key={module.id} className="rounded-xl border border-white/[.07] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">{module.title}</h3><span className="text-xs capitalize text-slate-500">{module.status}</span></div>{module.description && <p className="mt-2 text-sm text-slate-500">{module.description}</p>}{(module.lessons || []).length ? <div className="mt-3 space-y-2">{module.lessons.map((lesson: any) => <div key={lesson.id} className="rounded-lg bg-black/15 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-medium">{lesson.title}</p><span className="text-[10px] uppercase text-slate-600">{lesson.status}</span></div><p className="mt-1 line-clamp-2 whitespace-pre-wrap text-xs leading-5 text-slate-500">{lesson.content}</p></div>)}</div> : <p className="mt-3 text-xs text-amber-200/70">Add a written lesson to this module before publishing.</p>}</article>)}</div>
      </section>}
      <section className="mt-5 rounded-2xl border border-white/[.08] bg-[#0e1319] p-5 sm:p-6"><div className="flex items-center gap-3"><CircleDollarSign className="gold" size={20}/><div><h2 className="font-semibold">Creator earnings ledger</h2><p className="mt-1 text-xs text-slate-500">Entries recorded by Learnora’s commerce backend. No estimated earnings are added.</p></div></div>{ledger.length ? <div className="mt-5 divide-y divide-white/[.06]">{ledger.map((entry: any) => <div key={entry.id} className="flex flex-wrap items-center justify-between gap-4 py-3"><div><p className="text-sm font-medium capitalize">{String(entry.entry_type || "Ledger entry").replaceAll("_", " ")}</p><p className="mt-1 text-xs text-slate-600">{entry.created_at ? new Date(entry.created_at).toLocaleDateString() : "Date unavailable"}{entry.available_at ? " · Available " + new Date(entry.available_at).toLocaleDateString() : ""}</p></div><p className="text-sm font-semibold text-slate-200">{formatMoney(entry.amount_minor, entry.currency)}</p></div>)}</div> : <p className="mt-5 rounded-xl border border-dashed border-white/10 p-5 text-sm text-slate-500">No earnings entries have been recorded yet.</p>}</section>
    </>}
  </Shell>;
}

const inputClass = "mt-2 w-full rounded-xl border border-white/10 bg-[#090c10] p-3 text-sm text-white outline-none focus:border-[#d7ad35]/50 disabled:opacity-40";
function Stat({ label, value }: { label: string; value: string | number }) { return <div className="rounded-2xl border border-white/[.08] bg-[#0e1319] p-5"><p className="text-xs text-slate-500">{label}</p><p className="mt-3 text-3xl font-semibold text-white">{value}</p></div>; }
