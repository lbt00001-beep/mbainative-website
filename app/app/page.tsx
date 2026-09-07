import { pageMetadata } from '@/lib/seo';
import Doctrine from '@/components/home/Doctrine';
import Hero from '@/components/home/Hero';
import MBAIProfile from '@/components/home/MBAIProfile';
import TrainingPlatformCTA from '@/components/home/TrainingPlatformCTA';
import FeaturedApplications from '@/components/home/FeaturedApplications';
import PracticalGuide from '@/components/home/PracticalGuide';
import AINewsWidget from '@/components/AINewsWidget';
export const metadata = pageMetadata('/');
export default function Home() {
  return <>
    <Hero /><FeaturedApplications /><PracticalGuide /><Doctrine /><MBAIProfile />
    <section className="site-shell section-block"><AINewsWidget limit={3} showViewAll /></section>
    <TrainingPlatformCTA />
  </>;
}
