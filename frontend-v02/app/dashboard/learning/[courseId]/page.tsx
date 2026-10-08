"use client";
import{useEffect,useMemo,useRef,useState}from"react";
import Shell from"../../../../components/dashboard/Shell";
import EmptyState from"../../../../components/feedback/EmptyState";
import{request}from"../../../../lib/api/client";

export default function LearningPlayer({params}:{params:{courseId:string}}){
 const[d,setD]=useState<any>(),[err,setErr]=useState(""),[media,setMedia]=useState<any>({videos:[],resources:[]});
 const[current,setCurrent]=useState<any>(null),lastSaved=useRef(0);
 useEffect(()=>{request<any>("/progress/courses/"+encodeURIComponent(params.courseId)).then(x=>setD(x.progress)).catch(x=>setErr(x.message))},[params.courseId]);
 const lessons=useMemo(()=>d?.modules?.flatMap((m:any)=>m.lessons||[])||[],[d]);
 useEffect(()=>{if(!current&&lessons.length)setCurrent(lessons.find((l:any)=>!l.progress?.completed)||lessons[0])},[lessons,current]);
 useEffect(()=>{if(!current)return;setMedia({videos:[],resources:[]});request<any>("/progress/lessons/"+encodeURIComponent(current.id)+"/media").then(setMedia).catch(x=>setErr(x.message))},[current]);
 const saveProgress=(percent:number,position:number,completed=false)=>request<any>("/progress/lessons/"+current.id,{method:"PUT",body:JSON.stringify({progress_percent:Math.max(0,Math.min(100,Math.round(percent))),completed,last_position_seconds:Math.max(0,Math.round(position))})}).then(x=>setD(x.course_progress)).catch(x=>setErr(x.message));
 if(err&&!d)return <Shell active="learning"><EmptyState title="Learning unavailable" message={err}/></Shell>;
 if(!d)return <Shell active="learning"><p className="text-slate-500">Loading your course…</p></Shell>;
 const video=media.videos?.[0];
 return <Shell active="learning"><div className="grid gap-6 lg:grid-cols-[280px_1fr]">
 <aside className="rounded-2xl border border-white/[.07] bg-[#0e1319] p-4"><p className="mb-4 text-xs uppercase tracking-[.2em] gold">Course progress</p><div className="mb-5 text-3xl font-semibold">{d.progress_percent}%</div>{lessons.map((l:any)=><button key={l.id} onClick={()=>setCurrent(l)} className={"mb-1 w-full rounded-xl p-3 text-left text-sm "+(current?.id===l.id?"bg-[#d7ad35]/10 text-[#f2d477]":"text-slate-500")}>{l.title}<span className="ml-2 text-xs text-slate-700">{l.progress?.completed?"✓":""}</span></button>)}</aside>
 <section className="rounded-3xl border border-white/[.07] bg-[#0e1319] p-6 md:p-8"><p className="text-xs uppercase tracking-[.2em] text-slate-600">Lesson</p><h1 className="mt-2 font-display text-4xl">{current?.title||"Select a lesson"}</h1>
 {video?.signed_url?<video key={video.id} className="mt-8 w-full rounded-2xl bg-black" controls preload="metadata" src={video.signed_url} onTimeUpdate={e=>{const el=e.currentTarget;if(el.currentTime-lastSaved.current>=15){lastSaved.current=el.currentTime;saveProgress(el.duration?el.currentTime/el.duration*100:0,el.currentTime)}}} onEnded={()=>saveProgress(100,elDuration(video),true)}/>:video?.provider==="youtube"&&video?.external_video_id?<iframe className="mt-8 aspect-video w-full rounded-2xl" src={"https://www.youtube.com/embed/"+encodeURIComponent(video.external_video_id)} allowFullScreen/>:video?.provider==="vimeo"&&video?.external_video_id?<iframe className="mt-8 aspect-video w-full rounded-2xl" src={"https://player.vimeo.com/video/"+encodeURIComponent(video.external_video_id)} allowFullScreen/>:<div className="mt-8 rounded-2xl bg-black/20 p-6 text-slate-500">{current?.content||"This lesson does not have video or text content yet."}</div>}
 {current?.content&&video?.signed_url&&<div className="mt-6 whitespace-pre-wrap leading-7 text-slate-400">{current.content}</div>}
 {media.resources?.length>0&&<div className="mt-6"><h2 className="font-semibold">Resources</h2><div className="mt-3 grid gap-2">{media.resources.map((r:any)=><a key={r.id} href={r.signed_url||r.external_url||"#"} target="_blank" rel="noreferrer" className="rounded-xl border border-white/[.07] p-3 text-sm text-slate-400 hover:text-slate-200">{r.title}</a>)}</div></div>}
 {current&&<button onClick={()=>saveProgress(100,0,true)} className="mt-6 rounded-xl bg-[#d7ad35] px-5 py-3 font-semibold text-black">Mark lesson complete</button>}
 </section></div></Shell>
}
function elDuration(video:any){return Number(video?.duration_seconds||0)}
