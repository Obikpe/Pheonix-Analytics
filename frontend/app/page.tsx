'use client';
import Header from '../components/Header';
import HeroCentered from '../components/HeroCentered';
import Library from '../components/Library';
import Playground from '../components/Playground';
import Pricing from '../components/Pricing';

export default function Page(){
  return (
    <main className="bg-[#0B0F17] text-white min-h-screen">
      <Header />
      <HeroCentered />
      <Library />
      <Playground />
      <Pricing />
    </main>
  );
}