import type { Metadata } from "next";
import CourseDetailPage from "../../../components/CourseDetailPage";

type PageProps = { params: { id: string } };

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://learnora-backend.vercel.app").replace(/\/$/, "");

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const response = await fetch(API_BASE + "/api/public/courses/" + encodeURIComponent(params.id), { cache: "no-store" });
    if (response.ok) {
      const body = await response.json();
      const course = body.course || body.data || body;
      return {
        title: course.title || "Course details",
        description: course.short_description || course.description || "Explore this published Learnora course and its learning structure.",
      };
    }
  } catch {
    // Metadata must still render if the public API is temporarily unavailable.
  }
  return {
    title: "Course details",
    description: "Explore published Learnora courses and their learning structure.",
  };
}

export default function Page({ params }: PageProps) {
  return <CourseDetailPage courseId={params.id} />;
}
