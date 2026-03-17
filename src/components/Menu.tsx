import { useState } from 'react'
import { Plus } from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  description: string
  price: string
  category: string
  popular?: boolean
}

const menuItems: MenuItem[] = [
  // Build Your Own
  {
    id: 'byo-1',
    name: 'Build Your Own Pizza',
    description: 'Start with our signature thick crust and tomato sauce, then add your favorite toppings. Cheese included.',
    price: '12.99',
    category: 'Build Your Own',
  },
  // Specialty Pizzas
  {
    id: 'spec-1',
    name: 'The Ultimate Pie',
    description: 'Pepperoni, sausage, mushrooms, onions, green peppers, black olives, and extra cheese.',
    price: '24.99',
    category: 'Specialty Pizzas',
    popular: true,
  },
  {
    id: 'spec-2',
    name: 'BBQ Chicken',
    description: 'Grilled chicken, red onions, cilantro, and our tangy BBQ sauce with mozzarella.',
    price: '22.99',
    category: 'Specialty Pizzas',
  },
  {
    id: 'spec-3',
    name: 'Veggie Supreme',
    description: 'Mushrooms, onions, green peppers, black olives, tomatoes, and spinach.',
    price: '21.99',
    category: 'Specialty Pizzas',
  },
  {
    id: 'spec-4',
    name: 'Meat Lovers',
    description: 'Pepperoni, sausage, ham, bacon, and ground beef with extra cheese.',
    price: '25.99',
    category: 'Specialty Pizzas',
    popular: true,
  },
  {
    id: 'spec-5',
    name: 'Margherita',
    description: 'Fresh mozzarella, sliced tomatoes, basil, and olive oil on our classic crust.',
    price: '19.99',
    category: 'Specialty Pizzas',
  },
  {
    id: 'spec-6',
    name: 'Hawaiian',
    description: 'Ham, pineapple, and bacon with our signature tomato sauce.',
    price: '20.99',
    category: 'Specialty Pizzas',
  },
  // Calzones & Strombolis
  {
    id: 'cal-1',
    name: 'Classic Calzone',
    description: 'Ricotta, mozzarella, and ham baked in our famous dough. Served with marinara.',
    price: '14.99',
    category: 'Calzones & Strombolis',
  },
  {
    id: 'cal-2',
    name: 'Stromboli Special',
    description: 'Pepperoni, sausage, peppers, onions, and mozzarella rolled in our dough.',
    price: '15.99',
    category: 'Calzones & Strombolis',
    popular: true,
  },
  // Sides
  {
    id: 'side-1',
    name: 'Garlic Breadsticks',
    description: 'Fresh-baked breadsticks with garlic butter and parmesan. Served with marinara.',
    price: '6.99',
    category: 'Sides',
  },
  {
    id: 'side-2',
    name: 'Cheesy Breadsticks',
    description: 'Our famous breadsticks loaded with mozzarella and served with ranch.',
    price: '8.99',
    category: 'Sides',
    popular: true,
  },
  {
    id: 'side-3',
    name: 'Wings (10 pcs)',
    description: 'Choose from Buffalo, BBQ, or Garlic Parmesan. Served with celery and ranch.',
    price: '12.99',
    category: 'Sides',
  },
  // Salads
  {
    id: 'salad-1',
    name: 'Caesar Salad',
    description: 'Romaine lettuce, croutons, parmesan cheese, and our house Caesar dressing.',
    price: '9.99',
    category: 'Salads',
  },
  {
    id: 'salad-2',
    name: 'Garden Salad',
    description: 'Mixed greens, tomatoes, cucumbers, red onions, olives, and balsamic vinaigrette.',
    price: '8.99',
    category: 'Salads',
  },
]

const categories = ['All', 'Build Your Own', 'Specialty Pizzas', 'Calzones & Strombolis', 'Sides', 'Salads']

export default function Menu() {
  const [activeCategory, setActiveCategory] = useState('All')

  const filteredItems = activeCategory === 'All' 
    ? menuItems 
    : menuItems.filter(item => item.category === activeCategory)

  return (
    <section id="menu" className="py-24 bg-stone-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 scroll-reveal">
          <div className="inline-block px-4 py-1 bg-red-600/10 text-red-500 rounded-full text-sm font-semibold uppercase tracking-wider mb-4">
            Our Menu
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Delicious <span className="gradient-text">Offerings</span>
          </h2>
          <p className="text-stone-400 max-w-2xl mx-auto">
            From our signature thick-crust pizzas to handmade calzones, every item is crafted with love and the freshest ingredients.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-12 scroll-reveal">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                activeCategory === category
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/25'
                  : 'bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-white'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item, index) => (
            <div
              key={item.id}
              className="scroll-reveal group bg-stone-800/50 backdrop-blur-sm rounded-2xl p-6 hover:bg-stone-800 transition-all duration-300 hover-lift border border-stone-700/50 hover:border-red-600/30"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold text-white group-hover:text-red-500 transition-colors duration-300">
                      {item.name}
                    </h3>
                    {item.popular && (
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-semibold rounded-full">
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="text-stone-400 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <span className="text-2xl font-bold text-red-500">${item.price}</span>
                </div>
              </div>
              <div className="pt-4 border-t border-stone-700/50 flex justify-between items-center">
                <span className="text-xs text-stone-500 uppercase tracking-wider">{item.category}</span>
                <button className="flex items-center space-x-1 text-red-500 hover:text-red-400 text-sm font-medium transition-colors duration-300 group/btn">
                  <span>Add to Order</span>
                  <Plus className="w-4 h-4 transform group-hover/btn:rotate-90 transition-transform duration-300" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* View Full Menu CTA */}
        <div className="text-center mt-12 scroll-reveal">
          <button className="bg-transparent border-2 border-red-600 text-red-500 hover:bg-red-600 hover:text-white px-8 py-3 rounded-full font-semibold transition-all duration-300">
            Download Full Menu PDF
          </button>
        </div>
      </div>
    </section>
  )
}