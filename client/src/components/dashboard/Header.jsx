const Header = ({ userName }) => {
  return (
    <header className="bg-[#1e293b] shadow border-b border-gray-700">
      <div className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome, {userName}!
          </h1>
          <p className="text-gray-300">Track your progress and manage your DSA journey</p>
        </div>
        
        <button className="bg-purple-600 text-white font-medium py-2 px-4 rounded-md flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
          Invite Friends
        </button>
      </div>
    </header>
  );
};

export default Header;
