import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';

const WatchVideo = () => {
  const location = useLocation();
  const [videoUrl, setVideoUrl] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  // Extract URL from location state if available (from DailyPlan page)
  useEffect(() => {
    if (location.state && location.state.videoLink) {
      setVideoUrl(location.state.videoLink);
    }
  }, [location]);

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return '';
    
    // Match standard YouTube, youtu.be and YouTube playlist URLs
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|list=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    
    if (match && match[2].length === 11) {
      // Standard video ID
      return `https://www.youtube.com/embed/${match[2]}`;
    } else if (match && match[1].includes('list=')) {
      // Playlist
      return `https://www.youtube.com/embed/videoseries?list=${match[2]}`;
    }
    
    return url;
  };

  const handleSubmitUrl = (e) => {
    e.preventDefault();
    // No need to update state again if URL hasn't changed
    if (!videoUrl) return;
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Watch Together</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <form onSubmit={handleSubmitUrl} className="flex items-center gap-2">
                  <div className="flex flex-grow border border-gray-300 rounded-full overflow-hidden">
                    <input
                      type="text"
                      placeholder="YouTube URL..."
                      className="flex-1 px-4 py-2.5 bg-transparent text-gray-700 placeholder-gray-400 border-none outline-none"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                    />
                    <button
                      type="button"
                      className="px-4 py-2.5 text-blue-600 hover:bg-gray-100 transition-colors"
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
                    className="bg-[#7C3AED] text-white px-6 py-2.5 rounded-full hover:bg-purple-600 transition-colors shadow-md font-medium"
                  >
                    Watch
                  </button>
                </form>
              </div>
              
              {videoUrl ? (
                <div className="aspect-w-16 aspect-h-9">
                  <iframe 
                    src={getYouTubeEmbedUrl(videoUrl)}
                    className="w-full h-[500px]"
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[500px] bg-gray-100 text-gray-500">
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-2">Enter a YouTube URL to begin watching</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Chat Section */}
          <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col h-[500px]">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="font-semibold text-gray-800">Live Chat</h2>
              <div className="flex items-center">
                <span className={`h-3 w-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className="text-sm text-gray-600">{isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <p>No messages yet</p>
                  <p className="text-sm mt-1">Start the conversation!</p>
                </div>
              ) : (
                chatMessages.map(message => (
                  <div key={message.id} className="flex flex-col">
                    <div className="flex items-center">
                      <span className="font-medium text-blue-600">{message.user}</span>
                      <span className="text-xs text-gray-500 ml-2">{message.timestamp}</span>
                    </div>
                    <p className="text-gray-800">{message.text}</p>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <div className="flex flex-grow border border-gray-300 rounded-full overflow-hidden">
                  <input
                    type="text"
                    placeholder="Type message..."
                    className="flex-1 px-4 py-2.5 bg-transparent text-gray-700 placeholder-gray-400 border-none outline-none"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <button
                    type="button"
                    className="px-4 py-2.5 text-blue-600 hover:bg-gray-100 transition-colors"
                    onClick={() => {
                      const clipboardText = navigator.clipboard.readText();
                      clipboardText.then(text => setNewMessage(text));
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </button>
                </div>
                <button
                  type="submit"
                  className="bg-[#7C3AED] text-white px-6 py-2.5 rounded-full hover:bg-purple-600 transition-colors shadow-md font-medium"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchVideo;
