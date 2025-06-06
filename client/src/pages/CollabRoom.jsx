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
import { toast } from "react-toastify";

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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingLanguage, setPendingLanguage] = useState(null);
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
  const [isCodeModalOpen, setIsCodeModal] = useState(false);
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

  // Room creator states for problem details sharing
  const [isRoomCreator, setIsRoomCreator] = useState(false);
  const [hasSharedProblemDetails, setHasSharedProblemDetails] = useState(false);
  const [problemDetailsReceived, setProblemDetailsReceived] = useState(false);

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
    setIsCodeModal(true);
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
  };
  useEffect(() => {
    // Initialize problem information from location state
    if (location.state) {
      console.log("Location state in CollabRoom:", location.state);

      if (location.state.problemLink) {
        setProblemLink(location.state.problemLink);
        console.log("Setting problem link:", location.state.problemLink);
      }

      // Store problem ID and day ID if available - these are critical for fetching problem details
      if (location.state.problemId) {
        // Make sure we convert to string for consistent comparison
        const pId = String(location.state.problemId);
        setProblemId(pId);
        console.log("Setting problem ID from location state:", pId);

        // Store in localStorage to persist across page refreshes
        localStorage.setItem("current_collab_problem_id", pId);
      }

      // Always try to recover from localStorage if not in location state
      if (!location.state.problemId) {
        const savedProblemId = localStorage.getItem(
          "current_collab_problem_id"
        );
        if (savedProblemId) {
          console.log(
            "Recovering problem ID from localStorage:",
            savedProblemId
          );
          setProblemId(savedProblemId);
        }
      }

      if (location.state.dayId) {
        // Make sure we convert to string for consistent comparison
        const dId = String(location.state.dayId);
        setDayId(dId);
        console.log("Setting day ID from location state:", dId);

        // Store in localStorage to persist across page refreshes
        localStorage.setItem("current_collab_day_id", dId);
      }

      // Always try to recover from localStorage if not in location state
      if (!location.state.dayId) {
        const savedDayId = localStorage.getItem("current_collab_day_id");
        if (savedDayId) {
          console.log("Recovering day ID from localStorage:", savedDayId);
          setDayId(savedDayId);
        }
      }

      // Determine if this user is the room creator
      const isCreator =
        location.state.isCreator ||
        (roomData.created && roomData.roomId) ||
        localStorage.getItem(`room_creator_${roomData.roomId}`) === "true";

      if (isCreator) {
        setIsRoomCreator(true);
        // Store that this user is the creator for this room
        if (roomData.roomId) {
          localStorage.setItem(`room_creator_${roomData.roomId}`, "true");
        }
        console.log("This user is the room creator");
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
          url: location.state.url,
        });

        // Set initial problem details right away for faster UI rendering
        if (
          location.state.problemTitle &&
          location.state.problemTitle !== "LeetCode Problem" &&
          location.state.problemTitle !== "Problem"
        ) {
          setProblemDetails({
            title: location.state.problemTitle,
            difficulty: location.state.difficulty || "Medium",
            platform: location.state.platform || "Unknown",
            url: location.state.url || "",
            status: location.state.status || "unsolved",
          });
        }
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
    } else {
      // If no location state, try to recover IDs from localStorage
      const savedProblemId = localStorage.getItem("current_collab_problem_id");
      const savedDayId = localStorage.getItem("current_collab_day_id");

      if (savedProblemId) {
        console.log("Recovering problem ID from localStorage:", savedProblemId);
        setProblemId(savedProblemId);
      }

      if (savedDayId) {
        console.log("Recovering day ID from localStorage:", savedDayId);
        setDayId(savedDayId);
      }

      // Check if this user is the room creator from localStorage
      if (
        roomData.roomId &&
        localStorage.getItem(`room_creator_${roomData.roomId}`) === "true"
      ) {
        setIsRoomCreator(true);
        console.log("Identified as room creator from localStorage");
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
  }, [location.state]); // Improved function to fetch problem details using specific IDs
  const fetchProblemDetails = async () => {
    try {
      setIsLoadingProblem(true);
      setProblemFetchError(null);

      console.log("Starting problem fetch with IDs:", {
        problemId,
        dayId,
        userId: localStorage.getItem("userId"),
      });

      // Use any directly provided details from location state first
      if (location.state && location.state.problemTitle) {
        // We have direct details from location state (likely from Syllabus page)
        console.log("Using direct problem details from location state:", {
          title: location.state.problemTitle,
          difficulty: location.state.difficulty,
          platform: location.state.platform,
        });

        const directDetails = {
          title: location.state.problemTitle,
          difficulty: location.state.difficulty || "Medium",
          platform: location.state.platform || "Unknown",
          url: location.state.url || problemLink || "",
          status: location.state.status || "unsolved",
        };

        // Only use if the title is not a placeholder
        if (
          directDetails.title &&
          directDetails.title !== "LeetCode Problem" &&
          directDetails.title !== "Problem" &&
          directDetails.title !== "Loading Problem..."
        ) {
          setProblemDetails(directDetails);
          setProblemStatus(directDetails.status);

          // Share these details if we're the creator
          if (isRoomCreator && roomData.inRoom) {
            shareProblemDetailsWithRoom(directDetails);
          }

          setIsLoadingProblem(false);
          setProblemExists(true);
          return;
        }
      }

      // Skip fetching if we've already received problem details from the room creator
      if (problemDetailsReceived && !isRoomCreator) {
        console.log("Using problem details received from room creator");
        setIsLoadingProblem(false);
        return;
      }

      // If we have both dayId and problemId, fetch problem details directly
      if (dayId && problemId) {
        console.log(
          `Fetching problem details for day: ${dayId}, problem: ${problemId}`
        );

        try {
          // First, try the specific endpoint to get a single problem from a study day
          const userId = localStorage.getItem("userId");

          // Be specific about the path to ensure we get the right problem
          const problemEndpoint = `/syllabus/users/${userId}/days/${dayId}/problems/${problemId}`;
          console.log("Fetching from endpoint:", problemEndpoint);

          const response = await safeApiGet(problemEndpoint);

          if (response.data && response.data.success && response.data.data) {
            const problem = response.data.data;
            console.log("Problem data found via direct API:", problem);

            // Validate that we received actual data, not placeholders
            if (
              !problem ||
              !problem.title ||
              problem.title === "LeetCode Problem" ||
              problem.title === "Problem"
            ) {
              console.warn(
                "API returned placeholder problem data, trying alternative fetch"
              );
              throw new Error("API returned placeholder data");
            }

            const updatedProblemDetails = {
              title: problem.title,
              difficulty: problem.difficulty || "Medium",
              platform: problem.platform || "Unknown",
              url: problem.url || "",
              status: problem.status || "unsolved",
            };

            // Log actual fetched values
            console.log(
              "Setting verified problem details from API:",
              updatedProblemDetails
            );

            setProblemDetails(updatedProblemDetails);
            setProblemStatus(updatedProblemDetails.status);
            setProblemExists(true);
            // Share problem details with other participants if this user is the room creator
            if (isRoomCreator && roomData.inRoom && socket.connected) {
              // Include the current dayId and problemId when sharing
              const detailsToShare = {
                ...updatedProblemDetails,
                _dayId: dayId,
                _problemId: problemId,
              };

              shareProblemDetailsWithRoom(detailsToShare);
            }

            setIsLoadingProblem(false);
            return;
          }
        } catch (directApiError) {
          console.log("Direct problem API call failed:", directApiError);
          // Continue to try other fetch methods
        } // Try the second approach: Fetch directly from user's syllabus
        try {
          console.log("Trying to fetch from user's syllabus...");
          const userId = localStorage.getItem("userId");

          if (!userId) {
            console.error("No user ID found in local storage");
            throw new Error("User ID not available");
          }
          // Get user's whole syllabus and extract the problem
          const syllabusResponse = await safeApiGet(`/syllabus/${userId}`);

          if (!syllabusResponse.data || !syllabusResponse.data.success) {
            throw new Error("Failed to fetch syllabus");
          }

          console.log("Syllabus data fetched, looking for study day:", dayId);

          // Find the specific study day
          const syllabus = syllabusResponse.data.data;
          const studyDay = syllabus.studyDays.find((day) => day._id === dayId);

          if (!studyDay) {
            console.error("Study day not found in syllabus:", dayId);
            throw new Error("Study day not found");
          }

          console.log("Study day found, problems:", studyDay.problems.length);
          console.log("Looking for problem ID:", problemId);

          // Find the specific problem in the study day
          const problem = studyDay.problems.find(
            (p) =>
              String(p._id) === String(problemId) ||
              String(p.id) === String(problemId)
          );

          if (!problem) {
            console.error("Problem not found in study day");
            throw new Error("Problem not found in study day");
          }

          console.log("Problem found in syllabus:", problem);

          // Validate and use the problem data
          const updatedProblemDetails = {
            title:
              problem.title || extractTitleFromUrl(problemLink) || "Problem",
            difficulty:
              problem.difficulty || location.state?.difficulty || "Medium",
            platform: problem.platform || location.state?.platform || "Unknown",
            url: problem.url || problemLink || "",
            status: problem.status || "unsolved",
          };

          console.log(
            "Using problem details from syllabus:",
            updatedProblemDetails
          );

          setProblemDetails(updatedProblemDetails);
          setProblemStatus(problem.status || "unsolved");
          setProblemExists(true); // Share with other users if we're the room creator
          if (isRoomCreator && roomData.inRoom && socket.connected) {
            // Include the current dayId and problemId when sharing
            const detailsToShare = {
              ...updatedProblemDetails,
              _dayId: dayId,
              _problemId: problemId,
            };

            shareProblemDetailsWithRoom(detailsToShare);
          }

          setIsLoadingProblem(false);
          return;
        } catch (syllabusError) {
          console.error("Error fetching from syllabus:", syllabusError);

          // Third approach: Try the syllabusApiUtils as the final resort
          try {
            console.log("Final attempt: Using syllabusApiUtils...");
            const { fetchStudyDay } = await import("../utils/syllabusApiUtils");
            const studyDayResponse = await fetchStudyDay(dayId);

            if (!studyDayResponse.success) {
              throw new Error(
                `Failed to fetch study day: ${studyDayResponse.message}`
              );
            }

            // Parse response data
            const data = studyDayResponse.data;
            console.log("Study day data from utils:", data);

            if (data && Array.isArray(data.problems)) {
              // Find the specific problem in the study day's problems array
              const problem = data.problems.find(
                (p) =>
                  String(p._id) === String(problemId) ||
                  String(p.id) === String(problemId)
              );

              if (problem) {
                console.log("Problem data found in utils response:", problem);

                // Create consistent problem details
                const updatedProblemDetails = {
                  title: problem.title || "Problem",
                  difficulty: problem.difficulty || "Medium",
                  platform: problem.platform || "Unknown",
                  url: problem.url || "",
                  status: problem.status || "unsolved",
                };

                setProblemDetails(updatedProblemDetails);
                setProblemStatus(updatedProblemDetails.status);
                setProblemExists(true);
                if (isRoomCreator && roomData.inRoom && socket.connected) {
                  // Include the current dayId and problemId when sharing
                  const detailsToShare = {
                    ...updatedProblemDetails,
                    _dayId: dayId,
                    _problemId: problemId,
                  };

                  shareProblemDetailsWithRoom(detailsToShare);
                }

                setIsLoadingProblem(false);
                return;
              }
            }

            // If we reach here, we couldn't get the problem details
            throw new Error("Problem not found in study day data");
          } catch (utilsError) {
            console.error("All fetch attempts failed:", utilsError);
            useFallbackProblemDetails();
          }
        }
      } else if (problemLink) {
        console.log("Using problem link only:", problemLink);
        // Try to detect platform from the URL
        const detectedPlatform = detectPlatformFromUrl(problemLink);

        // If we only have the problem link but no details, use best-effort data
        const linkBasedDetails = {
          title:
            location.state?.problemTitle ||
            extractTitleFromUrl(problemLink) ||
            "Problem",
          difficulty: location.state?.difficulty || "Medium",
          platform: location.state?.platform || detectedPlatform || "Unknown",
          url: problemLink || "",
          status: location.state?.status || "unsolved",
        };

        setProblemDetails(linkBasedDetails);
        setProblemExists(!!problemLink);
        setProblemStatus(location.state?.status || "unsolved");

        // Share these link-based details if we're the creator
        if (isRoomCreator && !hasSharedProblemDetails && roomData.inRoom) {
          shareProblemDetailsWithRoom(linkBasedDetails);
        }
      } else {
        console.log("No problem ID or link available");
        // No problem ID or link, set default values
        const defaultDetails = {
          title: "No Problem Selected",
          difficulty: "Medium",
          platform: "Unknown",
          url: "",
          status: "unsolved",
        };

        setProblemDetails(defaultDetails);
        setProblemExists(false);

        // Share these default details as well if we're the creator
        if (isRoomCreator && !hasSharedProblemDetails && roomData.inRoom) {
          shareProblemDetailsWithRoom(defaultDetails);
        }
      }
    } catch (error) {
      console.error("Error fetching problem details:", error);
      setProblemFetchError(error.message || "Failed to load problem details");
      useFallbackProblemDetails();
    } finally {
      setIsLoadingProblem(false);
    }
  };

  // Helper function to use fallback problem details when fetch fails
  const useFallbackProblemDetails = () => {
    const fallbackDetails = {
      title:
        location.state?.problemTitle ||
        extractTitleFromUrl(problemLink) ||
        "Problem",
      difficulty: location.state?.difficulty || "Medium",
      platform: location.state?.platform || "Unknown",
      url: problemLink || "",
      status: location.state?.status || "unsolved",
    };

    setProblemDetails(fallbackDetails);
    setProblemFetchError("Problem data unavailable or incomplete");
    setProblemExists(!!problemLink);
    setProblemStatus(location.state?.status || "unsolved");

    // Share fallback details with the room if we're the creator
    if (isRoomCreator && !hasSharedProblemDetails && roomData.inRoom) {
      shareProblemDetailsWithRoom(fallbackDetails);
    }
  }; // Load problem details when component mounts or when IDs change
  useEffect(() => {
    // Skip fetching if we already have received problem details from socket
    // and we're not the room creator (avoid overriding shared details)
    if (problemDetailsReceived && !isRoomCreator) {
      console.log(
        "Skipping problem fetch - already received details from room creator"
      );
      setIsLoadingProblem(false);
      return;
    }

    if (dayId && problemId) {
      console.log(
        `Ready to fetch problem details - dayId: ${dayId}, problemId: ${problemId}`
      );
      fetchProblemDetails();
    } else if (problemLink) {
      console.log("Only have problem link, will try to fetch:", problemLink);
      fetchProblemDetails();
    } else {
      console.log(
        "Missing required IDs for problem fetch. dayId:",
        dayId,
        "problemId:",
        problemId
      );
      // If we're the creator, make it clear to guests that no problem is selected yet
      if (isRoomCreator && roomData.inRoom && socket.connected) {
        const defaultDetails = {
          title: "No Problem Selected",
          difficulty: "Medium",
          platform: "Unknown",
          url: "",
          status: "unsolved",
        };

        // Share these details with the room to inform guests
        shareProblemDetailsWithRoom(defaultDetails);
      }
    }
  }, [dayId, problemId, problemLink, problemDetailsReceived, isRoomCreator]);

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

      // Share status update with room participants
      if (socket.connected && roomData.inRoom && roomData.roomId) {
        console.log("Sharing status update with room:", statusToApply);
        socket.emit("share-problem-status", {
          roomId: roomData.roomId,
          status: statusToApply,
          dayId,
          problemId,
          problemTitle: problemDetails.title,
        });
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
        toast("Code copied to clipboard!");
      })
      .catch((err) => {
        console.error("Could not copy code: ", err);
      });
  };

  const handleLanguageChange = (newLang) => {
    if (code.trim()) {
      setPendingLanguage(newLang);
      setShowConfirmDialog(true);
      return;
    }

    // If no code or user confirmed, proceed with language change
    setLanguage(newLang);
    setCode(boilerplates[newLang]);
  };

  // Function to handle confirmation dialog result
  const handleConfirmLanguageChange = (confirmed) => {
    setShowConfirmDialog(false);

    if (confirmed && pendingLanguage) {
      setLanguage(pendingLanguage);
      setCode(boilerplates[pendingLanguage]);
    }

    setPendingLanguage(null);
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

      // Special notification for room creator joining
      const isCreatorJoining = data.isCreator === true;

      // Add system notification
      const joinMessage = {
        id: `join-${Date.now()}`,
        user: "System",
        text: isCreatorJoining
          ? `${data.username} (room creator) joined the room. Problem details should be available soon.`
          : `${data.username} joined the room`,
        timestamp: new Date(),
        type: "system",
      };

      setChatMessages((prev) => {
        const updated = [...prev, joinMessage];
        saveCollabMessages(roomData.roomId, updated);
        return updated;
      });

      // If creator joined, automatically request problem details after a short delay
      if (
        isCreatorJoining &&
        !isRoomCreator &&
        roomData.roomId &&
        socket.connected
      ) {
        setTimeout(() => {
          console.log("Room creator joined - requesting problem details");
          socket.emit("request-problem-details", {
            roomId: roomData.roomId,
          });
        }, 1000);
      }
    };

    socket.on("user-joined", handleUserJoined);
    socket.on("user_joined", handleUserJoined);

    return () => {
      socket.off("user-joined", handleUserJoined);
      socket.off("user_joined", handleUserJoined);
    };
  }, [socket.connected, roomData.inRoom, roomData.roomId, userName]); // Listen for problem status updates from other participants
  useEffect(() => {
    if (!socket.connected || !roomData.inRoom) {
      return;
    }

    const handleProblemStatus = (data) => {
      console.log("Received problem status update:", data);

      if (!data || !data.status || !data.problemId) {
        console.warn("Received invalid problem status update");
        return;
      }

      // Skip if this is our own update (already applied locally)
      if (data.fromSocketId === socket.id) {
        console.log("Skipping our own status update");
        return;
      }

      // Only apply if it matches our current problem
      if (problemId && data.problemId === problemId) {
        console.log(`Updating local problem status to: ${data.status}`);

        // Update status in state
        setProblemStatus(data.status);

        // Update UI state
        if (data.status === "solved") {
          setIsSolved(true);
          setIsSavedForLater(false);
        } else if (data.status === "solveLater") {
          setIsSavedForLater(true);
          setIsSolved(false);
        } else {
          setIsSolved(false);
          setIsSavedForLater(false);
        }
        // Update local storage for persistence
        localStorage.setItem(`problem_status_${problemId}`, data.status);

        // Problem status update messages removed as requested by user
        // The status will still be updated in the UI but no message will be shown in chat
      }
    };

    socket.on("problem-status-update", handleProblemStatus);

    return () => {
      socket.off("problem-status-update", handleProblemStatus);
    };
  }, [socket.connected, roomData.inRoom, problemId]);

  // Listen for problem details shared by room creator
  useEffect(() => {
    if (!socket.connected || !roomData.inRoom) {
      return;
    }
    const handleProblemDetails = (data) => {
      console.log("Received problem details from room:", data);

      if (!data || !data.problemDetails) {
        console.warn("Received invalid problem details");
        return;
      }

      // Validate that we got real problem details, not placeholder data
      const receivedDetails = data.problemDetails;

      // Enhanced validation to check if data is meaningful
      const isValidData = validateProblemData(receivedDetails);

      // Secondary check for any usable details
      const hasUsableDetails =
        receivedDetails.title &&
        receivedDetails.title.trim() !== "" &&
        receivedDetails.title !== "Loading Problem..." &&
        receivedDetails.title !== "No Problem Selected" &&
        receivedDetails.title !== "LeetCode Problem" &&
        receivedDetails.title !== "Problem" &&
        receivedDetails.title !== "Untitled Problem" &&
        receivedDetails.title !== "Coding Problem";

      // Check if we have dayId and problemId in the data
      const hasValidIds =
        data.dayId &&
        data.problemId &&
        data.dayId !== "undefined" &&
        data.dayId !== "null" &&
        data.problemId !== "undefined" &&
        data.problemId !== "null";

      // Log validation results for debugging
      console.log("Problem data validation results:", {
        isValidData,
        hasUsableDetails,
        hasValidIds,
        title: receivedDetails.title,
        dayId: data.dayId,
        problemId: data.problemId,
      });

      // Special case: if we have valid IDs, accept the data even with placeholder title
      const shouldAcceptData = isValidData || hasUsableDetails || hasValidIds;

      if (!shouldAcceptData) {
        console.warn(
          "Received problem details contain only placeholder data without valid IDs:",
          receivedDetails
        );

        // If we already have better details, don't replace them
        const currentDetailsValid =
          problemDetails.title &&
          problemDetails.title.trim() !== "" &&
          problemDetails.title !== "Loading Problem..." &&
          problemDetails.title !== "No Problem Selected" &&
          problemDetails.title !== "LeetCode Problem" &&
          problemDetails.title !== "Problem" &&
          problemDetails.title !== "Untitled Problem" &&
          problemDetails.title !== "Coding Problem";

        if (currentDetailsValid) {
          console.log(
            "Keeping existing problem details which seem better than received ones"
          );
          return;
        }
      }

      // Update problem IDs if available - ALWAYS capture IDs when provided
      if (data.dayId && data.dayId !== "undefined" && data.dayId !== "null") {
        setDayId(data.dayId);
        // Also store in localStorage for persistence across refreshes
        localStorage.setItem("current_collab_day_id", data.dayId);
        console.log("Updated dayId from received data:", data.dayId);
      }

      if (
        data.problemId &&
        data.problemId !== "undefined" &&
        data.problemId !== "null"
      ) {
        setProblemId(data.problemId);
        // Also store in localStorage for persistence across refreshes
        localStorage.setItem("current_collab_problem_id", data.problemId);
        console.log("Updated problemId from received data:", data.problemId);
      }

      console.log(
        "Updating problem details from received data:",
        receivedDetails
      );

      // Update problem details - ensure we don't lose information
      setProblemDetails((prev) => {
        // Enhanced title comparison - prefer meaningful titles
        const titleIsPlaceholder =
          !receivedDetails.title ||
          receivedDetails.title === "LeetCode Problem" ||
          receivedDetails.title === "Problem" ||
          receivedDetails.title === "Loading Problem..." ||
          receivedDetails.title === "No Problem Selected" ||
          receivedDetails.title === "Untitled Problem" ||
          receivedDetails.title === "Coding Problem" ||
          receivedDetails.title.trim() === "";

        const prevTitleIsPlaceholder =
          !prev.title ||
          prev.title === "LeetCode Problem" ||
          prev.title === "Problem" ||
          prev.title === "Loading Problem..." ||
          prev.title === "No Problem Selected" ||
          prev.title === "Untitled Problem" ||
          prev.title === "Coding Problem" ||
          prev.title.trim() === "";

        // Choose better title - only use received if it's not a placeholder or previous is a placeholder
        const betterTitle =
          !titleIsPlaceholder || (titleIsPlaceholder && prevTitleIsPlaceholder)
            ? receivedDetails.title
            : prev.title;

        // Similar logic for difficulty
        const difficultyIsPlaceholder =
          !receivedDetails.difficulty ||
          receivedDetails.difficulty === "Unknown" ||
          receivedDetails.difficulty === "Medium";

        const prevDifficultyIsPlaceholder =
          !prev.difficulty ||
          prev.difficulty === "Unknown" ||
          prev.difficulty === "Medium";

        const betterDifficulty =
          !difficultyIsPlaceholder ||
          (difficultyIsPlaceholder && prevDifficultyIsPlaceholder)
            ? receivedDetails.difficulty
            : prev.difficulty;

        // Similar logic for platform
        const platformIsPlaceholder =
          !receivedDetails.platform || receivedDetails.platform === "Unknown";

        const prevPlatformIsPlaceholder =
          !prev.platform || prev.platform === "Unknown";

        const betterPlatform =
          !platformIsPlaceholder ||
          (platformIsPlaceholder && prevPlatformIsPlaceholder)
            ? receivedDetails.platform
            : prev.platform;

        // Always take URL from received details if it exists
        const betterUrl = receivedDetails.url || prev.url || "";

        // Combine best values from both sources
        const bestDetails = {
          title: betterTitle || prev.title,
          difficulty: betterDifficulty || prev.difficulty,
          platform: betterPlatform || prev.platform,
          url: betterUrl,
          status: receivedDetails.status || prev.status || "unsolved",
        };

        console.log("Updated problem details with best values:", bestDetails);

        return bestDetails;
      });

      if (receivedDetails.status) {
        setProblemStatus(receivedDetails.status);

        // Update status flags for UI consistency
        if (receivedDetails.status === "solved") {
          setIsSolved(true);
          setIsSavedForLater(false);
        } else if (receivedDetails.status === "solveLater") {
          setIsSavedForLater(true);
          setIsSolved(false);
        } else {
          setIsSolved(false);
          setIsSavedForLater(false);
        }
      }
      // Set flag that we've received details
      setProblemDetailsReceived(true);

      // Problem details sharing messages removed as requested by user
      // We still track that we received details, but don't show a message in chat
    };
    const handleRequestProblemDetails = (data) => {
      console.log("Received request for problem details:", data);

      // Only respond if we're the room creator
      if (isRoomCreator) {
        // Always share what we have if we have dayId and problemId - those are reliable identifiers
        const hasProblemIds = dayId && problemId;

        // Check if we have valid details in addition to IDs
        const hasValidDetails =
          problemDetails.title &&
          problemDetails.title !== "Loading Problem..." &&
          problemDetails.title !== "No Problem Selected" &&
          problemDetails.title !== "LeetCode Problem" &&
          problemDetails.title !== "Problem" &&
          problemDetails.title !== "Untitled Problem" &&
          problemDetails.title !== "Coding Problem";

        if (hasValidDetails || hasProblemIds) {
          console.log("Responding to problem details request with:", {
            details: problemDetails,
            dayId: dayId,
            problemId: problemId,
            hasValidDetails,
            hasProblemIds,
          });

          // Always share what we have, even if it's just the IDs
          shareProblemDetailsWithRoom(problemDetails);
        } else {
          console.log(
            "Cannot share problem details - no valid problem selected and no IDs available"
          );

          // We're not showing problem details request messages in chat anymore
          // Just log the event for debugging purposes
        }
      }
    };

    socket.on("problem-details", handleProblemDetails);
    socket.on("request-problem-details", handleRequestProblemDetails); // Request problem details if we're just joining and not the creator
    if (!isRoomCreator && roomData.roomId) {
      // Implement a staggered request strategy with increasing intervals
      const requestDetails = () => {
        // Only request if we haven't received details yet
        if (!problemDetailsReceived) {
          console.log("Requesting problem details from room creator");
          socket.emit("request-problem-details", {
            roomId: roomData.roomId,
            silent: true,
          });
        }
      };

      // First request is immediate
      requestDetails();

      // Second request after 2 seconds if needed
      const firstRetryTimeout = setTimeout(() => {
        if (!problemDetailsReceived) {
          console.log("Retry #1: Requesting problem details");
          socket.emit("request-problem-details", {
            roomId: roomData.roomId,
            silent: false, // Show UI notification on second attempt
          });
        }
      }, 2000);

      // Return cleanup function
      return () => {
        clearTimeout(firstRetryTimeout);
      };
    }

    return () => {
      socket.off("problem-details", handleProblemDetails);
      socket.off("request-problem-details", handleRequestProblemDetails);
    };
  }, [socket.connected, roomData.inRoom, roomData.roomId, isRoomCreator]); // Join the socket room
  const joinRoom = () => {
    if (!socket.connected || !roomData.inRoom) return;

    const roomId = roomData.roomId;
    console.log(
      `Joining socket room with ID: ${roomId} as ${
        isRoomCreator ? "creator" : "guest"
      }`
    );

    // Include more context in the join event, including problem IDs if available
    const joinData = {
      roomId,
      username: userName,
      isCreator: isRoomCreator,
      timestamp: Date.now(),
      // Include problem context for more robust synchronization
      problemContext: {
        dayId: dayId,
        problemId: problemId,
        hasProblemData:
          problemDetails.title !== "Loading Problem..." &&
          problemDetails.title !== "No Problem Selected",
      },
    };

    socket.emit("join-room", joinData);

    // Also emit with underscore format for compatibility
    socket.emit("join_room", joinData);

    setIsConnected(true);

    // Add join handling based on creator status
    if (isRoomCreator) {
      console.log(
        "Joining as room creator, will share problem details if available"
      );

      // Always share problem details on join - either having the IDs or having actual details is useful
      const hasValidDetailsOrIds =
        (problemDetails.title &&
          problemDetails.title !== "Loading Problem..." &&
          problemDetails.title !== "No Problem Selected") ||
        (dayId && problemId);

      if (hasValidDetailsOrIds) {
        console.log("Will share problem details with room:", {
          details: problemDetails,
          dayId,
          problemId,
          hasValidTitle:
            problemDetails.title &&
            problemDetails.title !== "Loading Problem..." &&
            problemDetails.title !== "No Problem Selected",
          hasIds: !!(dayId && problemId),
        });

        // Short delay to ensure connection is established
        setTimeout(() => {
          shareProblemDetailsWithRoom(problemDetails);
        }, 500);
      } else {
        console.log(
          "No problem details or IDs available yet, will share when loaded"
        );
        // We'll share details once they're fetched in fetchProblemDetails
      }
    } else {
      console.log("Joining as guest, will request problem details");
      // We'll request details in the problem-details socket listener effect

      // Add immediate silent request to speed up synchronization
      setTimeout(() => {
        socket.emit("request-problem-details", {
          roomId: roomData.roomId,
          silent: true,
        });
      }, 1000);
    }
  };
  // Function to validate problem details consistency
  const verifyProblemDetailsIntegrity = () => {
    // Only run this check if we're in a room and have problem IDs
    if (!roomData.inRoom || !dayId || !problemId) {
      console.log(
        "Skipping problem details integrity check - not enough context"
      );
      return;
    }

    console.log("Verifying problem details integrity");

    // Check if we have valid title data
    const hasValidTitle =
      problemDetails.title &&
      problemDetails.title !== "LeetCode Problem" &&
      problemDetails.title !== "Problem" &&
      problemDetails.title !== "Loading Problem..." &&
      problemDetails.title !== "No Problem Selected" &&
      problemDetails.title !== "Coding Problem" &&
      problemDetails.title !== "Untitled Problem";

    // For guests, if we don't have proper details after 5 seconds,
    // request them again from the room creator
    if (!isRoomCreator && !hasValidTitle) {
      console.log(
        "Problem details might be incomplete, requesting again from creator"
      );

      setTimeout(() => {
        if (socket.connected && roomData.roomId) {
          socket.emit("request-problem-details", {
            roomId: roomData.roomId,
            silent: false,
          });
        }
      }, 500);
    }

    // For creators, ensure we're sharing details
    if (isRoomCreator && roomData.inRoom) {
      console.log("Verifying that problem details were shared as room creator");

      // If we have at least a day ID and problem ID, share what we have
      if (dayId && problemId) {
        const detailsToShare = {
          ...problemDetails,
          _dayId: dayId,
          _problemId: problemId,
        };

        // Use setTimeout to ensure this happens after initial join
        setTimeout(() => {
          shareProblemDetailsWithRoom(detailsToShare);
        }, 1000);
      }
    }
  };

  // Join room when roomData changes
  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    if (roomData.inRoom && roomData.roomId) {
      joinRoom();

      // Verify problem details integrity after joining
      setTimeout(verifyProblemDetailsIntegrity, 3000);
    }
  }, [roomData.inRoom, roomData.roomId, socket.connected, dayId, problemId]);

  // Clean up problem details when navigating away
  useEffect(() => {
    return () => {
      // Clear the problem IDs from localStorage when component unmounts
      localStorage.removeItem("current_collab_problem_id");
      localStorage.removeItem("current_collab_day_id");
      console.log("Cleared problem details on navigation away from Collab Room");
    };
  }, []);

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
        // Update problem details to include new status
        setProblemDetails((prev) => ({ ...prev, status: newStatus }));

        // Update status state variable for direct access
        setProblemStatus(newStatus);

        // Update UI state for buttons
        if (newStatus === "solved") {
          setIsSolved(true);
          setIsSavedForLater(false);
          showSolvedSuccessMessage();
        } else if (newStatus === "solveLater") {
          setIsSolved(false);
          setIsSavedForLater(true);
          showBookmarkedSuccessMessage();
        } else {
          // Handle unsolved state
          setIsSolved(false);
          setIsSavedForLater(false);
        }

        // Persist the status in localStorage by problem ID
        localStorage.setItem(`problem_status_${problemId}`, newStatus);
      } else {
        console.error("Failed to update problem status:", result.message);
        setStatusUpdateError(result.message);
        setTimeout(() => setStatusUpdateError(null), 3000);

        // Implement a retry mechanism
        if (!result.retried) {
          console.log("Retrying status update after failure");
          setTimeout(() => {
            handleUpdateProblemStatus(newStatus);
          }, 2000);
          return;
        }
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
  }; // Helper function to validate problem details
  const validateProblemData = (problem) => {
    // More thorough validation to prevent placeholder/default data
    return (
      problem &&
      typeof problem === "object" &&
      problem.title &&
      typeof problem.title === "string" &&
      // Make sure we're not just getting placeholder data
      problem.title !== "LeetCode Problem" &&
      problem.title !== "Problem" &&
      problem.title !== "Loading Problem..." &&
      problem.title !== "Untitled Problem" &&
      problem.title !== "No Problem Selected" &&
      problem.title !== "Coding Problem" &&
      // Additional checks for empty or generic titles
      problem.title.trim() !== "" &&
      problem.title.toLowerCase() !== "untitled" &&
      problem.title.toLowerCase() !== "unknown"
    );
  }; // Function to share problem details with room
  const shareProblemDetailsWithRoom = (details) => {
    if (!socket.connected || !roomData.inRoom) {
      console.log(
        "Cannot share problem details: socket not connected or not in room"
      );
      return;
    }

    if (!details) {
      console.warn("Cannot share undefined problem details");
      return;
    }

    // Validate the problem details object before sending
    if (typeof details !== "object") {
      console.warn("Problem details must be an object");
      return;
    }

    // Enhanced validation to prevent sharing placeholder data
    const placeholderTitles = [
      "LeetCode Problem",
      "Problem",
      "Loading Problem...",
      "No Problem Selected",
      "Untitled Problem",
      "Coding Problem",
    ];

    const isPurelyPlaceholder =
      placeholderTitles.includes(details.title) ||
      !details.title ||
      details.title.trim() === "" ||
      details.title.toLowerCase() === "untitled" ||
      details.title.toLowerCase() === "unknown";

    if (isPurelyPlaceholder && !dayId && !problemId) {
      console.warn(
        "Not sharing placeholder problem details without IDs:",
        details.title
      );

      // If this is a deliberate share attempt (not automatic), show warning to room creator
      const isInitialShare = !hasSharedProblemDetails;
      if (isInitialShare) {
        const warningMessage = {
          id: `warning-${Date.now()}`,
          user: "System",
          text: `Unable to share problem details: the problem title "${
            details.title || "Unknown"
          }" appears to be a placeholder. Please select a valid problem from the syllabus before sharing.`,
          timestamp: new Date(),
          type: "warning",
        };

        setChatMessages((prev) => {
          const updated = [...prev, warningMessage];
          saveCollabMessages(roomData.roomId, updated);
          return updated;
        });
      }

      return;
    }

    // Only perform this check if we don't have dayId and problemId
    // If we have IDs, the problem is properly selected from syllabus
    if (!dayId && !problemId) {
      // Avoid sharing if all fields are default/placeholder values
      const hasAllPlaceholderValues =
        (details.difficulty === "Unknown" || details.difficulty === "Medium") &&
        details.platform === "Unknown" &&
        (!details.url || details.url === "");

      if (hasAllPlaceholderValues) {
        console.warn("Not sharing details with all placeholder values");
        return;
      }
    }

    // Check if we've shared recently to avoid duplicate shares
    const lastSharedTime = sessionStorage.getItem(
      `last_shared_details_${roomData.roomId}`
    );
    const now = Date.now();

    if (lastSharedTime && now - parseInt(lastSharedTime) < 5000) {
      // 5 seconds
      console.log("Skipping share, already shared recently");
      return;
    }

    console.log("Sharing problem details with room:", details);

    // Ensure we have valid data with defaults for missing values
    const detailsToShare = {
      ...details,
      title: details.title,
      difficulty: details.difficulty || "Medium",
      platform: details.platform || "Unknown",
      url: details.url || "",
      status: details.status || "unsolved",
    };

    // Update last shared timestamp
    sessionStorage.setItem(
      `last_shared_details_${roomData.roomId}`,
      now.toString()
    );

    // Always use the current IDs from state - this ensures we're sharing the most up-to-date info
    const currentProblemId =
      problemId || localStorage.getItem("current_collab_problem_id");
    const currentDayId = dayId || localStorage.getItem("current_collab_day_id");

    // Log what we're sharing
    console.log("Sharing problem details with roomId:", roomData.roomId, {
      details: detailsToShare,
      dayId: currentDayId,
      problemId: currentProblemId,
    });

    socket.emit("share-problem-details", {
      roomId: roomData.roomId,
      problemDetails: detailsToShare,
      dayId: currentDayId,
      problemId: currentProblemId,
      userId: localStorage.getItem("userId"),
    });
    setHasSharedProblemDetails(true);

    // Problem details sharing messages removed as requested by user
    // We still need to set the flag but won't add a chat message about it
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
    }  }, [problemDetails.url, problemDetails.title]); 
  
  // Helper function to check if a title is a placeholder
  const hasPlaceholderTitle = (title) => {
    return !title || 
      title === "LeetCode Problem" ||
      title === "Problem" ||
      title === "Loading Problem..." ||
      title === "No Problem Selected" ||
      title === "Untitled Problem" ||
      title === "Coding Problem" ||
      title.trim() === "";
  };

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
            {problemDetails.title &&
            problemDetails.title !== "LeetCode Problem" &&
            problemDetails.title !== "Problem" &&
            problemDetails.title !== "Loading Problem..." &&
            problemDetails.title !== "No Problem Selected"
              ? problemDetails.title
              : "Problem Details"}
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
      // Check if title is a placeholder value
      const hasPlaceholderTitle =
        !problemDetails.title ||
        problemDetails.title === "LeetCode Problem" ||
        problemDetails.title === "Problem" ||
        problemDetails.title === "Loading Problem..." ||
        problemDetails.title === "No Problem Selected" ||
        problemDetails.title === "Untitled Problem" ||
        problemDetails.title === "Coding Problem" ||
        problemDetails.title.trim() === "";

      if (hasPlaceholderTitle) {
        // For both creator and guest, show a simple coding problem title
        // This avoids the "waiting for details" text that might confuse users
        return (
          <div className="flex items-center">
            <span className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1 text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Coding Problem
            </span>
            {isRoomCreator && (
              <span className="ml-2 text-xs text-amber-400 bg-amber-900/30 px-2 py-1 rounded border border-amber-500/30 flex items-center">
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                {dayId && problemId
                  ? "Loading problem details..."
                  : "Select a problem from syllabus"}
              </span>
            )}
          </div>
        );
      }

      // Return actual problem title if available
      return problemDetails.title;
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#334155] to-[#0f172a] text-white">
      <Navbar />      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-[#94C3D2] bg-clip-text text-transparent">
            Code Collaboration Room
          </h1>
        </div>          {/* Problem Information Card with status buttons integrated - only display if a valid problem is selected from syllabus */}
        {(dayId && problemId && !hasPlaceholderTitle(problemDetails.title)) && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                {/* Display actual problem title, not "Problem" */}{" "}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <h2 className="text-xl font-medium text-white/95">
                    {renderProblemDetails()}
                  </h2>
                </div>
              <div className="mt-3 flex flex-wrap gap-3">
                {" "}
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    problemDetails.difficulty === "Unknown"
                      ? "bg-gray-700/50 text-gray-300 border border-gray-500/30"
                      : "bg-white/10 text-white/80 border border-white/20"
                  }`}
                >
                  {" "}
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
                      Unknown
                    </span>
                  ) : problemDetails.difficulty === "Medium" ? (
                    <span className="flex items-center">Medium</span>
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
                  {" "}
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
                      Coding Platform
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
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
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
            )}          </div>
        </div>
        )}

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
      </div>{" "}
      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gradient-to-b from-[#1a1a2e]/95 to-[#16213e]/95 backdrop-blur-md text-white/95 p-6 rounded-xl shadow-2xl max-w-md w-full border border-white/10">
            <div className="border-b border-white/10 pb-3 mb-4">
              <h3 className="text-xl font-semibold text-[#94C3D2]">
                Confirm Language Change
              </h3>
            </div>
            <p className="mb-6 text-white/90 leading-relaxed">
              Changing language will reset your current code. Do you want to
              continue?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => handleConfirmLanguageChange(false)}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white/90 border border-white/10 rounded-lg transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmLanguageChange(true)}
                className="px-5 py-2.5 bg-[#94C3D2] hover:bg-[#7EB5C3] text-white rounded-lg transition-all duration-200"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
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
