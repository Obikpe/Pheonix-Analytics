import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Published Courses",
  description: "Browse Learnora's live published course catalogue and find your next useful skill.",
};

import CoursesPage from "../../components/CoursesPage";

export default function Page() {
  return <CoursesPage />;
}
