import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How Learnora Works",
  description: "Explore the Learnora learning cycle: learn, practise, build, review and show your progress.",
};

import MarketingPage from "../../components/MarketingPage";

export default function Page() {
  return <MarketingPage page="how" />;
}
