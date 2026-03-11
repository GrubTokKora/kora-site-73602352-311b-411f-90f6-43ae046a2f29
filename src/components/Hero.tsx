type HeroProps = {
  title: string;
  subtitle: string;
};

function Hero({ title, subtitle }: HeroProps) {
  return (
    <section className="hero">
      <h1>{title}</h1>
      <p>{subtitle}</p>
      <a href="#menu" className="btn">View Our Menu</a>
    </section>
  );
}

export default Hero;