import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';

const WatchVideo = () => {
  const location = useLocation();
  const [videoUrl, setVideoUrl] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isCodeMessage, setIsCodeMessage] = useState(false);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Watch Together</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-700">
              <div className="px-0 pt-4 pb-4">
                <form onSubmit={handleSubmitUrl} className="flex items-center gap-2 px-4 mb-4">
                  <div className="flex flex-grow border border-gray-700 rounded-md overflow-hidden mx-0">
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
                    className="bg-[#7C3AED] text-white px-6 py-2.5 rounded-md hover:bg-purple-600 transition-colors shadow-md font-medium"
                  >
                    Watch
                  </button>
                </form>
              </div>
              
              {videoUrl ? (
                <div className="w-full border-t border-gray-700">
                <iframe
                  className="video-iframe rounded-lg"
                  width="100%"
                  height="500"
                  src={`${getYouTubeEmbedUrl(videoUrl)}`}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[500px] bg-gray-100 text-gray-500 border-t border-gray-700">
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
          <div className="bg-[#1e293b] rounded-lg shadow overflow-hidden border border-gray-700 flex flex-col" style={{ height: videoUrl ? '573px' : '573px' }}>
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h2 className="font-semibold text-white">Live Chat</h2>
              <div className="flex items-center">
                <span className={`h-3 w-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className="text-sm text-gray-400">{isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>
            
            <div className="flex-1 p-4 space-y-4 bg-[#0f172a] overflow-y-auto chat-messages">
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
                        <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                          {message.user.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="flex flex-col">
                      <div className={`flex items-center ${message.user === 'You' ? 'justify-end' : ''}`}>
                        <span className={`font-medium ${message.user === 'You' ? 'text-purple-400' : 'text-blue-400'}`}>{message.user}</span>
                        <span className="text-xs text-gray-400 ml-2">{message.timestamp}</span>
                      </div>
                      {message.isCode ? (
                        <pre className={`p-3 rounded-lg text-sm bg-gray-900 text-gray-100 font-mono overflow-x-auto whitespace-pre-wrap ${message.user === 'You' ? 'rounded-tr-none' : 'rounded-tl-none'}`}>
                          <code>{message.text}</code>
                        </pre>
                      ) : (
                        <p className={`p-3 rounded-lg text-sm ${message.user === 'You' ? 'bg-purple-500 text-white rounded-tr-none' : 'bg-gray-700 text-white rounded-tl-none'}`}>
                          {message.text}
                        </p>
                      )}
                    </div>
                    {message.user === 'You' && (
                      <div className="flex-shrink-0">
                        <span className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
                          {message.user.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            
            <div className="p-4 border-t border-gray-700 bg-[#1e293b]">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <div className="flex-1 flex items-center bg-[#0f172a] border border-gray-600 rounded-lg overflow-hidden">
                  <input
                    type="text"
                    placeholder={isCodeMessage ? "Type your code here..." : "Type message..."}
                    className="flex-1 px-4 py-2.5 bg-transparent text-white placeholder-gray-400 outline-none"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setIsCodeMessage(!isCodeMessage)}
                    className={`px-2 mx-2 ${isCodeMessage ? 'text-blue-400' : 'text-gray-400'} hover:text-blue-500 transition-colors`}
                    title={isCodeMessage ? "Switch to regular message" : "Switch to code message"}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
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
    </div>
  );
};

export default WatchVideo;