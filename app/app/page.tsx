import { pageMetadata } from '@/lib/seo';
import JourneyInvitation from '@/components/home/JourneyInvitation';
import Hero from '@/components/home/Hero';
import TrainingPlatformCTA from '@/components/home/TrainingPlatformCTA';
import FeaturedApplications from '@/components/home/FeaturedApplications';
import PracticalGuide from '@/components/home/PracticalGuide';
import AINewsWidget from '@/components/AINewsWidget';
export const metadata = pageMetadata('/');
export default function Home() {
  return <>
    <Hero /><JourneyInvitation /><FeaturedApplications /><PracticalGuide />
    <section className="site-shell section-block"><AINewsWidget limit={3} showViewAll /></section>
    <TrainingPlatformCTA />
  </>;
}
