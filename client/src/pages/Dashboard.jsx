import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify'; // Import ToastContainer too
import 'react-toastify/dist/ReactToastify.css'; // Import the toast styles
import Navbar from '../components/Navbar';
import Header from '../components/dashboard/Header';
import StatCard from '../components/dashboard/StatCard';
import DistributionCard from '../components/dashboard/DistributionCard';
import PlatformCard from '../components/dashboard/PlatformCard';
import ProblemList from '../components/dashboard/ProblemList';
import { fetchCurrentUser } from '../utils/authUtils';
import axios from 'axios';

const Dashboard = () => {
  const navigate = useNavigate();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinLink, setJoinLink] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [roomCreated, setRoomCreated] = useState(false);
  const [roomId, setRoomId] = useState('');
  const inviteLinkRef = useRef(null);
  
  const [userData, setUserData] = useState({
    name: localStorage.getItem('userName') || 'User',
    stats: {
      solved: 78,
      unsolved: 45,
      solveLater: 23
    },
    distribution: {
      easy: 42,
      medium: 29,
      hard: 7
    },
    platforms: {
      leetcode: 58,
      codeforces: 12,
      hackerrank: 8
    }
  });

  // Fetch user data from the API
  useEffect(() => {
    const getUserData = async () => {
      try {
        const user = await fetchCurrentUser();
        if (user && user.name) {
          localStorage.setItem('userName', user.name);
          
          setUserData(prevData => ({
            ...prevData,
            name: user.name
          }));
        }
      } catch (err) {
        console.error('Failed to fetch user data:', err);
      }
    };
    
    getUserData();
  }, []);

  // Mock data for problems
  const mockProblems = [
    { 
      id: 1, 
      title: 'Two Sum', 
      link: 'https://leetcode.com/problems/two-sum/',
      platform: 'LeetCode',
      dateAdded: '2023-10-15',
      status: 'solved' 
    },
    { 
      id: 2, 
      title: 'Valid Parentheses', 
      link: 'https://leetcode.com/problems/valid-parentheses/',
      platform: 'LeetCode',
      dateAdded: '2023-10-18',
      status: 'solved' 
    },
    { 
      id: 3, 
      title: 'Merge Two Sorted Lists', 
      link: 'https://leetcode.com/problems/merge-two-sorted-lists/',
      platform: 'LeetCode',
      dateAdded: '2023-10-20',
      status: 'unsolved' 
    },
    { 
      id: 4, 
      title: 'Maximum Subarray', 
      link: 'https://leetcode.com/problems/maximum-subarray/',
      platform: 'LeetCode',
      dateAdded: '2023-10-22',
      status: 'solveLater' 
    },
    { 
      id: 5, 
      title: 'Watermelon', 
      link: 'https://codeforces.com/problemset/problem/4/A',
      platform: 'Codeforces',
      dateAdded: '2023-10-25',
      status: 'unsolved' 
    },
  ];

  // State for active tab
  const [activeTab, setActiveTab] = useState('recent');
  const [problems, setProblems] = useState(mockProblems);

  // Filter problems based on active tab
  useEffect(() => {
    if (activeTab === 'recent') {
      setProblems(mockProblems.slice(0, 5));
    } else if (activeTab === 'solved') {
      setProblems(mockProblems.filter(p => p.status === 'solved'));
    } else if (activeTab === 'unsolved') {
      setProblems(mockProblems.filter(p => p.status === 'unsolved'));
    } else if (activeTab === 'solveLater') {
      setProblems(mockProblems.filter(p => p.status === 'solveLater'));
    }
  }, [activeTab]);

  // Generate a mock userId for demo
  const mockUserId = 'user123';
  
  const BASE_URL = window.location.origin;

  // IMPORTANT DEBUG: Add console logs to track the flow
  const handleCreateRoomClick = () => {
    console.log("Create Room button clicked");
    setShowInviteModal(true);
  };
  
  const handleCreateRoom = async () => {
    try {
      setCreatingRoom(true);
      
      // Make the API call directly without checking for a token
      // The server will handle authentication via cookies
      try {
        // Use axios with credentials included
        const response = await axios.post('/api/rooms/create', {}, {
          withCredentials: true // This ensures cookies are sent with the request
        });
        
        const data = response.data;
        
        if (data.success && data.data.roomId) {
          const newRoomId = data.data.roomId;
          setRoomId(newRoomId);
          setRoomCreated(true);
          
          // Save the room information in localStorage
          localStorage.setItem('roomInfo', JSON.stringify({ 
            roomId: newRoomId, 
            createdAt: new Date().toISOString() 
          }));
          
          // Dispatch event to notify Navbar component
          window.dispatchEvent(new CustomEvent('roomCreated'));
          
          toast.success("Room created successfully!");
        }
      } catch (error) {
        console.error('Error from server:', error.response?.data || error);
        toast.error(error.response?.data?.message || "Failed to create room");
      }
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error("Failed to create room");
    } finally {
      setCreatingRoom(false);
    }
  };

  const generateInviteLink = () => {
    if (roomCreated && roomId) {
      return `${BASE_URL}/join/${roomId}`;
    }
    return '';
  };

  const handleCopyLink = () => {
    if (!roomCreated) {
      toast.info('Please create a room first');
      return;
    }
    
    navigator.clipboard.writeText(inviteLinkRef.current?.value || generateInviteLink())
      .then(() => {
        setCopySuccess(true);
        toast.success('Link copied to clipboard!');
        setTimeout(() => setCopySuccess(false), 3000);
      })
      .catch(err => {
        console.error('Failed to copy link: ', err);
        toast.error('Failed to copy link');
      });
  };

  const shareOnWhatsApp = () => {
    if (!roomCreated) {
      toast.info('Please create a room first');
      return;
    }
    
    const link = generateInviteLink();
    const text = encodeURIComponent(`Join me on Codyssey! ${link}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareViaEmail = () => {
    if (!roomCreated) {
      toast.info('Please create a room first');
      return;
    }
    
    const link = generateInviteLink();
    const subject = encodeURIComponent('Join me on Codyssey');
    const body = encodeURIComponent(`I'm inviting you to join me on Codyssey. Click this link to join: ${link}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!joinLink) {
      setJoinError('Please enter an invite link or room ID');
      return;
    }

    try {
      // Try parsing as a URL first
      let roomIdToJoin;
      try {
        const url = new URL(joinLink);
        const pathSegments = url.pathname.split('/');
        roomIdToJoin = pathSegments[pathSegments.length - 1];
      } catch (error) {
        // If not a URL, use the input directly as a roomId
        roomIdToJoin = joinLink.trim();
      }

      if (roomIdToJoin) {
        // Save the joined room info
        localStorage.setItem('roomInfo', JSON.stringify({ 
          roomId: roomIdToJoin, 
          joinedAt: new Date().toISOString() 
        }));
        
        // Dispatch event to notify Navbar component
        window.dispatchEvent(new CustomEvent('roomJoined'));
        
        // Navigate to the room
        navigate(`/room/${roomIdToJoin}`);
        setShowJoinModal(false);
      } else {
        setJoinError('Invalid room link or ID');
      }
    } catch (error) {
      setJoinError('Invalid invite link or ID');
      console.error('Error joining room:', error);
    }
  };

  const handleOpenRoom = () => {
    if (roomCreated && roomId) {
      // Navigate to the room page with the roomId
      navigate(`/room/${roomId}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#E8F1F7]">
      <Navbar />
      <ToastContainer position="top-right" autoClose={3000} />
      <Header 
        userName={userData.name} 
        onCreateRoom={handleCreateRoomClick}
        onJoinRoom={() => setShowJoinModal(true)}
      />
      
      <div className="container mx-auto px-6 md:px-10">
        <h2 className="text-2xl font-bold text-[#333333] mt-8 mb-6">Your Dashboard</h2>
      </div>
      
      <main className="container mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard 
            title="Problem Status" 
            stats={userData.stats} 
          />
          <DistributionCard 
            title="Difficulty Distribution" 
            distribution={userData.distribution} 
          />
          <PlatformCard 
            title="Platform Breakdown" 
            platforms={userData.platforms} 
          />
        </div>
        
        <div className="mb-6 flex space-x-2">
          <button 
            onClick={() => setActiveTab('recent')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'recent' 
                ? 'bg-[#94C3D2] text-gray-800 shadow' 
                : 'bg-[#dbeafe] bg-opacity-70 text-gray-600 hover:bg-[#dbeafe]'
            }`}
          >
            Recent
          </button>
          <button 
            onClick={() => setActiveTab('solved')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'solved' 
                ? 'bg-[#94C3D2] text-gray-800 shadow' 
                : 'bg-[#dbeafe] bg-opacity-70 text-gray-600 hover:bg-[#dbeafe]'
            }`}
          >
            Solved
          </button>
          <button 
            onClick={() => setActiveTab('unsolved')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'unsolved' 
                ? 'bg-[#94C3D2] text-gray-800 shadow' 
                : 'bg-[#dbeafe] bg-opacity-70 text-gray-600 hover:bg-[#dbeafe]'
            }`}
          >
            Unsolved
          </button>
          <button 
            onClick={() => setActiveTab('solveLater')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'solveLater' 
                ? 'bg-[#94C3D2] text-gray-800 shadow' 
                : 'bg-[#dbeafe] bg-opacity-70 text-gray-600 hover:bg-[#dbeafe]'
            }`}
          >
            Solve Later
          </button>
        </div>
        
        <ProblemList problems={problems} />
      </main>
      
      {/* Create Room Modal (formerly Invite Modal) */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#dbeafe] rounded-2xl shadow-lg w-full max-w-md p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Create Room</h3>
              <button
                onClick={() => {
                  console.log("Modal close button clicked");
                  setShowInviteModal(false);
                  setRoomCreated(false);
                  setRoomId('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              {!roomCreated ? (
                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      console.log("Create New Room button clicked");
                      handleCreateRoom();
                    }}
                    disabled={creatingRoom}
                    className="px-6 py-2.5 bg-[#94C3D2] text-white rounded-lg hover:bg-opacity-90 transition-colors flex items-center"
                  >
                    {creatingRoom ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating room...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create New Room
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label htmlFor="invite-link" className="block text-sm font-medium text-gray-700 mb-1">
                      Share this link with your friends
                    </label>
                    <div className="flex">
                      <input
                        ref={inviteLinkRef}
                        type="text"
                        id="invite-link"
                        readOnly
                        value={generateInviteLink()}
                        className="w-full px-4 py-2.5 bg-[#E8F1F7] border border-gray-200 rounded-l-lg focus:ring-[#94C3D2] focus:border-[#94C3D2] text-gray-800"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="px-4 py-2.5 bg-[#94C3D2] text-white rounded-r-lg hover:bg-opacity-90 transition-colors"
                      >
                        {copySuccess ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {copySuccess && (
                      <p className="mt-2 text-sm text-green-600">Link copied to clipboard!</p>
                    )}
                  </div>
                  
                  {/* Add Open Room button */}
                  <div className="flex justify-center py-2">
                    <button
                      onClick={handleOpenRoom}
                      className="px-6 py-2.5 bg-[#3b82f6] text-white rounded-lg hover:bg-opacity-90 transition-colors flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                      </svg>
                      Open Room
                    </button>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-sm text-gray-500 mb-3">Or share directly via:</p>
                    <div className="flex space-x-3">
                      <button
                        onClick={shareOnWhatsApp}
                        className="flex-1 py-2.5 bg-[#25D366] text-white rounded-lg hover:bg-opacity-90 transition-colors flex items-center justify-center"
                      >
                        <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"></path>
                          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm6.127 16.12c-.282.822-1.127 1.496-1.922 1.791-.806.298-1.647.457-2.768-.054-1.267-.575-2.237-1.02-3.383-2.053-1.464-1.325-2.524-2.991-2.875-3.699-.555-1.121-.629-2.413-.193-3.343.462-.93 1.141-1.21 1.527-1.21.351 0 .716.145 1.014.414.297.265.408.607.549.965.139.365.335.847.395 1.213.069.405.128.749-.193 1.143-.231.284-.487.56-.656.73-.149.149-.247.331-.11.665.138.332.608 1.376 1.306 2.215.883 1.053 1.58 1.385 1.9 1.538.32.149.698.232 1.068.06.37-.17.602-.483.786-.808.193-.329.396-.682.694-.827.298-.149.695-.052 1.091.084.395.137 2.52 1.188 2.95 1.402.432.214.719.322.826.499.106.175.106.646-.177 1.273z"></path>
                        </svg>
                        WhatsApp
                      </button>
                      <button
                        onClick={shareViaEmail}
                        className="flex-1 py-2.5 bg-[#EA4335] text-white rounded-lg hover:bg-opacity-90 transition-colors flex items-center justify-center"
                      >
                        <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"></path>
                        </svg>
                        Email
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Join Room Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#dbeafe] rounded-2xl shadow-lg w-full max-w-md p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Join a Room</h3>
              <button
                onClick={() => {
                  setShowJoinModal(false);
                  setJoinLink('');
                  setJoinError('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleJoinRoom} className="space-y-4">
              <div>
                <label htmlFor="join-link" className="block text-sm font-medium text-gray-700 mb-1">
                  Paste invite link or room ID
                </label>
                <input
                  type="text"
                  id="join-link"
                  value={joinLink}
                  onChange={(e) => {
                    setJoinLink(e.target.value);
                    setJoinError('');
                  }}
                  placeholder="https://codyssey.live/join?inviterId=user123"
                  className="w-full px-4 py-2.5 bg-[#E8F1F7] border border-gray-200 rounded-lg focus:ring-[#94C3D2] focus:border-[#94C3D2] text-gray-800"
                />
                {joinError && (
                  <p className="mt-2 text-sm text-red-600">{joinError}</p>
                )}
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#94C3D2] text-white rounded-lg hover:bg-opacity-90 transition-colors flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  Join
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Added margin at the bottom */}
      <div className="pb-16"></div>
    </div>
  );
};

export default Dashboard;
