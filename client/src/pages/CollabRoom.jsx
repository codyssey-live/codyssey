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
import { updateProblemStatus } from "../utils/syllabusApiUtils";
import apiClient from "../utils/apiClient"; // Import apiClient for making API requests
import axios from "axios";

const CollabRoom = () => {
  const location = useLocation();
  const { roomData } = useRoom();
  const editorRef = useRef(null);
  const [problemLink, setProblemLink] = useState("");
  const [problemId, setProblemId] = useState(null); // Add this state
  const [dayId, setDayId] = useState(null); // Add this state
  const [language, setLanguage] = useState("javascript");
  const [isConnected, setIsConnected] = useState(false);
  const [userName, setUserName] = useState("User");
  const [problemStatus, setProblemStatus] = useState("unsolved");
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [statusUpdateError, setStatusUpdateError] = useState(null);
  // Removed statusUpdateSuccess state as requested
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });
  const [showStatusMessage, setShowStatusMessage] = useState(true);
  useEffect(() => {
    if (problemStatus === "solved" || problemStatus === "solveLater") {
      setShowStatusMessage(true);
      const timer = setTimeout(() => {
        setShowStatusMessage(false);
      }, 2500); // 2.5 seconds
      return () => clearTimeout(timer);
    }
  }, [problemStatus]);
  const [problemDetails, setProblemDetails] = useState({
    title: "Loading Problem...",
    difficulty: "Unknown",
    platform: "Unknown",
    url: "",
    status: "unsolved",
  });
  const [isLoadingProblem, setIsLoadingProblem] = useState(true);
  const [problemFetchError, setProblemFetchError] = useState(null);
  const [problemExists, setProblemExists] = useState(false);

  // Add a recovery mechanism if initial fetch fails
  const [fetchRetryCount, setFetchRetryCount] = useState(0);
  // Reference for scrolling to bottom
  const messagesEndRef = useRef(null);

  // Add states for success messages
  const [solvedSuccess, setSolvedSuccess] = useState(false);
  const [bookmarkedSuccess, setBookmarkedSuccess] = useState(false);

  // Process function to avoid duplicates - use a Map for better tracking
  const processedMessages = useRef(new Map());

  // New state for code modal
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [modalCode, setModalCode] = useState("");
  const [modalLanguage, setModalLanguage] = useState("javascript");
  const [isModalFromCurrentUser, setIsModalFromCurrentUser] = useState(true); // Track who sent the code

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

  // Function to detect code language from code content
  const detectCodeLanguage = (codeText) => {
    if (codeText.includes("def ") && codeText.includes(":")) return "python";
    if (
      codeText.includes("public class") ||
      codeText.includes("public static void")
    )
      return "java";
    if (codeText.includes("#include")) return "cpp";
    return "javascript"; // Default
  };

  // Function to open the code modal
  const openCodeModal = (codeText, lang = null, isFromCurrentUser = true) => {
    // Normalize line endings for consistency
    const formattedCode = codeText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    setModalCode(formattedCode);
    setModalLanguage(lang || detectCodeLanguage(formattedCode));
    setIsModalFromCurrentUser(isFromCurrentUser);
    setIsCodeModalOpen(true);
  };

  // Function to copy code from modal
  const copyModalCode = () => {
    navigator.clipboard
      .writeText(modalCode)
      .then(() => {
        // Show brief visual feedback for copy success
        const copyBtn = document.getElementById("modal-copy-btn");
        if (copyBtn) {
          const originalText = copyBtn.innerText;
          copyBtn.innerText = "Copied!";
          setTimeout(() => {
            copyBtn.innerText = originalText;
          }, 1500);
        }
      })
      .catch((err) => console.error("Could not copy code: ", err));
  };  useEffect(() => {
    // Initialize problem information from location state
    if (location.state) {
      if (location.state.problemLink) {
        setProblemLink(location.state.problemLink);
      }

      // Store problem ID and day ID if available
      if (location.state.problemId) {
        setProblemId(location.state.problemId);
        console.log(
          "Setting problem ID from location state:",
          location.state.problemId
        );
      }

      if (location.state.dayId) {
        setDayId(location.state.dayId);
        console.log(
          "Setting day ID from location state:",
          location.state.dayId
        );
      }
      
      // Check if we should update the timestamp (coming from syllabus page)
      if (location.state.updateTimestamp && location.state.problemId && location.state.dayId) {
        const updateTimestamp = async () => {
          try {
            // Import and use the utility function to update the problem status
            // This will also update the dateAdded timestamp on the backend
            const { updateProblemStatus } = await import("../utils/syllabusApiUtils");
            const result = await updateProblemStatus(
              location.state.dayId, 
              location.state.problemId, 
              location.state.status || 'unsolved'
            );
            
            if (result.success) {
              console.log("Updated problem timestamp successfully");
            } else {
              console.error("Failed to update problem timestamp:", result.message);
            }
          } catch (error) {
            console.error("Error updating problem timestamp:", error);
          }
        };
        
        updateTimestamp();
      }

      // Initialize problem details if provided directly in state
      if (
        location.state.problemTitle ||
        location.state.difficulty ||
        location.state.platform
      ) {
        console.log("Initial problem details from state:", {
          title: location.state.problemTitle,
          difficulty: location.state.difficulty,
          platform: location.state.platform,
        });
      }

      // Initialize status based on passed state
      if (location.state.status) {
        console.log(
          "Setting initial status from location state:",
          location.state.status
        );
        setProblemStatus(location.state.status);

        if (location.state.status === "solved") {
          setIsSolved(true);
          setIsSavedForLater(false);
        } else if (location.state.status === "solveLater") {
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
    const initialStatus = location.state?.status || "unsolved";
    setProblemStatus(initialStatus);
  }, [location.state]); // Enhanced function to fetch problem details from the study day schema
  const fetchProblemDetails = async () => {
    try {
      setIsLoadingProblem(true);
      setProblemFetchError(null);
      // If we have both dayId and problemId, fetch problem details
      if (dayId && problemId) {
        console.log(
          `Fetching problem details for day: ${dayId}, problem: ${problemId}`
        );

        // Use the syllabusApiUtils to get the study day
        const { fetchStudyDay } = await import("../utils/syllabusApiUtils");
        const studyDayResponse = await fetchStudyDay(dayId);

        if (!studyDayResponse.success) {
          throw new Error(
            `Failed to fetch study day: ${studyDayResponse.message}`
          );
        }

        // Parse response data
        const data = studyDayResponse.data;
        console.log("Study day data:", data);
        console.log("Available problems:", data?.problems || []);
        console.log("Looking for problemId:", problemId);
        if (data && Array.isArray(data.problems)) {
          // Find the specific problem in the study day's problems array
          const problem = data.problems.find(
            (p) =>
              String(p._id) === String(problemId) ||
              String(p.id) === String(problemId)
          );

          if (problem) {
            console.log("Problem data found:", problem);

            // Validate the problem data
            const isValid = validateProblemData(problem);
            console.log("Problem data validation result:", isValid);

            if (!isValid) {
              console.warn("Problem data is incomplete or invalid:", problem);
              // Set a flag to indicate incomplete data
              setProblemFetchError("Problem data is incomplete");
            }

            // Log the actual problem values to debug
            console.log("Setting problem details with values:", {
              title: problem.title,
              difficulty: problem.difficulty,
              platform: problem.platform,
              url: problem.url,
              status: problem.status,
            });

            // Detect platform from URL if not provided
            const detectedPlatform = detectPlatformFromUrl(
              problem.url || problemLink
            );

            setProblemDetails({
              title:
                problem.title ||
                extractTitleFromUrl(problemLink) ||
                "Untitled Problem",
              difficulty:
                problem.difficulty || location.state?.difficulty || "Unknown",
              platform:
                problem.platform ||
                location.state?.platform ||
                detectedPlatform ||
                "Unknown",
              url: problem.url || problemLink || "",
              status: problem.status || "unsolved",
            });

            // Also set the status state for tracking changes
            setProblemStatus(problem.status || "unsolved");
            setProblemExists(true);
          } else {
            console.error(
              `Problem not found in study day. Problem ID: ${problemId} was not found in ${
                data.problems?.length || 0
              } problems`
            );
            // Fallback to available state data
            setProblemDetails({
              title:
                location.state?.problemTitle ||
                extractTitleFromUrl(problemLink) ||
                "Problem",
              difficulty: location.state?.difficulty || "Unknown",
              platform: location.state?.platform || "Unknown",
              url: problemLink || "",
              status: location.state?.status || "unsolved",
            });
            setProblemFetchError("Problem not found in study day");
            setProblemExists(false);
          }
        } else {
          console.error("Invalid API response structure:", data);
          // Try to extract meaningful error information
          const errorMsg =
            "Study day data structure is invalid or missing problems array";
          setProblemFetchError(errorMsg);

          // Fallback to available state data
          setProblemDetails({
            title:
              location.state?.problemTitle ||
              extractTitleFromUrl(problemLink) ||
              "Problem",
            difficulty: location.state?.difficulty || "Unknown",
            platform: location.state?.platform || "Unknown",
            url: problemLink || "",
            status: location.state?.status || "unsolved",
          });
          setProblemExists(false);
        }
      } else if (problemLink) {
        console.log("Using problem link only:", problemLink);
        // Try to detect platform from the URL
        const detectedPlatform = detectPlatformFromUrl(problemLink);

        // If we only have the problem link but no details, use best-effort data
        setProblemDetails({
          title:
            location.state?.problemTitle ||
            extractTitleFromUrl(problemLink) ||
            "Problem",
          difficulty: location.state?.difficulty || "Unknown",
          platform: location.state?.platform || detectedPlatform || "Unknown",
          url: problemLink || "",
          status: location.state?.status || "unsolved",
        });

        // If we at least have a problem link, consider it as existing
        setProblemExists(!!problemLink);
        setProblemStatus(location.state?.status || "unsolved");
      } else {
        console.log("No problem ID or link available");
        // No problem ID or link, set default values
        setProblemDetails({
          title: "No Problem Selected",
          difficulty: "N/A",
          platform: "N/A",
          url: "",
          status: "unsolved",
        });
        setProblemExists(false);
      }
    } catch (error) {
      console.error("Error fetching problem details:", error);
      setProblemFetchError(error.message || "Failed to load problem details");

      // Fallback to available state data with actual "Unknown" indicators
      // rather than hardcoded default values
      setProblemDetails({
        title:
          location.state?.problemTitle ||
          extractTitleFromUrl(problemLink) ||
          "Problem",
        difficulty: location.state?.difficulty || "Unknown",
        platform: location.state?.platform || "Unknown",
        url: problemLink || "",
        status: location.state?.status || "unsolved",
      });

      // If we at least have a problem link, consider it as existing
      setProblemExists(!!problemLink);
      setProblemStatus(location.state?.status || "unsolved");
    } finally {
      setIsLoadingProblem(false);
    }
  };

  // Load problem details when component mounts or when IDs change
  useEffect(() => {
    fetchProblemDetails();
  }, [dayId, problemId, problemLink]);

  // Add a retry mechanism for fetching problem details if there's an error
  useEffect(() => {
    if (problemFetchError && fetchRetryCount < 3) {
      console.log(
        `Retrying problem details fetch (attempt ${
          fetchRetryCount + 1
        } of 3)...`
      );
      const retryTimer = setTimeout(() => {
        setFetchRetryCount((prev) => prev + 1);
        fetchProblemDetails();
      }, 1500 * (fetchRetryCount + 1)); // Exponential backoff

      return () => clearTimeout(retryTimer);
    }
  }, [problemFetchError, fetchRetryCount]);
  // Enhanced function to extract title from URL
  const extractTitleFromUrl = (url) => {
    if (!url) return null;

    try {
      const path = new URL(url).pathname;
      const segments = path.split("/").filter(Boolean);

      if (segments.length > 0) {
        // Get the last segment which typically contains the problem name
        const lastSegment = segments[segments.length - 1];

        // Remove any trailing numbers or special characters
        const cleanedSegment = lastSegment
          .replace(/[-_]/g, " ")
          .replace(/\.html?$/i, "")
          .replace(/[0-9]+$/g, "")
          .trim();

        // Capitalize words
        return cleanedSegment
          .split(" ")
          .map(
            (word) =>
              word && word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          )
          .filter(Boolean)
          .join(" ");
      }

      // If we couldn't extract from pathname, try the hostname for platform name
      const hostname = new URL(url).hostname;
      if (hostname) {
        if (hostname.includes("leetcode")) return "LeetCode Problem";
        if (hostname.includes("hackerrank")) return "HackerRank Problem";
        if (hostname.includes("codewars")) return "Codewars Problem";
        if (hostname.includes("hackerearth")) return "HackerEarth Problem";
        if (hostname.includes("codeforces")) return "Codeforces Problem";
        return "Coding Problem";
      }
    } catch (err) {
      console.error("Error parsing URL:", err);
    }

    return "Coding Problem";
  };

  // Helper function to detect platform from URL
  const detectPlatformFromUrl = (url) => {
    if (!url) return null;

    try {
      const hostname = new URL(url).hostname;

      if (hostname.includes("leetcode")) return "LeetCode";
      if (hostname.includes("hackerrank")) return "HackerRank";
      if (hostname.includes("codechef")) return "CodeChef";
      if (hostname.includes("codeforces")) return "CodeForces";
      if (hostname.includes("hackerearth")) return "HackerEarth";
      if (hostname.includes("geeksforgeeks") || hostname.includes("gfg"))
        return "GeeksForGeeks";
      if (hostname.includes("topcoder")) return "TopCoder";
      if (hostname.includes("spoj")) return "SPOJ";
      if (hostname.includes("atcoder")) return "AtCoder";
      if (hostname.includes("codewars")) return "CodeWars";
      if (hostname.includes("projecteuler")) return "Project Euler";

      // Try to extract from pathname for GitHub repos containing problems
      if (hostname.includes("github")) {
        return "GitHub";
      }

      return null;
    } catch (error) {
      console.error("Error detecting platform from URL:", error);
      return null;
    }
  }; // Modified handleStatusChange to use our handleUpdateProblemStatus function
  const handleStatusChange = async (newStatus) => {
    try {
      // If the current status is the same as the new one, toggle it to unsolved (reset)
      const statusToApply =
        problemStatus === newStatus ? "unsolved" : newStatus;

      // Validate required parameters
      if (!dayId || !problemId) {
        console.error("Missing required parameters for status update", {
          dayId,
          problemId,
        });
        setStatusUpdateError(
          "Missing problem information. Please try again from the syllabus page."
        );
        setTimeout(() => setStatusUpdateError(null), 3000);
        return;
      }

      console.log(
        `Updating problem status: dayId=${dayId}, problemId=${problemId}, status=${statusToApply}`
      );
      // Use the handleUpdateProblemStatus function which includes all the necessary logic
      await handleUpdateProblemStatus(statusToApply);

      // Store the status in localStorage to persist after refresh
      if (problemId) {
        localStorage.setItem(`problem_status_${problemId}`, statusToApply);
      }
    } catch (error) {
      console.error("Error in handleStatusChange:", error);
      // Error handling is already done in handleUpdateProblemStatus
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
          const response = await apiClient.get(
            `/syllabus/${localStorage.getItem("userId")}`
          );
          if (response.data.success && response.data.data) {
            const syllabus = response.data.data;
            const studyDay = syllabus.studyDays.find(
              (day) => day._id === dayId
            );

            if (studyDay) {
              const problem = studyDay.problems.find(
                (p) => p._id === problemId
              );
              if (problem && problem.status) {
                setProblemStatus(problem.status);
                // Update localStorage with latest status from server
                localStorage.setItem(
                  `problem_status_${problemId}`,
                  problem.status
                );
              }
            }
          }
        } catch (error) {
          console.error("Error fetching problem status:", error);
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
      const response = await updateProblemStatus(
        dayId,
        problemId,
        newState ? "solved" : "unsolved"
      );
      if (response.success) {
        console.log("Problem status updated successfully:", response.data);
      } else {
        console.error("Failed to update problem status:", response.message);
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
      const response = await updateProblemStatus(
        dayId,
        problemId,
        newState ? "solveLater" : "unsolved"
      );
      if (response.success) {
        console.log("Problem status updated successfully:", response.data);
      } else {
        console.error("Failed to update problem status:", response.message);
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
      // Add source to clearly identify collab room messages
      source: "collab-room",
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
        source: "collab-room",
      });

      // Also emit with underscore format for compatibility
      socket.emit("send_message", {
        roomId: roomData.roomId,
        message: newMessage, // Use message instead of text for consistency
        username: userName,
        messageId,
        isCode: isCodeMessage,
        source: "collab-room",
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

      // Normalize data structure from different message formats      // Check if message is from collab room
      const source = data.source;
      if (source && source !== "collab-room") {
        console.log("Ignoring message from different source:", source);
        return;
      }

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

  // Handle updating problem status
  const handleUpdateProblemStatus = async (newStatus) => {
    if (!problemId || !dayId) {
      console.error("Cannot update status: Problem details not available");
      return;
    }

    try {
      setStatusUpdateLoading(true);
      setStatusUpdateError(null);

      // Import and use the utility function
      const { updateProblemStatus } = await import("../utils/syllabusApiUtils");
      const result = await updateProblemStatus(dayId, problemId, newStatus);

      if (result.success) {
        setProblemDetails((prev) => ({ ...prev, status: newStatus }));
        setProblemStatus(newStatus);
        if (newStatus === "solved") {
          showSolvedSuccessMessage();
        } else if (newStatus === "solveLater") {
          showBookmarkedSuccessMessage();
        }

        // Status update success handling removed as requested
      } else {
        console.error("Failed to update problem status:", result.message);
        setStatusUpdateError(result.message);
        setTimeout(() => setStatusUpdateError(null), 3000);
      }
    } catch (error) {
      console.error("Error updating problem status:", error);
      setStatusUpdateError("An error occurred while updating status");
      setTimeout(() => setStatusUpdateError(null), 3000);
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  // Helper function to show solved success message
  const showSolvedSuccessMessage = () => {
    setIsSolved(true);
    setIsSavedForLater(false);
    setSolvedSuccess(true);
    setBookmarkedSuccess(false);
    setStatusMessage({
      type: "success",
      text: "Problem marked as solved!",
    });

    // Auto hide the message after some time
    setTimeout(() => {
      setSolvedSuccess(false);
      setStatusMessage({ type: "", text: "" });
    }, 3000);
  };

  // Helper function to show bookmarked success message
  const showBookmarkedSuccessMessage = () => {
    setIsSolved(false);
    setIsSavedForLater(true);
    setSolvedSuccess(false);
    setBookmarkedSuccess(true);
    setStatusMessage({
      type: "info",
      text: "Problem saved for later!",
    });

    // Auto hide the message after some time
    setTimeout(() => {
      setBookmarkedSuccess(false);
      setStatusMessage({ type: "", text: "" });
    }, 3000);
  };

  // Helper function to validate problem details
  const validateProblemData = (problem) => {
    if (!problem) return false;

    // Check if required fields exist and are not empty strings
    const hasTitle = problem.title && problem.title.trim() !== "";
    const hasDifficulty =
      problem.difficulty &&
      problem.difficulty.trim() !== "" &&
      problem.difficulty !== "Unknown";
    const hasPlatform =
      problem.platform &&
      problem.platform.trim() !== "" &&
      problem.platform !== "Unknown";

    console.log(
      `Problem validation: title=${hasTitle}, difficulty=${hasDifficulty}, platform=${hasPlatform}`
    );

    // Return true if all required fields are present
    return hasTitle && (hasDifficulty || hasPlatform);
  };
  // Helper function to limit code lines rather than characters
  const limitCodeLines = (code, maxLines = 5) => {
    const lines = code.split("\n");
    if (lines.length <= maxLines) return code;
    return lines.slice(0, maxLines).join("\n") + "\n...";
  };

  // Add debugging log when problem details change
  useEffect(() => {
    console.log("Problem details updated:", problemDetails);

    // If difficulty or platform are Unknown but we have URL, try to infer them
    if (
      (problemDetails.difficulty === "Unknown" ||
        problemDetails.platform === "Unknown") &&
      problemDetails.url
    ) {
      const detectedPlatform = detectPlatformFromUrl(problemDetails.url);
      if (detectedPlatform && problemDetails.platform === "Unknown") {
        console.log("Auto-detected platform from URL:", detectedPlatform);
        setProblemDetails((prev) => ({ ...prev, platform: detectedPlatform }));
      }
    }
  }, [problemDetails.url, problemDetails.title]);
  // Function to handle error display in problem details
  const renderProblemDetails = () => {
    if (isLoadingProblem) {
      // Show loading state
      return <div className="animate-pulse bg-white/20 h-6 w-48 rounded"></div>;
    } else if (problemFetchError) {
      // Show warning with best data available when we have error
      return (
        <>
          <h2 className="text-lg font-medium text-white/95 flex items-center">
            {problemDetails.title || "Problem Details"}
            <span className="ml-2 text-xs text-amber-400 bg-amber-900/30 px-2 py-0.5 rounded-full border border-amber-500/30">
              Limited Data
            </span>
          </h2>
          {fetchRetryCount >= 3 && (
            <p className="text-sm text-red-300 mt-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 inline-block mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Error loading complete problem details. Using available
              information.
            </p>
          )}
        </>
      );
    } else {
      // Normal display when we have data and no errors
      return problemDetails.title || "Untitled Problem";
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
              {/* Display actual problem title, not "Problem" */}{" "}
              <h2 className="text-xl font-medium text-white/95">
                {renderProblemDetails()}
              </h2>
              <div className="mt-3 flex flex-wrap gap-3">
                {" "}
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    problemDetails.difficulty === "Unknown"
                      ? "bg-gray-700/50 text-gray-300 border border-gray-500/30"
                      : "bg-white/10 text-white/80 border border-white/20"
                  }`}
                >
                  {isLoadingProblem ? (
                    <div className="animate-pulse bg-white/20 h-4 w-16 rounded-full"></div>
                  ) : problemDetails.difficulty === "Unknown" ? (
                    <span className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Difficulty Unknown
                    </span>
                  ) : (
                    problemDetails.difficulty
                  )}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    problemDetails.platform === "Unknown"
                      ? "bg-gray-700/50 text-gray-300 border border-gray-500/30"
                      : "bg-white/10 text-white/80 border border-white/20"
                  }`}
                >
                  {isLoadingProblem ? (
                    <div className="animate-pulse bg-white/20 h-4 w-20 rounded-full"></div>
                  ) : problemDetails.platform === "Unknown" ? (
                    <span className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Platform Unknown
                    </span>
                  ) : (
                    problemDetails.platform
                  )}
                </span>
                {problemDetails.url && problemDetails.url !== "" ? (
                  <a
                    href={problemDetails.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white bg-[#94C3D2] hover:bg-[#7EB5C3] px-3 py-1 rounded-lg flex items-center transition-colors text-sm"
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
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    Open Problem
                  </a>
                ) : (
                  <span className="text-white/50 bg-white/10 px-3 py-1 rounded-lg flex items-center text-sm border border-white/20">
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
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14.828 14.828a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101"
                      />
                    </svg>
                    No Link Available
                  </span>
                )}
              </div>
            </div>
            {/* Status buttons moved inside the card */}
            <div className="flex space-x-3">
              <button
                onClick={() => handleStatusChange("solved")}
                disabled={statusUpdateLoading}
                className={`px-5 py-2 rounded-md text-md font-medium transition-colors flex items-center ${
                  problemStatus === "solved"
                    ? "bg-green-600 text-white/95"
                    : "bg-green-900/50 text-green-200 border border-green-600/30 hover:bg-green-900/70"
                }`}
                title={
                  problemStatus === "solved"
                    ? "Click to reset status"
                    : "Mark as solved"
                }
              >
                {statusUpdateLoading && problemStatus !== "solved" ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4"
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
                    {/* Show actual problem name instead of "Problem" */}
                    {problemDetails.title}
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1.5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {problemStatus === "solved" ? "Solved" : "Mark as Solved"}
                  </>
                )}
              </button>

              {/* Save for Later button */}
              <button
                onClick={() => handleStatusChange("solveLater")}
                disabled={statusUpdateLoading}
                className={`px-4 py-2 rounded-md text-sm font-medium flex items-center ${
                  problemStatus === "solveLater"
                    ? "bg-yellow-600 text-white/95"
                    : "bg-yellow-900/50 text-yellow-200 border border-yellow-600/30 hover:bg-yellow-900/70"
                } transition-colors`}
                title={
                  problemStatus === "solveLater"
                    ? "Click to reset status"
                    : "Mark to solve later"
                }
              >
                {statusUpdateLoading && problemStatus !== "solveLater" ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4"
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
                    {/* Show actual problem name instead of "Problem" */}
                    {problemDetails.title}
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1.5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {problemStatus === "solveLater"
                      ? "Saved for Later"
                      : "Solve Later"}
                  </>
                )}
              </button>
            </div>{" "}
          </div>

          <div className="mt-2">
            {/* Remove the "Problem Status" text */}
            {statusUpdateError && (
              <div className="mb-4 bg-red-900/30 text-red-300 border border-red-500/30 rounded-md p-3">
                {statusUpdateError}
              </div>
            )}
            {/* Status condition messages */}
            {problemStatus === "solved" && showStatusMessage && (
              <div className="mt-4 text-sm bg-green-900/20 text-green-400 border border-green-600/20 p-3 rounded-lg">
                <div className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 mt-0.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="font-medium">Great job!</p>
                    <p>
                      You've marked this problem as solved. Keep up the good
                      work!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {problemStatus === "solveLater" && showStatusMessage && (
              <div className="mt-4 text-sm bg-yellow-900/20 text-yellow-400 border border-yellow-600/20 p-3 rounded-lg">
                <div className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 mt-0.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="font-medium">Bookmarked for later!</p>
                    <p>
                      You'll find this problem in your "Solve Later" collection
                      when you're ready to tackle it.
                    </p>
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
              <div className="p-4 border-b border-white/20 flex justify-between items-center">
                <h2 className="font-semibold text-white/95">Discussion</h2>
                <div className="flex items-center">
                  <span
                    className={`h-3 w-3 rounded-full mr-2 ${
                      isConnected && roomData.inRoom
                        ? "bg-green-500"
                        : "bg-red-400"
                    }`}
                  ></span>
                  <span
                    className={`text-sm ${
                      isConnected && roomData.inRoom
                        ? "text-white/80"
                        : "text-red-400"
                    }`}
                  >
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
                              <div
                                className={`rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity ${
                                  isCurrentUser
                                    ? "bg-[#94C3D2]/90 text-white"
                                    : "bg-yellow-50 text-gray-900"
                                }`}
                                onClick={() =>
                                  openCodeModal(
                                    message.text,
                                    null,
                                    isCurrentUser
                                  )
                                }
                              >
                                <div
                                  className={`px-3 py-1 flex items-center justify-between ${
                                    isCurrentUser
                                      ? "bg-black/30"
                                      : "bg-amber-200/50"
                                  }`}
                                >
                                  <span
                                    className={`text-xs font-mono ${
                                      isCurrentUser ? "" : "text-gray-800"
                                    }`}
                                  >
                                    {detectCodeLanguage(
                                      message.text
                                    ).toUpperCase()}{" "}
                                    Code
                                  </span>
                                  <span className="text-xs">Click to view</span>
                                </div>
                                <pre
                                  className="p-3 text-sm font-mono overflow-x-auto overflow-y-hidden w-full scrollbar-hide"
                                  style={{
                                    maxHeight: "50px",
                                    whiteSpace: "pre",
                                    overflowX: "auto",
                                    width: "100%",
                                    msOverflowStyle: "none" /* IE and Edge */,
                                    scrollbarWidth: "none" /* Firefox */,
                                  }}
                                >
                                  <code
                                    className="inline-block whitespace-nowrap"
                                    style={{ minWidth: "max-content" }}
                                  >
                                    {limitCodeLines(message.text)}
                                  </code>
                                </pre>
                              </div>
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
                )}
              </div>
              <div className="p-4 border-t border-white/20">
                <form
                  onSubmit={handleSendMessage}
                  className="flex items-center gap-2"
                >
                  <div className="flex-1 flex items-center bg-[#2d3748] border border-white/20 rounded-lg overflow-hidden">
                    {isCodeMessage ? (
                      <textarea
                        placeholder="Type or paste your code here..."
                        className="flex-1 px-4 py-2.5 bg-transparent text-white placeholder-gray-400 outline-none focus:ring-[#94C3D2] focus:border-[#94C3D2] border-none resize-none"
                        style={{ height: "42px", overflow: "auto" }}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          // Allow tab key for indentation in code
                          if (e.key === "Tab") {
                            e.preventDefault();
                            const start = e.target.selectionStart;
                            const end = e.target.selectionEnd;
                            const value = e.target.value;
                            setNewMessage(
                              value.substring(0, start) +
                                "  " +
                                value.substring(end)
                            );
                            // Set cursor position after the inserted tab
                            setTimeout(() => {
                              e.target.selectionStart = e.target.selectionEnd =
                                start + 2;
                            }, 0);
                          } else if (e.key === "Enter" && !e.shiftKey) {
                            handleSendMessage(e);
                          }
                        }}
                      />
                    ) : (
                      <input
                        type="text"
                        placeholder="Type message..."
                        className="flex-1 px-4 py-2.5 bg-transparent text-white placeholder-gray-400 outline-none focus:ring-[#94C3D2] focus:border-[#94C3D2] border-none"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleMessageKeyDown}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setIsCodeMessage(!isCodeMessage);
                        setNewMessage(""); // Clear message when switching modes
                      }}
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

      {/* Code Snippet Modal */}
      {isCodeModalOpen && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black/70 flex items-center justify-center p-4">
          <div
            className={`${
              isModalFromCurrentUser ? "bg-gray-900" : "bg-yellow-50"
            } rounded-xl border ${
              isModalFromCurrentUser ? "border-gray-700" : "border-amber-200"
            } w-full max-w-4xl max-h-[95vh] flex flex-col`}
          >
            <div
              className={`border-b ${
                isModalFromCurrentUser ? "border-gray-700" : "border-amber-300"
              } px-5 py-3 flex justify-between items-center`}
            >
              <h3
                className={`text-lg font-medium ${
                  isModalFromCurrentUser ? "text-gray-900" : "text-gray-900"
                }`}
              >
                Code - {modalLanguage.toUpperCase()}
              </h3>
              <div className="flex items-center gap-3">
                <button
                  id="modal-copy-btn"
                  onClick={copyModalCode}
                  className={`px-3 py-1 ${
                    isModalFromCurrentUser
                      ? "bg-[#2d3748] hover:bg-[#3e4c5e] text-white/90"
                      : "bg-amber-200 hover:bg-amber-300 text-gray-900"
                  } text-sm rounded-md transition-colors`}
                >
                  Copy Code
                </button>
                <button
                  onClick={() => setIsCodeModalOpen(false)}
                  className={`${
                    isModalFromCurrentUser
                      ? "text-gray-700 hover:text-gray-900"
                      : "text-gray-700 hover:text-gray-900"
                  }`}
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
            </div>
            <div className="flex-1 overflow-auto p-0">
              <div
                className={`h-full ${
                  isModalFromCurrentUser ? "bg-[#1e1e1e]" : "bg-[#1e1e1e]"
                } rounded-b-xl overflow-hidden`}
              >
                <div
                  style={{ height: "60vh", minHeight: "400px" }}
                  className="p-1 rounded-b-xl overflow-hidden"
                >
                  <Editor
                    key={`monaco-${Date.now()}`} // Force re-render with unique key
                    value={modalCode}
                    language={getMonacoLanguage(modalLanguage)}
                    theme="vs-dark"
                    beforeMount={(monaco) => {
                      // Configure editor before mounting
                      monaco.editor.defineTheme("modal-theme", {
                        base: "vs-dark",
                        inherit: true,
                        rules: [],
                        colors: {},
                      });
                    }}
                    options={{
                      readOnly: true,
                      minimap: { enabled: true },
                      scrollBeyondLastLine: false,
                      lineNumbers: "on",
                      fontSize: 14,
                      fontFamily: "JetBrains Mono, monospace",
                      wordWrap: "on",
                      automaticLayout: true,
                      tabSize: 2,
                      renderWhitespace: "all",
                      renderControlCharacters: true,
                    }}
                    onMount={(editor) => {
                      // Ensure content is properly loaded
                      setTimeout(() => {
                        // Force layout recalculation
                        editor.layout();
                        // Ensure line breaks are preserved in model
                        const model = editor.getModel();
                        if (model) {
                          // Force the model to update with properly formatted code
                          model.setValue(modalCode);
                          editor.setScrollPosition({ scrollTop: 0 });
                        }
                      }, 50);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollabRoom;
