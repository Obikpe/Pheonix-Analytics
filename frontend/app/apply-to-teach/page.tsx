import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Apply to Teach",
  description: "Submit an instructor application for Learnora's review process.",
};

import ApplyToTeachPage from "../../components/ApplyToTeachPage";

export default function Page() {
  return <ApplyToTeachPage />;
}
