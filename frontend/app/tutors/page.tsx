import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Instructor Directory",
  description: "Explore approved public instructor profiles published by Learnora.",
};

import TutorsPage from "../../components/TutorsPage";

export default function Page() {
  return <TutorsPage />;
}
