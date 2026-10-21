import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { HelixScroll } from "@/components/helix/HelixScroll";
import { FlavorGrid } from "@/components/FlavorGrid";
import { Interlude } from "@/components/Interlude";
import { OrderCTA } from "@/components/OrderCTA";
import { Footer } from "@/components/Footer";

export default function Home() {
  return <div id="home">
    <a href="#main" className="skip-link">Skip to content</a>
    <Header />
    <main id="main" tabIndex={-1}>
      <Hero />
      <HelixScroll />
      <FlavorGrid />
      <Interlude />
      <OrderCTA />
    </main>
    <Footer />
  </div>;
}
