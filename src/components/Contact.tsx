import { useState, useEffect, useRef } from 'react'
import type { FormEvent } from 'react'
import { Mail, Phone, MapPin, Send, CheckCircle, Loader2 } from 'lucide-react'
import { getApiBaseUrl } from '../utils/api'
import { contact } from '../data'

interface ContactProps {
  businessId: string
}

// Global window types are defined in src/vite-env.d.ts

export default function Contact({ businessId }: ContactProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')
  const recaptchaWidgetId = useRef<number | null>(null);
  const recaptchaRef = useRef<HTMLDivElement>(null);

  const recaptchaSiteKey = (window as any).KORA_CONFIG?.recaptchaSiteKey || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'; // fallback to test key

  useEffect(() => {
    if (isSubmitted) return;

    const timer = setInterval(() => {
      if (window.grecaptcha && window.grecaptcha.render && recaptchaRef.current && recaptchaWidgetId.current === null) {
        recaptchaWidgetId.current = window.grecaptcha.render(recaptchaRef.current, {
          sitekey: recaptchaSiteKey,
        });
        clearInterval(timer);
      }
    }, 100);

    return () => clearInterval(timer);
  }, [recaptchaSiteKey, isSubmitted]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.message) {
      setError('Please fill out all required fields.');
      return;
    }

    const token = window.grecaptcha.getResponse(recaptchaWidgetId.current);
    if (!token) {
      setError('Please complete the CAPTCHA.');
      return;
    }

    setIsSubmitting(true)
    setError('')

    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/v1/public/forms/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: businessId,
          form_type: 'contact',
          form_data: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            message: formData.message,
          },
          submitter_email: formData.email || null,
          captcha_token: token,
        }),
      });

      if (response.ok) {
        setIsSubmitted(true)
        setFormData({ name: '', email: '', phone: '', message: '' })
        if (recaptchaWidgetId.current !== null) {
          window.grecaptcha.reset(recaptchaWidgetId.current);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Failed to send message. Please try again.')
      }
    } catch (err) {
      setError('An error occurred. Please try again later.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="contact" className="py-24 bg-stone-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16">
          {/* Contact Info */}
          <div className="scroll-reveal">
            <div className="inline-block px-4 py-1 bg-red-600/10 text-red-500 rounded-full text-sm font-semibold uppercase tracking-wider mb-4">
              Get In Touch
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Contact <span className="gradient-text">Us</span>
            </h2>
            <p className="text-stone-400 text-lg mb-8 leading-relaxed">
              Have a question or want to place a large order? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>

            <div className="space-y-6">
              <div className="flex items-center space-x-4 group">
                <div className="w-12 h-12 bg-red-600/10 rounded-xl flex items-center justify-center group-hover:bg-red-600/20 transition-colors duration-300">
                  <Phone className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-stone-500 text-sm">Phone</p>
<a href={`tel:${contact.phone}`} className="text-white font-semibold hover:text-red-500 transition-colors duration-300">
                    {contact.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-center space-x-4 group">
                <div className="w-12 h-12 bg-red-600/10 rounded-xl flex items-center justify-center group-hover:bg-red-600/20 transition-colors duration-300">
                  <Mail className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-stone-500 text-sm">Email</p>
<a href={`mailto:${contact.email}`} className="text-white font-semibold hover:text-red-500 transition-colors duration-300">
                    {contact.email}
                  </a>
                </div>
              </div>

              <div className="flex items-center space-x-4 group">
                <div className="w-12 h-12 bg-red-600/10 rounded-xl flex items-center justify-center group-hover:bg-red-600/20 transition-colors duration-300">
                  <MapPin className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-stone-500 text-sm">Address</p>
<p className="text-white font-semibold">
                    {contact.address.replace(', USA', '')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="scroll-reveal delay-200">
            <div className="bg-stone-900 p-8 rounded-2xl border border-stone-800 shadow-xl">
              {isSubmitted ? (
                <div className="text-center py-12 animate-fade-in">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Message Sent!</h3>
                  <p className="text-stone-400">Thank you for contacting us. We'll get back to you soon.</p>
                  <button 
                    onClick={() => setIsSubmitted(false)}
                    className="mt-6 text-red-500 hover:text-red-400 font-medium"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-stone-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-stone-800 border border-stone-700 rounded-xl text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-300"
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-stone-300 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 bg-stone-800 border border-stone-700 rounded-xl text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-300"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-stone-300 mb-2">
                        Phone Number (Optional)
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 bg-stone-800 border border-stone-700 rounded-xl text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-300"
                        placeholder="(801) 555-1234"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-stone-300 mb-2">
                      Message
                    </label>
                    <textarea
                      id="message"
                      rows={4}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 bg-stone-800 border border-stone-700 rounded-xl text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-300 resize-none"
                      placeholder="How can we help you?"
                    />
                  </div>

                  <div ref={recaptchaRef} className="flex justify-center"></div>

                  {error && (
                    <div className="p-4 bg-red-600/10 border border-red-600/30 rounded-xl text-red-400 text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-red-600/25 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <span>Send Message</span>
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <p className="text-xs text-stone-500 text-center">
                    This site is protected by reCAPTCHA and the Google Privacy Policy and Terms of Service apply.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}