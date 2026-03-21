import React, { useState } from 'react';
import { Phone, Mail, MapPin, User, ArrowRight, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { contactAPI } from '../services/api';

export default function LawyerContact() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim() || formData.name.trim().length < 3) {
      newErrors.name = 'Please enter a valid full name (at least 3 characters).';
    }
    
    // Validate Indian phone number (10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid 10-digit phone number.';
    }

    // Basic email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!formData.message.trim() || formData.message.trim().length < 10) {
      newErrors.message = 'Please provide a clearer description (at least 10 characters).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      setIsSubmitting(true);
      try {
        await contactAPI.submit(formData);
        setIsSubmitted(true);
        setFormData({ name: '', phone: '', email: '', message: '' });
        setTimeout(() => setIsSubmitted(false), 5000); // Reset success message
      } catch (error) {
        console.error('Error submitting form:', error);
        setErrors({ ...errors, submit: 'Failed to send message. Please try again later.' });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error for this field as the user types
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Our legal professionals are committed to protecting your rights and
            providing clear, strategic legal guidance you can trust.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Card - Contact Info */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">Contact Information</h3>
            <p className="text-slate-300 mb-8">
              If you need legal advice, representation, or have general inquiries,
              please reach out to our law office. All consultations are handled
              with complete confidentiality.
            </p>

            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-slate-200">
                <div className="p-2 bg-slate-700 rounded-lg">
                  <Phone className="w-5 h-5 text-blue-400" />
                </div>
                +91 7876789794
              </li>
              <li className="flex items-center gap-3 text-slate-200">
                <div className="p-2 bg-slate-700 rounded-lg">
                  <Mail className="w-5 h-5 text-blue-400" />
                </div>
                tipdot95@gmail.com
              </li>
              <li className="flex items-center gap-3 text-slate-200">
                <div className="p-2 bg-slate-700 rounded-lg">
                  <MapPin className="w-5 h-5 text-blue-400" />
                </div>
                Ghumarwin, District Bilaspur, Himachal Pradesh, India
              </li>
            </ul>
          </div>

          {/* Right Card - Contact Form */}
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Get Legal Assistance</h3>
            <p className="text-gray-600 mb-6">
              Submit your details and a member of our legal support team will
              contact you shortly to discuss your case.
            </p>

            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
              
              {errors.submit && (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-3 border border-red-200">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="font-medium text-sm">{errors.submit}</p>
                </div>
              )}

              {isSubmitted && (
                <div className="p-4 bg-green-50 text-green-700 rounded-lg flex items-start gap-3 border border-green-200">
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  <p className="font-medium text-sm">Thank you! Your consultation request has been received. We will contact you soon.</p>
                </div>
              )}

              <div>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Full Name" 
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                  />
                </div>
                {errors.name && <p className="mt-1 text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> {errors.name}</p>}
              </div>

              <div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Phone Number (10 Digits)" 
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                  />
                </div>
                {errors.phone && <p className="mt-1 text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> {errors.phone}</p>}
              </div>

              <div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email Address" 
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                  />
                </div>
                {errors.email && <p className="mt-1 text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> {errors.email}</p>}
              </div>

              <div>
                <textarea 
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Briefly describe your legal issue" 
                  rows="4"
                  className={`w-full px-4 py-3 border text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none ${errors.message ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.message && <p className="mt-1 text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> {errors.message}</p>}
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Sending Request...
                  </>
                ) : (
                  <>
                    Request Consultation
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
