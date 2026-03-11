type AboutProps = {
  description: string;
  summary: string;
};

function About({ description, summary }: AboutProps) {
  return (
    <section id="about">
      <div className="container">
        <h2>About Us</h2>
        <p>{description}</p>
        <p>{summary} We've been a local favorite for years, known for our casual atmosphere and delicious, hearty meals.</p>
      </div>
    </section>
  );
}

export default About;