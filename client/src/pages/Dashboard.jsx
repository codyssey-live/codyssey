import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../context/NotificationContext";
import Navbar from "../components/Navbar";
import Header from "../components/dashboard/Header";
import StatCard from "../components/dashboard/StatCard";
import DistributionCard from "../components/dashboard/DistributionCard";
import PlatformCard from "../components/dashboard/PlatformCard";
import ProblemList from "../components/dashboard/ProblemList";
import { fetchCurrentUser } from "../utils/authUtils";
import { fetchUserSyllabusProblems } from "../utils/syllabusApiUtils";
import axios from "axios";
import { motion } from "framer-motion";
import apiClient from "../utils/apiClient"; // Import our configured axios instance

const Dashboard = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinLink, setJoinLink] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [roomCreated, setRoomCreated] = useState(false);
  const [roomId, setRoomId] = useState("");
  const inviteLinkRef = useRef(null);

  const [userData, setUserData] = useState({
    name: localStorage.getItem("userName") || "User",
    stats: {
      solved: 0,
      unsolved: 0,
      solveLater: 0,
    },
    distribution: {
      easy: 0,
      medium: 0,
      hard: 0,
    },
    platforms: {
      leetcode: 0,
      codeforces: 0,
      hackerrank: 0,
      other: 0,
    },
  });

  // Ensure no room is automatically created when dashboard loads
  if (localStorage.getItem("autoCreateRoom") === "true") {
    localStorage.removeItem("autoCreateRoom");
  }

  // State for active tab and problems
  const [activeTab, setActiveTab] = useState("recent");
  const [problems, setProblems] = useState([]);
  const [allProblems, setAllProblems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user data and problems from the API
  useEffect(() => {
    const getUserData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch user profile
        const user = await fetchCurrentUser();
        let userId = null;
        
        if (user) {
          userId = user._id || user.id;
          localStorage.setItem("userName", user.name || "User");
          localStorage.setItem("userId", userId);
        
          // Fetch all syllabus problems for this user
          const result = await fetchUserSyllabusProblems(userId);
          
          if (result.success && result.data) {
            const userProblems = result.data;
            setAllProblems(userProblems);
            
            // Process problem statistics
            const stats = {
              solved: userProblems.filter(p => p.status === "solved").length,
              unsolved: userProblems.filter(p => p.status === "unsolved").length,
              solveLater: userProblems.filter(p => p.status === "solveLater").length,
            };
            
            // Process difficulty distribution
            const distribution = {
              easy: userProblems.filter(p => p.difficulty?.toLowerCase() === "easy").length,
              medium: userProblems.filter(p => p.difficulty?.toLowerCase() === "medium").length,
              hard: userProblems.filter(p => p.difficulty?.toLowerCase() === "hard").length,
            };
            
            // Process platform distribution
            const platformCounts = {};
            userProblems.forEach(problem => {
              const platform = problem.platform;
              if (!platform) return;
              
              const normalizedPlatform = platform.toLowerCase();
              if (['leetcode', 'codeforces', 'hackerrank'].includes(normalizedPlatform)) {
                platformCounts[normalizedPlatform] = (platformCounts[normalizedPlatform] || 0) + 1;
              } else {
                platformCounts.other = (platformCounts.other || 0) + 1;
              }
            });
            
            // Update user data with real statistics
            setUserData({
              name: user.name || "User",
              stats,
              distribution,
              platforms: {
                leetcode: platformCounts.leetcode || 0,
                codeforces: platformCounts.codeforces || 0,
                hackerrank: platformCounts.hackerrank || 0,
                other: platformCounts.other || 0,
              },
            });
              // Format problems for display
            const formattedProblems = userProblems.map(p => {
              // Log dates to help debugging
              
              return {
                id: p._id,
                title: p.title,
                link: p.url,
                platform: p.platform,
                dateAdded: new Date(p.dateAdded).toISOString().split('T')[0],
                dateAddedRaw: p.dateAdded, // Keep raw date for accurate sorting
                status: p.status || "unsolved",
                difficulty: p.difficulty
              };
            });
            
            setAllProblems(formattedProblems);
          }
        }
      } catch (err) {
       
        addNotification("Failed to load your problem data", "error");
      } finally {
        setIsLoading(false);
      }
    };

    getUserData();
    
    // Clean up any accidental room creation flags
    return () => {
      localStorage.removeItem('autoCreateRoom');
    };
  }, []);
  // Filter problems based on active tab
  useEffect(() => {
    if (allProblems.length === 0) {
      setProblems([]);
      return;
    }
      // Create a sorted copy for all cases to ensure consistent ordering
    const sortedProblems = [...allProblems].sort((a, b) => {
      // Use the raw date if available for more accurate sorting
      const dateA = a.dateAddedRaw ? new Date(a.dateAddedRaw) : 
                    a.dateAdded ? new Date(a.dateAdded) : new Date(0);
      const dateB = b.dateAddedRaw ? new Date(b.dateAddedRaw) : 
                    b.dateAdded ? new Date(b.dateAdded) : new Date(0);
            
      // Sort newest first (most recent at the top)
      return dateB - dateA;
    });
      if (activeTab === "recent") {
      // Take the top 5 most recent problems
      const recentProblems = sortedProblems.slice(0, 5);
      setProblems(recentProblems);
    } else if (activeTab === "solved") {
      // Keep the sorted order (newest first) for solved problems too
      setProblems(sortedProblems.filter((p) => p.status === "solved"));
    } else if (activeTab === "unsolved") {
      // Keep the sorted order (newest first) for unsolved problems too
      setProblems(sortedProblems.filter((p) => p.status === "unsolved"));
    } else if (activeTab === "solveLater") {
      // Keep the sorted order (newest first) for solve later problems too
      setProblems(sortedProblems.filter((p) => p.status === "solveLater"));
    }
  }, [activeTab, allProblems]);

  const handleCreateRoomClick = () => { 
    // Log authentication state for debugging
    const token = localStorage.getItem('token');
    
    setShowInviteModal(true);
  };

  const handleCreateRoom = async () => {
    try {
      setCreatingRoom(true);

      try {        // Use our apiClient instead of axios directly to ensure credentials are sent
        // apiClient already has withCredentials set to true globally
        const response = await apiClient.post(
          "/rooms/create",
          {} // Empty body
        );

        const data = response.data;

        if (data.success && data.data.roomId) {
          const newRoomId = data.data.roomId;

          setRoomId(newRoomId);
          setRoomCreated(true);

          const userId = localStorage.getItem("userId");          // Make sure to include all required room info
          localStorage.setItem(
            "roomInfo",
            JSON.stringify({
              roomId: newRoomId,
              createdAt: new Date().toISOString(),
              isCreator: true,
              inviterId: userId, // Store inviterId (creator's own ID in this case)
              userId: userId,
            })
          );

          // Also store this room ID in a separate mapping of rooms created by this user
          const userCreatedRooms = JSON.parse(
            localStorage.getItem("userCreatedRooms") || "{}"
          );
          userCreatedRooms[newRoomId] = userId;
          localStorage.setItem("userCreatedRooms", JSON.stringify(userCreatedRooms));

          // Also add to validated rooms cache
          const validatedRooms = JSON.parse(
            localStorage.getItem("validatedRooms") || "[]"
          );
          if (!validatedRooms.includes(newRoomId)) {
            validatedRooms.push(newRoomId);
            localStorage.setItem(
              "validatedRooms",
              JSON.stringify(validatedRooms)
            );
          }

          // Dispatch event to notify Navbar component
          window.dispatchEvent(new CustomEvent("roomCreated"));

          addNotification("Room created successfully!", "success");
        }
      } catch (error) {
       
        addNotification(error.response?.data?.message || "Failed to create room", "error");
      }
    } catch (error) {
      
    } finally {
      setCreatingRoom(false);
    }
  };

  // Return just the room ID instead of a URL
  const generateInviteCode = () => {
    if (roomCreated && roomId) {
      return roomId;
    }
    return "";
  };

  const handleCopyLink = () => {
    if (!roomCreated) {
      addNotification("Please create a room first", "info");
      return;
    }

    // Only copy the room ID, not a full URL
    navigator.clipboard
      .writeText(roomId)
      .then(() => {
        setCopySuccess(true);
        addNotification("Room code copied to clipboard!", "success");
        setTimeout(() => setCopySuccess(false), 3000);
      })
      .catch((err) => {
      
        addNotification("Failed to copy room code", "error");
      });
  };

  const shareOnWhatsApp = () => {
    if (!roomCreated) {
      addNotification("Please create a room first", "info");
      return;
    }
    const text = encodeURIComponent(
      `Join me on Codyssey! Use room code: ${roomId}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const shareViaEmail = () => {
    if (!roomCreated) {
      addNotification("Please create a room first", "info");
      return;
    }
    const subject = encodeURIComponent("Join me on Codyssey");
    const body = encodeURIComponent(
      `I'm inviting you to join me on Codyssey. Use this room code to join: ${roomId}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };
  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!joinLink) {
      setJoinError("Please enter a room code");
      return;
    }
    
    // Log authentication state for debugging
    const token = localStorage.getItem('token');
    

    try {
      // Extract room ID - either directly entered or from a URL
      let roomIdToJoin;
      if (joinLink.includes("/") || joinLink.includes("://")) {
        try {
          const url = new URL(joinLink);
          const pathSegments = url.pathname.split("/");
          roomIdToJoin = pathSegments[pathSegments.length - 1];
        } catch (error) {
          // Not a valid URL, try extracting from string
          const matches = joinLink.match(/([a-zA-Z0-9]{8})/);
          if (matches && matches.length > 0) {
            roomIdToJoin = matches[0];
          } else {
            setJoinError("Invalid room code or URL");
            return;
          }
        }
      } else {
        // Direct room ID entered
        roomIdToJoin = joinLink;
      }

      const roomCreatorHistory = JSON.parse(
        localStorage.getItem("roomCreatorHistory") || "{}"
      );
      const wasRoomCreator = roomCreatorHistory[roomIdToJoin] === true;

      try {        // Validate room before joining - use apiClient for consistent auth handling
        const response = await apiClient.get(`/rooms/validate/${roomIdToJoin}`);

        if (response.data.success) {

          // Get inviterId from the response
          const inviterId = response.data.data.inviterId;
            // Check if this user is the original creator by comparing user ID with inviter ID
          const currentUserId = localStorage.getItem("userId");
          
          // Room creator status is ONLY determined by matching the current user ID with the inviterId
          // This prevents unauthorized users from ending rooms
          const isOriginalCreator = currentUserId && inviterId && currentUserId === inviterId.toString();
          
          // Room creator history is no longer used to determine if user can end room
          // We're keeping it just for backward compatibility
          if (isOriginalCreator) {
            
            roomCreatorHistory[roomIdToJoin] = true;
            localStorage.setItem("roomCreatorHistory", JSON.stringify(roomCreatorHistory));
          }
          
          // Set creator status based ONLY on ID match with inviterId
          const finalCreatorStatus = isOriginalCreator;

          // Save the joined room info
          localStorage.setItem(
            "roomInfo",
            JSON.stringify({
              roomId: roomIdToJoin,
              joinedAt: new Date().toISOString(),
              isCreator: finalCreatorStatus,
              inviterId: inviterId, // Store the inviterId (room creator)
            })
          );

          // Track this room as validated
          const validatedRooms = JSON.parse(
            localStorage.getItem("validatedRooms") || "[]"
          );
          if (!validatedRooms.includes(roomIdToJoin)) {
            validatedRooms.push(roomIdToJoin);
            localStorage.setItem(
              "validatedRooms",
              JSON.stringify(validatedRooms)
            );
          }

          // Dispatch event to notify Navbar component
          window.dispatchEvent(new CustomEvent("roomJoined"));

          // Navigate to the room
          navigate(`/room/${roomIdToJoin}`);
          setShowJoinModal(false);
        }
      } catch (error) {
        if (error.response && error.response.status === 404) {
          setJoinError("Room not found or is no longer active");
        } else {
          
          setJoinError("Error validating room. Please try again.");
        }
      }
    } catch (error) {
     
      setJoinError("Invalid room code or connection issue");
    }
  };

  const handleOpenRoom = () => {
    if (roomCreated && roomId) {
      // First check if this room was previously ended
      const endedRooms = JSON.parse(localStorage.getItem("endedRooms") || "[]");
      if (endedRooms.includes(roomId)) {
        addNotification("This room has been ended and is no longer available", "error");
        return;
      }
      // Navigate to the room page with the roomId
      navigate(`/room/${roomId}`);
    }
  };

  // Share and copy functions for problem links
  const handleCopyProblemLink = (problem) => {
    const link = problem.link || problem.url;
    navigator.clipboard
      .writeText(link)
      .then(() => {
        addNotification("Problem link copied to clipboard!", "success");
      })
      .catch((err) => {

        addNotification("Failed to copy problem link", "error");
      });
  };

  const handleShareProblem = (problem) => {
    const title = problem.title;
    const link = problem.link || problem.url;
    
    if (navigator.share) {
      navigator.share({
        title: `Coding Problem: ${title}`,
        text: `Check out this coding problem: ${title}`,
        url: link
      })
      .catch(err => {
        // Fallback to copy if share fails
        handleCopyProblemLink(problem);
      });
    } else {
      // Fallback for browsers that don't support native sharing
      handleCopyProblemLink(problem);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#334155] to-[#0f172a] text-white">
      <Navbar />
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 relative z-10">        <motion.div
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-[#94C3D2] bg-clip-text text-transparent">
              Welcome, {userData.name}!
            </h1>
            <p className="text-[#94C3D2]/80 mt-1">
              Track your progress and manage your DSA journey
            </p>
          </div>

          <div className="flex gap-2 sm:gap-4 mt-4 sm:mt-0 w-full sm:w-auto">            <button
              onClick={handleCreateRoomClick}
              className="bg-white/10 border border-white/20 text-white/95 hover:bg-white/20 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg flex items-center shadow-sm backdrop-blur-sm transition-colors flex-1 sm:flex-auto justify-center sm:justify-start"
              style={{ textShadow: "0 0 10px rgba(255, 255, 255, 0.3)" }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 text-[#94C3D2]"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
              </svg>
              <span className="text-sm sm:text-base">Create Room</span>
            </button>
            <button
              onClick={() => setShowJoinModal(true)}
              className="bg-[#94C3D2] text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg flex items-center shadow-sm hover:bg-[#7EB5C3] transition-colors flex-1 sm:flex-auto justify-center"
              style={{ textShadow: "0 0 10px rgba(255, 255, 255, 0.3)" }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 002-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
              </svg>
              <span className="text-sm sm:text-base">Join Room</span>
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
        </motion.h2>        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <div className="bg-white/10 rounded-2xl shadow-lg border border-white/20 p-6 backdrop-blur-md hover:bg-white/15 transition-all duration-300">
            <h3 className="text-lg font-medium text-[#94C3D2] mb-4 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Problem Status
            </h3>

            <div className="space-y-5 flex-grow">          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm text-green-400 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Solved
              </span>
              <span className="text-sm text-green-400">
                {isLoading ? "..." : userData.stats.solved}
              </span>
            </div>
            <div className="w-full bg-gray-600/30 rounded-full h-2 overflow-hidden">
              <div
                className="bg-green-400 h-2 rounded-full transition-all duration-500 ease-in-out"
                style={{
                  width: `${
                    isLoading || 
                    (userData.stats.solved +
                      userData.stats.unsolved +
                      userData.stats.solveLater) === 0
                      ? "0"
                      : (userData.stats.solved /
                          (userData.stats.solved +
                            userData.stats.unsolved +
                            userData.stats.solveLater)) *
                        100
                  }%`,
                }}
              ></div>
            </div>
          </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-red-400 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1 text-red-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Unsolved
                  </span>
                  <span className="text-sm text-red-400">
                    {isLoading ? "..." : userData.stats.unsolved}
                  </span>
                </div>
                <div className="w-full bg-gray-600/30 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-red-400 h-2 rounded-full transition-all duration-500 ease-in-out"
                    style={{
                      width: `${
                        isLoading || 
                        (userData.stats.solved +
                          userData.stats.unsolved +
                          userData.stats.solveLater) === 0
                          ? "0"
                          : (userData.stats.unsolved /
                              (userData.stats.solved +
                                userData.stats.unsolved +
                                userData.stats.solveLater)) *
                            100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-yellow-400 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1 text-yellow-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Solve Later
                  </span>
                  <span className="text-sm text-yellow-400">
                    {isLoading ? "..." : userData.stats.solveLater}
                  </span>
                </div>
                <div className="w-full bg-gray-600/30 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-500 ease-in-out"
                    style={{
                      width: `${
                        isLoading || 
                        (userData.stats.solved +
                          userData.stats.unsolved +
                          userData.stats.solveLater) === 0
                          ? "0"
                          : (userData.stats.solveLater /
                              (userData.stats.solved +
                                userData.stats.unsolved +
                                userData.stats.solveLater)) *
                            100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-between items-center">
              <span className="text-sm text-white/80">Total</span>
              <span className="text-xl font-semibold text-white/95">
                {isLoading ? (
                  <span className="text-base opacity-70">Loading...</span>
                ) : (
                  userData.stats.solved +
                  userData.stats.unsolved +
                  userData.stats.solveLater
                )}
              </span>
            </div>
          </div>

          <div className="bg-white/10 rounded-2xl shadow-lg border border-white/20 p-6 backdrop-blur-md hover:bg-white/15 transition-all duration-300">
            <h3 className="text-lg font-medium text-[#94C3D2] mb-4 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                />
              </svg>
              Difficulty Distribution
            </h3>

            <div className="space-y-5 flex-grow">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-green-400 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-green-400 mr-1.5"></span>
                    Easy ({isLoading ? "..." : userData.distribution.easy})
                  </span>
                  <span className="text-sm font-medium text-green-400">
                    {isLoading || 
                    (userData.distribution.easy +
                      userData.distribution.medium +
                      userData.distribution.hard) === 0
                      ? "-"
                      : `${Math.round(
                          (userData.distribution.easy /
                            (userData.distribution.easy +
                              userData.distribution.medium +
                              userData.distribution.hard)) *
                            100
                        )}%`
                    }
                  </span>
                </div>
                <div className="w-full bg-gray-600/30 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-green-400 h-2 rounded-full transition-all duration-500 ease-in-out"
                    style={{
                      width: `${
                        isLoading || 
                        (userData.distribution.easy +
                          userData.distribution.medium +
                          userData.distribution.hard) === 0
                          ? "0"
                          : (userData.distribution.easy /
                              (userData.distribution.easy +
                                userData.distribution.medium +
                                userData.distribution.hard)) *
                            100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-yellow-400 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-yellow-400 mr-1.5"></span>
                    Medium ({isLoading ? "..." : userData.distribution.medium})
                  </span>
                  <span className="text-sm font-medium text-yellow-400">
                    {isLoading || 
                    (userData.distribution.easy +
                      userData.distribution.medium +
                      userData.distribution.hard) === 0
                      ? "-"
                      : `${Math.round(
                          (userData.distribution.medium /
                            (userData.distribution.easy +
                              userData.distribution.medium +
                              userData.distribution.hard)) *
                            100
                        )}%`
                    }
                  </span>
                </div>
                <div className="w-full bg-gray-600/30 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-500 ease-in-out"
                    style={{
                      width: `${
                        isLoading || 
                        (userData.distribution.easy +
                          userData.distribution.medium +
                          userData.distribution.hard) === 0
                          ? "0"
                          : (userData.distribution.medium /
                              (userData.distribution.easy +
                                userData.distribution.medium +
                                userData.distribution.hard)) *
                            100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-red-400 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-red-400 mr-1.5"></span>
                    Hard ({isLoading ? "..." : userData.distribution.hard})
                  </span>
                  <span className="text-sm font-medium text-red-400">
                    {isLoading || 
                    (userData.distribution.easy +
                      userData.distribution.medium +
                      userData.distribution.hard) === 0
                      ? "-"
                      : `${Math.round(
                          (userData.distribution.hard /
                            (userData.distribution.easy +
                              userData.distribution.medium +
                              userData.distribution.hard)) *
                            100
                        )}%`
                    }
                  </span>
                </div>
                <div className="w-full bg-gray-600/30 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-red-400 h-2 rounded-full transition-all duration-500 ease-in-out"
                    style={{
                      width: `${
                        isLoading || 
                        (userData.distribution.easy +
                          userData.distribution.medium +
                          userData.distribution.hard) === 0
                          ? "0"
                          : (userData.distribution.hard /
                              (userData.distribution.easy +
                                userData.distribution.medium +
                                userData.distribution.hard)) *
                            100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-between items-center">
              <span className="text-sm text-white/80">Total Problems</span>
              <span className="text-xl font-semibold text-white/95">
                {isLoading ? (
                  <span className="text-base opacity-70">Loading...</span>
                ) : (
                  userData.distribution.easy +
                  userData.distribution.medium +
                  userData.distribution.hard
                )}
              </span>
            </div>
          </div>

          <div className="bg-white/10 rounded-2xl shadow-lg border border-white/20 p-6 backdrop-blur-md hover:bg-white/15 transition-all duration-300">
            <h3 className="text-lg font-medium text-[#94C3D2] mb-4 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c-1.657 0-3-4.03-3-9s1.343-9 3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                />
              </svg>
              Platform Distribution
            </h3>

            <div className="space-y-5 flex-grow">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-yellow-400 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-yellow-400 mr-1.5"></span>
                    LeetCode ({isLoading ? "..." : userData.platforms.leetcode})
                  </span>
                  <span className="text-sm font-medium text-yellow-400">
                    {isLoading || 
                    (userData.platforms.leetcode +
                      userData.platforms.codeforces +
                      userData.platforms.hackerrank +
                      userData.platforms.other) === 0
                      ? "-"
                      : `${Math.round(
                          (userData.platforms.leetcode /
                            (userData.platforms.leetcode +
                              userData.platforms.codeforces +
                              userData.platforms.hackerrank +
                              userData.platforms.other)) *
                            100
                        )}%`
                    }
                  </span>
                </div>
                <div className="w-full bg-gray-600/30 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-500 ease-in-out"
                    style={{
                      width: `${
                        isLoading || 
                        (userData.platforms.leetcode +
                          userData.platforms.codeforces +
                          userData.platforms.hackerrank +
                          userData.platforms.other) === 0
                          ? "0"
                          : (userData.platforms.leetcode /
                              (userData.platforms.leetcode +
                                userData.platforms.codeforces +
                                userData.platforms.hackerrank +
                                userData.platforms.other)) *
                            100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-red-400 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-red-400 mr-1.5"></span>
                    Codeforces ({isLoading ? "..." : userData.platforms.codeforces})
                  </span>
                  <span className="text-sm font-medium text-red-400">
                    {isLoading || 
                    (userData.platforms.leetcode +
                      userData.platforms.codeforces +
                      userData.platforms.hackerrank +
                      userData.platforms.other) === 0
                      ? "-"
                      : `${Math.round(
                          (userData.platforms.codeforces /
                            (userData.platforms.leetcode +
                              userData.platforms.codeforces +
                              userData.platforms.hackerrank +
                              userData.platforms.other)) *
                            100
                        )}%`
                    }
                  </span>
                </div>
                <div className="w-full bg-gray-600/30 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-red-400 h-2 rounded-full transition-all duration-500 ease-in-out"
                    style={{
                      width: `${
                        isLoading || 
                        (userData.platforms.leetcode +
                          userData.platforms.codeforces +
                          userData.platforms.hackerrank +
                          userData.platforms.other) === 0
                          ? "0"
                          : (userData.platforms.codeforces /
                              (userData.platforms.leetcode +
                                userData.platforms.codeforces +
                                userData.platforms.hackerrank +
                                userData.platforms.other)) *
                            100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-green-400 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-green-400 mr-1.5"></span>
                    HackerRank ({isLoading ? "..." : userData.platforms.hackerrank})
                  </span>
                  <span className="text-sm font-medium text-green-400">
                    {isLoading || 
                    (userData.platforms.leetcode +
                      userData.platforms.codeforces +
                      userData.platforms.hackerrank +
                      userData.platforms.other) === 0
                      ? "-"
                      : `${Math.round(
                          (userData.platforms.hackerrank /
                            (userData.platforms.leetcode +
                              userData.platforms.codeforces +
                              userData.platforms.hackerrank +
                              userData.platforms.other)) *
                            100
                        )}%`
                    }
                  </span>
                </div>
                <div className="w-full bg-gray-600/30 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-green-400 h-2 rounded-full transition-all duration-500 ease-in-out"
                    style={{
                      width: `${
                        isLoading || 
                        (userData.platforms.leetcode +
                          userData.platforms.codeforces +
                          userData.platforms.hackerrank +
                          userData.platforms.other) === 0
                          ? "0"
                          : (userData.platforms.hackerrank /
                              (userData.platforms.leetcode +
                                userData.platforms.codeforces +
                                userData.platforms.hackerrank +
                                userData.platforms.other)) *
                            100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
              
              {userData.platforms.other > 0 && (
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-blue-400 flex items-center">
                      <span className="w-2 h-2 rounded-full bg-blue-400 mr-1.5"></span>
                      Other ({userData.platforms.other})
                    </span>
                    <span className="text-sm font-medium text-blue-400">
                      {`${Math.round(
                        (userData.platforms.other /
                          (userData.platforms.leetcode +
                            userData.platforms.codeforces +
                            userData.platforms.hackerrank +
                            userData.platforms.other)) *
                          100
                      )}%`}
                    </span>
                  </div>
                  <div className="w-full bg-gray-600/30 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-400 h-2 rounded-full transition-all duration-500 ease-in-out"
                      style={{
                        width: `${
                          (userData.platforms.other /
                            (userData.platforms.leetcode +
                              userData.platforms.codeforces +
                              userData.platforms.hackerrank +
                              userData.platforms.other)) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-between items-center">
              <span className="text-sm text-white/80">Total Submissions</span>
              <span className="text-xl font-semibold text-white/95">
                {isLoading ? (
                  <span className="text-base opacity-70">Loading...</span>
                ) : (
                  userData.platforms.leetcode +
                  userData.platforms.codeforces +
                  userData.platforms.hackerrank +
                  userData.platforms.other
                )}
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="mb-6 flex flex-wrap gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <button
            onClick={() => setActiveTab("recent")}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              activeTab === "recent"
                ? "bg-[#94C3D2] text-white shadow"
                : "bg-white/10 text-white/80 hover:bg-white/20"
            }`}
          >
            Recent
          </button>
          <button
            onClick={() => setActiveTab("solved")}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              activeTab === "solved"
                ? "bg-[#94C3D2] text-white shadow"
                : "bg-white/10 text-white/80 hover:bg-white/20"
            }`}
          >
            Solved
          </button>
          <button
            onClick={() => setActiveTab("unsolved")}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              activeTab === "unsolved"
                ? "bg-[#94C3D2] text-white shadow"
                : "bg-white/10 text-white/80 hover:bg-white/20"
            }`}
          >
            Unsolved
          </button>
          <button
            onClick={() => setActiveTab("solveLater")}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              activeTab === "solveLater"
                ? "bg-[#94C3D2] text-white shadow"
                : "bg-white/10 text-white/80 hover:bg-white/20"
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
          {isLoading ? (
            <div className="bg-white/10 rounded-xl p-6 sm:p-10 text-center backdrop-blur-md border border-white/20 mx-4 sm:mx-0">
              <div className="animate-pulse flex flex-col items-center">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/30 mb-3 sm:mb-4"></div>
                <div className="h-3 sm:h-4 w-36 sm:w-48 bg-white/30 rounded mb-2 sm:mb-3"></div>
                <div className="h-2 sm:h-3 w-24 sm:w-32 bg-white/20 rounded"></div>
              </div>
            </div>
          ) : problems.length === 0 ? (
            <div className="bg-white/10 rounded-xl p-6 sm:p-10 text-center backdrop-blur-md border border-white/20 mx-4 sm:mx-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 sm:h-12 sm:w-12 text-white/60 mx-auto mb-3 sm:mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p className="text-white/95 font-medium text-sm sm:text-base">
                No problems found in this category.
              </p>
              <p className="text-white/70 text-xs sm:text-sm mt-1">
                {allProblems.length === 0 
                  ? "Add problems in the Syllabus page to see them here."
                  : "Try changing your filter."
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              <div className="hidden sm:block bg-white/10 rounded-xl overflow-hidden backdrop-blur-md border border-white/20 p-4 mx-4 sm:mx-0">
                <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-semibold text-white/95 uppercase tracking-wider">
                  <div className="col-span-5">Title</div>
                  <div className="col-span-2">Platform</div>
                  <div className="col-span-2">Date Added</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-1">Actions</div>
                </div>
              </div>              {problems.map((problem) => (
                <div
                  key={problem.id || problem._id}
                  className="bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-3 sm:p-4 transition-all duration-300 mx-4 sm:mx-0"
                >
                  <div className="sm:grid sm:grid-cols-12 sm:gap-4 sm:items-center">
                    <div className="sm:col-span-5 mb-2 sm:mb-0">
                      <a
                        href={problem.link || problem.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-white/95 hover:text-[#94C3D2] hover:underline transition-colors text-sm sm:text-base"
                      >
                        {problem.title}
                      </a>
                    </div>
                    <div className="flex justify-between sm:justify-start items-center mb-2 sm:mb-0 sm:col-span-2">
                      <div className="sm:hidden text-xs text-white/60">Platform:</div>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          problem.platform?.toLowerCase() === "leetcode"
                            ? "bg-yellow-100 text-yellow-800"
                            : problem.platform?.toLowerCase() === "codeforces"
                            ? "bg-red-100 text-red-800"
                            : problem.platform?.toLowerCase() === "hackerrank"
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {problem.platform || "Other"}
                      </span>
                    </div>
                    <div className="flex justify-between sm:justify-start items-center mb-2 sm:mb-0 sm:col-span-2">
                      <div className="sm:hidden text-xs text-white/60">Added:</div>
                      <span className="text-xs sm:text-sm text-white/70">
                        {problem.dateAdded}
                      </span>
                    </div>
                    <div className="flex justify-between sm:justify-start items-center mb-2 sm:mb-0 sm:col-span-2">
                      <div className="sm:hidden text-xs text-white/60">Status:</div>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          problem.status === "solved"
                            ? "bg-green-100 text-green-800"
                            : problem.status === "unsolved"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {problem.status === "solveLater"
                          ? "Solve Later"
                          : problem.status.charAt(0).toUpperCase() +
                            problem.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex sm:justify-start justify-end sm:col-span-1">
                      <div className="flex space-x-2">
                        <a
                          href={problem.link || problem.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#94C3D2] hover:text-[#7EB5C3] transition-colors"
                          title="Open problem"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 sm:h-5 sm:w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </a>
                        <button
                          onClick={() => handleCopyProblemLink(problem)}
                          className="text-blue-400 hover:text-blue-500 transition-colors"
                          title="Copy link"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 sm:h-5 sm:w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleShareProblem(problem)}
                          className="text-green-400 hover:text-green-500 transition-colors"
                          title="Share"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 sm:h-5 sm:w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                            />
                          </svg>
                        </button>
                      </div>
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
            className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl w-full max-w-md p-4 sm:p-6 border border-white/20 overflow-hidden relative"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white to-[#94C3D2] bg-clip-text text-transparent">
                Create Room
              </h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              {!roomCreated ? (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={handleCreateRoom}
                    disabled={creatingRoom}
                    className={`px-4 sm:px-6 py-2 sm:py-2.5 w-full bg-[#94C3D2] text-white rounded-lg ${
                      creatingRoom ? "opacity-75" : "hover:bg-[#7EB5C3]"
                    } transition-colors shadow-lg flex items-center justify-center text-sm sm:text-base`}
                  >
                    {creatingRoom ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Creating room...
                      </>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        Create New Room
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label
                      htmlFor="invite-link"
                      className="block text-sm font-medium text-[#94C3D2] mb-1.5"
                    >
                      Share this code with your friends
                    </label>
                    <div className="flex">
                      <input
                        ref={inviteLinkRef}
                        type="text"
                        id="invite-link"
                        readOnly
                        value={generateInviteCode()}
                        className="w-full pl-3 sm:pl-4 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-[#2d3748] border border-gray-600 rounded-l-lg focus:outline-none text-gray-100 text-sm sm:text-base"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="px-3 sm:px-4 py-2 sm:py-2.5 bg-[#94C3D2] text-white rounded-r-lg hover:bg-[#7EB5C3] transition-colors focus:outline-none"
                      >
                        {copySuccess ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        ) : (
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                    {copySuccess && (
                      <p className="mt-2 text-xs sm:text-sm text-green-400">
                        Room code copied to clipboard!
                      </p>
                    )}
                  </div>

                  {/* Add Open Room button */}
                  <div className="flex justify-center py-2">
                    <button
                      onClick={handleOpenRoom}
                      className="px-4 sm:px-6 py-2 sm:py-2.5 w-full bg-[#94C3D2] text-white rounded-lg hover:bg-[#7EB5C3] transition-colors shadow-lg flex items-center justify-center text-sm sm:text-base"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                        />
                      </svg>
                      Open Room
                    </button>
                  </div>
                  <div className="border-t border-gray-600/30 pt-3 sm:pt-4">
                    <p className="text-xs sm:text-sm text-white/70 mb-2 sm:mb-3">
                      Or share code directly via:
                    </p>
                    <div className="flex space-x-2 sm:space-x-3">
                      <button
                        onClick={shareOnWhatsApp}
                        className="flex-1 py-2 sm:py-2.5 bg-[#25D366] text-white/90 rounded-lg hover:bg-opacity-90 transition-colors flex items-center justify-center text-xs sm:text-sm"
                      >
                        <svg className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12C2 13.9 2.5 15.68 3.35 17.22L2.05 22L6.97 20.76C8.44 21.54 10.15 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C10.42 20 8.93 19.58 7.63 18.81L7.27 18.6L4.47 19.31L5.2 16.61L4.97 16.23C4.14 14.89 3.69 13.34 3.69 11.71C3.69 7.41 7.41 3.93 12.01 3.93C16.61 3.93 20.06 7.41 20.06 11.71C20.06 16.01 16.61 20 12 20ZM16.5 14.12C16.33 14.03 15.18 13.47 15.02 13.41C14.86 13.36 14.75 13.33 14.63 13.5C14.51 13.67 14.07 14.18 13.97 14.29C13.87 14.41 13.77 14.42 13.6 14.33C13.43 14.24 12.68 14 11.8 13.23C11.13 12.64 10.68 11.91 10.58 11.74C10.47 11.57 10.56 11.47 10.65 11.38C10.74 11.3 10.84 11.17 10.93 11.07C11.02 10.97 11.05 10.9 11.11 10.78C11.16 10.67 11.13 10.57 11.09 10.48C11.05 10.39 10.61 9.24 10.47 8.9C10.33 8.56 10.19 8.61 10.08 8.61C9.97 8.6 9.86 8.6 9.74 8.6C9.63 8.6 9.44 8.64 9.28 8.81C9.12 8.97 8.52 9.54 8.52 10.68C8.52 11.82 9.35 12.93 9.45 13.04C9.55 13.15 10.61 14.76 12.21 15.75C12.66 15.95 13.01 16.07 13.29 16.16C13.74 16.31 14.15 16.29 14.48 16.25C14.84 16.2 15.78 15.7 15.92 15.3C16.06 14.9 16.06 14.56 16.02 14.48C15.98 14.41 15.87 14.36 15.7 14.27L16.5 14.12Z" fill="currentColor"/>
                        </svg>
                        WhatsApp
                      </button>
                      <button
                        onClick={shareViaEmail}
                        className="flex-1 py-2 sm:py-2.5 bg-[#EA4335] text-white/90 rounded-lg hover:bg-opacity-90 transition-colors flex items-center justify-center text-xs sm:text-sm"
                      >
                        <svg
                          className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
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
            className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl w-full max-w-md p-4 sm:p-6 border border-white/20 overflow-hidden relative"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white to-[#94C3D2] bg-clip-text text-transparent">
                Join a Room
              </h3>
              <button
                onClick={() => {
                  setShowJoinModal(false);
                  setJoinLink("");
                  setJoinError("");
                }}
                className="text-white/80 hover:text-white transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 sm:h-6 sm:w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <form onSubmit={handleJoinRoom} className="space-y-4">
              <div>
                <label
                  htmlFor="join-link"
                  className="block text-sm font-medium text-[#94C3D2] mb-1.5"
                >
                  Enter room code
                </label>
                <input
                  type="text"
                  id="join-link"
                  value={joinLink}
                  onChange={(e) => {
                    setJoinLink(e.target.value);
                    setJoinError("");
                  }}
                  placeholder="Enter an 8-character room code"
                  className="w-full pl-3 sm:pl-4 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none text-gray-100 placeholder-gray-400 text-sm sm:text-base"
                />
                {joinError && (
                  <p className="mt-2 text-xs sm:text-sm text-red-400">{joinError}</p>
                )}
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 sm:px-6 py-2 sm:py-2.5 bg-[#94C3D2] text-white text-sm sm:text-base rounded-lg hover:bg-[#7EB5C3] transition-colors shadow-lg flex items-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
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
