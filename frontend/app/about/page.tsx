import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Learnora",
  description: "Learn how Learnora ME connects structured learning, practical work, feedback and evidence of skills.",
};

import MarketingPage from "../../components/MarketingPage";

export default function Page() {
  return <MarketingPage page="about" />;
}
