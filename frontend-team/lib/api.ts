const BASE=(process.env.NEXT_PUBLIC_API_URL||"").replace(/\/$/,"");
export const token=()=>typeof window==="undefined"?"":localStorage.getItem("learnora_team_token")||"";
export const setToken=(v:string)=>localStorage.setItem("learnora_team_token",v);
export const clearToken=()=>localStorage.removeItem("learnora_team_token");
export async function request<T>(path:string,init:RequestInit={}):Promise<T>{const h=new Headers(init.headers);h.set("Content-Type","application/json");const t=token();if(t)h.set("Authorization","Bearer "+t);const r=await fetch(BASE+"/api/internal"+path,{...init,headers:h,cache:"no-store"});const b=await r.json().catch(()=>({}));if(!r.ok)throw new Error(typeof b.detail==="string"?b.detail:"Internal request failed");return b}
export const teamLogin=(email:string,password:string)=>request<any>("/auth/login",{method:"POST",body:JSON.stringify({email,password})});
export const teamMe=()=>request<any>("/auth/me");
export const staff=()=>request<any>("/staff");
export const staffRoles=()=>request<any>("/staff/roles/catalog");
export const departments=()=>request<any>("/departments");
export const teams=()=>request<any>("/teams");
export const teamMembers=(id:string)=>request<any>("/teams/"+encodeURIComponent(id)+"/members");

export const aiHealth=()=>request<any>("/ai/health");
export const aiProfiles=()=>request<any>("/ai/profiles");
export const updateAiProfile=(key:string,payload:any)=>request<any>("/ai/profiles/"+encodeURIComponent(key),{method:"PATCH",body:JSON.stringify(payload)});
export const testAiProfile=(key:string)=>request<any>("/ai/profiles/"+encodeURIComponent(key)+"/test",{method:"POST"});
