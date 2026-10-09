import { redirect } from "next/navigation";

export default function AdminRouteRedirect({ children }: { children: React.ReactNode }) {
  redirect("https://teamslearnora.vercel.app/login");
  return children;
}
