import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Organisations",
  description: "Explore Learnora's organisation learning approach for teams, cohorts, academies and businesses.",
};

import MarketingPage from "../../components/MarketingPage";

export default function Page() {
  return <MarketingPage page="organisation" />;
}
