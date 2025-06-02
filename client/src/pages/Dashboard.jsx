import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
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

const Dashboard = () => {
  const navigate = useNavigate();
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
              console.log(`Problem: ${p.title}, Date: ${p.dateAdded}, Status: ${p.status}`);
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
        console.error("Error fetching user data:", err);
        toast.error("Failed to load your problem data");
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
      
      // Log the comparison to help debug sorting
      console.log(`Comparing: ${a.title} (${dateA}) vs ${b.title} (${dateB})`);
      
      // Sort newest first (most recent at the top)
      return dateB - dateA;
    });
      if (activeTab === "recent") {
      // Take the top 5 most recent problems
      const recentProblems = sortedProblems.slice(0, 5);
      setProblems(recentProblems);
      console.log("Recent problems (sorted newest first):", recentProblems);
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

  // Generate a mock userId for demo
  const mockUserId = "user123";

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
        const response = await axios.post(
          "/api/rooms/create",
          {},
          {
            withCredentials: true,
          }
        );

        const data = response.data;

        if (data.success && data.data.roomId) {
          const newRoomId = data.data.roomId;
          console.log("Room created successfully with ID:", newRoomId);

          setRoomId(newRoomId);
          setRoomCreated(true);

          const userId = localStorage.getItem("userId");

          // Make sure to include all required room info
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

          toast.success("Room created successfully!");
        }
      } catch (error) {
        console.error("Error from server:", error.response?.data || error);
        toast.error(error.response?.data?.message || "Failed to create room");
      }
    } catch (error) {
      console.error("Error creating room:", error);
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
    return "";
  };

  const handleCopyLink = () => {
    if (!roomCreated) {
      toast.info("Please create a room first");
      return;
    }

    // Only copy the room ID, not a full URL
    navigator.clipboard
      .writeText(roomId)
      .then(() => {
        setCopySuccess(true);
        toast.success("Room code copied to clipboard!");
        setTimeout(() => setCopySuccess(false), 3000);
      })
      .catch((err) => {
        console.error("Failed to copy room ID: ", err);
        toast.error("Failed to copy room code");
      });
  };

  const shareOnWhatsApp = () => {
    if (!roomCreated) {
      toast.info("Please create a room first");
      return;
    }
    const text = encodeURIComponent(
      `Join me on Codyssey! Use room code: ${roomId}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const shareViaEmail = () => {
    if (!roomCreated) {
      toast.info("Please create a room first");
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

      console.log("Attempting to join room with ID:", roomIdToJoin);      // Check if user was previously the creator of this room
      const roomCreatorHistory = JSON.parse(
        localStorage.getItem("roomCreatorHistory") || "{}"
      );
      const wasRoomCreator = roomCreatorHistory[roomIdToJoin] === true;

      try {
        // Validate room before joining
        const response = await axios.get(`/api/rooms/validate/${roomIdToJoin}`);

        if (response.data.success) {
          console.log("Room validation successful");

          // Get inviterId from the response
          const inviterId = response.data.data.inviterId;
          
          // Check if this user is the original creator by ID match
          const currentUserId = localStorage.getItem("userId");
          const isOriginalCreator = currentUserId && inviterId && currentUserId === inviterId;
          
          // If user is the original creator by ID match, update creator history
          if (isOriginalCreator && !wasRoomCreator) {
            console.log("User identified as original creator by ID match, updating history");
            roomCreatorHistory[roomIdToJoin] = true;
            localStorage.setItem("roomCreatorHistory", JSON.stringify(roomCreatorHistory));
          }
          
          // Use creator status from history or original creator check
          const finalCreatorStatus = wasRoomCreator || isOriginalCreator;

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
          console.error("Error joining room:", error);
          setJoinError("Error validating room. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error in join room process:", error);
      setJoinError("Invalid room code or connection issue");
    }
  };

  const handleOpenRoom = () => {
    if (roomCreated && roomId) {
      // First check if this room was previously ended
      const endedRooms = JSON.parse(localStorage.getItem("endedRooms") || "[]");
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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-[#94C3D2] bg-clip-text text-transparent">
              Welcome, {userData.name}!
            </h1>
            <p className="text-[#94C3D2]/80 mt-1">
              Track your progress and manage your DSA journey
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleCreateRoomClick}
              className="bg-white/10 border border-white/20 text-white/95 hover:bg-white/20 px-4 py-2.5 rounded-lg flex items-center shadow-sm backdrop-blur-sm transition-colors"
              style={{ textShadow: "0 0 10px rgba(255, 255, 255, 0.3)" }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-[#94C3D2]"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
              </svg>
              Create Room
            </button>
            <button
              onClick={() => setShowJoinModal(true)}
              className="bg-[#94C3D2] text-white px-5 py-2.5 rounded-lg flex items-center shadow-sm hover:bg-[#7EB5C3] transition-colors"
              style={{ textShadow: "0 0 10px rgba(255, 255, 255, 0.3)" }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
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
          className="mb-6 flex space-x-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <button
            onClick={() => setActiveTab("recent")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "recent"
                ? "bg-[#94C3D2] text-white shadow"
                : "bg-white/10 text-white/80 hover:bg-white/20"
            }`}
          >
            Recent
          </button>
          <button
            onClick={() => setActiveTab("solved")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "solved"
                ? "bg-[#94C3D2] text-white shadow"
                : "bg-white/10 text-white/80 hover:bg-white/20"
            }`}
          >
            Solved
          </button>
          <button
            onClick={() => setActiveTab("unsolved")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "unsolved"
                ? "bg-[#94C3D2] text-white shadow"
                : "bg-white/10 text-white/80 hover:bg-white/20"
            }`}
          >
            Unsolved
          </button>
          <button
            onClick={() => setActiveTab("solveLater")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
            <div className="bg-white/10 rounded-xl p-10 text-center backdrop-blur-md border border-white/20">
              <div className="animate-pulse flex flex-col items-center">
                <div className="h-12 w-12 rounded-full bg-white/30 mb-4"></div>
                <div className="h-4 w-48 bg-white/30 rounded mb-3"></div>
                <div className="h-3 w-32 bg-white/20 rounded"></div>
              </div>
            </div>
          ) : problems.length === 0 ? (
            <div className="bg-white/10 rounded-xl p-10 text-center backdrop-blur-md border border-white/20">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-white/60 mx-auto mb-4"
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
              <p className="text-white/95 font-medium">
                No problems found in this category.
              </p>
              <p className="text-white/70 text-sm mt-1">
                {allProblems.length === 0 
                  ? "Add problems in the Syllabus page to see them here."
                  : "Try changing your filter."
                }
              </p>
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
                  key={problem.id || problem._id}
                  className="bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-4 transition-all duration-300"
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-4 md:col-span-5">
                      <a
                        href={problem.link || problem.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-white/95 hover:text-[#94C3D2] hover:underline transition-colors"
                      >
                        {problem.title}
                      </a>
                      {problem.difficulty && (
                        <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                          problem.difficulty.toLowerCase() === 'easy' ? 'bg-green-900/40 text-green-200' :
                          problem.difficulty.toLowerCase() === 'medium' ? 'bg-yellow-900/40 text-yellow-200' :
                          'bg-red-900/40 text-red-200'
                        }`}>
                          {problem.difficulty}
                        </span>
                      )}
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
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          problem.status === "solved"
                            ? "bg-green-900/50 text-green-200 border border-green-600/30"
                            : problem.status === "unsolved"
                            ? "bg-red-900/50 text-red-200 border border-red-600/30"
                            : "bg-yellow-900/50 text-yellow-200 border border-yellow-600/30"
                        }`}
                      >
                        {problem.status === "solveLater"
                          ? "Solve Later"
                          : problem.status.charAt(0).toUpperCase() +
                            problem.status.slice(1)}
                      </span>
                    </div>

                    <div className="hidden md:flex md:col-span-1 justify-end space-x-3">
                      <button
                        className="text-blue-400 hover:text-blue-300 transition-colors p-1.5 hover:bg-white/10 rounded-full"
                        title="Copy Link"
                        onClick={() => {
                          navigator.clipboard.writeText(problem.link || problem.url);
                          toast.success("Problem link copied to clipboard!");
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                          />
                        </svg>
                      </button>
                      <button
                        className="text-green-400 hover:text-green-300 transition-colors p-1.5 hover:bg-white/10 rounded-full"
                        title="Share"
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({
                              title: problem.title,
                              text: `Check out this problem: ${problem.title}`,
                              url: problem.link || problem.url
                            });
                          } else {
                            navigator.clipboard.writeText(problem.link || problem.url);
                            toast.success("Problem link copied to clipboard!");
                          }
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
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

                    {/* Mobile actions - only visible on small screens */}
                    <div className="col-span-12 flex md:hidden justify-end mt-2 space-x-4">
                      <button
                        className="text-blue-400 hover:text-blue-300 transition-colors flex items-center"
                        title="Copy Link"
                        onClick={() => {
                          navigator.clipboard.writeText(problem.link || problem.url);
                          toast.success("Problem link copied to clipboard!");
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-1"
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
                        Copy
                      </button>
                      <button
                        className="text-green-400 hover:text-green-300 transition-colors flex items-center"
                        title="Share"
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({
                              title: problem.title,
                              text: `Check out this problem: ${problem.title}`,
                              url: problem.link || problem.url
                            });
                          } else {
                            navigator.clipboard.writeText(problem.link || problem.url);
                            toast.success("Problem link copied to clipboard!");
                          }
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-1"
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
              <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-[#94C3D2] bg-clip-text text-transparent">
                Create Room
              </h3>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setRoomCreated(false);
                  setRoomId("");
                }}
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
                <div className="flex justify-center">
                  <button
                    onClick={handleCreateRoom}
                    disabled={creatingRoom}
                    className="px-6 py-2.5 bg-[#94C3D2] text-white rounded-lg hover:bg-[#7EB5C3] transition-colors shadow-lg flex items-center"
                  >
                    {creatingRoom ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                          className="h-5 w-5 mr-2"
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
                        className="w-full pl-4 pr-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-l-lg focus:outline-none text-gray-100"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="px-4 py-2.5 bg-[#94C3D2] text-white rounded-r-lg hover:bg-[#7EB5C3] transition-colors focus:outline-none"
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
                      <p className="mt-2 text-sm text-green-400">
                        Room code copied to clipboard!
                      </p>
                    )}
                  </div>

                  {/* Add Open Room button */}
                  <div className="flex justify-center py-2">
                    <button
                      onClick={handleOpenRoom}
                      className="px-6 py-2.5 bg-[#94C3D2] text-white rounded-lg hover:bg-[#7EB5C3] transition-colors shadow-lg flex items-center"
                    >
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
                          d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                        />
                      </svg>
                      Open Room
                    </button>
                  </div>
                  <div className="border-t border-gray-600/30 pt-4">
                    <p className="text-sm text-white/70 mb-3">
                      Or share code directly via:
                    </p>
                    <div className="flex space-x-3">
                      <button
                        onClick={shareOnWhatsApp}
                        className="flex-1 py-2.5 bg-[#25D366] text-white/90 rounded-lg hover:bg-opacity-90 transition-colors flex items-center justify-center"
                      >
                        <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12C2 13.9 2.5 15.68 3.35 17.22L2.05 22L6.97 20.76C8.44 21.54 10.15 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C10.42 20 8.93 19.58 7.63 18.81L7.27 18.6L4.47 19.31L5.2 16.61L4.97 16.23C4.14 14.89 3.69 13.34 3.69 11.71C3.69 7.41 7.41 3.93 12.01 3.93C16.61 3.93 20.06 7.41 20.06 11.71C20.06 16.01 16.61 20 12 20ZM16.5 14.12C16.33 14.03 15.18 13.47 15.02 13.41C14.86 13.36 14.75 13.33 14.63 13.5C14.51 13.67 14.07 14.18 13.97 14.29C13.87 14.41 13.77 14.42 13.6 14.33C13.43 14.24 12.68 14 11.8 13.23C11.13 12.64 10.68 11.91 10.58 11.74C10.47 11.57 10.56 11.47 10.65 11.38C10.74 11.3 10.84 11.17 10.93 11.07C11.02 10.97 11.05 10.9 11.11 10.78C11.16 10.67 11.13 10.57 11.09 10.48C11.05 10.39 10.61 9.24 10.47 8.9C10.33 8.56 10.19 8.61 10.08 8.61C9.97 8.6 9.86 8.6 9.74 8.6C9.63 8.6 9.44 8.64 9.28 8.81C9.12 8.97 8.52 9.54 8.52 10.68C8.52 11.82 9.35 12.93 9.45 13.04C9.55 13.15 10.61 14.76 12.21 15.75C12.66 15.95 13.01 16.07 13.29 16.16C13.74 16.31 14.15 16.29 14.48 16.25C14.84 16.2 15.78 15.7 15.92 15.3C16.06 14.9 16.06 14.56 16.02 14.48C15.98 14.41 15.87 14.36 15.7 14.27L16.5 14.12Z" fill="currentColor"/>
                        </svg>
                        WhatsApp
                      </button>
                      <button
                        onClick={shareViaEmail}
                        className="flex-1 py-2.5 bg-[#EA4335] text-white/90 rounded-lg hover:bg-opacity-90 transition-colors flex items-center justify-center"
                      >
                        <svg
                          className="h-5 w-5 mr-2"
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
            className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl w-full max-w-md p-6 border border-white/20 overflow-hidden relative"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-[#94C3D2] bg-clip-text text-transparent">
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
                  className="w-full pl-4 pr-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none text-gray-100 placeholder-gray-400"
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
