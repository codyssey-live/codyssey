import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Editor from '@monaco-editor/react';

const CollabRoom = () => {
  const location = useLocation();
  const editorRef = useRef(null);
  const [problemLink, setProblemLink] = useState('');
  const [language, setLanguage] = useState('javascript');
  
  const boilerplates = {
    javascript: `// JavaScript Solution\nfunction solution() {\n  // Your code here\n}`,
    python: `# Python Solution\ndef solution():\n    # Your code here\n    pass`,
    java: `// Java Solution\npublic class Solution {\n  public static void main(String[] args) {\n    // Your code here\n  }\n}`,
    cpp: `// C++ Solution\n#include <iostream>\nusing namespace std;\n\nint main() {\n  // Your code here\n  return 0;\n}`
  };
  
  const [code, setCode] = useState(boilerplates.javascript);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isCodeMessage, setIsCodeMessage] = useState(false);
  const [isSolved, setIsSolved] = useState(false);
  const [isSavedForLater, setIsSavedForLater] = useState(false);

  const languages = [
    { id: 'javascript', name: 'JavaScript' },
    { id: 'python', name: 'Python' },
    { id: 'java', name: 'Java' },
    { id: 'cpp', name: 'C++' }
  ];

  useEffect(() => {
    if (location.state && location.state.problemLink) {
      const link = location.state.problemLink;
      setProblemLink(link);

      const solved = localStorage.getItem(`solved_${link}`);
      setIsSolved(solved === 'true');

      const savedLater = localStorage.getItem(`savedLater_${link}`);
      setIsSavedForLater(savedLater === 'true');
    }
    
    setCode(boilerplates[language]);
  }, [location]);

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
    if (problemLink) localStorage.setItem(`savedLater_${problemLink}`, newState);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const newChat = {
      id: Date.now(),
      user: 'You',
      text: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isCode: isCodeMessage
    };
    setChatMessages([...chatMessages, newChat]);
    setNewMessage('');
    setIsCodeMessage(false); // Reset after sending
    
    // Auto scroll to bottom after new message
    setTimeout(() => {
      const chatContainer = document.querySelector('.chat-messages');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 0); // Increased timeout for more reliable scrolling
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
            forceMoveMarkers: true
          }
        ]);
      }
    } catch (err) {
      console.error("Failed to paste code: ", err);
    }
  };

  const copyCode = () => {
    const editorValue = editorRef.current ? editorRef.current.getValue() : code;
    navigator.clipboard.writeText(editorValue).then(() => {
      alert('Code copied to clipboard!');
    }).catch(err => {
      console.error('Could not copy code: ', err);
    });
  };

  const shareRoom = () => {
    const shareLink = `${window.location.origin}/collab-room?id=${Date.now()}`;
    navigator.clipboard.writeText(shareLink).then(() => {
      alert('Room link copied to clipboard!');
    }).catch(err => {
      console.error('Could not copy room link: ', err);
    });
  };

  const handleLanguageChange = (newLang) => {
    if (code.trim() && !window.confirm("Changing language will reset the code. Continue?")) return;
    setLanguage(newLang);
    setCode(boilerplates[newLang]);
  };

  const getMonacoLanguage = (lang) => {
    const mapping = {
      'javascript': 'javascript',
      'python': 'python',
      'java': 'java',
      'cpp': 'cpp'
    };
    return mapping[lang] || 'javascript';
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#334155] to-[#0f172a] text-white">
      <Navbar />
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-[#94C3D2] bg-clip-text text-transparent">Code Collaboration Room</h1>
        </div>

        {problemLink && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-md overflow-hidden border border-white/20 mb-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center p-4 gap-4">
              <div>
                <h2 className="text-lg font-medium text-white/95">Problem Link</h2>
                <a href={problemLink} target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-200 transition-colors">{problemLink}</a>
              </div>
              <div className="flex space-x-3">
                <button 
                  onClick={toggleSolved} 
                  className={`px-4 py-2 rounded-lg text-white ${isSolved ? 'bg-green-600 hover:bg-green-700' : isSavedForLater ? 'bg-white/20 cursor-not-allowed opacity-60' : 'bg-[#94C3D2] hover:bg-[#7EB5C3]'} transition-colors shadow-md`}
                  disabled={isSavedForLater}
                  title={isSavedForLater ? "Cannot mark as solved when saved for later" : ""}
                >
                  {isSolved ? '✓ Solved' : 'Mark as Solved'}
                </button>
                <button 
                  onClick={toggleSaveForLater} 
                  className={`px-4 py-2 rounded-lg text-white ${isSavedForLater ? 'bg-yellow-600 hover:bg-yellow-700' : isSolved ? 'bg-white/20 cursor-not-allowed opacity-60' : 'bg-[#94C3D2] hover:bg-[#7EB5C3]'} transition-colors shadow-md`}
                  disabled={isSolved}
                  title={isSolved ? "Cannot save for later when marked as solved" : ""}
                >
                  {isSavedForLater ? '★ Saved' : 'Save for Later'}
                </button>
                <a href={problemLink} target="_blank" rel="noopener noreferrer" className="bg-[#94C3D2] hover:bg-[#7EB5C3] text-white px-5 py-2 rounded-lg transition-colors shadow-md">Open Problem</a>
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
                  {languages.map(lang => (
                    <option key={lang.id} value={lang.id}>{lang.name}</option>
                  ))}
                </select>
              </div>
              <div className="border-t border-white/20" style={{ height: '500px' }}>
                <Editor
                  height="100%"
                  defaultLanguage={getMonacoLanguage(language)}
                  language={getMonacoLanguage(language)}
                  value={code}
                  onChange={(value) => setCode(value || '')}
                  onMount={handleEditorDidMount}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: true },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    fontFamily: 'JetBrains Mono, Consolas, monospace',
                    wordWrap: 'on',
                    automaticLayout: true,
                    tabSize: 2,
                    renderWhitespace: 'selection',
                    renderControlCharacters: true
                  }}
                />
              </div>
              <div className="p-4 border-t border-white/20 flex justify-end space-x-2">
                <button 
                  onClick={copyCode}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white/95 border border-white/20 rounded-lg transition-colors shadow-sm"
                  title="Copy code"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                <button 
                  onClick={handlePasteCode}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white/95 border border-white/20 rounded-lg transition-colors shadow-sm"
                  title="Paste code"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Chat Section */}
          <div className="lg:w-1/3 flex flex-col h-full">
            <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-md overflow-hidden border border-white/20 flex flex-col" style={{ height: '100%', minHeight: '650px' }}>
              <div className="p-4 border-b border-white/20 flex justify-between items-center">
                <h2 className="font-semibold text-white/95">Discussion</h2>
                <div className="flex items-center">
                  <span className="h-3 w-3 rounded-full mr-2 bg-green-500"></span>
                  <span className="text-sm text-white/80">Connected</span>
                </div>
              </div>
              
              <div className="flex-1 p-4 space-y-4 bg-white/5 overflow-y-auto chat-messages" style={{ minHeight: "500px" }}>
                {chatMessages.length === 0 ? (
                  <div className="text-center text-gray-400 mt-8">
                    <p>No messages yet</p>
                    <p className="text-sm mt-1">Start the discussion!</p>
                  </div>
                ) : (
                  chatMessages.map(message => (
                    <div key={message.id} className={`flex items-start space-x-3 ${message.user === 'You' ? 'justify-end ml-12' : 'mr-12'}`}>
                      {message.user !== 'You' && (
                        <div className="flex-shrink-0">
                          <span className="h-8 w-8 rounded-full bg-[#94C3D2] flex items-center justify-center text-white font-bold">
                            {message.user.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="flex flex-col">
                        <div className={`flex items-center ${message.user === 'You' ? 'justify-end' : ''}`}>
                          <span className={`font-medium ${message.user === 'You' ? 'text-white/90' : 'text-white/90'}`}>{message.user}</span>
                          <span className="text-xs text-white/60 ml-2">{message.timestamp}</span>
                        </div>
                        {message.isCode ? (
                          <pre className={`p-3 rounded-lg text-sm bg-black font-mono overflow-x-auto whitespace-pre-wrap ${message.user === 'You' ? 'rounded-tr-none' : 'rounded-tl-none'}`} style={{color: '#f8f8f2'}}>
                            <code style={{color: '#f8f8f2'}}>{message.text}</code>
                          </pre>
                        ) : (
                          <p className={`p-3 rounded-lg text-sm ${message.user === 'You' ? 'bg-[#94C3D2] text-white rounded-tr-none' : 'bg-white/10 text-white/90 rounded-tl-none border border-white/20'}`}>
                            {message.text}
                          </p>
                        )}
                      </div>
                      {message.user === 'You' && (
                        <div className="flex-shrink-0">
                          <span className="h-8 w-8 rounded-full bg-[#94C3D2] flex items-center justify-center text-white font-bold">
                            {message.user.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
              <div className="p-4 border-t border-white/20">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <div className="flex-1 flex items-center bg-[#2d3748] border border-white/20 rounded-lg overflow-hidden">
                    <input
                      type="text"
                      placeholder={isCodeMessage ? "Type your code here..." : "Type message..."}
                      className="flex-1 px-4 py-2.5 bg-transparent text-white placeholder-gray-400 outline-none focus:ring-[#94C3D2] focus:border-[#94C3D2] border-none"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setIsCodeMessage(!isCodeMessage)}
                      className={`px-2 mx-2 ${isCodeMessage ? 'text-[#94C3D2]' : 'text-white/95'} hover:text-[#94C3D2] transition-colors`}
                      title={isCodeMessage ? "Switch to regular message" : "Switch to code message"}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
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
