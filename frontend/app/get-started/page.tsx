import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get Started",
  description: "Choose your Learnora path as a learner, instructor or organisation.",
};

import GetStartedPage from "../../components/GetStartedPage";

export default function Page() {
  return <GetStartedPage />;
}
