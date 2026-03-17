import { ChefHat, Flame, Leaf } from 'lucide-react'

export default function About() {
  return (
    <section id="about" className="py-24 bg-stone-950 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Image Side */}
          <div className="scroll-reveal relative">
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?q=80&w=1935&auto=format&fit=crop"
                alt="Pizza preparation"
                className="rounded-2xl shadow-2xl w-full object-cover h-[500px]"
              />
              <div className="absolute -bottom-6 -right-6 bg-red-600 text-white p-6 rounded-2xl shadow-xl hidden md:block animate-float">
                <div className="text-4xl font-bold">Since</div>
                <div className="text-2xl font-light">1998</div>
              </div>
            </div>
            {/* Decorative frame */}
            <div className="absolute -top-4 -left-4 w-24 h-24 border-t-4 border-l-4 border-red-600 rounded-tl-2xl" />
            <div className="absolute -bottom-4 -right-4 w-24 h-24 border-b-4 border-r-4 border-red-600 rounded-br-2xl" />
          </div>

          {/* Content Side */}
          <div className="scroll-reveal delay-200">
            <div className="inline-block px-4 py-1 bg-red-600/10 text-red-500 rounded-full text-sm font-semibold uppercase tracking-wider mb-4">
              Our Story
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Crafting Perfect Pizzas Since <span className="text-red-500">1998</span>
            </h2>
            <p className="text-stone-400 text-lg mb-6 leading-relaxed">
              The Pie Pizzeria is a beloved branch of a casual local chain famous for its unique, thick-crust pizzas, calzones, and strombolis. We believe in using only the freshest ingredients and time-honored recipes to create unforgettable dining experiences.
            </p>
            <p className="text-stone-500 mb-8 leading-relaxed">
              Our menu also features pasta dishes, fresh salads, and hot sandwiches, with various options to accommodate dietary preferences. Whether you're dining in, taking out, or ordering delivery, we bring the authentic taste of Italian-American cuisine right to your table.
            </p>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start space-x-3 group">
                <div className="bg-red-600/10 p-3 rounded-lg group-hover:bg-red-600/20 transition-colors duration-300">
                  <ChefHat className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Expert Chefs</h3>
                  <p className="text-stone-500 text-sm">Master pizza makers</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 group">
                <div className="bg-amber-500/10 p-3 rounded-lg group-hover:bg-amber-500/20 transition-colors duration-300">
                  <Flame className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Stone Fired</h3>
                  <p className="text-stone-500 text-sm">Authentic cooking</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 group">
                <div className="bg-emerald-500/10 p-3 rounded-lg group-hover:bg-emerald-500/20 transition-colors duration-300">
                  <Leaf className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Fresh Daily</h3>
                  <p className="text-stone-500 text-sm">Local ingredients</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}