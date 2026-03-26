import { Clock, MapPin } from 'lucide-react'
import { hours, contact } from '../data'

const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const hoursData = daysOfWeek.map(day => ({
  day: day.charAt(0).toUpperCase() + day.slice(1),
  hours: hours[day] || 'Closed'
}));

export default function Hours() {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })
  
  return (
    <section id="hours" className="py-24 bg-stone-900 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-red-600/5 to-transparent pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Hours Side */}
          <div className="scroll-reveal">
            <div className="inline-flex items-center space-x-2 px-4 py-1 bg-red-600/10 text-red-500 rounded-full text-sm font-semibold uppercase tracking-wider mb-4">
              <Clock className="w-4 h-4" />
              <span>Opening Hours</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
              Come Visit <span className="gradient-text">Us</span>
            </h2>
            
            <div className="space-y-4">
              {hoursData.map((item, index) => {
                const isToday = item.day === today
                return (
                  <div 
                    key={item.day}
                    className={`flex justify-between items-center p-4 rounded-xl transition-all duration-300 ${
                      isToday 
                        ? 'bg-red-600/20 border border-red-600/30' 
                        : 'bg-stone-800/50 hover:bg-stone-800'
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center space-x-3">
                      <span className={`font-medium ${isToday ? 'text-red-400' : 'text-stone-400'}`}>
                        {item.day}
                      </span>
                      {isToday && (
                        <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded-full">
                          TODAY
                        </span>
                      )}
                    </div>
                    <span className={`font-semibold ${isToday ? 'text-white' : 'text-stone-300'}`}>
                      {item.hours}
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="mt-8 p-6 bg-stone-800/50 rounded-2xl border border-stone-700/50">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-white font-semibold mb-1">Location</h3>
                  <p className="text-stone-400 text-sm leading-relaxed">
                    {contact.address.split(',')[0].trim()}<br />
                    {contact.address.split(',').slice(1, -1).join(',').trim()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Map/Visual Side */}
          <div className="scroll-reveal delay-200">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl h-[500px] bg-stone-800 group">
              {/* Static Map Representation */}
              <div className="absolute inset-0 bg-stone-800">
                <div className="absolute inset-0 opacity-30">
                  <div className="w-full h-full" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%239C92AC' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                  }} />
                </div>
                {/* Map Marker */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="relative">
                    <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-red-600/50">
                      <MapPin className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 translate-y-full">
                      <div className="bg-white px-4 py-2 rounded-lg shadow-xl whitespace-nowrap">
                        <p className="text-stone-900 font-bold text-sm">The Pie Pizzeria</p>
                        <p className="text-stone-500 text-xs">South Salt Lake</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Overlay with CTA */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-stone-950 to-transparent">
                <a 
                  href={`https://maps.google.com/?q=${encodeURIComponent(contact.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-white text-stone-900 text-center py-3 rounded-xl font-semibold hover:bg-stone-100 transition-colors duration-300"
                >
                  Get Directions
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}