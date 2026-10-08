"use client";
import{useState}from"react";
import{useRouter}from"next/navigation";
import Logo from"../../components/brand/Logo";
import Toast from"../../components/feedback/Toast";
import{login,setToken}from"../../lib/api";
const API_URL=(process.env.NEXT_PUBLIC_API_URL||"https://learnora-backend.vercel.app").replace(/\/$/,"");
export default function Login(){
 const[email,setE]=useState(""),[password,setP]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false);
 const router=useRouter();
 async function submit(e:any){
  e.preventDefault();setError("");setBusy(true);
  try{
   // Internal Learnora staff must authenticate through the internal auth route,
   // which issues a staff-scoped token accepted by /api/internal/* endpoints.
   let internalResponse:Response|undefined;
   try{
    internalResponse=await fetch(API_URL+"/api/internal/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password}),cache:"no-store"});
   }catch{/* Learner login is still attempted below. */}
   if(internalResponse?.ok){
    const staffResult:any=await internalResponse.json();
    const roles:string[]=Array.isArray(staffResult?.staff?.roles)?staffResult.staff.roles:[];
    if(!roles.includes("super_admin")){
     setError("This account has internal staff access, but it is not assigned the super_admin role.");
     return;
    }
    localStorage.setItem("learnora_internal_token",staffResult.token);
    localStorage.removeItem("phx_token");
    router.push("/dashboard/admin/super_admin");
    return;
   }
   const r:any=await login(email,password);
   if(r.account_type==="admin"&&r.role==="super_admin"){
    setError("This account uses legacy administrator authentication. Sign-in through the internal staff workspace must be enabled before it can access the new Super Admin dashboard.");
    return;
   }
   setToken(r.token||r.access_token);
   router.push(r.account_type==="admin"?"/dashboard/admin":"/dashboard");
  }catch(x:any){setError(x.message||"Unable to sign in. Please try again.");}
  finally{setBusy(false);}
 }
 return <main className="grid min-h-screen lg:grid-cols-2"><div className="hidden bg-cover bg-center lg:block" style={{backgroundImage:"linear-gradient(90deg,#07090c33,#07090c),url(https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=80)"}}/><div className="flex items-center px-6"><form onSubmit={submit} className="mx-auto w-full max-w-md"><a href="/"><Logo/></a><h1 className="mt-16 font-display text-5xl">Welcome back.</h1><p className="mt-3 text-slate-500">Sign in to the Learnora experience available to you.</p><div className="mt-8 grid gap-5"><label>Email<input value={email} onChange={e=>setE(e.target.value)} type="email" required autoComplete="username" className="mt-2 w-full rounded-xl border border-white/10 bg-white/[.03] p-3 outline-none"/></label><label>Password<input value={password} onChange={e=>setP(e.target.value)} type="password" required autoComplete="current-password" className="mt-2 w-full rounded-xl border border-white/10 bg-white/[.03] p-3 outline-none"/></label><button disabled={busy} className="rounded-xl bg-[#d7ad35] p-3.5 font-bold text-black disabled:opacity-60">{busy?"Signing in…":"Log in"}</button></div><div className="mt-6 text-sm text-slate-500"><a className="gold" href="/register">Create an account</a> · <a href="/forgot-password">Forgot password?</a></div></form></div>{error&&<Toast title="Sign in failed" message={error} type="error" onClose={()=>setError("")}/>}</main>
}