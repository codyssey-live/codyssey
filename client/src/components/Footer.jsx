import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';

const Footer = () => {
  const [showModal, setShowModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  
  const developers = [
    {
      name: "Tushar Ahuja",
      role: "Full Stack Developer",
      bio: "Passionate about creating intuitive user interfaces and robust backend systems with a focus on performance and scalability.",
      github: "https://github.com/tushrahuja",
      email: "tusharahuja.dev@gmail.com",
      linkedin: "https://linkedin.com/in/tushrahuja"
    },
    {
      name: "Riya Ahuja",
      role: "Full Stack Developer",
      bio: "Experienced in building end-to-end applications with modern technologies, balancing frontend aesthetics with backend efficiency.",
      github: "https://github.com/RiyaAhuja-182",
      email: "riya.m.ahuja182@gmail.com",
      linkedin: "https://linkedin.com/in/riya-ahuja-0594a831b"
    }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitContact = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) {
      setSubmitError('Please fill all required fields');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactForm.email)) {
      setSubmitError('Please enter a valid email address');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      const response = await axios.post('/api/contact', {
        name: contactForm.name,
        email: contactForm.email,
        subject: contactForm.subject || 'Contact Form Submission',
        message: contactForm.message
      });
      
      if (response.status !== 200) {
        throw new Error(response.data.message || 'Something went wrong');
      }
      
      // Success!
      setSubmitSuccess(true);
      setContactForm({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        if (submitSuccess) {
          setSubmitSuccess(false);
          setShowContactModal(false);
        }
      }, 5000);
      
    } catch (error) {
      setSubmitError(error.response?.data?.message || 'Failed to send message. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-gray-50 py-6 text-center text-gray-500 mt-auto border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <p className="text-sm">© {new Date().getFullYear()} Codyssey. All rights reserved</p>
        
        {isHomePage && (
          <div className="flex flex-col sm:flex-row justify-center mt-4 space-y-3 sm:space-y-0 sm:space-x-6">
            
            <button
              onClick={() => setShowContactModal(true)} 
              className="text-sm text-gray-500 hover:text-[#dbeafe] transition-colors focus:outline-none"
            >
              Contact Us
            </button>
          </div>
        )}
      </div>

      {/* Contact Modal - Made responsive */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl w-full max-w-xl p-4 sm:p-6 border border-white/20 overflow-hidden relative"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-[#94C3D2] bg-clip-text text-transparent">Contact Us</h3>
              <button
                onClick={() => {
                  setShowContactModal(false);
                  setSubmitSuccess(false);
                  setSubmitError('');
                }}
                className="text-white/80 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {submitSuccess ? (
              <motion.div 
                className="text-center py-8 sm:py-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-[#94c3d2] mb-2">Message Sent!</h4>
                <p className="text-white/70">Thank you for reaching out. We'll get back to you soon.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmitContact} className="space-y-4 sm:space-y-5">
                <div className="text-left">
                  <label htmlFor="name" className="block text-base font-medium text-[#94C3D2] mb-1">Name </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={contactForm.name}
                    onChange={handleInputChange}
                    placeholder="Your full name"
                    className="w-full px-4 py-2.5 bg-[#2d3748] outline-none rounded-lg text-white text-base placeholder-gray-400 focus:ring-0 focus:border-[#94C3D2]"
                    required
                  />
                </div>
                
                <div className="text-left">
                  <label htmlFor="email" className="block text-base font-medium text-[#94C3D2] mb-1">Email </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={contactForm.email}
                    onChange={handleInputChange}
                    placeholder="your.email@example.com"
                    className="w-full px-4 py-2.5 bg-[#2d3748] outline-none rounded-lg text-white text-base placeholder-gray-400"
                    required
                  />
                </div>
                
                <div className="text-left">
                  <label htmlFor="subject" className="block text-base font-medium text-[#94C3D2] mb-1">Subject</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={contactForm.subject}
                    onChange={handleInputChange}
                    placeholder="What's this regarding?"
                    className="w-full px-4 py-2.5 bg-[#2d3748] outline-none rounded-lg text-white text-base placeholder-gray-400"
                  />
                </div>
                
                <div className="text-left">
                  <label htmlFor="message" className="block text-base font-medium text-[#94C3D2] mb-1">Message </label>
                  <textarea
                    id="message"
                    name="message"
                    value={contactForm.message}
                    onChange={handleInputChange}
                    placeholder="Your message here..."
                    rows="5"
                    className="w-full px-4 py-2.5 bg-[#2d3748] outline-none rounded-lg text-white text-base placeholder-gray-400 focus:ring-0 focus:border-[#94C3D2] resize-none"
                    required
                  ></textarea>
                </div>
                
                {submitError && (
                  <div className="bg-red-900/30 border border-red-500/30 text-red-200 py-2 px-3 rounded-lg text-sm">
                    {submitError}
                  </div>
                )}
                
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-6 py-2.5 bg-[#94C3D2] text-white rounded-lg flex items-center transition-colors shadow-lg text-base sm:text-lg
                    ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#7EB5C3]'}`}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>
                        <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
                        </svg>
                        Send Message
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </footer>
  );
};

export default Footer;
