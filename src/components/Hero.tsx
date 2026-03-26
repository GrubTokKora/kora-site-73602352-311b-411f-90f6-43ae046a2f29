import { useEffect, useState } from 'react'
import { ChevronRight, Star } from 'lucide-react'
import { hero, actions } from '../data'

interface HeroProps {
  businessId: string
}

export default function Hero({ businessId }: HeroProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const scrollToMenu = () => {
    const element = document.querySelector('#menu')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const scrollToContact = () => {
    const element = document.querySelector('#contact')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
<img 
          src={hero.backgroundImage}
          alt="Delicious pizza"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-gradient(to bottom, rgba(18, 24, 31, 0.8), rgba(18, 24, 31, 0.6), rgba(18, 24, 31, 1))" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20">
        {/* Rating Badge */}
        <div 
          className={`inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-8 transition-all duration-1000 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`w-4 h-4 ${i < 4 ? 'text-yellow-400 fill-yellow-400' : 'text-yellow-400 fill-yellow-400/50'}`} />
            ))}
          </div>
          <span className="text-sm font-medium text-white">4.6 Rating • South Salt Lake</span>
        </div>

        {/* Main Heading */}
        <h1 
          className={`text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-tight transition-all duration-1000 delay-200 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          The Pie <span className="gradient-text">Pizzeria</span>
        </h1>

<p 
          className={`text-xl md:text-2xl text-stone-300 max-w-3xl mx-auto mb-4 font-light transition-all duration-1000 delay-300 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          {hero.subtitle}
        </p>

        <p 
          className={`text-stone-400 max-w-2xl mx-auto mb-12 transition-all duration-1000 delay-400 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          Build your own creation or choose from our legendary specialty pizzas. Fresh ingredients, authentic recipes, unforgettable taste.
        </p>

        {/* CTA Buttons */}
        <div 
          className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-1000 delay-500 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
<button 
            onClick={scrollToMenu}
            className="group bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-red-600/25 flex items-center space-x-2"
          >
            <span>{actions.primaryCtaLabel}</span>
            <ChevronRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
          </button>
          <button 
            onClick={scrollToContact}
            className="bg-transparent border-2 border-white/30 hover:border-white text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 hover:bg-white/10"
          >
            {actions.secondaryCtaLabel}
          </button>
        </div>

        {/* Stats */}
        <div 
          className={`mt-20 grid grid-cols-3 gap-8 max-w-2xl mx-auto transition-all duration-1000 delay-700 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-white mb-1">25+</div>
            <div className="text-sm text-stone-400 uppercase tracking-wider">Years</div>
          </div>
          <div className="text-center border-x border-white/10">
            <div className="text-3xl md:text-4xl font-bold text-white mb-1">50+</div>
            <div className="text-sm text-stone-400 uppercase tracking-wider">Menu Items</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-white mb-1">4.6</div>
            <div className="text-sm text-stone-400 uppercase tracking-wider">Rating</div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-float">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
          <div className="w-1 h-2 bg-white/50 rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  )
}