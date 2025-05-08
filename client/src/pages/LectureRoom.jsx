import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';

const LectureRoom = () => {
  const location = useLocation();
  const [videoUrl, setVideoUrl] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isCodeMessage, setIsCodeMessage] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  // Add state for notes functionality
  const [notes, setNotes] = useState('');
  const [savedNotes, setSavedNotes] = useState([]);
  const [showNotesModal, setShowNotesModal] = useState(false);

  // Extract URL from location state if available (from DailyPlan page)
  useEffect(() => {
    if (location.state && location.state.videoLink) {
      const link = location.state.videoLink;
      setVideoUrl(link);
      
      // Load saved notes for this video from localStorage
      const notesFromStorage = localStorage.getItem(`video_notes_${link}`);
      if (notesFromStorage) setSavedNotes(JSON.parse(notesFromStorage));
    }
  }, [location]);

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return '';
    
    // Match standard YouTube, youtu.be and YouTube playlist URLs
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|list=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    
    if (match && match[2].length === 11) {
      // Standard video ID
      return `https://www.youtube.com/embed/${match[2]}?enablejsapi=1`;
    } else if (match && match[1].includes('list=')) {
      // Playlist
      return `https://www.youtube.com/embed/videoseries?list=${match[2]}&enablejsapi=1`;
    }
    
    return url;
  };

  const handleSubmitUrl = (e) => {
    e.preventDefault();
    if (!videoUrl) return;
    
    // Force reload the iframe with autoplay
    const videoElement = document.querySelector('.video-iframe');
    if (videoElement) {
      const embedUrl = getYouTubeEmbedUrl(videoUrl);
      videoElement.src = embedUrl + '&autoplay=1';
    }
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
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 0);
  };

  // Notes related functions
  const saveNote = () => {
    if (!notes.trim()) {
      alert('Please add some notes before saving.');
      return;
    }
    
    if (!videoUrl) {
      alert('No video URL found. Please enter a YouTube URL first.');
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
      localStorage.setItem(`video_notes_${videoUrl}`, JSON.stringify(updatedNotes));
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
      localStorage.setItem(`video_notes_${videoUrl}`, JSON.stringify(updatedNotes));
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const handlePasteNotes = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setNotes(text);
    } catch (err) {
      console.error("Failed to read clipboard: ", err);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#334155] to-[#0f172a] text-white">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <h1 className="text-3xl font-bold mb-6"><span className="bg-gradient-to-r from-white to-[#94C3D2] bg-clip-text text-transparent">Watch Together</span></h1>   
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Video Player Section - Maintains larger width */}
          <div className="lg:w-2/3">
            <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-md overflow-hidden border border-white/20 h-full">
              <div className="px-4 pt-4 pb-4">
                <form onSubmit={handleSubmitUrl} className="flex items-center gap-2 mb-4">
                  <div className="flex flex-grow border border-white/20 rounded-lg overflow-hidden bg-[#2d3748]">
                    <input
                      type="text"
                      placeholder="YouTube URL..."
                      className="flex-1 px-4 py-2.5 bg-transparent text-white placeholder-gray-400 border-none outline-none focus:ring-[#94C3D2] focus:border-[#94C3D2]"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                    />
                    <button
                      type="button"
                      className="px-4 py-2.5 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                      onClick={() => {
                        const clipboardText = navigator.clipboard.readText();
                        clipboardText.then(text => setVideoUrl(text));
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </button>
                  </div>
                  <button
                    type="submit"
                    className="bg-[#94C3D2] text-white px-6 py-2.5 rounded-lg hover:bg-[#7EB5C3] transition-colors shadow-md font-medium flex-shrink-0"
                  >
                    Watch
                  </button>
                </form>
              </div>
              
              {videoUrl ? (
                <div className="w-full border-t border-white/20">
                <iframe
                  className="video-iframe rounded-lg"
                  width="100%"
                  height="600"
                  src={`${getYouTubeEmbedUrl(videoUrl)}`}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[600px] bg-white/5 text-gray-400 border-t border-white/20">
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-2">Enter a YouTube URL to begin watching</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Right Column - Chat and Notes - Maintains height to match video */}
          <div className="lg:w-1/3 flex flex-col h-full">
            {/* Notes Section - Set to approximately half of video height + form */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-md overflow-hidden border border-white/20 mb-6">
              <div className="p-4 border-b border-white/20 flex justify-between items-center">
                <h2 className="font-semibold text-white/95">Notes</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={handlePasteNotes}
                    className="px-4 py-2 bg-white/10 border border-white/20 text-white/95 hover:bg-white/20 rounded-lg flex items-center shadow-sm backdrop-blur-sm transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    Paste
                  </button>
                  <button
                    onClick={() => setShowNotesModal(true)}
                    className="px-4 py-2 bg-white/10 border border-white/20 text-white/95 hover:bg-white/20 rounded-lg flex items-center shadow-sm backdrop-blur-sm transition-colors relative"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    View Saved
                    {savedNotes.length > 0 && (
                      <span className="absolute -top-2 -right-2 bg-[#94C3D2] text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">
                        {savedNotes.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={saveNote}
                    className="px-4 py-2 bg-[#94C3D2] hover:bg-[#7EB5C3] text-white rounded-lg flex items-center transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                    Save Note
                  </button>
                </div>
              </div>
              <div className="p-0">
                <textarea
                  className="w-full h-full p-4 font-mono text-sm bg-[#2d3748] text-white focus:outline-none block resize-none focus:ring-[#94C3D2] focus:border-[#94C3D2] border-none"
                  style={{ height: '250px' }}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Take notes for this video..."
                ></textarea>
              </div>
            </div>
            
            {/* Chat Section - Set to match remaining height */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-md overflow-hidden border border-white/20 flex flex-col flex-grow">
              <div className="p-4 border-b border-white/20 flex justify-between items-center">
                <h2 className="font-semibold text-white/95">Live Chat</h2>
                <div className="flex items-center">
                  <span className={`h-3 w-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="text-sm text-white/80">{isConnected ? 'Connected' : 'Disconnected'}</span>
                </div>
              </div>
              
              <div className="flex-1 p-4 space-y-4 bg-white/5 overflow-y-auto chat-messages" style={{ minHeight: "250px" }}>
                {chatMessages.length === 0 ? (
                  <div className="text-center text-gray-400 mt-8">
                    <p>No messages yet</p>
                    <p className="text-sm mt-1">Start the conversation!</p>
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

      {/* Modal for viewing saved notes - remains unchanged */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col border border-white/20">
            <div className="p-4 flex justify-between items-center border-b border-white/20">
              <h2 className="text-xl font-bold bg-gradient-to-r from-white to-[#94C3D2] bg-clip-text text-transparent">Saved Notes</h2>
              <button
                onClick={() => setShowNotesModal(false)}
                className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
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
                    <li key={note.id} className="bg-white/10 p-4 rounded-lg border border-white/20">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-white/80 font-medium">{formatDate(note.date)}</span>
                        <button
                          onClick={() => deleteNote(note.id)}
                          className="bg-red-900/50 text-red-200 border border-red-600/30 px-3 py-1 rounded font-medium hover:bg-red-900/70 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                      <p className="whitespace-pre-wrap text-white/95 font-medium">{note.text}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-white/60 text-center">No notes saved for this video yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LectureRoom;