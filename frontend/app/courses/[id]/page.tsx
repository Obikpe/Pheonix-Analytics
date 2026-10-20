"use client";

import { useParams } from "next/navigation";
import CourseDetailPage from "../../../components/CourseDetailPage";

export default function Page() {
  const params = useParams<{ id: string }>();
  return <CourseDetailPage courseId={params.id} />;
}
