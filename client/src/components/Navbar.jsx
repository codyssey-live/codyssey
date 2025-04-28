import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const location = useLocation();
  const [userName, setUserName] = useState('User');
  const [userEmail, setUserEmail] = useState('user@example.com');
  
  // Get user details from localStorage on component mount
  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    const storedEmail = localStorage.getItem('userEmail');
    
    if (storedName) setUserName(storedName);
    if (storedEmail) setUserEmail(storedEmail);
  }, []);
  
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Navigation items
  const navItems = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Syllabus", path: "/syllabus" },
    { name: "Lecture Room", path: "/lecture-room" },
    { name: "Collab Room", path: "/collab-room" }
  ];

  return (
    <nav className="bg-[#94C3D2] text-gray-800 shadow-lg border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <img 
                src="logo-grayscale.png" 
                alt="Codyssey Logo" 
                className="h-8 w-auto mr-2" 
              />
              <span className="text-xl font-bold text-gray-800">Codyssey</span>
            </div>
            
            {/* Tubelight Navigation Menu */}
            <div className="hidden md:block ml-10">
              <motion.div 
                className="flex items-center bg-white/30 backdrop-blur-md rounded-full px-2 py-1 shadow-lg border border-white/40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <motion.div
                      key={item.name}
                      className="relative px-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Link 
                        to={item.path} 
                        className={`px-4 py-2 rounded-full text-sm font-medium inline-block relative z-10 ${isActive ? 'text-[#2a4365]' : 'text-gray-600'}`}
                      >
                        {item.name}
                      </Link>
                      {isActive && (
                        <motion.div
                          layoutId="navbar-tube"
                          className="absolute inset-0 bg-[#bae6fd] rounded-full shadow-sm -z-0"
                          initial={false}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                          }}
                        >
                          <motion.div 
                            className="absolute -top-1 left-0 right-0 mx-auto w-10 h-1 bg-[#94C3D2] rounded-full"
                            animate={{ 
                              opacity: [0.7, 1, 0.7], 
                              boxShadow: [
                                '0 0 2px 1px rgba(148, 195, 210, 0.3)', 
                                '0 0 8px 2px rgba(148, 195, 210, 0.6)', 
                                '0 0 2px 1px rgba(148, 195, 210, 0.3)'
                              ]
                            }}
                            transition={{ repeat: Infinity, duration: 2 }}
                          />
                          <div className="absolute w-full h-full bg-[#bae6fd]/80 rounded-full" />
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="relative">
              <button 
                onClick={toggleDropdown}
                className="flex items-center justify-center p-2 rounded-full bg-[#dbeafe] text-gray-800 shadow-sm hover:shadow-md transition-all transform hover:scale-105 w-10 h-10"
                aria-label="User menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="origin-top-right absolute right-0 mt-2 w-64 rounded-2xl shadow-xl bg-white/90 backdrop-blur-md ring-1 ring-black/5 z-50 overflow-hidden border border-white/40"
                  >
                    <div className="py-1">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center">
                          <div className="bg-[#94C3D2] rounded-full p-2 mr-3">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{userName}</p>
                            <p className="text-xs text-gray-500">{userEmail}</p>
                          </div>
                        </div>
                      </div>
                      
                      <Link to="/profile" className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-[#dbeafe] transition-colors">
                        <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        Your Account
                      </Link>
                      
                      <div className="border-t border-gray-100 my-1"></div>
                      
                      <Link to="/" className="flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors">
                        <svg className="w-5 h-5 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                        </svg>
                        Sign out
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
