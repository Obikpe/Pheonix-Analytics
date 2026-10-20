import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Instructors",
  description: "Learn how instructors can structure lessons, review practical work and support learner growth on Learnora.",
};

import MarketingPage from "../../components/MarketingPage";

export default function Page() {
  return <MarketingPage page="instructor" />;
}
