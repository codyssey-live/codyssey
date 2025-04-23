import { Link } from 'react-router-dom';

const Header = ({ userName }) => {
  return (
    <div className="bg-[#dbeafe] py-6 px-6 md:px-10">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#333333]">Welcome, {userName}!</h1>
            <p className="text-[#444444] mt-1">Track your progress and manage your DSA journey</p>
          </div>
          
          <div className="flex space-x-3 mt-4 md:mt-0">
            <Link 
              to="/invite"
              className="bg-[#3b82f6] text-white px-4 py-2 rounded-md hover:bg-[#2563eb] transition-colors"
            >
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                </svg>
                Invite Friends
              </span>
            </Link>
            
            <Link 
              to="/join-room"
              className="bg-[#10b981] text-white px-4 py-2 rounded-md hover:bg-[#059669] transition-colors"
            >
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                </svg>
                Join Room
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
