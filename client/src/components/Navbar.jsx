import { useState } from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <nav className="bg-[#94C3D2] text-gray-800 shadow-lg border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link to="/" className="text-xl font-bold text-gray-800 hover:text-blue-700 transition-colors">Codyssey</Link>
            </div>
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                <Link to="/dashboard" className="px-3 py-2 rounded-full text-sm font-medium bg-[#dbeafe] text-gray-800 shadow-sm hover:shadow-md transition-all transform hover:scale-105">Dashboard</Link>
                <Link to="/syllabus" className="px-3 py-2 rounded-full text-sm font-medium bg-[#dbeafe] text-gray-800 shadow-sm hover:shadow-md transition-all transform hover:scale-105">Syllabus</Link>
                <Link to="/watch-video" className="px-3 py-2 rounded-full text-sm font-medium bg-[#dbeafe] text-gray-800 shadow-sm hover:shadow-md transition-all transform hover:scale-105">Watch Video</Link>
                <Link to="/collab-room" className="px-3 py-2 rounded-full text-sm font-medium bg-[#dbeafe] text-gray-800 shadow-sm hover:shadow-md transition-all transform hover:scale-105">Collab Room</Link>
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="relative">
              <button 
                onClick={toggleDropdown}
                className="flex items-center px-4 py-2 rounded-full text-sm font-medium bg-[#dbeafe] text-gray-800 shadow-sm hover:shadow-md transition-all transform hover:scale-105"
              >
                <span className="mr-1">Account</span>
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              {isDropdownOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-52 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 overflow-hidden transform transition-all duration-200 scale-100">
                  <div className="py-2">
                    <Link to="/profile" className="block px-5 py-3 text-base text-gray-800 hover:bg-[#dbeafe] transition-colors">Your Account</Link>
                    <Link to="/" className="w-full text-left block px-5 py-3 text-base text-gray-800 hover:bg-[#dbeafe] transition-colors">Sign out</Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
