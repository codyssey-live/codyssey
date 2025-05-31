import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Editor from "@monaco-editor/react";
import { useRoom } from "../context/RoomContext";
import socket from "../socket";
import {
  loadCollabMessages,
  saveCollabMessages,
} from "../utils/collabRoomChatPersistence";

const CollabRoom = () => {
  const location = useLocation();
  const { roomData } = useRoom();
  const editorRef = useRef(null);
  const [problemLink, setProblemLink] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [isConnected, setIsConnected] = useState(false);
  const [userName, setUserName] = useState("User");
  // Reference for scrolling to bottom
  const messagesEndRef = useRef(null);

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
    if (codeText.includes("public class") || codeText.includes("public static void")) return "java";
    if (codeText.includes("#include")) return "cpp";
    return "javascript"; // Default
  };

  // Function to open the code modal
  const openCodeModal = (codeText, lang = null, isFromCurrentUser = true) => {
    // Normalize line endings for consistency
    const formattedCode = codeText
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');
    
    setModalCode(formattedCode);
    setModalLanguage(lang || detectCodeLanguage(formattedCode));
    setIsModalFromCurrentUser(isFromCurrentUser);
    setIsCodeModalOpen(true);
  };

  // Function to copy code from modal
  const copyModalCode = () => {
    navigator.clipboard.writeText(modalCode)
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
      .catch(err => console.error("Could not copy code: ", err));
  };

  useEffect(() => {
    if (location.state && location.state.problemLink) {
      const link = location.state.problemLink;
      setProblemLink(link);

      const solved = localStorage.getItem(`solved_${link}`);
      setIsSolved(solved === "true");

      const savedLater = localStorage.getItem(`savedLater_${link}`);
      setIsSavedForLater(savedLater === "true");
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

  const toggleSolved = () => {
    const newState = !isSolved;
    setIsSolved(newState);
    if (newState) {
      // If marking as solved, ensure it's not saved for later
      setIsSavedForLater(false);
      if (problemLink) localStorage.setItem(`savedLater_${problemLink}`, false);
    }
    if (problemLink) localStorage.setItem(`solved_${problemLink}`, newState);
  };

  const toggleSaveForLater = () => {
    const newState = !isSavedForLater;
    setIsSavedForLater(newState);
    if (newState) {
      // If saving for later, ensure it's not marked as solved
      setIsSolved(false);
      if (problemLink) localStorage.setItem(`solved_${problemLink}`, false);
    }
    if (problemLink)
      localStorage.setItem(`savedLater_${problemLink}`, newState);
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
      source: "collab-room"
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
        source: "collab-room"
      });
      
      // Also emit with underscore format for compatibility
      socket.emit("send_message", {
        roomId: roomData.roomId,
        message: newMessage, // Use message instead of text for consistency
        username: userName,
        messageId,
        isCode: isCodeMessage,
        source: "collab-room"
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

  // Add this helper function to limit lines rather than characters
  const limitCodeLines = (code, maxLines = 5) => {
    const lines = code.split('\n');
    if (lines.length <= maxLines) return code;
    return lines.slice(0, maxLines).join('\n') + '\n...';
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

        {problemLink && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-md overflow-hidden border border-white/20 mb-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center p-4 gap-4">
              <div>
                <h2 className="text-lg font-medium text-white/95">
                  Problem Link
                </h2>
                <a
                  href={problemLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-300 hover:text-blue-200 transition-colors"
                >
                  {problemLink}
                </a>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={toggleSolved}
                  className={`px-4 py-2 rounded-lg text-white ${
                    isSolved
                      ? "bg-green-600 hover:bg-green-700"
                      : isSavedForLater
                      ? "bg-white/20 cursor-not-allowed opacity-60"
                      : "bg-[#94C3D2] hover:bg-[#7EB5C3]"
                  } transition-colors shadow-md`}
                  disabled={isSavedForLater}
                  title={
                    isSavedForLater
                      ? "Cannot mark as solved when saved for later"
                      : ""
                  }
                >
                  {isSolved ? "✓ Solved" : "Mark as Solved"}
                </button>
                <button
                  onClick={toggleSaveForLater}
                  className={`px-4 py-2 rounded-lg text-white ${
                    isSavedForLater
                      ? "bg-yellow-600 hover:bg-yellow-700"
                      : isSolved
                      ? "bg-white/20 cursor-not-allowed opacity-60"
                      : "bg-[#94C3D2] hover:bg-[#7EB5C3]"
                  } transition-colors shadow-md`}
                  disabled={isSolved}
                  title={
                    isSolved
                      ? "Cannot save for later when marked as solved"
                      : ""
                  }
                >
                  {isSavedForLater ? "★ Saved" : "Save for Later"}
                </button>
                <a
                  href={problemLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#94C3D2] hover:bg-[#7EB5C3] text-white px-5 py-2 rounded-lg transition-colors shadow-md"
                >
                  Open Problem
                </a>
              </div>
            </div>
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
                              <div 
                                className={`rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity ${
                                  isCurrentUser ? "bg-[#94C3D2]/90 text-white" : "bg-yellow-50 text-gray-900"
                                }`}
                                onClick={() => openCodeModal(message.text, null, isCurrentUser)}
                              >
                                <div className={`px-3 py-1 flex items-center justify-between ${
                                  isCurrentUser ? "bg-black/30" : "bg-amber-200/50"
                                }`}>
                                  <span className={`text-xs font-mono ${isCurrentUser ? "" : "text-gray-800"}`}>
                                    {detectCodeLanguage(message.text).toUpperCase()} Code
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
                                    msOverflowStyle: "none", /* IE and Edge */
                                    scrollbarWidth: "none", /* Firefox */
                                  }}
                                >
                                  <code className="inline-block whitespace-nowrap" style={{ minWidth: "max-content" }}>
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
                          if (e.key === 'Tab') {
                            e.preventDefault();
                            const start = e.target.selectionStart;
                            const end = e.target.selectionEnd;
                            const value = e.target.value;
                            setNewMessage(value.substring(0, start) + '  ' + value.substring(end));
                            // Set cursor position after the inserted tab
                            setTimeout(() => {
                              e.target.selectionStart = e.target.selectionEnd = start + 2;
                            }, 0);
                          } else if (e.key === 'Enter' && !e.shiftKey) {
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
                        setNewMessage(''); // Clear message when switching modes
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
          <div className={`${isModalFromCurrentUser ? "bg-gray-900" : "bg-yellow-50"} rounded-xl border ${isModalFromCurrentUser ? "border-gray-700" : "border-amber-200"} w-full max-w-4xl max-h-[95vh] flex flex-col`}>
            <div className={`border-b ${isModalFromCurrentUser ? "border-gray-700" : "border-amber-300"} px-5 py-3 flex justify-between items-center`}>
              <h3 className={`text-lg font-medium ${isModalFromCurrentUser ? "text-gray-900" : "text-gray-900"}`}>
                Code - {modalLanguage.toUpperCase()}
              </h3>
              <div className="flex items-center gap-3">
                <button
                  id="modal-copy-btn"
                  onClick={copyModalCode}
                  className={`px-3 py-1 ${isModalFromCurrentUser ? "bg-[#2d3748] hover:bg-[#3e4c5e] text-white/90" : "bg-amber-200 hover:bg-amber-300 text-gray-900"} text-sm rounded-md transition-colors`}
                >
                  Copy Code
                </button>
                <button
                  onClick={() => setIsCodeModalOpen(false)}
                  className={`${isModalFromCurrentUser ? "text-gray-700 hover:text-gray-900" : "text-gray-700 hover:text-gray-900"}`}
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
              <div className={`h-full ${isModalFromCurrentUser ? "bg-[#1e1e1e]" : "bg-[#1e1e1e]"} rounded-b-xl overflow-hidden`}>
                <div style={{ height: "60vh", minHeight: "400px" }} className="p-1 rounded-b-xl overflow-hidden">
                  <Editor
                    key={`monaco-${Date.now()}`} // Force re-render with unique key
                    value={modalCode}
                    language={getMonacoLanguage(modalLanguage)}
                    theme="vs-dark"
                    beforeMount={(monaco) => {
                      // Configure editor before mounting
                      monaco.editor.defineTheme('modal-theme', {
                        base: 'vs-dark',
                        inherit: true,
                        rules: [],
                        colors: {}
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
