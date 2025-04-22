import { useState } from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <nav className="bg-[#141b2d] text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link to="/" className="text-xl font-bold">Codyssey</Link>
            </div>
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-3">
                <Link to="/dashboard" className="px-4 py-2 rounded-lg text-sm font-medium bg-[#2a3c63]">Dashboard</Link>
                <Link to="/syllabus" className="px-4 py-2 rounded-lg text-sm font-medium bg-[#2a3c63]">Syllabus</Link>
                <Link to="/watch-video" className="px-4 py-2 rounded-lg text-sm font-medium bg-[#2a3c63]">Video Watch</Link>
                <Link to="/collab-room" className="px-4 py-2 rounded-lg text-sm font-medium bg-[#2a3c63]">Collab Room</Link>
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="relative ml-3">
              <div>
                <button 
                  onClick={toggleDropdown}
                  className="flex items-center px-5 py-3 border border-gray-700 rounded-lg text-base font-medium focus:outline-none bg-[#2a3c63]"
                >
                  <span className="mr-2">Account</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              {isDropdownOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-52 rounded-md shadow-2xl bg-[#0a0d14] ring-1 ring-black ring-opacity-5 z-50 transform transition-all duration-200 ease-in-out" style={{ backgroundColor: 'rgba(10, 13, 20, 0.98)' }}>
                  <div className="py-2">
                    <Link to="/profile" className="block px-5 py-3 text-base text-white hover:bg-[#2a3c63] transition-colors duration-150">Your Account</Link>
                    <Link to="/" className="w-full text-left block px-5 py-3 text-base text-white hover:bg-[#2a3c63] transition-colors duration-150">Sign out</Link>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="md:hidden">
            <button className="p-3 rounded-md bg-[#2a3c63] focus:outline-none">
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
