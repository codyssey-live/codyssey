import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';

const CollabRoom = () => {
  const location = useLocation();
  const [problemLink, setProblemLink] = useState('');
  const [code, setCode] = useState('// Write your code here...');
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [language, setLanguage] = useState('javascript');
  const [notes, setNotes] = useState('');
  const [savedNotes, setSavedNotes] = useState([]);
  const [showNotesModal, setShowNotesModal] = useState(false);
  
  // Available languages
  const languages = [
    { id: 'javascript', name: 'JavaScript' },
    { id: 'python', name: 'Python' },
    { id: 'java', name: 'Java' },
    { id: 'cpp', name: 'C++' }
  ];

  // Extract URL from location state if available (from DailyPlan page)
  useEffect(() => {
    if (location.state && location.state.problemLink) {
      setProblemLink(location.state.problemLink);
      
      // Load saved notes for this problem
      const savedNotesFromStorage = localStorage.getItem(`notes_${location.state.problemLink}`);
      if (savedNotesFromStorage) {
        setSavedNotes(JSON.parse(savedNotesFromStorage));
      }
    }
  }, [location]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    // Mockup of chat functionality (to be replaced with Socket.io)
    const newChat = {
      id: Date.now(),
      user: 'You',
      text: newMessage,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setChatMessages([...chatMessages, newChat]);
    setNewMessage('');
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code)
      .then(() => {
        alert('Code copied to clipboard!');
      })
      .catch(err => {
        console.error('Could not copy code: ', err);
      });
  };

  const shareRoom = () => {
    // Generate a shareable link (mockup)
    const shareLink = `${window.location.origin}/collab-room?id=${Date.now()}`;
    
    navigator.clipboard.writeText(shareLink)
      .then(() => {
        alert('Room link copied to clipboard!');
      })
      .catch(err => {
        console.error('Could not copy room link: ', err);
      });
  };

  const saveNote = () => {
    if (!notes.trim() || !problemLink) return;
    
    const newNote = {
      id: Date.now(),
      text: notes,
      date: new Date().toISOString()
    };
    
    const updatedNotes = [...savedNotes, newNote];
    setSavedNotes(updatedNotes);
    
    // Save to localStorage
    if (problemLink) {
      localStorage.setItem(`notes_${problemLink}`, JSON.stringify(updatedNotes));
      alert('Note saved successfully!');
      setNotes(''); // Clear the current note
    }
  };

  const deleteNote = (noteId) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      const updatedNotes = savedNotes.filter(note => note.id !== noteId);
      setSavedNotes(updatedNotes);
      
      // Update localStorage
      if (problemLink) {
        localStorage.setItem(`notes_${problemLink}`, JSON.stringify(updatedNotes));
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  const handlePasteMessage = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setNewMessage(text);
      }
    } catch (err) {
      console.error("Failed to read clipboard: ", err);
    }
  };

  const handlePasteNotes = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setNotes(text);
      }
    } catch (err) {
      console.error("Failed to read clipboard: ", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Code Collaboration Room</h1>
          <div className="flex space-x-3">
            <button 
              onClick={copyCode}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 flex items-center transition-colors shadow-md"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              Copy Code
            </button>
            <button 
              onClick={shareRoom}
              className="bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 flex items-center transition-colors shadow-md"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share Room
            </button>
          </div>
        </div>
        
        {/* Problem Link Display */}
        {problemLink && (
          <div className="bg-[#1e293b] rounded-lg p-4 mb-6 border border-gray-700">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-medium text-white">Problem Link</h2>
                <a 
                  href={problemLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  {problemLink}
                </a>
              </div>
              <a 
                href={problemLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-purple-600 text-white px-5 py-2.5 rounded-lg hover:bg-purple-700 transition-colors shadow-md"
              >
                Open Problem
              </a>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel: Code Editor + Notes */}
          <div className="lg:col-span-2 space-y-6">
            {/* Code Editor Section */}
            <div className="bg-[#1e293b] rounded-lg overflow-hidden border border-gray-700">
              <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                <h2 className="font-semibold">Code Editor</h2>
                <div>
                  <select 
                    value={language} 
                    onChange={(e) => setLanguage(e.target.value)}
                    className="px-3 py-2 bg-[#111827] border border-gray-600 rounded-lg text-white"
                  >
                    {languages.map(lang => (
                      <option key={lang.id} value={lang.id}>{lang.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="p-0">
                <textarea 
                  className="w-full h-[400px] p-4 font-mono text-sm bg-[#0f172a] text-white focus:outline-none"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                ></textarea>
              </div>
            </div>

            {/* Notes Section */}
            <div className="bg-[#1e293b] rounded-lg overflow-hidden border border-gray-700">
              <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                <h2 className="font-semibold">Notes</h2>
                <div className="flex space-x-2">
                  <button 
                    onClick={handlePasteNotes}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center transition-colors shadow-md"
                    title="Paste from clipboard"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Paste
                  </button>
                  <button 
                    onClick={() => setShowNotesModal(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center transition-colors shadow-md"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Saved
                    {savedNotes.length > 0 && <span className="ml-1 bg-white text-indigo-700 rounded-lg w-5 h-5 text-xs flex items-center justify-center">{savedNotes.length}</span>}
                  </button>
                  <button 
                    onClick={saveNote}
                    className="px-4 py-2 bg-[#7C3AED] text-white rounded-lg hover:bg-purple-600 flex items-center transition-colors shadow-md"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Save Note
                  </button>
                </div>
              </div>
              
              <div className="p-0">
                <textarea 
                  className="w-full h-[150px] p-4 font-mono text-sm bg-[#111827] text-white focus:outline-none"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Take notes for this problem..."
                ></textarea>
              </div>
            </div>
          </div>
          
          {/* Chat Section */}
          <div className="bg-[#1e293b] rounded-lg overflow-hidden flex flex-col h-[600px] border border-gray-700">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h2 className="font-semibold">Discussion</h2>
              <div className="flex items-center">
                <span className={`h-3 w-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className="text-sm text-gray-400">{isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 ? (
                <div className="text-center text-gray-400 mt-8">
                  <p>No messages yet</p>
                  <p className="text-sm mt-1">Start the discussion about the problem!</p>
                </div>
              ) : (
                chatMessages.map(message => (
                  <div key={message.id} className="flex flex-col bg-[#172033] p-3 rounded-lg">
                    <div className="flex items-center">
                      <span className="font-medium text-blue-400">{message.user}</span>
                      <span className="text-xs text-gray-400 ml-2">{message.timestamp}</span>
                    </div>
                    <p className="text-gray-200">{message.text}</p>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-4 border-t border-gray-700">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <div className="flex flex-grow border border-gray-600 bg-[#111827] rounded-lg overflow-hidden">
                  <input
                    type="text"
                    placeholder="Type message..."
                    className="flex-1 px-4 py-2.5 bg-transparent text-white placeholder-gray-400 border-none outline-none"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handlePasteMessage}
                    className="px-4 py-2.5 text-blue-400 hover:bg-[#1c2431] transition-colors"
                    title="Paste from clipboard"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </button>
                </div>
                <button
                  type="submit"
                  className="bg-[#7C3AED] text-white px-6 py-2.5 rounded-lg hover:bg-purple-600 transition-colors shadow-md font-medium"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for viewing saved notes */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1e293b] rounded-lg w-full max-w-3xl max-h-[80vh] overflow-hidden border border-gray-700">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Saved Notes</h2>
              <button 
                onClick={() => setShowNotesModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="overflow-y-auto p-4 max-h-[60vh]">
              {savedNotes.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <p>No saved notes yet</p>
                  <p className="text-sm mt-1">Your saved notes for this problem will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {savedNotes.map(note => (
                    <div key={note.id} className="bg-[#172033] p-4 rounded-lg border border-gray-700">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs text-gray-400">Saved on: {formatDate(note.date)}</span>
                        <button 
                          onClick={() => deleteNote(note.id)}
                          className="text-red-400 hover:text-red-300"
                          title="Delete note"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      <div className="bg-[#0f172a] p-3 rounded border border-gray-700 whitespace-pre-wrap font-mono text-sm">
                        {note.text}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-700 flex justify-end">
              <button 
                onClick={() => setShowNotesModal(false)}
                className="px-5 py-2.5 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-colors shadow-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollabRoom;
