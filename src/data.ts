// This file contains the canonical data for the website, sourced from the backbone.
// It is used by components to ensure the site content is always in sync with the business data.

export const business = {
  "name": "The Pie Pizzeria - South Salt Lake",
  "description": "Branch of a casual local chain delivering thick build-your-own & specialty pizzas & breadsticks.",
  "summary": "Famous for its unique, thick-crust pizzas, calzones, and strombolis. The menu also features pasta dishes, fresh salads, and hot sandwiches, with various options to accommodate dietary preferences.",
  "address": "3321 S 200 E, South Salt Lake, UT 84115, USA",
  "website": "http://www.thepie.com/",
  "id": "73602352-311b-411f-90f6-43ae046a2f29"
};

export const hours: Record<string, string> = {
  "monday": "9:00 AM – 5:00 PM",
  "tuesday": "9:00 AM – 5:00 PM",
  "wednesday": "9:00 AM – 5:00 PM",
  "thursday": "9:00 AM – 5:00 PM",
  "friday": "9:00 AM – 5:00 PM",
  "saturday": "9:00 AM – 5:00 PM",
  "sunday": "9:00 AM – 5:00 PM",
};

export const hero = {
  "title": "The Pie Pizzeria - South Salt Lake",
  "subtitle": "Famous for thick-crust pizzas, calzones, and strombolis",
  "backgroundImage": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1981&auto=format&fit=crop",
};

export const menu = [
  {
    "id": "byo-1",
    "name": "Build Your Own Pizza",
    "description": "Start with our signature thick crust and tomato sauce, then add your favorite toppings. Cheese included.",
    "price": "12.99",
    "category": "Build Your Own"
  },
  {
    "id": "spec-1",
    "name": "The Ultimate Pie",
    "description": "Pepperoni, sausage, mushrooms, onions, green peppers, black olives, and extra cheese.",
    "price": "24.99",
    "category": "Specialty Pizzas"
  },
  {
    "id": "spec-2",
    "name": "BBQ Chicken",
    "description": "Grilled chicken, red onions, cilantro, and our tangy BBQ sauce with mozzarella.",
    "price": "22.99",
    "category": "Specialty Pizzas"
  },
  {
    "id": "spec-3",
    "name": "Veggie Supreme",
    "description": "Mushrooms, onions, green peppers, black olives, tomatoes, and spinach.",
    "price": "21.99",
    "category": "Specialty Pizzas"
  },
  {
    "id": "spec-4",
    "name": "Meat Lovers",
    "description": "Pepperoni, sausage, ham, bacon, and ground beef with extra cheese.",
    "price": "25.99",
    "category": "Specialty Pizzas"
  },
  {
    "id": "spec-5",
    "name": "Margherita",
    "description": "Fresh mozzarella, sliced tomatoes, basil, and olive oil on our classic crust.",
    "price": "19.99",
    "category": "Specialty Pizzas"
  },
  {
    "id": "cal-1",
    "name": "Classic Calzone",
    "description": "Ricotta, mozzarella, and ham baked in our famous dough. Served with marinara.",
    "price": "14.99",
    "category": "Calzones & Strombolis"
  },
  {
    "id": "side-1",
    "name": "Garlic Breadsticks",
    "description": "Fresh-baked breadsticks with garlic butter and parmesan. Served with marinara.",
    "price": "6.99",
    "category": "Sides"
  },
  {
    "id": "salad-1",
    "name": "Caesar Salad",
    "description": "Romaine lettuce, croutons, parmesan cheese, and our house Caesar dressing.",
    "price": "9.99",
    "category": "Salads"
  }
];

export const gallery = [
  "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?q=80&w=1935&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1981&auto=format&fit=crop",
  "https://deveusblob.blob.core.windows.net/kora-business-images/user-media/73602352-311b-411f-90f6-43ae046a2f29/10ba98a4-a410-4015-99d9-701074e2e5bc/1773406172_3rhcb8.jpeg",
  "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=2069&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1595708684082-a173bb3a06c5?q=80&w=2069&auto=format&fit=crop"
];

export const contact = {
  "address": "3321 S 200 E, South Salt Lake, UT 84115, USA",
  "phone": "(801) 555-1234",
  "email": "info@thepie.com",
};

export const socialMedia = {
  "instagram": "#",
  "facebook": "#",
  "twitter": "#",
  "youtube": "#"
};

export const actions = {
  "primaryCtaLabel": "View Menu",
  "primaryCtaUrl": "#menu",
  "secondaryCtaLabel": "Order Online",
  "secondaryCtaUrl": "#contact"
};

export const featured = {
  "title": "Popular Items",
  "items": [
    "spec-1",
    "spec-4",
    "cal-1",
    "side-1"
  ]
};