import { Link } from 'react-router-dom';

const Header = ({ userName, onCreateRoom, onJoinRoom }) => {
  return (
    <div className="py-6 px-6 md:px-10">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-[#94C3D2] bg-clip-text text-transparent">Welcome, {userName}!</h1>
            <p className="text-[#94C3D2]/80 mt-1">Track your progress and manage your DSA journey</p>
          </div>
          
          <div className="flex space-x-3 mt-4 md:mt-0">
            <button 
              onClick={() => {
                console.log("Create Room button clicked in Header");
                if (onCreateRoom) onCreateRoom();
              }}
              className="bg-white/10 border border-white/20 text-white/95 hover:bg-white/20 px-4 py-2.5 rounded-lg flex items-center shadow-sm backdrop-blur-sm transition-colors"
              style={{ textShadow: "0 0 10px rgba(255, 255, 255, 0.3)" }}
            >
              <span className="flex items-center"> 
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#94C3D2]" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                </svg>
                Create Room
              </span>
            </button>
            
            <button 
              onClick={() => {
                console.log("Join Room button clicked in Header");
                if (onJoinRoom) onJoinRoom();
              }}
              className="bg-[#94C3D2] text-white px-4 py-2.5 rounded-lg hover:bg-[#7EB5C3] transition-colors shadow-sm flex items-center"
              style={{ textShadow: "0 0 10px rgba(255, 255, 255, 0.3)" }}
            >
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                </svg>
                Join Room
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
