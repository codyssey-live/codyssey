import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

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
      // Make API call to the contact endpoint
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: contactForm.name,
          email: contactForm.email,
          subject: contactForm.subject || 'Contact Form Submission',
          message: contactForm.message
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }
      
      console.log('Contact form submission successful:', data);
      
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
      console.error('Error submitting contact form:', error);
      setSubmitError(error.message || 'Failed to send message. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-gray-50 py-6 text-center text-gray-500 mt-auto border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-6">
        <p className="text-sm">© {new Date().getFullYear()} Codyssey. All rights reserved</p>
        
        {isHomePage && (
          <div className="flex justify-center mt-4 space-x-6">
            <button 
              onClick={() => setShowModal(true)}
              className="text-sm text-gray-500 hover:text-[#dbeafe] transition-colors focus:outline-none"
            >
              Meet the Developers
            </button>
            
            <button
              onClick={() => setShowContactModal(true)} 
              className="text-sm text-gray-500 hover:text-[#dbeafe] transition-colors focus:outline-none"
            >
              Contact Us
            </button>
            
            <a 
              href="mailto:contact@codyssey.com" 
              className="text-gray-500 hover:text-[#dbeafe] transition-colors"
              aria-label="Email"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
              </svg>
            </a>
          </div>
        )}
      </div>

      {/* Developer Modal - Updated to match application style */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl w-full max-w-2xl p-6 border border-white/20 overflow-hidden relative"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-[#94C3D2] bg-clip-text text-transparent">Meet the Developers</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {developers.map((dev, index) => (
                <motion.div 
                  key={index}
                  className="bg-white/10 rounded-xl p-5 shadow-sm border border-white/20"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                >
                  <h4 className="text-lg font-bold text-white/90">{dev.name}</h4>
                  <p className="text-sm text-[#94C3D2] mb-2">{dev.role}</p>
                  <p className="text-sm text-white/80 mb-4">{dev.bio}</p>
                  
                  <div className="flex space-x-3">
                    <a 
                      href={dev.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/70 hover:text-[#94C3D2] transition-colors"
                      title="GitHub"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" clipRule="evenodd" />
                      </svg>
                    </a>
                    <a 
                      href={`mailto:${dev.email}`}
                      className="text-white/70 hover:text-[#94C3D2] transition-colors"
                      title="Email"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
                      </svg>
                    </a>
                    <a 
                      href={dev.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/70 hover:text-[#94C3D2] transition-colors"
                      title="LinkedIn"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl w-full max-w-xl p-6 border border-white/20 overflow-hidden relative"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-3xl font-bold bg-gradient-to-r from-white to-[#94C3D2] bg-clip-text text-transparent">Contact Us</h3>
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
                className="text-center py-10"
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
              <form onSubmit={handleSubmitContact} className="space-y-5">
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
                    className="w-full px-4 py-2.5 bg-[#2d3748] outline-none  rounded-lg text-white text-base placeholder-gray-400 focus:ring-0 focus:border-[#94C3D2] resize-none"
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
                    className={`px-6 py-2.5 bg-[#94C3D2] text-white rounded-lg flex items-center transition-colors shadow-lg text-lg
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
                        {/* Updated telegram icon to match the reference image */}
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
