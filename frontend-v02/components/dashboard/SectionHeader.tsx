export default function SectionHeader({eyebrow,title,description,action}:{eyebrow?:string;title:string;description?:string;action?:React.ReactNode}) {
  return <header className="mb-7 flex flex-col gap-5 border-b border-white/[.1] pb-6 md:flex-row md:items-end md:justify-between md:pb-7">
    <div className="min-w-0">{eyebrow&&<p className="section-kicker">{eyebrow}</p>}<h1 className="mt-3 font-display text-4xl leading-tight tracking-tight sm:text-5xl">{title}</h1>{description&&<p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">{description}</p>}</div>
    {action&&<div className="shrink-0">{action}</div>}
  </header>;
}