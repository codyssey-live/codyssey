import { useState } from 'react';
import { useLocation } from 'react-router-dom';

const Footer = () => {
  const [showModal, setShowModal] = useState(false);
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

      {/* Developer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Meet the Developers</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {developers.map((dev, index) => (
                <div key={index} className="bg-[#dbeafe] rounded-lg p-4 shadow-sm">
                  <h4 className="text-lg font-medium text-gray-800">{dev.name}</h4>
                  <p className="text-sm text-[#94C3D2] mb-2">{dev.role}</p>
                  <p className="text-sm text-gray-600 mb-4">{dev.bio}</p>
                  
                  <div className="flex space-x-3">
                    <a 
                      href={dev.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" clipRule="evenodd" />
                      </svg>
                    </a>
                    <a 
                      href={`mailto:${dev.email}`}
                      className="text-gray-500 hover:text-gray-700 transition-colors"
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
                      className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;
