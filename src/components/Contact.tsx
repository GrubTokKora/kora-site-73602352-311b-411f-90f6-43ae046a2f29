import { useState } from 'react'
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react'
import { subscribeToNewsletter } from '../newsletter'

interface ContactProps {
  businessId: string
}

export default function Contact({ businessId }: ContactProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    emailOptIn: true,
    smsOptIn: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    if (!formData.email && !formData.phone) {
      setError('Please provide at least an email or phone number.')
      setIsSubmitting(false)
      return
    }

    try {
      const result = await subscribeToNewsletter({
        businessId: businessId,
        email: formData.email || undefined,
        phoneNumber: formData.phone || undefined,
        firstName: formData.name.split(' ')[0],
        lastName: formData.name.split(' ').slice(1).join(' '),
        emailOptIn: formData.emailOptIn,
        smsOptIn: formData.smsOptIn,
        metadata: { message: formData.message, source: 'contact_form' },
      })

      if (result.success) {
        setIsSubmitted(true)
        setFormData({
          name: '',
          email: '',
          phone: '',
          message: '',
          emailOptIn: true,
          smsOptIn: false,
        })
      } else {
        setError(result.message || 'Failed to send message. Please try again.')
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
                  <a href="tel:+18015551234" className="text-white font-semibold hover:text-red-500 transition-colors duration-300">
                    (801) 555-1234
                  </a>
                </div>
              </div>

              <div className="flex items-center space-x-4 group">
                <div className="w-12 h-12 bg-red-600/10 rounded-xl flex items-center justify-center group-hover:bg-red-600/20 transition-colors duration-300">
                  <Mail className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-stone-500 text-sm">Email</p>
                  <a href="mailto:info@thepie.com" className="text-white font-semibold hover:text-red-500 transition-colors duration-300">
                    info@thepie.com
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
                    3321 S 200 E, South Salt Lake, UT 84115
                  </p>
                </div>
              </div>
            </div>

            {/* Newsletter Signup Info */}
            <div className="mt-8 p-6 bg-stone-900 rounded-2xl border border-stone-800">
              <h3 className="text-white font-semibold mb-2">Join Our Newsletter</h3>
              <p className="text-stone-400 text-sm mb-4">
                Subscribe to receive exclusive deals, new menu updates, and special event invitations.
              </p>
              <div className="flex items-center space-x-2 text-sm text-stone-500">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Weekly deals and coupons</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-stone-500 mt-1">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>New menu item announcements</span>
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
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 bg-stone-800 border border-stone-700 rounded-xl text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-300"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-stone-300 mb-2">
                        Phone Number
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
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 bg-stone-800 border border-stone-700 rounded-xl text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-300 resize-none"
                      placeholder="How can we help you?"
                    />
                  </div>

                  {/* Opt-in Checkboxes */}
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={formData.emailOptIn}
                        onChange={(e) => setFormData({ ...formData, emailOptIn: e.target.checked })}
                        className="w-5 h-5 rounded border-stone-600 bg-stone-800 text-red-600 focus:ring-red-600 focus:ring-offset-stone-900"
                      />
                      <span className="text-stone-300 text-sm group-hover:text-white transition-colors">
                        Send me email updates and promotions
                      </span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={formData.smsOptIn}
                        onChange={(e) => setFormData({ ...formData, smsOptIn: e.target.checked })}
                        className="w-5 h-5 rounded border-stone-600 bg-stone-800 text-red-600 focus:ring-red-600 focus:ring-offset-stone-900"
                      />
                      <span className="text-stone-300 text-sm group-hover:text-white transition-colors">
                        Send me SMS/text notifications
                      </span>
                    </label>
                  </div>

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
                      <span>Sending...</span>
                    ) : (
                      <>
                        <span>Send Message</span>
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <p className="text-xs text-stone-500 text-center">
                    By submitting, you agree to receive communications from The Pie Pizzeria.
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