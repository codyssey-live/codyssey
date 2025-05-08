import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from '../components/Navbar';
import Header from '../components/dashboard/Header';
import StatCard from '../components/dashboard/StatCard';
import DistributionCard from '../components/dashboard/DistributionCard';
import PlatformCard from '../components/dashboard/PlatformCard';
import ProblemList from '../components/dashboard/ProblemList';
import { fetchCurrentUser } from '../utils/authUtils';
import axios from 'axios';
import { motion } from 'framer-motion';

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
        console.error('Error fetching user data:', err);
      }
    };
    
    getUserData();
  }, []);
  
  // Mock problem data
  const mockProblems = [
    { 
      id: 1, 
      title: 'Two Sum', 
      link: 'https://leetcode.com/problems/two-sum/',
      platform: 'LeetCode',
      dateAdded: '2023-10-18',
      status: 'solved' 
    },
    { 
      id: 2, 
      title: 'Valid Parentheses', 
      link: 'https://leetcode.com/problems/valid-parentheses/',
      platform: 'LeetCode',
      dateAdded: '2023-10-19',
      status: 'unsolved' 
    },
    { 
      id: 3, 
      title: 'Reverse Linked List', 
      link: 'https://leetcode.com/problems/reverse-linked-list/',
      platform: 'LeetCode',
      dateAdded: '2023-10-20',
      status: 'solved' 
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
      
      try {
        // Use axios with credentials included
        const response = await axios.post('/api/rooms/create', {}, {
          withCredentials: true
        });
        
        const data = response.data;
        
        if (data.success && data.data.roomId) {
          const newRoomId = data.data.roomId;
          console.log('Room created successfully with ID:', newRoomId);
          
          setRoomId(newRoomId);
          setRoomCreated(true);
          
          // Make sure to include all required room info
          localStorage.setItem('roomInfo', JSON.stringify({ 
            roomId: newRoomId, 
            createdAt: new Date().toISOString(),
            isCreator: true, // Explicitly mark as creator
            userId: localStorage.getItem('userId') // Include user ID for verification
          }));
          
          // Also add to validated rooms cache
          const validatedRooms = JSON.parse(localStorage.getItem('validatedRooms') || '[]');
          if (!validatedRooms.includes(newRoomId)) {
            validatedRooms.push(newRoomId);
            localStorage.setItem('validatedRooms', JSON.stringify(validatedRooms));
          }
          
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

  // Return just the room ID instead of a URL
  const generateInviteCode = () => {
    if (roomCreated && roomId) {
      return roomId;
    }
    return '';
  };

  const handleCopyLink = () => {
    if (!roomCreated) {
      toast.info('Please create a room first');
      return;
    }
    
    // Only copy the room ID, not a full URL
    navigator.clipboard.writeText(roomId)
      .then(() => {
        setCopySuccess(true);
        toast.success('Room code copied to clipboard!');
        setTimeout(() => setCopySuccess(false), 3000);
      })
      .catch(err => {
        console.error('Failed to copy room ID: ', err);
        toast.error('Failed to copy room code');
      });
  };

  const shareOnWhatsApp = () => {
    if (!roomCreated) {
      toast.info('Please create a room first');
      return;
    }
    const text = encodeURIComponent(`Join me on Codyssey! Use room code: ${roomId}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareViaEmail = () => {
    if (!roomCreated) {
      toast.info('Please create a room first');
      return;
    }
    const subject = encodeURIComponent('Join me on Codyssey');
    const body = encodeURIComponent(`I'm inviting you to join me on Codyssey. Use this room code to join: ${roomId}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!joinLink) {
      setJoinError('Please enter a room code');
      return;
    }

    try {
      // Extract room ID - either directly entered or from a URL
      let roomIdToJoin;
      if (joinLink.includes('/') || joinLink.includes('://')) {
        try {
          const url = new URL(joinLink);
          const pathSegments = url.pathname.split('/');
          roomIdToJoin = pathSegments[pathSegments.length - 1];
        } catch (error) {
          // Not a valid URL, try extracting from string
          const matches = joinLink.match(/([a-zA-Z0-9]{8})/);
          if (matches && matches.length > 0) {
            roomIdToJoin = matches[0];
          } else {
            setJoinError('Invalid room code or URL');
            return;
          }
        }
      } else {
        // Direct room ID entered
        roomIdToJoin = joinLink;
      }
      
      console.log('Attempting to join room with ID:', roomIdToJoin);
      
      // Check if user was previously the creator of this room
      const roomCreatorHistory = JSON.parse(localStorage.getItem('roomCreatorHistory') || '{}');
      const wasRoomCreator = roomCreatorHistory[roomIdToJoin] === true;
      
      try {
        // Validate room before joining
        const response = await axios.get(`/api/rooms/validate/${roomIdToJoin}`);
        
        if (response.data.success) {
          console.log("Room validation successful");
          
          // Save the joined room info - include isCreator if user was previously creator
          localStorage.setItem('roomInfo', JSON.stringify({ 
            roomId: roomIdToJoin, 
            joinedAt: new Date().toISOString(),
            isCreator: wasRoomCreator // Set this if user was previously creator
          }));
          
          // Track this room as validated
          const validatedRooms = JSON.parse(localStorage.getItem('validatedRooms') || '[]');
          if (!validatedRooms.includes(roomIdToJoin)) {
            validatedRooms.push(roomIdToJoin);
            localStorage.setItem('validatedRooms', JSON.stringify(validatedRooms));
          }
          
          // Dispatch event to notify Navbar component
          window.dispatchEvent(new CustomEvent('roomJoined'));
          
          // Navigate to the room
          navigate(`/room/${roomIdToJoin}`);
          setShowJoinModal(false);
        }
      } catch (error) {
        if (error.response && error.response.status === 404) {
          setJoinError('Room not found or is no longer active');
        } else {
          console.error('Error joining room:', error);
          setJoinError('Error validating room. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error in join room process:', error);
      setJoinError('Invalid room code or connection issue');
    }
  };

  const handleOpenRoom = () => {
    if (roomCreated && roomId) {
      // First check if this room was previously ended
      const endedRooms = JSON.parse(localStorage.getItem('endedRooms') || '[]');
      if (endedRooms.includes(roomId)) {
        toast.error("This room has been ended and is no longer available");
        return;
      }
      // Navigate to the room page with the roomId
      navigate(`/room/${roomId}`);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#334155] to-[#0f172a] text-white">
      <Navbar />
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <motion.div 
          className="flex justify-between items-center mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-[#94C3D2] bg-clip-text text-transparent">Welcome, {userData.name}!</h1>
            <p className="text-[#94C3D2]/80 mt-1">Track your progress and manage your DSA journey</p>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={handleCreateRoomClick}
              className="bg-white/10 border border-white/20 text-white/95 hover:bg-white/20 px-4 py-2.5 rounded-lg flex items-center shadow-sm backdrop-blur-sm transition-colors"
              style={{ textShadow: "0 0 10px rgba(255, 255, 255, 0.3)" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#94C3D2]" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
              </svg>
              Create Room
            </button>
            <button 
              onClick={() => setShowJoinModal(true)}
              className="bg-[#94C3D2] text-white px-5 py-2.5 rounded-lg flex items-center shadow-sm hover:bg-[#7EB5C3] transition-colors"
              style={{ textShadow: "0 0 10px rgba(255, 255, 255, 0.3)" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 002-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
              </svg>
              Join Room
            </button>
          </div>
        </motion.div>
        
        <motion.h2 
          className="text-2xl font-bold bg-gradient-to-r from-white to-[#94C3D2] bg-clip-text text-transparent mt-8 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          Your Dashboard
        </motion.h2>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <div className="bg-white/10 rounded-2xl shadow-lg border border-white/20 p-6 backdrop-blur-md hover:bg-white/15 transition-all duration-300">
            <h3 className="text-lg font-medium text-[#94C3D2] mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Problem Status
            </h3>
            
            <div className="space-y-5 flex-grow">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-green-400 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Solved
                  </span>
                  <span className="text-sm text-green-400">{userData.stats.solved}</span>
                </div>
                <div className="w-full bg-gray-600/30 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-green-400 h-2 rounded-full transition-all duration-500 ease-in-out"
                    style={{ 
                      width: `${(userData.stats.solved / (userData.stats.solved + userData.stats.unsolved + userData.stats.solveLater)) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-red-400 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    Unsolved
                  </span>
                  <span className="text-sm text-red-400">{userData.stats.unsolved}</span>
                </div>
                <div className="w-full bg-gray-600/30 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-red-400 h-2 rounded-full transition-all duration-500 ease-in-out"
                    style={{ 
                      width: `${(userData.stats.unsolved / (userData.stats.solved + userData.stats.unsolved + userData.stats.solveLater)) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-yellow-400 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    Solve Later
                  </span>
                  <span className="text-sm text-yellow-400">{userData.stats.solveLater}</span>
                </div>
                <div className="w-full bg-gray-600/30 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-500 ease-in-out"
                    style={{ 
                      width: `${(userData.stats.solveLater / (userData.stats.solved + userData.stats.unsolved + userData.stats.solveLater)) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex justify-between items-center">
              <span className="text-sm text-white/80">Total</span>
              <span className="text-xl font-semibold text-white/95">{userData.stats.solved + userData.stats.unsolved + userData.stats.solveLater}</span>
            </div>
          </div>
          
          <div className="bg-white/10 rounded-2xl shadow-lg border border-white/20 p-6 backdrop-blur-md hover:bg-white/15 transition-all duration-300">
            <h3 className="text-lg font-medium text-[#94C3D2] mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
              Difficulty Distribution
            </h3>
            
            <div className="space-y-5 flex-grow">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-green-400 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-green-400 mr-1.5"></span>
                    Easy ({userData.distribution.easy})
                  </span>
                  <span className="text-sm font-medium text-green-400">{Math.round((userData.distribution.easy / (userData.distribution.easy + userData.distribution.medium + userData.distribution.hard)) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-600/30 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-green-400 h-2 rounded-full transition-all duration-500 ease-in-out"
                    style={{ width: `${(userData.distribution.easy / (userData.distribution.easy + userData.distribution.medium + userData.distribution.hard)) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-yellow-400 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-yellow-400 mr-1.5"></span>
                    Medium ({userData.distribution.medium})
                  </span>
                  <span className="text-sm font-medium text-yellow-400">{Math.round((userData.distribution.medium / (userData.distribution.easy + userData.distribution.medium + userData.distribution.hard)) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-600/30 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-500 ease-in-out"
                    style={{ width: `${(userData.distribution.medium / (userData.distribution.easy + userData.distribution.medium + userData.distribution.hard)) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-red-400 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-red-400 mr-1.5"></span>
                    Hard ({userData.distribution.hard})
                  </span>
                  <span className="text-sm font-medium text-red-400">{Math.round((userData.distribution.hard / (userData.distribution.easy + userData.distribution.medium + userData.distribution.hard)) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-600/30 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-red-400 h-2 rounded-full transition-all duration-500 ease-in-out"
                    style={{ width: `${(userData.distribution.hard / (userData.distribution.easy + userData.distribution.medium + userData.distribution.hard)) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex justify-between items-center">
              <span className="text-sm text-white/80">Total Problems</span>
              <span className="text-xl font-semibold text-white/95">{userData.distribution.easy + userData.distribution.medium + userData.distribution.hard}</span>
            </div>
          </div>
          
          <div className="bg-white/10 rounded-2xl shadow-lg border border-white/20 p-6 backdrop-blur-md hover:bg-white/15 transition-all duration-300">
            <h3 className="text-lg font-medium text-[#94C3D2] mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c-1.657 0-3-4.03-3-9s1.343-9 3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              Platform Distribution
            </h3>
            
            <div className="space-y-5 flex-grow">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-yellow-400 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-yellow-400 mr-1.5"></span>
                    LeetCode ({userData.platforms.leetcode})
                  </span>
                  <span className="text-sm font-medium text-yellow-400">{Math.round((userData.platforms.leetcode / (userData.platforms.leetcode + userData.platforms.codeforces + userData.platforms.hackerrank)) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-600/30 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-500 ease-in-out"
                    style={{ width: `${(userData.platforms.leetcode / (userData.platforms.leetcode + userData.platforms.codeforces + userData.platforms.hackerrank)) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-red-400 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-red-400 mr-1.5"></span>
                    Codeforces ({userData.platforms.codeforces})
                  </span>
                  <span className="text-sm font-medium text-red-400">{Math.round((userData.platforms.codeforces / (userData.platforms.leetcode + userData.platforms.codeforces + userData.platforms.hackerrank)) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-600/30 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-red-400 h-2 rounded-full transition-all duration-500 ease-in-out"
                    style={{ width: `${(userData.platforms.codeforces / (userData.platforms.leetcode + userData.platforms.codeforces + userData.platforms.hackerrank)) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-green-400 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-green-400 mr-1.5"></span>
                    HackerRank ({userData.platforms.hackerrank})
                  </span>
                  <span className="text-sm font-medium text-green-400">{Math.round((userData.platforms.hackerrank / (userData.platforms.leetcode + userData.platforms.codeforces + userData.platforms.hackerrank)) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-600/30 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-green-400 h-2 rounded-full transition-all duration-500 ease-in-out"
                    style={{ width: `${(userData.platforms.hackerrank / (userData.platforms.leetcode + userData.platforms.codeforces + userData.platforms.hackerrank)) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex justify-between items-center">
              <span className="text-sm text-white/80">Total Submissions</span>
              <span className="text-xl font-semibold text-white/95">{userData.platforms.leetcode + userData.platforms.codeforces + userData.platforms.hackerrank}</span>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          className="mb-6 flex space-x-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <button
            onClick={() => setActiveTab('recent')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'recent' 
                ? 'bg-[#94C3D2] text-white shadow' 
                : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            Recent
          </button>
          <button
            onClick={() => setActiveTab('solved')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'solved' 
                ? 'bg-[#94C3D2] text-white shadow' 
                : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            Solved
          </button>
          <button
            onClick={() => setActiveTab('unsolved')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'unsolved' 
                ? 'bg-[#94C3D2] text-white shadow' 
                : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            Unsolved
          </button>
          <button
            onClick={() => setActiveTab('solveLater')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'solveLater' 
                ? 'bg-[#94C3D2] text-white shadow' 
                : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            Solve Later
          </button>
        </motion.div>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          {problems.length === 0 ? (
            <div className="bg-white/10 rounded-xl p-10 text-center backdrop-blur-md border border-white/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white/60 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-white/95 font-medium">No problems found in this category.</p>
              <p className="text-white/70 text-sm mt-1">Try adding some problems or changing your filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-white/10 rounded-xl overflow-hidden backdrop-blur-md border border-white/20 p-4">
                <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-semibold text-white/95 uppercase tracking-wider">
                  <div className="col-span-4 md:col-span-5">Title</div>
                  <div className="col-span-3 md:col-span-2">Platform</div>
                  <div className="col-span-3 md:col-span-2">Date Added</div>
                  <div className="col-span-2 md:col-span-2">Status</div>
                  <div className="hidden md:block md:col-span-1">Actions</div>
                </div>
              </div>
              
              {problems.map((problem) => (
                <div 
                  key={problem.id} 
                  className="bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-4 transition-all duration-300"
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-4 md:col-span-5">
                      <a 
                        href={problem.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-medium text-white/95 hover:text-[#94C3D2] hover:underline transition-colors"
                      >
                        {problem.title}
                      </a>
                    </div>

                    <div className="col-span-3 md:col-span-2">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 text-white/80 border border-white/20">
                        {problem.platform}
                      </span>
                    </div>

                    <div className="col-span-3 md:col-span-2 text-sm text-white/70">
                      {problem.dateAdded}
                    </div>

                    <div className="col-span-2 md:col-span-2">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        problem.status === 'solved' ? 'bg-green-900/50 text-green-200 border border-green-600/30' :
                        problem.status === 'unsolved' ? 'bg-red-900/50 text-red-200 border border-red-600/30' :
                        'bg-yellow-900/50 text-yellow-200 border border-yellow-600/30'
                      }`}>
                        {problem.status === 'solveLater' ? 'Solve Later' : problem.status.charAt(0).toUpperCase() + problem.status.slice(1)}
                      </span>
                    </div>

                    <div className="hidden md:flex md:col-span-1 justify-end space-x-3">
                      <button 
                        className="text-blue-400 hover:text-blue-300 transition-colors p-1.5 hover:bg-white/10 rounded-full"
                        title="Copy Link"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                      </button>
                      <button 
                        className="text-green-400 hover:text-green-300 transition-colors p-1.5 hover:bg-white/10 rounded-full"
                        title="Share"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* Mobile actions - only visible on small screens */}
                    <div className="col-span-12 flex md:hidden justify-end mt-2 space-x-4">
                      <button 
                        className="text-blue-400 hover:text-blue-300 transition-colors flex items-center"
                        title="Copy Link"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Copy
                      </button>
                      <button 
                        className="text-green-400 hover:text-green-300 transition-colors flex items-center"
                        title="Share"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        Share
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Create Room Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl w-full max-w-md p-6 border border-white/20 overflow-hidden relative"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-[#94C3D2] bg-clip-text text-transparent">Create Room</h3>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setRoomCreated(false);
                  setRoomId('');
                }}
                className="text-white/80 hover:text-white transition-colors"
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
                    onClick={handleCreateRoom}
                    disabled={creatingRoom}
                    className="px-6 py-2.5 bg-[#94C3D2] text-white rounded-lg hover:bg-[#7EB5C3] transition-colors shadow-lg flex items-center"
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
                    <label htmlFor="invite-link" className="block text-sm font-medium text-[#94C3D2] mb-1.5">
                      Share this code with your friends
                    </label>
                    <div className="flex">
                      <input
                        ref={inviteLinkRef}
                        type="text"
                        id="invite-link"
                        readOnly
                        value={generateInviteCode()}
                        className="w-full pl-4 pr-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-[#94C3D2]/50 focus:border-[#94C3D2] text-gray-100"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="px-4 py-2.5 bg-[#94C3D2] text-white rounded-r-lg hover:bg-[#7EB5C3] transition-colors"
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
                      <p className="mt-2 text-sm text-green-400">Room code copied to clipboard!</p>
                    )}
                  </div>
                  
                  {/* Add Open Room button */}
                  <div className="flex justify-center py-2">
                    <button
                      onClick={handleOpenRoom}
                      className="px-6 py-2.5 bg-[#94C3D2] text-white rounded-lg hover:bg-[#7EB5C3] transition-colors shadow-lg flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                      </svg>
                      Open Room
                    </button>
                  </div>
                  <div className="border-t border-gray-600/30 pt-4">
                    <p className="text-sm text-white/70 mb-3">Or share code directly via:</p>
                    <div className="flex space-x-3">
                      <button
                        onClick={shareOnWhatsApp}
                        className="flex-1 py-2.5 bg-[#25D366] text-white rounded-lg hover:bg-opacity-90 transition-colors flex items-center justify-center"
                      >
                        <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"></path>
                          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm6.127 16.12c-.282.822-1.127 1.496-1.922 1.791-.806.298-1.647.457-2.768-.054-1.267-.575-2.237-1.02-3.383-2.053-1.464-1.325-2.524-2.991-2.875-3.699-.555-1.121-.629-2.413-.193-3.343.462-.93 1.141-1.21 1.527-1.21.351 0 .716.145 1.014.414.297.265.408.607.549.965.139.365.335.847.395 1.213.069.405.128.749-.208 1.168-.328.34-.329.34-.329.34l-.062.105c-.282.478.154.999.231 1.125.831 1.303 1.94 2.121 3.067 2.552.274.105.274.105.578.011 0 0 .416-.455.696-.77.33-.377.749-.325 1.019-.231.271.094 1.742.822 1.742.822l.174.08c.367.168.601.555.427 1.083z"></path>
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
          </motion.div>
        </div>
      )}

      {/* Join Room Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl w-full max-w-md p-6 border border-white/20 overflow-hidden relative"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-[#94C3D2] bg-clip-text text-transparent">Join a Room</h3>
              <button
                onClick={() => {
                  setShowJoinModal(false);
                  setJoinLink('');
                  setJoinError('');
                }}
                className="text-white/80 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleJoinRoom} className="space-y-4">
              <div>
                <label htmlFor="join-link" className="block text-sm font-medium text-[#94C3D2] mb-1.5">
                  Enter room code
                </label>
                <input
                  type="text"
                  id="join-link"
                  value={joinLink}
                  onChange={(e) => {
                    setJoinLink(e.target.value);
                    setJoinError('');
                  }}
                  placeholder="Enter an 8-character room code"
                  className="w-full pl-4 pr-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#94C3D2]/50 focus:border-[#94C3D2] text-gray-100 placeholder-gray-400"
                />
                {joinError && (
                  <p className="mt-2 text-sm text-red-400">{joinError}</p>
                )}
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#94C3D2] text-white rounded-lg hover:bg-[#7EB5C3] transition-colors shadow-lg flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  Join
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      
      <div className="pb-16"></div>
    </div>
  );
};

export default Dashboard;
