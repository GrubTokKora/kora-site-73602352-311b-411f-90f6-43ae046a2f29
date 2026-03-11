type ContactProps = {
  address: string;
  phone: string;
};

function Contact({ address, phone }: ContactProps) {
  return (
    <section id="contact">
      <div className="container">
        <h2>Contact Us</h2>
        <p>Come visit us or give us a call!</p>
        <p><strong>Address:</strong> {address}</p>
        <p><strong>Phone:</strong> {phone}</p>
        <a 
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn"
        >
          Get Directions
        </a>
      </div>
    </section>
  );
}

export default Contact;