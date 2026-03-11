type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: string;
  category: string;
};

type MenuProps = {
  menu: MenuItem[];
};

function Menu({ menu }: MenuProps) {
  if (!menu || menu.length === 0) {
    return (
      <section id="menu">
        <div className="container">
          <h2>Our Menu</h2>
          <p>Our menu is currently being updated. Please check back soon!</p>
        </div>
      </section>
    );
  }

  const menuByCategory = menu.reduce((acc, item) => {
    if (!item.name) return acc; // Skip empty items
    const category = item.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  return (
    <section id="menu">
      <div className="container">
        <h2>Our Menu</h2>
        {Object.entries(menuByCategory).map(([category, items]) => (
          <div key={category} className="menu-category">
            <h3>{category}</h3>
            <div className="menu-items-grid">
              {items.map((item) => (
                <div key={item.id || item.name} className="menu-item-card">
                  <h4>{item.name}</h4>
                  <p className="menu-item-description">{item.description}</p>
                  <p className="menu-item-price">${item.price}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Menu;