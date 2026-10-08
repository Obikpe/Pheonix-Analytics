"use client";

import {useEffect,useState} from "react";
import Shell from "./Shell";
import {contentCourses,contentLesson,contentLessonMedia,contentLessons,contentModules} from "../lib/content";
import {teamMe} from "../lib/api";

export default function ContentWorkspace(){
  const [user,setUser]=useState<any>(null);
  const [courses,setCourses]=useState<any[]>([]);
  const [courseId,setCourseId]=useState("");
  const [modules,setModules]=useState<any[]>([]);
  const [moduleId,setModuleId]=useState("");
  const [lessons,setLessons]=useState<any[]>([]);
  const [lessonId,setLessonId]=useState("");
  const [lesson,setLesson]=useState<any>(null);
  const [media,setMedia]=useState<any>({videos:[],resources:[]});
  const [error,setError]=useState("");

  useEffect(()=>{
    Promise.all([teamMe(),contentCourses()]).then(([me,data])=>{
      setUser(me);
      setCourses(data.courses||[]);
      if(data.courses?.[0]) setCourseId(String(data.courses[0].id));
    }).catch(e=>setError(e.message||"Unable to load content workspace"));
  },[]);

  useEffect(()=>{
    if(!courseId)return;
    setModuleId("");setLessonId("");setLesson(null);
    contentModules(courseId).then(d=>{setModules(d.modules||[]);if(d.modules?.[0])setModuleId(String(d.modules[0].id));}).catch(e=>setError(e.message));
  },[courseId]);

  useEffect(()=>{
    if(!moduleId)return;
    setLessonId("");setLesson(null);
    contentLessons(moduleId).then(d=>{setLessons(d.lessons||[]);if(d.lessons?.[0])setLessonId(String(d.lessons[0].id));}).catch(e=>setError(e.message));
  },[moduleId]);

  useEffect(()=>{
    if(!lessonId){setLesson(null);setMedia({videos:[],resources:[]});return;}
    Promise.all([contentLesson(lessonId),contentLessonMedia(lessonId)]).then(([l,m])=>{setLesson(l.lesson);setMedia(m)}).catch(e=>setError(e.message));
  },[lessonId]);

  if(!user)return <div className="p-10 text-slate-400">Loading secure workspace…</div>;

  return <Shell roles={user.roles||[]} active="content">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs uppercase tracking-[.2em] text-[#d7ad35]">Learning operations</p><h1 className="mt-2 text-4xl font-semibold">Course content</h1><p className="mt-2 text-slate-500">Inspect live courses, modules, lessons and attached media.</p></div>
      <div className="text-xs text-slate-500">{courses.length} live course{courses.length===1?"":"s"}</div>
    </div>
    {error&&<div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">{error}</div>}
    {!courses.length?<div className="mt-8 rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-slate-500">No courses are currently available to this internal workspace.</div>:
    <div className="mt-8 grid gap-5 xl:grid-cols-[280px_280px_320px_1fr]">
      <Panel title="Courses"><select value={courseId} onChange={e=>setCourseId(e.target.value)} className="field">{courses.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select></Panel>
      <Panel title="Modules">{modules.map(m=><button key={m.id} onClick={()=>setModuleId(String(m.id))} className={"item "+(String(m.id)===moduleId?"active":"")}>{m.title}<span>{m.status}</span></button>)}{!modules.length&&<Muted>Nothing returned.</Muted>}</Panel>
      <Panel title="Lessons">{lessons.map(l=><button key={l.id} onClick={()=>setLessonId(String(l.id))} className={"item "+(String(l.id)===lessonId?"active":"")}>{l.title}<span>{l.lesson_type}</span></button>)}{!lessons.length&&<Muted>Nothing returned.</Muted>}</Panel>
      <Panel title={lesson?.title||"Lesson detail"}>{lesson?<><div className="space-y-4 text-sm"><Meta label="Status" value={lesson.status}/><Meta label="Type" value={lesson.lesson_type}/><Meta label="Duration" value={lesson.duration_minutes?lesson.duration_minutes+" minutes":"—"}/><div><p className="label">Description</p><p className="mt-1 text-slate-300">{lesson.description||"No description stored."}</p></div><div><p className="label">Content</p><pre className="mt-1 max-h-64 overflow-auto rounded-xl bg-black/20 p-4 whitespace-pre-wrap text-xs text-slate-300">{lesson.content||"No lesson content stored."}</pre></div><div><p className="label">Media</p><p className="mt-1 text-slate-300">{media.videos.length} video{media.videos.length===1?"":"s"} · {media.resources.length} resource{media.resources.length===1?"":"s"}</p></div></div></>:<Muted>Select a lesson to inspect its live content and media metadata.</Muted>}</Panel>
    </div>}
  </Shell>
}

function Panel({title,children}:{title:string;children:React.ReactNode}){return <section className="rounded-2xl border border-white/[.07] bg-[#0e1319] p-4"><h2 className="mb-4 text-sm font-semibold text-slate-200">{title}</h2>{children}</section>}
function Muted({children}:{children:React.ReactNode}){return <p className="text-sm text-slate-500">{children}</p>}
function Meta({label,value}:{label:string;value:any}){return <div><p className="label">{label}</p><p className="mt-1 text-slate-300">{value||"—"}</p></div>}
