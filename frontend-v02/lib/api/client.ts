const BASE=(process.env.NEXT_PUBLIC_API_URL||"https://learnora-backend.vercel.app").replace(/\/$/,"");
export const token=()=>typeof window==="undefined"?"":localStorage.getItem("phx_token")||"";
export const setToken=(v:string)=>localStorage.setItem("phx_token",v);
export const organisationContext=()=>typeof window==="undefined"?"":localStorage.getItem("learnora_organisation_id")||"";
export const setOrganisationContext=(id:string)=>{if(typeof window!=="undefined")localStorage.setItem("learnora_organisation_id",id)};
export const clearOrganisationContext=()=>{if(typeof window!=="undefined")localStorage.removeItem("learnora_organisation_id")};
export const clearToken=()=>{localStorage.removeItem("phx_token");clearOrganisationContext()};
export async function request<T>(path:string,init:RequestInit={}):Promise<T>{const h=new Headers(init.headers);h.set("Content-Type","application/json");const t=token();if(t)h.set("Authorization","Bearer "+t);const org=organisationContext();if(org&&!h.has("X-Organisation-ID"))h.set("X-Organisation-ID",org);const url=BASE+"/api"+path;const r=await fetch(url,{...init,headers:h,cache:"no-store"});const b=await r.json().catch(()=>({}));if(!r.ok)throw new Error(typeof b.detail==="string"?b.detail:typeof b.message==="string"?b.message:"Request failed ("+r.status+") at "+url);return b}