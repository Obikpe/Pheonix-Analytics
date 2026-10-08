import "./globals.css";
import SessionGuard from "../components/SessionGuard";

export const metadata = {
  title: "Learnora Team",
  description: "Internal Learnora operations",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionGuard />
        {children}
      </body>
    </html>
  );
}
