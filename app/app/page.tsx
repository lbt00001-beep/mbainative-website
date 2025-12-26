import Doctrine from "@/components/home/Doctrine";
import Hero from "@/components/home/Hero";
import MBAIProfile from "@/components/home/MBAIProfile";
import TrainingPlatformCTA from "@/components/home/TrainingPlatformCTA";
import AINewsWidget from "@/components/AINewsWidget";

export default function Home() {
  return (
    <main>
      <Hero />
      <Doctrine />
      <MBAIProfile />
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        <AINewsWidget limit={3} showViewAll={true} />
      </section>
      <TrainingPlatformCTA />
    </main>
  );
}
