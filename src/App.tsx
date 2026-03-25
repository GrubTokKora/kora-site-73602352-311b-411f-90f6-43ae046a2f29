import { useEffect } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import About from './components/About'
import Menu from './components/Menu'
import Gallery from './components/Gallery'
import Hours from './components/Hours'
import Contact from './components/Contact'
import Footer from './components/Footer'
import VoiceAgentWidget from './components/VoiceAgentWidget'

import { BUSINESS_ID } from './utils/api'

function App() {
  useEffect(() => {
    // Intersection Observer for scroll animations
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed')
          observer.unobserve(entry.target)
        }
      })
    }, observerOptions)

    // Observe all scroll-reveal elements
    const revealElements = document.querySelectorAll('.scroll-reveal')
    revealElements.forEach(el => observer.observe(el))

    return () => observer.disconnect()
  }, [])

return (
    <div className="min-h-screen bg-stone-950">
      <Navbar />
      <main>
        <Hero businessId={BUSINESS_ID} />
        <About />
        <Menu />
        <Gallery />
        <Hours />
        <Contact businessId={BUSINESS_ID} />
      </main>
      <Footer />
      <VoiceAgentWidget />
    </div>
  )
}

export default App