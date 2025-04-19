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
    if (problemLink) localStorage.setItem(`solved_${problemLink}`, newState);
  };

  const toggleSaveForLater = () => {
    const newState = !isSavedForLater;
    setIsSavedForLater(newState);
    if (problemLink) localStorage.setItem(`savedLater_${problemLink}`, newState);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const newChat = {
      id: Date.now(),
      user: 'You',
      text: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) // Format without seconds
    };
    setChatMessages([...chatMessages, newChat]);
    setNewMessage('');
    
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
    if (!notes.trim() || !problemLink) return;
    const newNote = {
      id: Date.now(),
      text: notes,
      date: new Date().toISOString()
    };
    const updatedNotes = [...savedNotes, newNote];
    setSavedNotes(updatedNotes);
    localStorage.setItem(`notes_${problemLink}`, JSON.stringify(updatedNotes));
    alert('Note saved successfully!');
    setNotes('');
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
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
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
    <div className="min-h-screen bg-[#0f172a] text-white">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Code Collaboration Room</h1>
        </div>

        {problemLink && (
          <div className="bg-[#1e293b] rounded-lg p-4 mb-6 border border-gray-700">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-medium text-white">Problem Link</h2>
                <a href={problemLink} target="_blank" rel="noopener noreferrer" className="text-blue-400">{problemLink}</a>
              </div>
              <div className="flex space-x-3">
                <button onClick={toggleSolved} className={`px-4 py-2 rounded-lg ${isSolved ? 'bg-green-600' : 'bg-gray-600'}`}>
                  {isSolved ? '✓ Solved' : 'Mark as Solved'}
                </button>
                <button onClick={toggleSaveForLater} className={`px-4 py-2 rounded-lg ${isSavedForLater ? 'bg-purple-600' : 'bg-gray-600'}`}>
                  {isSavedForLater ? '★ Saved' : 'Save for Later'}
                </button>
                <a href={problemLink} target="_blank" rel="noopener noreferrer" className="bg-blue-600 px-5 py-2 rounded-lg">Open Problem</a>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Code Editor Section */}
          <div className="lg:col-span-2">
            <div className="bg-[#1e293b] rounded-lg overflow-hidden border border-gray-700">
              <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                <h2 className="font-semibold">Code Editor</h2>
                <select
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="px-3 py-2 bg-[#111827] border border-gray-600 rounded-lg text-white"
                >
                  {languages.map(lang => (
                    <option key={lang.id} value={lang.id}>{lang.name}</option>
                  ))}
                </select>
              </div>
              <div className="border-t border-gray-700" style={{ height: '500px' }}>
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
              <div className="p-4 border-t border-gray-700 flex justify-end space-x-2">
                <button 
                  onClick={copyCode}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  title="Copy code"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </button>
                <button 
                  onClick={handlePasteCode} // Ensure this button uses handlePasteCode
                  className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  title="Paste code"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Notes Section */}
            <div className="mt-6 bg-[#1e293b] rounded-lg overflow-hidden border border-gray-700">
              <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                <h2 className="font-semibold">Notes</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={handlePasteNotes}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg flex items-center"
                    title="Paste from clipboard"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    Paste
                  </button>
                  <button
                    onClick={() => setShowNotesModal(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    View Saved
                    {savedNotes.length > 0 && <span className="ml-1 bg-white text-indigo-700 rounded-lg w-5 h-5 text-xs flex items-center justify-center">{savedNotes.length}</span>}
                  </button>
                  <button
                    onClick={saveNote}
                    className="px-4 py-2 bg-[#7C3AED] text-white rounded-lg flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                    Save Note
                  </button>
                </div>
              </div>
              <div className="p-0">
                <textarea
                  className="w-full h-[400px] p-4 font-mono text-sm bg-[#111827] text-white focus:outline-none block resize-none"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Take notes for this problem..."
                ></textarea>
              </div>
            </div>
          </div>

          {/* Chat Section - Fixed height to match code editor exactly */}
          <div className="bg-[#0f172a] rounded-lg overflow-hidden border border-gray-700 flex flex-col" style={{ height: '624px' }}>
            <div className="bg-[#1e293b] p-4 border-b border-gray-700 flex justify-between items-center">
              <h2 className="font-semibold">Discussion</h2>
              <div className="flex items-center">
                <span className="h-3 w-3 rounded-full mr-2 bg-gray-500"></span>
                <span className="text-sm text-gray-400">Offline</span>
              </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto bg-[#0f172a]">
              <div className="space-y-4">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-gray-400 mt-8">
                    <p>No messages yet</p>
                    <p className="text-sm mt-1">Start the discussion!</p>
                  </div>
                ) : (
                  chatMessages.map(message => (
                    <div key={message.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <span className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
                          {message.user.charAt(0)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center">
                          <span className="font-medium text-purple-400">{message.user}</span>
                          <span className="text-xs text-gray-400 ml-2">{message.timestamp}</span>
                        </div>
                        <p className={`p-3 rounded-lg text-sm ${message.user === 'You' ? 'bg-purple-500 text-white' : 'bg-gray-300 text-black'}`}>
                          {message.text}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="bg-[#1e293b] p-4 border-t border-gray-700">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  className="flex-1 px-4 py-2.5 bg-[#080D17] text-white border border-gray-700 rounded-lg outline-none"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Modal for viewing saved notes */}
        {showNotesModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-[#0f172a] rounded-lg w-full max-w-3xl max-h-[80vh] overflow-hidden border border-gray-700 flex flex-col">
              <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-[#111827]">
                <h2 className="text-xl font-semibold text-white">Saved Notes</h2>
                <button
                  onClick={() => setShowNotesModal(false)}
                  className="text-gray-400 hover:text-white bg-red-600 rounded-full p-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-4 overflow-y-auto flex-1 bg-[#0f172a]" style={{ maxHeight: '60vh' }}>
                {savedNotes.length > 0 ? (
                  <ul className="space-y-4">
                    {savedNotes.map(note => (
                      <li key={note.id} className="bg-[#111827] p-4 rounded-lg border border-gray-700">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-gray-400">{formatDate(note.date)}</span>
                          <button
                            onClick={() => deleteNote(note.id)}
                            className="text-white hover:text-gray-200 text-sm bg-red-600 rounded-lg px-3 py-1"
                          >
                            Delete
                          </button>
                        </div>
                        <p className="text-gray-200 whitespace-pre-wrap">{note.text}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400 text-center">No notes saved for this problem yet.</p>
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
