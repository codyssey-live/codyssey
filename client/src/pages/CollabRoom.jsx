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
  const [notes, setNotes] = useState('');
  const [savedNotes, setSavedNotes] = useState([]);
  const [showNotesModal, setShowNotesModal] = useState(false);
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

      const notesFromStorage = localStorage.getItem(`notes_${link}`);
      if (notesFromStorage) setSavedNotes(JSON.parse(notesFromStorage));

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
      const chatContainer = document.querySelector('.flex-1.overflow-y-auto');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 0);
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

  const saveNote = () => {
    if (!notes.trim()) {
      alert('Please add some notes before saving.');
      return;
    }
    
    if (!problemLink) {
      alert('No problem link found. Please select a problem from the Syllabus page first.');
      return;
    }
    
    const newNote = {
      id: Date.now(),
      text: notes,
      date: new Date().toISOString()
    };
    
    const updatedNotes = [...savedNotes, newNote];
    setSavedNotes(updatedNotes);
    
    try {
      localStorage.setItem(`notes_${problemLink}`, JSON.stringify(updatedNotes));
      alert('Note saved successfully!');
      setNotes('');
    } catch (error) {
      console.error("Error saving note:", error);
      alert('Failed to save note. Please try again.');
    }
  };

  const deleteNote = (noteId) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      const updatedNotes = savedNotes.filter(note => note.id !== noteId);
      setSavedNotes(updatedNotes);
      localStorage.setItem(`notes_${problemLink}`, JSON.stringify(updatedNotes));
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const handlePasteMessage = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setNewMessage(text);
    } catch (err) {
      console.error("Failed to read clipboard: ", err);
    }
  };

  const handlePasteNotes = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setNotes(text);
    } catch (err) {
      console.error("Failed to read clipboard: ", err);
    }
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
    <div className="min-h-screen bg-[#E8F1F7] text-gray-800">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Code Collaboration Room</h1>
        </div>

        {problemLink && (
          <div className="bg-[#dbeafe] rounded-lg p-4 mb-6 border border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-medium text-gray-800">Problem Link</h2>
                <a href={problemLink} target="_blank" rel="noopener noreferrer" className="text-blue-600">{problemLink}</a>
              </div>
              <div className="flex space-x-3">
                <button 
                  onClick={toggleSolved} 
                  className={`px-4 py-2 rounded-lg text-white ${isSolved ? 'bg-green-600' : isSavedForLater ? 'bg-gray-400 cursor-not-allowed opacity-60' : 'bg-[#94C3D2] hover:bg-opacity-90'}`}
                  disabled={isSavedForLater}
                  title={isSavedForLater ? "Cannot mark as solved when saved for later" : ""}
                >
                  {isSolved ? '✓ Solved' : 'Mark as Solved'}
                </button>
                <button 
                  onClick={toggleSaveForLater} 
                  className={`px-4 py-2 rounded-lg text-white ${isSavedForLater ? 'bg-yellow-600' : isSolved ? 'bg-gray-400 cursor-not-allowed opacity-60' : 'bg-[#94C3D2] hover:bg-opacity-90'}`}
                  disabled={isSolved}
                  title={isSolved ? "Cannot save for later when marked as solved" : ""}
                >
                  {isSavedForLater ? '★ Saved' : 'Save for Later'}
                </button>
                <a href={problemLink} target="_blank" rel="noopener noreferrer" className="bg-[#94C3D2] text-white px-5 py-2 rounded-lg hover:bg-opacity-90">Open Problem</a>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Code Editor Section */}
          <div className="lg:col-span-2">
            <div className="bg-[#dbeafe] rounded-lg overflow-hidden border border-gray-200">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="font-semibold">Code Editor</h2>
                <select
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="px-3 py-2 bg-[#E8F1F7] border border-gray-200 rounded-lg text-gray-800"
                >
                  {languages.map(lang => (
                    <option key={lang.id} value={lang.id}>{lang.name}</option>
                  ))}
                </select>
              </div>
              <div className="border-t border-gray-200" style={{ height: '500px' }}>
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
              <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
                <button 
                  onClick={copyCode}
                  className="px-3 py-2 bg-[#94C3D2] text-white rounded-lg hover:bg-opacity-90"
                  title="Copy code"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </button>
                <button 
                  onClick={handlePasteCode} // Ensure this button uses handlePasteCode
                  className="px-3 py-2 bg-[#94C3D2] text-white rounded-lg hover:bg-opacity-90"
                  title="Paste code"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Notes Section */}
            <div className="mt-6 bg-[#dbeafe] rounded-lg overflow-hidden border border-gray-200">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="font-semibold">Notes</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={handlePasteNotes}
                    className="px-4 py-2 bg-[#94C3D2] text-white rounded-lg flex items-center hover:bg-opacity-90"
                    title="Paste from clipboard"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    Paste
                  </button>
                  <button
                    onClick={() => setShowNotesModal(true)}
                    className="px-4 py-2 bg-[#94C3D2] text-white rounded-lg flex items-center hover:bg-opacity-90"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    View Saved
                    {savedNotes.length > 0 && (
                      <span className="ml-2 bg-[#dbeafe] border border-blue-300 shadow-sm rounded-full h-6 w-6 flex items-center justify-center text-blue-700 font-bold text-xs">
                        {savedNotes.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={saveNote}
                    className="px-4 py-2 bg-[#94C3D2] text-white rounded-lg flex items-center hover:bg-opacity-90"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                    Save Note
                  </button>
                </div>
              </div>
              <div className="p-0" style={{ minHeight: '450px' }}>
                <textarea
                  className="w-full h-full p-4 font-mono text-sm bg-[#E8F1F7] text-gray-800 focus:outline-none block resize-none focus:ring-[#94C3D2] focus:border-[#94C3D2]"
                  style={{ minHeight: '450px' }}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Take notes for this problem..."
                ></textarea>
              </div>
            </div>
          </div>

          {/* Chat Section - Fixed height to match code editor exactly */}
          <div className="bg-[#dbeafe] rounded-lg overflow-hidden border border-gray-200 flex flex-col" style={{ height: '643px' }}>
            <div className="bg-[#dbeafe] p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="font-semibold text-gray-800">Discussion</h2>
              <div className="flex items-center">
                <span className="h-3 w-3 rounded-full mr-2 bg-gray-500"></span>
                <span className="text-sm text-gray-600">Offline</span>
              </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto bg-[#E8F1F7]">
              <div className="space-y-4">
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
                          <span className={`font-medium ${message.user === 'You' ? 'text-gray-700' : 'text-gray-700'}`}>{message.user}</span>
                          <span className="text-xs text-gray-400 ml-2">{message.timestamp}</span>
                        </div>
                        {message.isCode ? (
                          <pre className={`p-3 rounded-lg text-sm bg-black font-mono overflow-x-auto whitespace-pre-wrap ${message.user === 'You' ? 'rounded-tr-none' : 'rounded-tl-none'}`} style={{color: '#f8f8f2'}}>
                            <code style={{color: '#f8f8f2'}}>{message.text}</code>
                          </pre>
                        ) : (
                          <p className={`p-3 rounded-lg text-sm ${message.user === 'You' ? 'bg-[#94C3D2] text-gray-800 rounded-tr-none' : 'bg-[#dbeafe] text-gray-800 rounded-tl-none'}`}>
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
            </div>
            <div className="bg-[#dbeafe] p-4 border-t border-gray-200">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <div className="flex-1 flex items-center bg-[#E8F1F7] border border-gray-300 rounded-lg overflow-hidden">
                  <input
                    type="text"
                    className="flex-1 px-4 py-2.5 bg-transparent text-gray-700 outline-none focus:ring-[#94C3D2] focus:border-[#94C3D2]"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={isCodeMessage ? "Type your code here..." : "Type a message..."}
                  />
                  <button
                    type="button"
                    onClick={() => setIsCodeMessage(!isCodeMessage)}
                    className={`px-2 mx-2 ${isCodeMessage ? 'text-[#94C3D2]' : 'text-gray-400'} hover:text-[#94C3D2] transition-colors`}
                    title={isCodeMessage ? "Switch to regular message" : "Switch to code message"}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </button>
                </div>
                <button
                  type="submit"
                  className="bg-[#94C3D2] text-white px-6 py-2.5 rounded-lg hover:bg-opacity-90 transition-colors"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Modal for viewing saved notes */}
        {showNotesModal && (
          <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col shadow-xl">
              <div className="p-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">Saved Notes</h2>
                <button
                  onClick={() => setShowNotesModal(false)}
                  className="text-white bg-red-600 rounded-full p-1.5 hover:bg-opacity-90"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="white"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div 
                className="p-4 overflow-y-auto flex-1" 
                style={{ 
                  maxHeight: '60vh', 
                  overflowY: 'auto',
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#d1d5db #f3f4f6'
                }}
              >
                {savedNotes.length > 0 ? (
                  <ul className="space-y-4">
                    {savedNotes.map(note => (
                      <li key={note.id} className="bg-[#E6F0FE] p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-gray-600 font-medium">{formatDate(note.date)}</span>
                          <button
                            onClick={() => deleteNote(note.id)}
                            style={{
                              backgroundColor: '#ef4444',
                              color: '#ffffff',
                              fontWeight: '500',
                              borderRadius: '0.375rem',
                              padding: '0.375rem 0.75rem',
                            }}
                          >
                            Delete
                          </button>
                        </div>
                        <p className="whitespace-pre-wrap text-gray-800 font-medium">{note.text}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600 text-center">No notes saved for this problem yet.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollabRoom;
