type HeaderProps = {
  businessName: string;
};

function Header({ businessName }: HeaderProps) {
  return (
    <header className="header">
      <div className="container">
        <a href="/" className="logo">{businessName}</a>
        <nav>
          <ul className="nav-links">
            <li><a href="#about">About</a></li>
            <li><a href="#menu">Menu</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

export default Header;