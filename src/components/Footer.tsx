import { Facebook, Instagram, Twitter, Youtube, Heart } from 'lucide-react'
import { socialMedia, contact } from '../data'

const footerLinks = {
  menu: [
    { name: 'Specialty Pizzas', href: '#menu' },
    { name: 'Build Your Own', href: '#menu' },
    { name: 'Calzones', href: '#menu' },
    { name: 'Sides & Salads', href: '#menu' },
  ],
  company: [
    { name: 'About Us', href: '#about' },
    { name: 'Gallery', href: '#gallery' },
    { name: 'Hours', href: '#hours' },
    { name: 'Contact', href: '#contact' },
  ],
  legal: [
    { name: 'Privacy Policy', href: '#' },
    { name: 'Terms of Service', href: '#' },
    { name: 'Accessibility', href: '#' },
  ],
}

const socialLinks = [
  { name: 'Facebook', icon: Facebook, href: socialMedia.facebook },
  { name: 'Instagram', icon: Instagram, href: socialMedia.instagram },
  { name: 'Twitter', icon: Twitter, href: socialMedia.twitter },
  { name: 'YouTube', icon: Youtube, href: socialMedia.youtube },
].filter(link => link.href && link.href !== '#');

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-stone-950 border-t border-stone-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <a href="#home" className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <span className="text-xl font-bold text-white">
                The Pie <span className="text-red-500">Pizzeria</span>
              </span>
            </a>
            <p className="text-stone-400 text-sm mb-6 leading-relaxed">
              South Salt Lake's favorite spot for thick-crust pizzas, calzones, and strombolis since 1998.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="w-10 h-10 bg-stone-800 rounded-full flex items-center justify-center text-stone-400 hover:bg-red-600 hover:text-white transition-all duration-300"
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Menu Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Menu</h3>
            <ul className="space-y-2">
              {footerLinks.menu.map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.href}
                    className="text-stone-400 hover:text-red-500 transition-colors duration-300 text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.href}
                    className="text-stone-400 hover:text-red-500 transition-colors duration-300 text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
<ul className="space-y-3 text-sm text-stone-400">
              <li>{contact.address.split(',')[0].trim()}</li>
              <li>{contact.address.split(',').slice(1, -1).join(',').trim()}</li>
              <li className="pt-2">
                <a href={`tel:${contact.phone}`} className="hover:text-red-500 transition-colors">
                  {contact.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${contact.email}`} className="hover:text-red-500 transition-colors">
                  {contact.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-stone-800/50 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-stone-500 text-sm flex items-center">
            © {currentYear} The Pie Pizzeria. Made with <Heart className="w-4 h-4 text-red-500 mx-1 fill-red-500" /> in Salt Lake
          </p>
          <div className="flex space-x-6">
            {footerLinks.legal.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-stone-500 hover:text-stone-300 transition-colors duration-300 text-sm"
              >
                {link.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}