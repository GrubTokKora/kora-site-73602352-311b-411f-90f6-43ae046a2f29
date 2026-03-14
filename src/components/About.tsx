type AboutProps = {
  description: string;
};

function About({ description }: AboutProps) {
  return (
    <section id="about">
      <div className="container">
        <h2>Know About Us</h2>
        <p>{description}</p>
      </div>
    </section>
  );
}

export default About;