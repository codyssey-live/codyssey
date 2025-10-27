import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchCurrentUser } from '../utils/authUtils';
import apiClient from '../utils/apiClient';
import { useRoom } from '../context/RoomContext';

const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [userData, setUserData] = useState({ name: 'User', email: 'Email' });
  const [loading, setLoading] = useState(true);
  const [hasActiveRoom, setHasActiveRoom] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const { roomData } = useRoom();
  const [syllabusPath, setSyllabusPath] = useState('/syllabus');
  
  // Fetch user data from the API - run this early and with higher priority
  useEffect(() => {
    const getUserData = async () => {
      setLoading(true);
      
      try {
        const user = await fetchCurrentUser();
        if (user) {
          setUserData({
            name: user.name,
            email: user.email
          });
        }
      } catch (err) {
        // Handle error (e.g., show notification)
      } finally {
        setLoading(false);
      }
    };
    
    // Add high priority to this fetch
    const fetchData = async () => {
      try {
        await Promise.race([
          getUserData(),
          new Promise(resolve => setTimeout(resolve, 3000)) // 3 second timeout fallback
        ]);
      } catch (error) {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Check for active room when component mounts and when localStorage changes
  useEffect(() => {
    const checkForActiveRoom = () => {
      const roomInfo = localStorage.getItem('roomInfo');
      if (roomInfo) {
        try {
          const parsedInfo = JSON.parse(roomInfo);
          if (parsedInfo.roomId) {
            setHasActiveRoom(true);
            setActiveRoomId(parsedInfo.roomId);
          } else {
            setHasActiveRoom(false);
            setActiveRoomId(null);
          }
        } catch (error) {
          // Handle error (e.g., show notification)
          setHasActiveRoom(false);
          setActiveRoomId(null);
        }
      } else {
        setHasActiveRoom(false);
        setActiveRoomId(null);
      }
    };
    
    // Check initially
    checkForActiveRoom();
    
    // Listen for storage changes (for when room is created in another tab)
    window.addEventListener('storage', checkForActiveRoom);
    
    // Listen for custom room events
    window.addEventListener('roomCreated', checkForActiveRoom);
    window.addEventListener('roomJoined', checkForActiveRoom);
    window.addEventListener('roomLeft', checkForActiveRoom);
    
    return () => {
      window.removeEventListener('storage', checkForActiveRoom);
      window.removeEventListener('roomCreated', checkForActiveRoom);
      window.removeEventListener('roomJoined', checkForActiveRoom);
      window.removeEventListener('roomLeft', checkForActiveRoom);
    };
  }, []);

  // Set syllabus path based on room context
  useEffect(() => {
    if (roomData.inRoom && roomData.inviterId) {
      setSyllabusPath(`/${roomData.inviterId}`);
    } else {
      setSyllabusPath('/syllabus');
    }
  }, [roomData]);
  const handleSignOut = async () => {
    try {
      // Call signout endpoint to clear the cookie
      const response = await apiClient.post('/auth/signout');
      
      // Clear localStorage items related to authentication
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      
      // Optionally clear other user-related data
      localStorage.removeItem('roomInfo');
      localStorage.removeItem('roomUsername');
      
      // Close the dropdown and redirect to home
      setIsDropdownOpen(false);
      navigate('/');
    } catch (error) {
      // Handle error (e.g., show notification)
      
      // Even if the API call fails, try to clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      
      // Still redirect to home
      setIsDropdownOpen(false);
      navigate('/');
    }
  };
  
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Navigation items
  const navItems = [
    { name: "Dashboard", path: "/dashboard" },
    { 
      name: "Syllabus", 
      path: roomData.inRoom && roomData.inviterId ? `/${roomData.inviterId}` : "/syllabus" 
    },
    { name: "Lecture Room", path: "/lecture-room" },
    { name: "Collab Room", path: "/collab-room" },
    // Only show Room if the user has an active room
    ...(hasActiveRoom ? [{ name: "Room", path: `/room/${activeRoomId}` }] : [])
  ];

  // User dropdown items with icons
  const userMenuItems = [
    { 
      name: "Your Profile", 
      path: "/profile",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    { 
      name: "Sign out", 
      action: handleSignOut,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      )
    }
  ];
  
  return (
    <nav className="bg-[#0f172a] text-gray-800 shadow-lg border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              {/* Added Link to home page */}
              <Link to="/" className="flex items-center">
                <img 
                  src="/logo-grayscale.png" 
                  alt="Codyssey Logo" 
                  className="h-8 w-auto mr-2" 
                />
                <span className="text-xl font-bold text-gray-800">Codyssey</span>
              </Link>
            </div>
            
            {/* Tubelight Navigation Menu - Hidden on mobile */}
            <div className="hidden md:block ml-10">
              <motion.div 
                className="bg-[#1a2234] flex items-center backdrop-blur-md rounded-full px-2 py-1 shadow-lg border border-white/5"
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
                        className={`px-4 py-2 rounded-full text-sm font-medium inline-block relative z-10 ${isActive ? 'text-[#94c3d2]' : 'text-white/80 '}`}
                      >
                        {item.name}
                      </Link>
                      {isActive && (
                        <motion.div
                          layoutId="navbar-tube"
                          className="absolute inset-0 Bg-[#1a2234] rounded-full shadow-sm -z-10"
                          initial={false}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                          }}
                        >
                          {/* Intense top glow bar */}
                          <motion.div 
                            className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-[#94C3D2] rounded-full"
                            animate={{ 
                              opacity: [0.7, 1, 0.7],
                              boxShadow: [
                                '0 0 8px 1px rgba(148, 195, 210, 0.6)',
                                '0 0 15px 3px rgba(148, 195, 210, 0.9)',
                                '0 0 8px 1px rgba(148, 195, 210, 0.6)'
                              ]
                            }}
                            transition={{ repeat: Infinity, duration: 2 }}
                          />
                          
                          {/* Ambient glow layers */}
                          <motion.div
                            className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-6 bg-[#94C3D2]/80 rounded-full blur-md"
                            animate={{
                              opacity: [0.4, 0.7, 0.4],
                              scale: [1, 1.1, 1],
                            }}
                            transition={{ repeat: Infinity, duration: 2.5, repeatType: "reverse" }}
                          />
                          
                          <motion.div
                            className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-4 bg-[#94C3D2]/40 rounded-full blur-sm"
                            animate={{
                              opacity: [0.5, 0.8, 0.5],
                              scale: [1, 1.05, 1],
                            }}
                            transition={{ repeat: Infinity, duration: 2, repeatType: "reverse" }}
                          />
                          
                          {/* Background fill for the active button */}
                          <div className="absolute w-full h-full bg-[#94C3D2]/15 rounded-full" />
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMobileMenu}
              className="flex items-center justify-center p-2 rounded-full bg-[#1a2234] text-[#94c3d2] shadow-sm hover:shadow-md transition-all transform hover:scale-105 w-10 h-10 mr-2"
              aria-label="Mobile menu"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-6 w-6" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            
            {/* User menu button on mobile */}
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center justify-center p-2 rounded-full bg-[#1a2234] text-[#94c3d2] shadow-sm hover:shadow-md transition-all transform hover:scale-105 w-10 h-10"
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
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-2xl shadow-xl bg-white/20 backdrop-blur-md ring-1 ring-black/5 z-50 overflow-hidden border border-white/40"
                  >
                    <div className="py-1">
                      {userMenuItems.map((item, index) => (
                        <div key={index} className={index === 0 ? "border-b border-white/10" : ""}>
                          {item.path ? (
                            <Link
                              to={item.path}
                              className="block px-4 py-3 text-sm text-white/90 hover:bg-white/20"
                              onClick={() => setIsDropdownOpen(false)}
                            >
                              <div className="flex items-center">
                                {item.icon}
                                {item.name}
                              </div>
                            </Link>
                          ) : (
                            <button
                              className="block w-full text-left px-4 py-3 text-sm hover:bg-white/20"
                              onClick={() => {
                                item.action();
                                setIsDropdownOpen(false);
                              }}
                            >
                              <div className="flex items-center text-red-600">
                                {item.icon}
                                {item.name}
                              </div>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          {/* Desktop User Menu */}
          <div className="hidden md:block">
            <div className="relative">
              <button 
                onClick={toggleDropdown}
                className="flex items-center justify-center p-2 rounded-full bg-[#1a2234] text-[#94c3d2] shadow-sm hover:shadow-md transition-all transform hover:scale-105 w-10 h-10"
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
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-2xl shadow-xl bg-white/20 backdrop-blur-md ring-1 ring-black/5 z-50 overflow-hidden border border-white/40"
                  >
                    <div className="py-1">
                      {userMenuItems.map((item, index) => (
                        <div key={index} className={index === 0 ? "border-b border-white/10" : ""}>
                          {item.path ? (
                            <Link
                              to={item.path}
                              className="block px-4 py-3 text-sm text-white/90 hover:bg-white/20"
                              onClick={() => setIsDropdownOpen(false)}
                            >
                              <div className="flex items-center">
                                {item.icon}
                                {item.name}
                              </div>
                            </Link>
                          ) : (
                            <button
                              className="block w-full text-left px-4 py-3 text-sm hover:bg-white/20"
                              onClick={() => {
                                item.action();
                                setIsDropdownOpen(false);
                              }}
                            >
                              <div className="flex items-center text-red-600">
                                {item.icon}
                                {item.name}
                              </div>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-[#1a2234] overflow-hidden border-t border-white/10"
          >
            <div className="px-3 py-4 space-y-1">
              {navItems.map((item, index) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={index}
                    to={item.path}
                    className={`block px-4 py-3 rounded-md text-base font-medium ${
                      isActive 
                        ? 'text-[#94c3d2] bg-[#94C3D2]/15' 
                        : 'text-white/80 hover:bg-white/10'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default Navbar;
