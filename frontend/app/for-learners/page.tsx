import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Learners",
  description: "Build useful skills through structured learning, practice, projects and evidence of your work.",
};

import MarketingPage from "../../components/MarketingPage";

export default function Page() {
  return <MarketingPage page="learner" />;
}
