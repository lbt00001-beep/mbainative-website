import Doctrine from "@/components/home/Doctrine";
import Hero from "@/components/home/Hero";
import MBAIProfile from "@/components/home/MBAIProfile";
import TrainingPlatformCTA from "@/components/home/TrainingPlatformCTA";

export default function Home() {
  return (
    <main>
      <Hero />
      <Doctrine />
      <MBAIProfile />
      <TrainingPlatformCTA />
    </main>
  );
}
