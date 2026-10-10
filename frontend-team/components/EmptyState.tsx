import { Inbox } from "lucide-react";
type Props={title?:string;message?:string};
export default function EmptyState({title="No records",message="No live records were returned by the backend for this view."}:Props) {
  return <div className="border border-dashed border-white/[.12] px-5 py-8 text-center">
    <Inbox size={20} strokeWidth={1.6} className="mx-auto text-slate-600"/>
    <p className="mt-3 text-sm font-medium text-slate-300">{title}</p>
    <p className="mx-auto mt-2 max-w-sm text-xs leading-6 text-slate-500">{message}</p>
  </div>;
}