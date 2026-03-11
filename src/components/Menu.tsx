type MenuProps = {
  website: string;
};

function Menu({ website }: MenuProps) {
  return (
    <section id="menu">
      <div className="container">
        <h2>Our Menu</h2>
        <p>Our menu is currently being updated. Please check back soon for our delicious selection of pizzas, calzones, and more!</p>
        <p>In the meantime, you can view our full menu on our main website.</p>
        <a href={website} className="btn" target="_blank" rel="noopener noreferrer">
          View Full Menu
        </a>
      </div>
    </section>
  );
}

export default Menu;