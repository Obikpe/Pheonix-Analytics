import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Shell({children,admin,role,active}:{children:React.ReactNode;admin?:boolean;role?:string;active:string}) {
  return <div className="min-h-screen bg-[var(--bg)]">
    <Sidebar admin={admin} role={role} active={active}/>
    <div className="lg:pl-72">
      <Topbar admin={admin}/>
      <main className="mx-auto max-w-[1500px] px-4 pb-10 pt-6 sm:px-5 lg:px-8 lg:py-8">{children}</main>
    </div>
  </div>;
}
