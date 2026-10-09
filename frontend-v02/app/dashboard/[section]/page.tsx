"use client";
import { useEffect,useState } from "react";
import { ArrowRight, BookOpen, FileCheck2, FolderKanban, Sparkles } from "lucide-react";
import { currentUser } from "../../../lib/api";
import { courses,progress,evidence } from "../../../lib/api/learning";
import { request } from "../../../lib/api/client";
import Shell from "../../../components/dashboard/Shell";
import SectionHeader from "../../../components/dashboard/SectionHeader";
import DataTable from "../../../components/dashboard/DataTable";
import EmptyState from "../../../components/feedback/EmptyState";

const labels:any={learning:"My learning",discover:"Discover",practice:"Practise",projects:"Projects",skills:"Skills",evidence:"Evidence",certificates:"Certificates",community:"Community",settings:"Settings"};
const descriptions:any={
 learning:"Return to enrolled courses and continue where you left off.",
 discover:"Explore published courses that are available to your account.",
 practice:"Use exercises and feedback to strengthen your understanding.",
 projects:"Review the practical work you have submitted through Learnora.",
 skills:"See the skills recorded in your learning profile and the evidence connected to them.",
 evidence:"Review the work and records attached to your learning journey.",
 certificates:"View certificates issued to your account.",
 community:"Ask questions and connect learning to the people who can support you.",
 settings:"Manage the profile and preferences currently available to your account."
};
export default function Page({params}:{params:{section:string}}){
 const [u,setU]=useState<any>(null),[data,setData]=useState<any>(null),[err,setErr]=useState(""),[loading,setLoading]=useState(true);
 useEffect(()=>{currentUser().then(me=>{if(me.role==="organisation_prospect"){location.href="/organisation-portal";return;}if(me.organisation_id&&["owner","admin"].includes(me.organisation_role)){location.href="/dashboard/organisation";return;}setU(me);}).catch(()=>location.href="/login")},[]);
 useEffect(()=>{
  if(!u)return;
  let cancelled=false;
  async function load(){
   setLoading(true);setErr("");setData(null);
   try{
    const s=params.section;
    const result=s==="discover"?await courses()
      :s==="learning"?await progress()
      :["evidence","skills","certificates"].includes(s)?await evidence()
      :s==="projects"?await request<any>("/evidence/projects/me")
      :null;
    if(!cancelled)setData(result);
   }catch(e:any){if(!cancelled)setErr(e.message||"This area could not be loaded.");}
   finally{if(!cancelled)setLoading(false);}
  }
  load();return()=>{cancelled=true};
 },[u,params.section]);
 if(!u)return <div className="p-10 text-slate-500">Loading your Learnora workspace…</div>;
 const section=params.section;
 const courseRows=(data?.data||data?.courses||[]).map((x:any)=>x.course?{id:x.course.id,title:x.course.title,level:x.course.level,status:x.enrolment?.status,completed_lessons:x.completed_lessons,tracked_lessons:x.tracked_lessons}:x);
 const evidenceRows=data?.evidence||[];
 const skills=data?.skills||[];
 const certs=data?.certificates||[];
 const submissions=data?.submissions||[];
 return <Shell active={section}>
  <SectionHeader eyebrow="Your Learnora" title={labels[section]||"Learnora"} description={descriptions[section]||"Your learning workspace."}/>
  {loading?<div className="mt-8 rounded-2xl border border-white/[.08] bg-[#0e1319] p-6 text-sm text-slate-500">Loading live records…</div>:err?<div role="alert" className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/[.05] p-5 text-sm text-red-200">{err}</div>:<>
   {section==="discover"&&<div className="mt-7"><DataTable rows={courseRows} emptyTitle="No published courses returned" emptyMessage="The course catalogue only shows courses that the backend has published and made available." columns={[{key:"title",label:"Course",render:r=><a className="font-medium text-white hover:gold" href={"/courses/"+r.id}>{r.title||"Untitled course"}</a>},{key:"level",label:"Level"},{key:"status",label:"Status"},{key:"estimated_hours",label:"Hours"}]}/></div>}
   {section==="learning"&&<div className="mt-7"><DataTable rows={courseRows} emptyTitle="Your learning starts here" emptyMessage="When you enrol in a course, it will appear here with its current progress." columns={[{key:"title",label:"Course",render:r=><a className="font-medium text-white" href={"/dashboard/learning/"+r.id}>{r.title||"Course"}</a>},{key:"status",label:"Enrolment"},{key:"completed_lessons",label:"Completed lessons"},{key:"tracked_lessons",label:"Lessons tracked"}]}/></div>}
   {section==="evidence"&&<div className="mt-7"><DataTable rows={evidenceRows} emptyTitle="No evidence records yet" emptyMessage="Evidence will appear after a supported project, assessment or other learning activity is recorded." columns={[{key:"skill_id",label:"Skill reference"},{key:"evidence_type",label:"Evidence type"},{key:"score",label:"Score"},{key:"created_at",label:"Added",render:r=>r.created_at?new Date(r.created_at).toLocaleDateString():"—"},{key:"notes",label:"Notes"}]}/><p className="mt-4 text-xs leading-6 text-slate-600">A saved evidence record is not automatically a verified skill. Review status is shown only when the backend has a corresponding review record.</p></div>}
   {section==="skills"&&<div className="mt-7"><DataTable rows={skills} emptyTitle="Your Skills Passport is taking shape" emptyMessage="Skills will appear here when they are recorded against your account. A skill should be treated as verified only when appropriate review evidence exists." columns={[{key:"skill_id",label:"Skill reference"},{key:"proficiency",label:"Proficiency"},{key:"status",label:"Record status"},{key:"updated_at",label:"Last updated",render:r=>r.updated_at?new Date(r.updated_at).toLocaleDateString():"—"}]}/></div>}
   {section==="certificates"&&<div className="mt-7"><DataTable rows={certs} emptyTitle="No certificates issued" emptyMessage="Certificates will appear here only when a certificate record has been issued to your account." columns={[{key:"certificate_number",label:"Certificate number"},{key:"course_id",label:"Course reference"},{key:"issued_at",label:"Issued",render:r=>r.issued_at?new Date(r.issued_at).toLocaleDateString():"—"}]}/></div>}
   {section==="projects"&&<div className="mt-7"><DataTable rows={submissions} emptyTitle="Your project record starts with a first submission" emptyMessage="Submitted projects will appear here with their review state and feedback. You can explore courses to find available practical work." columns={[{key:"title",label:"Submission",render:r=><div><p className="font-medium text-white">{r.title||r.project?.title||"Project submission"}</p><p className="mt-1 text-xs text-slate-500">{r.project?.title||"Project"}</p></div>},{key:"review_state",label:"Review",render:r=><span className={r.review_state==="reviewed"?"text-emerald-300":"text-amber-200"}>{r.review_state==="reviewed"?"Reviewed":"Awaiting review"}</span>},{key:"score",label:"Score"},{key:"submitted_at",label:"Submitted",render:r=>r.submitted_at?new Date(r.submitted_at).toLocaleDateString():"—"}]}/><p className="mt-4 text-xs leading-6 text-slate-600">Feedback and scores are displayed only when they have been saved by the backend. Awaiting review is not a competence verification.</p></div>}
   {section==="practice"&&<div className="mt-7 grid gap-4 md:grid-cols-2"><article className="rounded-2xl border border-white/[.08] bg-[#0e1319] p-6"><TargetIcon/><h2 className="mt-4 text-xl font-semibold">Practise a concept</h2><p className="mt-3 text-sm leading-7 text-slate-400">Ask the Practice Generator to create exercises for a topic, request hints, or review a mistake. AI-generated practice is guidance; it does not create a verified assessment result by itself.</p><a href="/dashboard/ai" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold gold">Open AI practice <ArrowRight size={15}/></a></article><article className="rounded-2xl border border-white/[.08] bg-[#0e1319] p-6"><BookOpen className="gold" size={22}/><h2 className="mt-4 text-xl font-semibold">Practise in context</h2><p className="mt-3 text-sm leading-7 text-slate-400">Return to a course and work through the lesson material before trying another exercise.</p><a href="/courses" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold gold">Explore courses <ArrowRight size={15}/></a></article></div>}
   {section==="community"&&<div className="mt-7"><EmptyState title="Community discussions are not connected yet" message="The current backend can send a lesson question for follow-up, but a persistent public discussion board is not available in this workspace yet. Use the course player or AI tutor for supported help." action={<a className="rounded-xl bg-[#d7ad35] px-4 py-2.5 text-sm font-bold text-black" href="/dashboard/ai">Open AI tutor</a>}/></div>}
   {section==="settings"&&<div className="mt-7"><EmptyState title="Profile settings are still being connected" message="This area will show editable account settings when the corresponding backend operations are available. No settings have been changed." action={<a className="rounded-xl border border-white/10 px-4 py-2.5 text-sm" href="/dashboard">Return to overview</a>}/></div>}
  </>}
 </Shell>;
}
function TargetIcon(){return <Sparkles className="gold" size={22}/>}
