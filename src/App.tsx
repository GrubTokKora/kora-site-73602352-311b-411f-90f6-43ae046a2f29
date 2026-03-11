import Header from './components/Header';
import Hero from './components/Hero';
import About from './components/About';
import Menu from './components/Menu';
import Contact from './components/Contact';
import Footer from './components/Footer';

// The business ID is a compile-time constant.
export const BUSINESS_ID = "73602352-311b-411f-90f6-43ae046a2f29";

const businessInfo = {
  name: "The Pie Pizzeria",
  description: "Branch of a casual local chain delivering thick build-your-own & specialty pizzas & breadsticks.",
  summary: "Famous for its unique, thick-crust pizzas, calzones, and strombolis. The menu also features pasta dishes, fresh salads, and hot sandwiches, with various options to accommodate dietary preferences.",
  address: "3321 S 200 E, South Salt Lake, UT 84115, USA",
  phone: "(801) 466-5100", // Placeholder phone
  website: "http://www.thepie.com/",
};

function App() {
  return (
    <>
      <Header businessName={businessInfo.name} />
      <main>
        <Hero 
          title={businessInfo.name}
          subtitle={businessInfo.summary}
        />
        <About 
          description={businessInfo.description}
          summary={businessInfo.summary}
        />
        <Menu website={businessInfo.website} />
        <Contact address={businessInfo.address} phone={businessInfo.phone} />
      </main>
      <Footer businessName={businessInfo.name} />
    </>
  );
}

export default App;