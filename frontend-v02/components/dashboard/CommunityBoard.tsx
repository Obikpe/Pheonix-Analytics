"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, CheckCircle2, MessageCircle, Plus, RefreshCw, Send } from "lucide-react";
import { request } from "../../lib/api/client";

type Discussion = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  category: "question" | "discussion";
  status: "open" | "closed";
  created_at: string;
  author_name?: string;
  reply_count?: number;
};

type Reply = {
  id: string;
  user_id: string;
  body: string;
  author_name?: string;
  is_answer?: boolean;
  created_at: string;
};

export default function CommunityBoard() {
  const [items, setItems] = useState<Discussion[]>([]);
  const [courseOptions, setCourseOptions] = useState<any[]>([]);
  const [courseFilter, setCourseFilter] = useState("");
  const [active, setActive] = useState<Discussion | null>(null);
  const [isAuthor, setIsAuthor] = useState(false);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<"question" | "discussion">("question");
  const [replyBody, setReplyBody] = useState("");
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const endpoint = "/community/discussions" + (courseFilter ? "?course_id=" + encodeURIComponent(courseFilter) : "");
      const result = await request<{ discussions?: Discussion[] }>(endpoint);
      setItems(result.discussions || []);
    } catch (e: any) {
      setError(e.message || "Community discussions could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [courseFilter]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { request<any>("/progress/me").then(r => setCourseOptions((r.courses || []).map((x: any) => x.course).filter((x: any) => x?.id))).catch(() => setCourseOptions([])); }, []);

  async function openDiscussion(item: Discussion) {
    setError("");
    setNotice("");
    try {
      const result = await request<{ discussion: Discussion; replies: Reply[]; is_author?: boolean }>("/community/discussions/" + encodeURIComponent(item.id));
      setActive(result.discussion);
      setIsAuthor(Boolean(result.is_author));
      setReplies(result.replies || []);
    } catch (e: any) {
      setError(e.message || "This discussion could not be opened.");
    }
  }

  async function createDiscussion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setError("");
    setNotice("");
    try {
      const result = await request<{ discussion: Discussion }>("/community/discussions", {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), body: body.trim(), category, course_id: courseFilter || null }),
      });
      setTitle("");
      setBody("");
      setCategory("question");
      setNotice("Your post has been published.");
      await load();
      if (result.discussion) {
        setActive(result.discussion);
        setIsAuthor(true);
        setReplies([]);
      }
    } catch (e: any) {
      setError(e.message || "Your post could not be published.");
    } finally {
      setCreating(false);
    }
  }

  async function sendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!active || !replyBody.trim()) return;
    setSending(true);
    setError("");
    setNotice("");
    try {
      await request("/community/discussions/" + encodeURIComponent(active.id) + "/replies", {
        method: "POST",
        body: JSON.stringify({ body: replyBody.trim() }),
      });
      setReplyBody("");
      await openDiscussion(active);
      await load();
    } catch (e: any) {
      setError(e.message || "Your reply could not be sent.");
    } finally {
      setSending(false);
    }
  }

  async function updateStatus(status: "open" | "closed") {
    if (!active) return;
    setError("");
    setNotice("");
    try {
      await request("/community/discussions/" + encodeURIComponent(active.id), {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setActive({ ...active, status });
      setNotice(status === "closed" ? "Discussion closed to new replies." : "Discussion reopened.");
      await load();
    } catch (e: any) {
      setError(e.message || "Discussion status could not be changed.");
    }
  }

  async function markAnswer(replyId: string) {
    if (!active) return;
    setError("");
    setNotice("");
    try {
      await request("/community/discussions/" + encodeURIComponent(active.id) + "/replies/" + encodeURIComponent(replyId) + "/answer", { method: "POST" });
      await openDiscussion(active);
      setNotice("Answer marked as accepted.");
      await load();
    } catch (e: any) {
      setError(e.message || "The answer could not be marked.");
    }
  }

  const formatDate = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Recently" : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <section className="mt-7 space-y-6">
      {(error || notice) && <div role={error ? "alert" : "status"} className={"rounded-xl border p-4 text-sm " + (error ? "border-red-400/20 bg-red-400/[.05] text-red-200" : "border-emerald-400/20 bg-emerald-400/[.05] text-emerald-200")}>{error || notice}<button onClick={() => { setError(""); setNotice(""); }} className="ml-3 underline underline-offset-4">Dismiss</button></div>}

      {active ? (
        <article className="rounded-2xl border border-white/[.08] bg-[#0e1319] p-5 sm:p-7">
          <button onClick={() => { setActive(null); setReplies([]); setError(""); setNotice(""); }} className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft size={15} /> All discussions</button>
          <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1"><span className="rounded-full border border-[#d7ad35]/20 bg-[#d7ad35]/[.06] px-3 py-1 text-[10px] uppercase tracking-[.16em] gold">{active.category}</span><h2 className="mt-4 break-words font-display text-3xl sm:text-4xl">{active.title}</h2><p className="mt-3 text-xs text-slate-500">Posted by {active.author_name || "Learnora member"} · {formatDate(active.created_at)}</p></div>
            <span className={"rounded-full px-3 py-1.5 text-xs " + (active.status === "open" ? "bg-emerald-300/[.08] text-emerald-200" : "bg-white/[.06] text-slate-400")}>{active.status === "open" ? "Open" : "Closed"}</span>
          </div>
          <p className="mt-6 whitespace-pre-wrap break-words text-sm leading-7 text-slate-300">{active.body}</p>
          <div className="mt-6 border-t border-white/[.07] pt-6">
            <h3 className="font-semibold">{replies.length} {replies.length === 1 ? "reply" : "replies"}</h3>
            {replies.length ? <div className="mt-4 space-y-3">{replies.map(reply => <article key={reply.id} className="rounded-xl border border-white/[.07] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-semibold">{reply.author_name || "Learnora member"}</p><div className="flex items-center gap-2">{reply.is_answer && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-300/[.08] px-2.5 py-1 text-[10px] text-emerald-200"><CheckCircle2 size={12}/> Accepted answer</span>}<time className="text-xs text-slate-600">{formatDate(reply.created_at)}</time></div></div>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-300">{reply.body}</p>
              {isAuthor && active.status === "open" && !reply.is_answer && <button onClick={() => void markAnswer(reply.id)} className="mt-3 text-xs font-semibold text-slate-500 hover:gold">Mark as accepted answer</button>}
            </article>)}</div> : <p className="mt-3 rounded-xl border border-dashed border-white/10 p-5 text-sm text-slate-500">No replies yet. Share a useful explanation, question or next step.</p>}
          </div>
          {active.status === "open" ? <form onSubmit={sendReply} className="mt-6"><label className="block text-xs text-slate-400">Your reply<textarea required minLength={1} maxLength={5000} rows={4} value={replyBody} onChange={e => setReplyBody(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#090c10] p-4 text-sm leading-6 outline-none focus:border-[#d7ad35]/50" placeholder="Be constructive. Explain your reasoning and share practical context." /></label><button disabled={sending || !replyBody.trim()} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#d7ad35] px-4 py-3 text-sm font-bold text-black disabled:opacity-50"><Send size={14}/>{sending ? "Sending…" : "Post reply"}</button></form> : <p className="mt-6 rounded-xl bg-white/[.03] p-4 text-sm text-slate-500">This discussion is closed to new replies.</p>}
          {isAuthor && <div className="mt-5 border-t border-white/[.07] pt-4"><button onClick={() => void updateStatus(active.status === "open" ? "closed" : "open")} className="text-xs text-slate-500 hover:text-white">{active.status === "open" ? "Close discussion" : "Reopen discussion"}</button><p className="mt-2 text-[11px] leading-5 text-slate-600">Only you, as the discussion author, can change its status or mark an accepted answer.</p></div>}
        </article>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
          <form onSubmit={createDiscussion} className="h-fit rounded-2xl border border-[#d7ad35]/20 bg-[#10151b] p-5 sm:p-6">
            <div className="flex items-center gap-3"><div className="rounded-xl bg-[#d7ad35]/10 p-2.5"><Plus className="gold" size={18}/></div><div><h2 className="font-semibold">Start a conversation</h2><p className="mt-1 text-xs text-slate-500">Ask a clear question or share an idea.</p></div></div>
            <label className="mt-5 block text-xs text-slate-400">Post type<select value={category} onChange={e => setCategory(e.target.value as "question" | "discussion")} className="mt-2 w-full rounded-xl border border-white/10 bg-[#090c10] p-3 text-sm text-white outline-none focus:border-[#d7ad35]/50"><option value="question">Question</option><option value="discussion">Discussion</option></select></label>
            <label className="mt-4 block text-xs text-slate-400">Title<input required minLength={5} maxLength={180} value={title} onChange={e => setTitle(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#090c10] p-3 text-sm text-white outline-none focus:border-[#d7ad35]/50" placeholder="What are you working through?" /></label>
            <label className="mt-4 block text-xs text-slate-400">Details<textarea required minLength={5} maxLength={10000} rows={6} value={body} onChange={e => setBody(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#090c10] p-3 text-sm leading-6 text-white outline-none focus:border-[#d7ad35]/50" placeholder="Add context, what you've tried, and where you're stuck." /></label>
            <button disabled={creating || !title.trim() || !body.trim()} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#d7ad35] px-4 py-3 text-sm font-bold text-black disabled:opacity-50"><Plus size={15}/>{creating ? "Publishing…" : "Publish post"}</button>
            <p className="mt-3 text-[11px] leading-5 text-slate-600">Keep personal information private. Posts are visible to authenticated Learnora learners using the community.</p>
          </form>
          <div className="rounded-2xl border border-white/[.08] bg-[#0e1319] p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Community conversations</h2><p className="mt-1 text-sm text-slate-500">{courseFilter ? "Course-only discussion space." : "Questions and ideas shared across Learnora learners."}</p></div><button onClick={() => void load()} disabled={loading} aria-label="Refresh discussions" className="rounded-lg border border-white/10 p-2.5 text-slate-400 hover:text-white disabled:opacity-50"><RefreshCw size={15} className={loading ? "animate-spin" : ""}/></button></div>
            <label className="mt-5 block max-w-md text-xs text-slate-400">Discussion space<select value={courseFilter} onChange={e => { setActive(null); setCourseFilter(e.target.value); }} className="mt-2 w-full rounded-xl border border-white/10 bg-[#090c10] p-3 text-sm text-white outline-none focus:border-[#d7ad35]/50"><option value="">All Learnora learners</option>{courseOptions.map((course: any) => <option key={course.id} value={course.id}>{course.title || "Enrolled course"}</option>)}</select></label>
            {loading ? <p className="mt-6 text-sm text-slate-500">Loading discussions…</p> : items.length ? <div className="mt-5 divide-y divide-white/[.06]">{items.map(item => <button key={item.id} onClick={() => void openDiscussion(item)} className="block w-full py-4 text-left first:pt-0 last:pb-0"><div className="flex flex-wrap items-center gap-2"><span className="text-[10px] uppercase tracking-[.14em] gold">{item.category}</span><span className="text-[10px] text-slate-600">{item.status}</span></div><h3 className="mt-2 text-base font-semibold text-white hover:gold">{item.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">{item.body}</p><p className="mt-3 text-xs text-slate-600">{item.author_name || "Learnora member"} · {formatDate(item.created_at)} · {item.reply_count || 0} replies</p></button>)}</div> : <div className="mt-6 rounded-xl border border-dashed border-white/10 p-6 text-center"><MessageCircle className="mx-auto gold" size={22}/><p className="mt-3 font-medium">No conversations yet</p><p className="mt-2 text-sm leading-6 text-slate-500">Be the first to ask a question or share something you have learned.</p></div>}
          </div>
        </div>
      )}
    </section>
  );
}
