const Header = ({ userName }) => {
  return (
    <header className="bg-[#94C3D2] shadow border-b border-gray-200">
      <div className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome, {userName}!
          </h1>
          <p className="text-gray-600">Track your progress and manage your DSA journey</p>
        </div>
        
        <button className="bg-[#dbeafe] text-gray-800 font-medium py-2 px-4 rounded-full flex items-center hover:shadow-lg transform transition-all duration-300 hover:-translate-y-1 border border-gray-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add New Problem
        </button>
      </div>
    </header>
  );
};

export default Header;
