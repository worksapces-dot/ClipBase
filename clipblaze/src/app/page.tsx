import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { Stats } from "@/components/stats";
import { Testimonials } from "@/components/testimonials";
import { Pricing } from "@/components/pricing";
import { FAQ } from "@/components/faq";
import { GlobalReach } from "@/components/global-reach";
import { CTA } from "@/components/cta";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <Stats />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <GlobalReach />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}
