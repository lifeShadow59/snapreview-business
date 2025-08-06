import { CTA } from "@/components/ui/CTA";
import { Features } from "@/components/ui/Features";
import { Footer } from "@/components/ui/Footer";
import { Header } from "@/components/ui/Header";
import Hero from "@/components/ui/Hero";
import { HowItWorks } from "@/components/ui/HowItWorks";
import { Pricing } from "@/components/ui/Pricing";
import { Testimonials } from "@/components/ui/Testimonials";
import LoginPage from "../auth/login/page";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* <Header /> */}
      <main className="flex-grow">
        {/* <Hero />
        <Features />
        <HowItWorks />
        <Testimonials />
        <Pricing />
        <CTA /> */}
        {/* directly login */}
        <LoginPage />
      </main>
      {/* <Footer /> */}
    </div>
  );
}
