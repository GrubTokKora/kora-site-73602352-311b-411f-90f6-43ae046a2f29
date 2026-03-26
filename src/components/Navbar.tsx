import { useState, useEffect } from 'react'
import { Menu, X, Phone } from 'lucide-react'
import { contact } from '../data'

const navLinks = [
  { name: 'Home', href: '#home' },
  { name: 'About', href: '#about' },
  { name: 'Menu', href: '#menu' },
  { name: 'Gallery', href: '#gallery' },
  { name: 'Hours', href: '#hours' },
  { name: 'Contact', href: '#contact' },
]

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (href: string) => {
    setIsMobileMenuOpen(false)
    const element = document.querySelector(href)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled ? 'glass shadow-lg py-3' : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a 
            href="#home" 
            onClick={(e) => { e.preventDefault(); scrollToSection('#home') }}
            className="flex items-center space-x-2 group"
          >
            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              The Pie <span className="text-red-500">Pizzeria</span>
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => { e.preventDefault(); scrollToSection(link.href) }}
                className="text-stone-300 hover:text-white transition-colors duration-300 text-sm font-medium uppercase tracking-wider relative group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-600 transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden md:flex items-center space-x-4">
<a 
              href={`tel:${contact.phone}`} 
              className="flex items-center space-x-2 text-stone-300 hover:text-white transition-colors duration-300"
            >
              <Phone className="w-4 h-4" />
              <span className="text-sm font-medium">Order Now</span>
            </a>
            <button 
              onClick={() => scrollToSection('#contact')}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-red-600/25"
            >
              Book a Table
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors duration-300"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div 
          className={`md:hidden overflow-hidden transition-all duration-500 ease-in-out ${
            isMobileMenuOpen ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="glass rounded-2xl p-4 space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => { e.preventDefault(); scrollToSection(link.href) }}
                className="block py-3 px-4 text-stone-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300"
              >
                {link.name}
              </a>
            ))}
            <button 
              onClick={() => scrollToSection('#contact')}
              className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium transition-colors duration-300"
            >
              Book a Table
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}