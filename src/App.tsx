import { useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import About from './components/About';
import Menu from './components/Menu';
import Hours from './components/Hours';
import Contact from './components/Contact';
import Footer from './components/Footer';
import { data } from './data';

// The business ID is a compile-time constant.
export const BUSINESS_ID = "73602352-311b-411f-90f6-43ae046a2f29";

function App() {
  const { business, hero, hours, contact, actions, menu } = data;

  useEffect(() => {
    document.title = business.name;
  }, [business.name]);

  // Use hero title/subtitle from backbone, with fallbacks to business name/description
  const heroTitle = hero.title || business.name;
  const heroSubtitle = hero.subtitle || business.description;

  // Use contact info from backbone, with fallbacks to business-level info
  const contactAddress = contact.address || business.address;
  const contactPhone = contact.phone; // Can be empty

  // Use primary CTA from backbone, with fallbacks for existing content
  const primaryCtaLabel = actions.primaryCtaLabel || 'View Our Menu';
  const primaryCtaUrl = actions.primaryCtaUrl || '#menu';

  return (
    <>
      <Header businessName={business.name} />
      <main>
        <Hero 
          title={heroTitle}
          subtitle={heroSubtitle}
          ctaLabel={primaryCtaLabel}
          ctaUrl={primaryCtaUrl}
        />
        <About 
          description={business.description}
        />
        <Menu menu={menu} />
        <Hours hours={hours} />
        <Contact address={contactAddress} phone={contactPhone} />
      </main>
      <Footer businessName={business.name} />
    </>
  );
}

export default App;