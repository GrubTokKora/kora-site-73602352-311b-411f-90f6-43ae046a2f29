type HeroProps = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaUrl: string;
};

function Hero({ title, subtitle, ctaLabel, ctaUrl }: HeroProps) {
  return (
    <section className="hero">
      <h1>{title}</h1>
      <p>{subtitle}</p>
      <a href={ctaUrl} className="btn">{ctaLabel}</a>
    </section>
  );
}

export default Hero;