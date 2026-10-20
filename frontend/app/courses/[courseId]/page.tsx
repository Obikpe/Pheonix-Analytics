import CourseDetailPage from "../../../components/CourseDetailPage";

export default function Page({ params }: { params: { courseId: string } }) {
  return <CourseDetailPage courseId={params.courseId} />;
}
