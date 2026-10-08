"use client";
import {useEffect,useState} from "react";
import {currentUser} from "../../../../lib/api";
import {adminCourses,organisations,organisationRequests,creatorApplications,aiProviders} from "../../../../lib/api/admin";
import Shell from "../../../../components/dashboard/Shell";
import SectionHeader from "../../../../components/dashboard/SectionHeader";
import DataTable from "../../../../components/dashboard/DataTable";
import EmptyState from "../../../../components/feedback/EmptyState";
export default function AdminSection({params}:{params:{section:string}}){
 const[u,setU]=useState<any>(null),[data,setData]=useState<any>(null),[err,setErr]=useState("");
 useEffect(()=>{currentUser().then(x=>{if(x.account_type!=="admin")location.href="/dashboard";else setU(x)}).catch(()=>location.href="/login")},[]);
 useEffect(()=>{if(!u)return;let fn:Promise<any>;switch(params.section){case"courses":fn=adminCourses();break;case"organisations":fn=organisations();break;case"commercial":fn=organisationRequests();break;case"creators":fn=creatorApplications();break;case"ai":fn=aiProviders();break;default:fn=Promise.resolve(null)}fn.then(setData).catch(e=>setErr(e.message))},[u,params.section]);
 if(!u)return <div className="p-10">Loading administration…</div>;
 const s=params.section, rows=data?.courses||data?.organisations||data?.requests||data?.applications||data?.providers||[];
 let columns:any[]=[];
 if(s==="courses")columns=[{key:"title",label:"Course"},{key:"ownership",label:"Ownership"},{key:"status",label:"Status"},{key:"level",label:"Level"}];
 else if(s==="organisations")columns=[{key:"name",label:"Organisation"},{key:"organisation_type",label:"Type"},{key:"template",label:"Template"},{key:"is_active",label:"Status",render:(r:any)=>r.is_active?"Active":"Inactive"}];
 else if(s==="commercial")columns=[{key:"organisation_name",label:"Organisation"},{key:"request_type",label:"Request"},{key:"status",label:"Status"},{key:"created_at",label:"Submitted"}];
 else if(s==="creators")columns=[{key:"status",label:"Status"},{key:"created_at",label:"Submitted"},{key:"user_id",label:"Applicant"}];
 else if(s==="ai")columns=[{key:"display_name",label:"Provider"},{key:"default_model",label:"Model"},{key:"enabled",label:"Enabled"}];
 return <Shell admin role={u.role} active={s}><SectionHeader eyebrow="Learnora administration" title={s==="ai"?"AI operations":s.replaceAll("-"," ")} description="Live operational records from the Learnora backend."/>
 {err?<div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 text-red-300">{err}</div>:data===null?<EmptyState title="No live endpoint for this area yet" message="This surface stays empty until the backend exposes a corresponding operation."/>:<DataTable rows={rows} columns={columns}/>}</Shell>
}