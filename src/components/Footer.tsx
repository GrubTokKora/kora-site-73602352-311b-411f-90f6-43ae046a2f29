import { useState } from 'react';
import type { FormEvent } from 'react';
import { subscribeToNewsletter } from '../newsletter';
import { BUSINESS_ID } from '../App';

function Footer({ businessName }: { businessName: string }) {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) {
      setMessage('Please enter a valid email address.');
      return;
    }
    setMessage('Subscribing...');
    const result = await subscribeToNewsletter({
      businessId: BUSINESS_ID,
      email: email,
      emailOptIn: true,
    });
    if (result.success) {
      setMessage('Thank you for subscribing!');
      setEmail('');
    } else {
      setMessage(result.message || 'An error occurred.');
    }
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="newsletter-form">
          <h3>Join Our Newsletter</h3>
          <p>Get updates on special offers and events.</p>
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" className="btn">Subscribe</button>
          </form>
          {message && <p className="newsletter-message">{message}</p>}
        </div>
        <p>&copy; {currentYear} {businessName}. All Rights Reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;