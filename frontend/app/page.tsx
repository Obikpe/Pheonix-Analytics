'use client';

import Header from '../components/Header';
import HeroCentered from '../components/HeroCentered';
import Library from '../components/Library';
import Playground from '../components/Playground';
import Pricing from '../components/Pricing';

export default function Page() {
  return (
    <main className="min-h-screen bg-white text-slate-900 antialiased">
      <Header />
      <HeroCentered />
      <Library />
      <Playground />
      <Pricing />
    </main>
  );
}