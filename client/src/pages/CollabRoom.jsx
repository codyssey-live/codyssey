import React, { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Editor from "@monaco-editor/react";
import { useRoom } from "../context/RoomContext";
import socket from "../socket";
import {
  loadCollabMessages,
  saveCollabMessages,
} from "../utils/collabRoomChatPersistence";
import { updateProblemStatus } from '../utils/syllabusApiUtils';
import apiClient from "../utils/apiClient"; // Import apiClient for making API requests
import axios from 'axios';

const CollabRoom = () => {
  const location = useLocation();
  const { roomData } = useRoom();
  const editorRef = useRef(null);
  const [problemLink, setProblemLink] = useState("");
  const [problemId, setProblemId] = useState(null);  // Add this state
  const [dayId, setDayId] = useState(null);          // Add this state
  const [language, setLanguage] = useState("javascript");
  const [isConnected, setIsConnected] = useState(false);
  const [userName, setUserName] = useState("User");
  const [problemStatus, setProblemStatus] = useState('unsolved');
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [statusUpdateError, setStatusUpdateError] = useState(null);
  const [statusUpdateSuccess, setStatusUpdateSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [showStatusMessage, setShowStatusMessage] = useState(true);
  useEffect(() => {
  if (problemStatus === 'solved' || problemStatus === 'solveLater') {
    setShowStatusMessage(true);
    const timer = setTimeout(() => {
      setShowStatusMessage(false);
    }, 2500); // 2.5 seconds
    return () => clearTimeout(timer);
  }
}, [problemStatus]);

  const [problemDetails, setProblemDetails] = useState({
    title: "Loading...",
    difficulty: "Medium",
    platform: "LeetCode",
    url: ""
  });
  const [isLoadingProblem, setIsLoadingProblem] = useState(true);
  const [problemFetchError, setProblemFetchError] = useState(null);
  const [problemExists, setProblemExists] = useState(false);
  // Reference for scrolling to bottom
  const messagesEndRef = useRef(null);

  // Add states for success messages
  const [solvedSuccess, setSolvedSuccess] = useState(false);
  const [bookmarkedSuccess, setBookmarkedSuccess] = useState(false);

  // Process function to avoid duplicates - use a Map for better tracking
  const processedMessages = useRef(new Map());

  const boilerplates = {
    javascript: `// JavaScript Solution\nfunction solution() {\n  // Your code here\n}`,
    python: `# Python Solution\ndef solution():\n    # Your code here\n    pass`,
    java: `// Java Solution\npublic class Solution {\n  public static void main(String[] args) {\n    // Your code here\n  }\n}`,
    cpp: `// C++ Solution\n#include <iostream>\nusing namespace std;\n\nint main() {\n  // Your code here\n  return 0;\n}`,
  };

  const [code, setCode] = useState(boilerplates.javascript);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isCodeMessage, setIsCodeMessage] = useState(false);
  const [isSolved, setIsSolved] = useState(false);
  const [isSavedForLater, setIsSavedForLater] = useState(false);

  const languages = [
    { id: "javascript", name: "JavaScript" },
    { id: "python", name: "Python" },
    { id: "java", name: "Java" },
    { id: "cpp", name: "C++" },
  ];

  useEffect(() => {
    if (location.state && location.state.problemLink) {
      setProblemLink(location.state.problemLink);
      
      // Also store problem ID and day ID if available
      if (location.state.problemId) {
        setProblemId(location.state.problemId);
      }
      if (location.state.dayId) {
        setDayId(location.state.dayId);
      }
      
      // Initialize status based on passed state
      if (location.state.status) {
        if (location.state.status === 'solved') {
          setIsSolved(true);
          setIsSavedForLater(false);
        } else if (location.state.status === 'solveLater') {
          setIsSavedForLater(true);
          setIsSolved(false);
        }
      }
    }

    setCode(boilerplates[language]);

    // Get username from localStorage for consistency with other pages
    const savedUsername = localStorage.getItem("roomUsername") || "User";
    setUserName(savedUsername);

    // Connect the socket if not already connected
    if (!socket.connected) {
      socket.connect();
      socket.on("connect", () => {
        setIsConnected(true);
        console.log(`Connected to socket server with ID: ${socket.id}`);
      });
    } else {
      setIsConnected(true);
    }

    // Cleanup socket connection
    return () => {
      socket.off("connect");
    };
  }, [location, roomData.roomId]);

  // Update problem status based on dayId and problemId
  useEffect(() => {
    const initialStatus = location.state?.status || 'unsolved';
    setProblemStatus(initialStatus);
  }, [location.state]);

  // Enhanced function to fetch problem details from the study day schema
  const fetchProblemDetails = async () => {
    try {
      setIsLoadingProblem(true);
      setProblemFetchError(null);
      
      // If we have both dayId and problemId, fetch problem details
      if (dayId && problemId) {
        console.log(`Fetching problem details for day: ${dayId}, problem: ${problemId}`);
        
        // Make a request to get the study day with the problem
        const response = await fetch(`/api/syllabus/day/${dayId}`, {
          credentials: 'include' // Include credentials for authentication
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch problem details: ${response.statusText}`);
        }
        
        const data = await response.json();
         console.log("Available problems:", data.data.problems);
console.log("Looking for problemId:", problemId);

        if (data.success && data.data) {
          // Find the specific problem in the study day's problems array
          const problem = data.data.problems.find(p => 
  String(p._id) === String(problemId) || String(p.id) === String(problemId)
);

          if (problem) {
            console.log("Problem data found:", problem);
            setProblemDetails({
              title: problem.title || 'Untitled Problem',
              difficulty: problem.difficulty || 'Medium',
              platform: problem.platform || 'LeetCode',
              url: problem.url || problemLink || '',
              status: problem.status || 'unsolved'
            });
            
            // Also set the status state for tracking changes
            setProblemStatus(problem.status || 'unsolved');
            setProblemExists(true);
          } else {
            throw new Error('Problem not found in study day');
          }
        } else {
          throw new Error('Study day data not found in response');
        }
      } else if (problemLink) {
        // If we only have the problem link but no details, use placeholder data
        setProblemDetails({
          title: location.state?.problemTitle || 'Problem',
          difficulty: location.state?.difficulty || 'Medium',
          platform: location.state?.platform || 'LeetCode',
          url: problemLink,
          status: location.state?.status || 'unsolved'
        });
        setProblemStatus(location.state?.status || 'unsolved');
        setProblemExists(true);
      } else {
        // No problem data available
        setProblemExists(false);
      }
    } catch (error) {
      console.error('Error fetching problem details:', error);
      setProblemFetchError(error.message || 'Failed to load problem details');
      
      // Set fallback data if fetch fails
      setProblemDetails({
        title: location.state?.problemTitle || 'Problem',
        difficulty: location.state?.difficulty || 'Medium',
        platform: location.state?.platform || 'LeetCode',
        url: problemLink || '',
        status: location.state?.status || 'unsolved'
      });
      
      // If we at least have a problem link, consider it as existing
      setProblemExists(!!problemLink);
      setProblemStatus(location.state?.status || 'unsolved');
    } finally {
      setIsLoadingProblem(false);
    }
  };

  // Load problem details when component mounts or when IDs change
  useEffect(() => {
    fetchProblemDetails();
  }, [dayId, problemId, problemLink]);

  // Simple function to extract title from URL (could be improved)
  const extractTitleFromUrl = (url) => {
    try {
      const path = new URL(url).pathname;
      const segments = path.split('/').filter(Boolean);
      if (segments.length > 0) {
        const lastSegment = segments[segments.length - 1];
        return lastSegment.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
      }
    } catch (err) {
      console.error('Error parsing URL:', err);
    }
    return null;
  };

  // Modified handleStatusChange to use apiClient and handle errors correctly
  const handleStatusChange = async (newStatus) => {
    try {
      // If the current status is the same as the new one, toggle it to unsolved (reset)
      const statusToApply = problemStatus === newStatus ? 'unsolved' : newStatus;
      
      // Validate required parameters
      if (!dayId || !problemId) {
        console.error('Missing required parameters for status update', { dayId, problemId });
        setStatusUpdateError('Missing problem information. Please try again from the syllabus page.');
        setTimeout(() => setStatusUpdateError(null), 3000);
        return;
      }
      
      console.log(`Updating problem status: dayId=${dayId}, problemId=${problemId}, status=${statusToApply}`);
      
      setStatusUpdateLoading(true);
      setStatusUpdateError(null);
      setStatusUpdateSuccess(false);
      
      // Use the correct API endpoint and provide parameters properly
      const response = await apiClient.put(`/syllabus/problem/${dayId}/${problemId}/status`, {
        status: statusToApply
      });
      
      // Successfully updated
      console.log('Status update successful:', response.data);
      setProblemStatus(statusToApply);
      
      // Store the status in localStorage to persist after refresh
      if (problemId) {
        localStorage.setItem(`problem_status_${problemId}`, statusToApply);
      }
      
      setStatusUpdateSuccess(true);
      // Show success message
      setTimeout(() => setStatusUpdateSuccess(false), 2500);
      
    } catch (error) {
      console.error('Error updating problem status:', error);
      
      // Extract error message from response if available
      const errorMessage = error.response?.data?.message || 
                          'Failed to update problem status. Please try again.';
                          
      setStatusUpdateError(errorMessage);
      setTimeout(() => setStatusUpdateError(null), 4000);
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  // Load problem status from localStorage and API
  useEffect(() => {
    const loadStatusFromStorage = () => {
      if (problemId) {
        const savedStatus = localStorage.getItem(`problem_status_${problemId}`);
        if (savedStatus) {
          setProblemStatus(savedStatus);
        }
      }
    };
    
    // First load from localStorage for immediate UI update
    loadStatusFromStorage();
    
    // Then try to get the latest status from API if we have both dayId and problemId
    const fetchProblemStatus = async () => {
      if (dayId && problemId) {
        try {
          // Get the study day to find the problem and its status
          const response = await apiClient.get(`/syllabus/${localStorage.getItem('userId')}`);
          if (response.data.success && response.data.data) {
            const syllabus = response.data.data;
            const studyDay = syllabus.studyDays.find(day => day._id === dayId);
            
            if (studyDay) {
              const problem = studyDay.problems.find(p => p._id === problemId);
              if (problem && problem.status) {
                setProblemStatus(problem.status);
                // Update localStorage with latest status from server
                localStorage.setItem(`problem_status_${problemId}`, problem.status);
              }
            }
          }
        } catch (error) {
          console.error('Error fetching problem status:', error);
          // Don't show error to user, just use localStorage value if available
        }
      }
    };
    
    fetchProblemStatus();
  }, [problemId, dayId]);

  const toggleSolved = async () => {
    const newState = !isSolved;
    setIsSolved(newState);
    
    // Update isSavedForLater to false if isSolved is true
    if (newState) {
      setIsSavedForLater(false);
    }
    
    // If both dayId and problemId exist, update the status in the database
    if (dayId && problemId) {
      const response = await updateProblemStatus(dayId, problemId, newState ? 'solved' : 'unsolved');
      if (response.success) {
        console.log('Problem status updated successfully:', response.data);
      } else {
        console.error('Failed to update problem status:', response.message);
      }
    }
  };

  const toggleSaveForLater = async () => {
    const newState = !isSavedForLater;
    setIsSavedForLater(newState);
    
    // Update isSolved to false if isSavedForLater is true
    if (newState) {
      setIsSolved(false);
    }
    
    // If both dayId and problemId exist, update the status in the database
    if (dayId && problemId) {
      const response = await updateProblemStatus(dayId, problemId, newState ? 'solveLater' : 'unsolved');
      if (response.success) {
        console.log('Problem status updated successfully:', response.data);
      } else {
        console.error('Failed to update problem status:', response.message);
      }
    }
  };

  // Format time consistently with other pages
  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket.connected || !roomData.inRoom) return;

    // Generate a unique ID for this message
    const messageId = `${socket.id}-${Date.now()}`;

    // Create message data with enhanced type information
    const messageData = {
      roomId: roomData.roomId,
      message: newMessage,
      username: userName,
      messageId,
      isCode: isCodeMessage,
      timestamp: new Date(),
      socketId: socket.id,
      type: "collab-chat",
    };

    console.log("Sending collab message to room:", messageData);

    // First add the message locally for immediate feedback
    const localMessage = {
      id: messageId,
      user: "You",
      text: newMessage,
      timestamp: new Date(),
      isCode: isCodeMessage,
    };

    setChatMessages((prevMessages) => {
      const updatedMessages = [...prevMessages, localMessage];
      // Save to persistence
      if (roomData.roomId) {
        saveCollabMessages(roomData.roomId, updatedMessages);
      }

      return updatedMessages;
    });

    // Send message via socket (if connected to a room)
    if (socket.connected && roomData.inRoom) {
      socket.emit("send-message", {
        roomId: roomData.roomId,
        message: newMessage,
        username: userName,
        messageId,
        isCode: isCodeMessage,
      });

      // Also emit with underscore format for compatibility
      socket.emit("send_message", {
        roomId: roomData.roomId,
        text: newMessage,
        username: userName,
        messageId,
        isCode: isCodeMessage,
      });
    }

    setNewMessage("");
    setIsCodeMessage(false); // Reset after sending
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    editor.focus();
  };

  // Update the handlePasteCode function to ensure it pastes into the editor
  const handlePasteCode = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && editorRef.current) {
        const editor = editorRef.current;
        const position = editor.getPosition();
        editor.executeEdits("", [
          {
            range: new monaco.Range(
              position.lineNumber,
              position.column,
              position.lineNumber,
              position.column
            ),
            text: text,
            forceMoveMarkers: true,
          },
        ]);
      }
    } catch (err) {
      console.error("Failed to paste code: ", err);
    }
  };

  const copyCode = () => {
    const editorValue = editorRef.current ? editorRef.current.getValue() : code;
    navigator.clipboard
      .writeText(editorValue)
      .then(() => {
        alert("Code copied to clipboard!");
      })
      .catch((err) => {
        console.error("Could not copy code: ", err);
      });
  };

  const shareRoom = () => {
    const shareLink = `${window.location.origin}/collab-room?id=${Date.now()}`;
    navigator.clipboard
      .writeText(shareLink)
      .then(() => {
        alert("Room link copied to clipboard!");
      })
      .catch((err) => {
        console.error("Could not copy room link: ", err);
      });
  };

  const handleLanguageChange = (newLang) => {
    if (
      code.trim() &&
      !window.confirm("Changing language will reset the code. Continue?")
    )
      return;
    setLanguage(newLang);
    setCode(boilerplates[newLang]);
  };

  const getMonacoLanguage = (lang) => {
    const mapping = {
      javascript: "javascript",
      python: "python",
      java: "java",
      cpp: "cpp",
    };
    return mapping[lang] || "javascript";
  };

  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // Load saved chat messages
  useEffect(() => {
    if (!roomData.inRoom || !roomData.roomId) return;
    // Load saved messages for this room from localStorage
    const savedMessages = loadCollabMessages(roomData.roomId);
    if (savedMessages && savedMessages.length > 0) {
      console.log(
        `Loaded ${savedMessages.length} collab chat messages from storage`
      );
      setChatMessages(savedMessages);
      setTimeout(scrollToBottom, 100);
    } else {
      console.log("No saved collab messages found");
      // Add initial system message
      setChatMessages([
        {
          id: Date.now(),
          user: "System",
          text: "Welcome to the collaboration room! You can discuss and work together here.",
          timestamp: new Date(),
          type: "system",
        },
      ]);
    }
  }, [roomData.inRoom, roomData.roomId]);

  // Listen for messages from other users
  useEffect(() => {
    if (!socket.connected || !roomData.inRoom) {
      return undefined;
    }

    console.log("Setting up chat message listeners with socket ID:", socket.id);

    // Handle incoming messages
    const handleReceiveMessage = (data) => {
      console.log("Received message:", data);

      // Normalize data structure from different message formats
      const messageId =
        data.messageId || data.id || `${data.username}-${Date.now()}`;
      const username = data.username;
      const message = data.message || data.text;
      const timestamp = data.time || data.timestamp || Date.now();
      const isCode = data.isCode || false;

      // Skip if we've already processed this exact message
      if (processedMessages.current.has(messageId)) {
        console.log("Skipping duplicate message with ID:", messageId);
        return;
      }

      // Skip if this is our own message (we've already added it locally)
      if (username === userName) {
        console.log("Skipping our own message from server");
        return;
      }

      console.log("Processing new message from:", username);

      // Mark as processed with timestamp
      processedMessages.current.set(messageId, Date.now());

      // Limit the size of the processed messages cache to prevent memory leaks
      if (processedMessages.current.size > 100) {
        const oldestKey = [...processedMessages.current.entries()].sort(
          (a, b) => a[1] - b[1]
        )[0][0];
        processedMessages.current.delete(oldestKey);
      }

      // Format the message
      const newMessage = {
        id: messageId,
        user: username,
        text: message,
        timestamp: new Date(timestamp),
        isCode: isCode,
      };

      // Add to messages and save in one operation
      setChatMessages((prevMessages) => {
        const updatedMessages = [...prevMessages, newMessage];
        // Save to persistence
        saveCollabMessages(roomData.roomId, updatedMessages);

        return updatedMessages;
      });

      // Scroll to bottom
      setTimeout(scrollToBottom, 100);
    };

    // Set up message event handlers
    socket.on("receive-message", handleReceiveMessage);
    socket.on("receive_message", handleReceiveMessage);

    // Clean up
    return () => {
      socket.off("receive-message", handleReceiveMessage);
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [socket.connected, roomData.inRoom, roomData.roomId, userName]);

  // Listen for users joining the room
  useEffect(() => {
    if (!socket.connected || !roomData.inRoom) {
      return;
    }

    const handleUserJoined = (data) => {
      // Skip notifications about ourselves
      if (data.username === userName) return;

      // Add system notification
      const joinMessage = {
        id: `join-${Date.now()}`,
        user: "System",
        text: `${data.username} joined the room`,
        timestamp: new Date(),
        type: "system",
      };

      setChatMessages((prev) => {
        const updated = [...prev, joinMessage];
        saveCollabMessages(roomData.roomId, updated);
        return updated;
      });
    };

    socket.on("user-joined", handleUserJoined);
    socket.on("user_joined", handleUserJoined);

    return () => {
      socket.off("user-joined", handleUserJoined);
      socket.off("user_joined", handleUserJoined);
    };
  }, [socket.connected, roomData.inRoom, roomData.roomId, userName]);

  // Join the socket room
  const joinRoom = () => {
    if (!socket.connected || !roomData.inRoom) return;

    const roomId = roomData.roomId;
    console.log(`Joining socket room with ID: ${roomId}`);

    socket.emit("join-room", {
      roomId,
      username: userName,
    });

    // Also emit with underscore format for compatibility
    socket.emit("join_room", {
      roomId,
      username: userName,
    });

    setIsConnected(true);
  };

  // Join room when roomData changes
  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    if (roomData.inRoom && roomData.roomId) {
      joinRoom();
    }
  }, [roomData.inRoom, roomData.roomId, socket.connected]);

  // Clean up socket connections and event listeners when component unmounts
  useEffect(() => {
    return () => {
      if (socket.connected && roomData.roomId) {
        socket.emit("leave-room", {
          roomId: roomData.roomId,
          username: userName,
        });
      }

      // Clean up all event listeners
      socket.off("connect");
      socket.off("disconnect");
      socket.off("receive-message");
      socket.off("receive_message");
    };
  }, []);
  // Handle keyboard shortcuts
  const handleMessageKeyDown = (e) => {
    // Send on Enter, but allow multiline with Shift+Enter
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // Auto-dismiss timeout functions for success messages
  const showSolvedSuccessMessage = () => {
    setSolvedSuccess(true);
    setTimeout(() => setSolvedSuccess(false), 3000);
  };

  const showBookmarkedSuccessMessage = () => {
    setBookmarkedSuccess(true);
    setTimeout(() => setBookmarkedSuccess(false), 3000);
  };
  
  // Handle updating problem status
  const handleUpdateProblemStatus = async (newStatus) => {
    if (!location.state || !location.state.problemId || !location.state.dayId) {
      console.error('Cannot update status: Problem details not available');
      return;
    }
    
    try {
      const { problemId, dayId } = location.state;
      const response = await axios.put(`/api/syllabus/day/${dayId}/problem/${problemId}/status`, {
        status: newStatus
      });
      
      if (response.data && response.data.success) {
        setProblemDetails(prev => ({...prev, status: newStatus}));
        
        if (newStatus === 'solved') {
          showSolvedSuccessMessage();
        } else if (newStatus === 'solveLater') {
          showBookmarkedSuccessMessage();
        }
      }
    } catch (error) {
      console.error('Error updating problem status:', error);
    }
  };
  
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#334155] to-[#0f172a] text-white">
      <Navbar />
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-[#94C3D2] bg-clip-text text-transparent">
            Code Collaboration Room
          </h1>
        </div>

        {/* Problem Information Card with status buttons integrated */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              {/* Display actual problem title, not "Problem" */}
              <h2 className="text-lg font-medium text-white/95">
                {isLoadingProblem ? (
                  <div className="animate-pulse bg-white/20 h-6 w-48 rounded"></div>
                ) : (
                  problemDetails.title
                )}
              </h2>
              <div className="mt-3 flex flex-wrap gap-3">
                <span className="bg-white/10 text-white/80 px-3 py-1 rounded-full text-sm border border-white/20">
                  {isLoadingProblem ? (
                    <div className="animate-pulse bg-white/20 h-4 w-16 rounded-full"></div>
                  ) : (
                    problemDetails.difficulty
                  )}
                </span>
                <span className="bg-white/10 text-white/80 px-3 py-1 rounded-full text-sm border border-white/20">
                  {isLoadingProblem ? (
                    <div className="animate-pulse bg-white/20 h-4 w-20 rounded-full"></div>
                  ) : (
                    problemDetails.platform
                  )}
                </span>
                <a 
                  href={problemDetails.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white bg-[#94C3D2] hover:bg-[#7EB5C3] px-3 py-1 rounded-lg flex items-center transition-colors text-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open Problem
                </a>
              </div>
            </div>
            
            {/* Status buttons moved inside the card */}
            <div className="flex space-x-3">
              <button 
                onClick={() => handleStatusChange('solved')} 
                disabled={statusUpdateLoading}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
                  problemStatus === 'solved' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-green-900/50 text-green-200 border border-green-600/30 hover:bg-green-900/70'
                }`}
                title={problemStatus === 'solved' ? "Click to reset status" : "Mark as solved"}
              >
                {statusUpdateLoading && problemStatus !== 'solved' ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {/* Show actual problem name instead of "Problem" */}
                    {problemDetails.title}
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {problemStatus === 'solved' ? 'Solved' : 'Mark as Solved'}
                  </>
                )}
              </button>
              
              
              
              {/* Save for Later button */}
              <button 
                onClick={() => handleStatusChange('solveLater')} 
                disabled={statusUpdateLoading}
                className={`px-4 py-2 rounded-md text-sm font-medium flex items-center ${
                  problemStatus === 'solveLater' 
                    ? 'bg-yellow-600 text-white' 
                    : 'bg-yellow-900/50 text-yellow-200 border border-yellow-600/30 hover:bg-yellow-900/70'
                } transition-colors`}
                title={problemStatus === 'solveLater' ? "Click to reset status" : "Mark to solve later"}
              >
                {statusUpdateLoading && problemStatus !== 'solveLater' ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {/* Show actual problem name instead of "Problem" */}
                    {problemDetails.title}
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    {problemStatus === 'solveLater' ? 'Saved for Later' : 'Solve Later'}
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div className="mt-6">
            {/* Remove the "Problem Status" text */}
            
            {statusUpdateError && (
              <div className="mb-4 bg-red-900/30 text-red-300 border border-red-500/30 rounded-md p-3">
                {statusUpdateError}
              </div>
            )}
            
            {statusUpdateSuccess && (
              <div className="mb-4 bg-green-900/30 text-green-300 border border-green-500/30 rounded-md p-3">
                Status updated successfully!
              </div>
            )}
            

            {/* Status condition messages */}
            {problemStatus === 'solved' && showStatusMessage && (
  <div className="mt-4 text-sm bg-green-900/20 text-green-400 border border-green-600/20 p-3 rounded-lg">
    <div className="flex items-start">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      <div>
        <p className="font-medium">Great job!</p>
        <p>You've marked this problem as solved. Keep up the good work!</p>
      </div>
    </div>
  </div>
)}

{problemStatus === 'solveLater' && showStatusMessage && (
  <div className="mt-4 text-sm bg-yellow-900/20 text-yellow-400 border border-yellow-600/20 p-3 rounded-lg">
    <div className="flex items-start">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
      </svg>
      <div>
        <p className="font-medium">Bookmarked for later!</p>
        <p>You'll find this problem in your "Solve Later" collection when you're ready to tackle it.</p>
      </div>
    </div>
  </div>
)}
</div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Code Editor Section */}
          <div className="lg:w-2/3">
            <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-md overflow-hidden border border-white/20 h-full">
              <div className="p-4 border-b border-white/20 flex justify-between items-center">
                <h2 className="font-semibold text-white/95">Code Editor</h2>
                <select
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="px-3 py-2 bg-[#2d3748] border border-white/20 rounded-lg text-white"
                >
                  {languages.map((lang) => (
                    <option key={lang.id} value={lang.id}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
              <div
                className="border-t border-white/20"
                style={{ height: "500px" }}
              >
                <Editor
                  height="100%"
                  defaultLanguage={getMonacoLanguage(language)}
                  language={getMonacoLanguage(language)}
                  value={code}
                  onChange={(value) => setCode(value || "")}
                  onMount={handleEditorDidMount}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: true },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    fontFamily: "JetBrains Mono, Consolas, monospace",
                    wordWrap: "on",
                    automaticLayout: true,
                    tabSize: 2,
                    renderWhitespace: "selection",
                    renderControlCharacters: true,
                  }}
                />
              </div>
              <div className="p-4 border-t border-white/20 flex justify-end space-x-2">
                <button
                  onClick={copyCode}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white/95 border border-white/20 rounded-lg transition-colors shadow-sm"
                  title="Copy code"
                >
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
                </button>
                <button
                  onClick={handlePasteCode}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white/95 border border-white/20 rounded-lg transition-colors shadow-sm"
                  title="Paste code"
                >
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
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Chat Section */}
          <div className="lg:w-1/3 flex flex-col h-full">
            <div
              className="bg-white/10 backdrop-blur-md rounded-xl shadow-md overflow-hidden border border-white/20 flex flex-col"
              style={{ height: "650px" }}
            >
              {" "}
              <div className="p-4 border-b border-white/20 flex justify-between items-center">
                <h2 className="font-semibold text-white/95">Discussion</h2>
                <div className="flex items-center">
                  <span
                    className={`h-3 w-3 rounded-full mr-2 ${
                      isConnected && roomData.inRoom
                        ? "bg-green-500"
                        : "bg-gray-500"
                    }`}
                  ></span>
                  <span className="text-sm text-white/80">
                    {isConnected && roomData.inRoom
                      ? "Connected"
                      : "Disconnected"}
                  </span>
                </div>
              </div>
              <div
                className="flex-1 p-4 space-y-3 bg-white/5 overflow-y-auto chat-messages"
                style={{ height: "500px" }}
              >
                {chatMessages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-400">
                      No messages yet. Start the conversation!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {chatMessages.map((message) => {
                      // Handle system messages with a different style
                      if (
                        message.user === "System" ||
                        message.type === "system"
                      ) {
                        return (
                          <div key={message.id} className="flex justify-center">
                            <div className="bg-indigo-900/30 text-indigo-200 px-3 py-1 rounded-lg border border-indigo-500/30 max-w-[80%] text-center">
                              {message.text}
                            </div>
                          </div>
                        );
                      }

                      const isCurrentUser = message.user === "You";
                      return (
                        <div
                          key={message.id}
                          className={`flex ${
                            isCurrentUser ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[85%] ${
                              isCurrentUser ? "ml-auto" : ""
                            }`}
                          >
                            <div
                              className={`flex items-center ${
                                isCurrentUser ? "justify-end" : "justify-start"
                              } mb-1`}
                            >
                              {!isCurrentUser && (
                                <span className="font-medium text-sm text-white/90 mr-1">
                                  {message.user}
                                </span>
                              )}
                              <span
                                className={`text-xs ${
                                  isCurrentUser
                                    ? "text-white/90 mr-2"
                                    : "text-white/90 ml-2"
                                }`}
                              >
                                {typeof message.timestamp === "object"
                                  ? formatTime(message.timestamp)
                                  : formatTime(new Date(message.timestamp))}
                              </span>
                              {isCurrentUser && (
                                <span className="font-medium text-sm text-white/90 ml-1">
                                  You
                                </span>
                              )}{" "}
                            </div>{" "}
                            {message.isCode ? (
                              <pre
                                className="p-3 rounded-lg text-sm bg-black font-mono overflow-x-auto whitespace-pre-wrap border border-gray-700 w-full"
                                style={{ color: "#ffffff" }}
                              >
                                <code>{message.text}</code>
                              </pre>
                            ) : (
                              <div
                                className={`rounded-lg px-4 py-2 ${
                                  isCurrentUser
                                    ? "bg-[#94C3D2] text-white rounded-tr-none"
                                    : "bg-yellow-50 text-black rounded-tl-none"
                                }`}
                              >
                                {message.text}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}{" "}
              </div>
              <div className="p-4 border-t border-white/20">
                <form
                  onSubmit={handleSendMessage}
                  className="flex items-center gap-2"
                >
                  <div className="flex-1 flex items-center bg-[#2d3748] border border-white/20 rounded-lg overflow-hidden">
                    {" "}
                    <input
                      type="text"
                      placeholder={
                        isCodeMessage
                          ? "Type your code here..."
                          : "Type message..."
                      }
                      className="flex-1 px-4 py-2.5 bg-transparent text-white placeholder-gray-400 outline-none focus:ring-[#94C3D2] focus:border-[#94C3D2] border-none"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleMessageKeyDown}
                    />{" "}
                    <button
                      type="button"
                      onClick={() => setIsCodeMessage(!isCodeMessage)}
                      className={`px-2 mx-2 ${
                        isCodeMessage ? "text-[#94C3D2]" : "text-white/95"
                      } hover:text-[#94C3D2] transition-colors`}
                      title={
                        isCodeMessage
                          ? "Currently in code mode"
                          : "Click to send code"
                      }
                    >
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
                          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                        />
                      </svg>
                    </button>
                  </div>
                  <button
                    type="submit"
                    className="bg-[#94C3D2] text-white px-6 py-2.5 rounded-lg hover:bg-[#7EB5C3] transition-colors shadow-md font-medium"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollabRoom;
