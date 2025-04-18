import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const DailyPlan = () => {
  const [topics, setTopics] = useState(() => {
    // Load from localStorage
    const saved = localStorage.getItem('dailyPlanTopics');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [topicName, setTopicName] = useState('');
  const [description, setDescription] = useState('');
  const [showAddTopicForm, setShowAddTopicForm] = useState(false);
  
  // Save to localStorage when topics change
  useEffect(() => {
    localStorage.setItem('dailyPlanTopics', JSON.stringify(topics));
  }, [topics]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!topicName.trim()) return;
    
    const newTopic = {
      id: Date.now(),
      name: topicName,
      description,
      problems: [],
      videos: [],
      notes: '',
      dateAdded: new Date().toISOString().split('T')[0]
    };
    
    setTopics([...topics, newTopic]);
    
    // Reset form
    setTopicName('');
    setDescription('');
    setShowAddTopicForm(false); // Hide the form after adding
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* Dark Navy Navbar */}
      <nav className="bg-[#141b2d] text-white shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Link to="/" className="text-xl font-bold">LeetRoom</Link>
              </div>
              <div className="hidden md:block ml-10">
                <div className="flex items-baseline space-x-4">
                  <Link to="/" className="px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-gray-700">Dashboard</Link>
                  <Link to="/daily-plan" className="px-3 py-2 rounded-md text-sm font-medium bg-[#1e2a4a] text-white">Daily Plan</Link>
                  <Link to="/watch-video" className="px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-gray-700">Watch Video</Link>
                  <Link to="/collab-room" className="px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-gray-700">Collab Room</Link>
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="relative">
                <button className="flex items-center text-sm font-medium text-white focus:outline-none">
                  <span className="mr-1">Account</span>
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="container mx-auto px-4 py-8">
        {/* Header with Add Topic Button */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Daily Learning Plan</h1>
          <button
            onClick={() => setShowAddTopicForm(!showAddTopicForm)}
            className="bg-[#7C3AED] text-white px-6 py-2.5 rounded-full flex items-center hover:bg-purple-600 transition-colors shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Topic
          </button>
        </div>
        
        {/* Collapsible Add Topic Form */}
        {showAddTopicForm && (
          <div className="bg-[#1e293b] rounded-lg shadow-xl mb-8 p-6 transition-all hover-lift">
            <h2 className="text-xl font-semibold text-white mb-4">Create New Topic</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="topicName" className="block text-sm font-medium text-gray-300 mb-1">Topic Name</label>
                <input
                  type="text"
                  id="topicName"
                  className="w-full px-4 py-2.5 bg-[#2d3748] border border-[#4a5568] rounded-full focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
                  placeholder="Topic name..."
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Description (Optional)</label>
                <textarea
                  id="description"
                  className="w-full px-4 py-2.5 bg-[#2d3748] border border-[#4a5568] rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
                  rows="3"
                  placeholder="Brief description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>
              </div>
              
              <div className="mt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddTopicForm(false)}
                  className="px-5 py-2.5 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-colors shadow-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-md"
                >
                  Add Topic
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Topics Section - Always visible */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">Your Topics</h2>
          
          {/* Empty State */}
          {topics.length === 0 ? (
            <div className="bg-[#1e293b] rounded-lg shadow-lg p-12 text-center border border-gray-700">
              <div className="flex justify-center mb-4">
                <svg className="h-16 w-16 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-1">No topics added yet</h3>
              <p className="text-gray-400">Click the "Add New Topic" button to get started</p>
            </div>
          ) : (
            <div className="space-y-6">
              {topics.map((topic) => (
                <TopicCard 
                  key={topic.id} 
                  topic={topic} 
                  setTopics={setTopics}
                  allTopics={topics}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TopicCard = ({ topic, setTopics, allTopics }) => {
  const [activeTab, setActiveTab] = useState('problems');
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(topic.name);
  const [editedDescription, setEditedDescription] = useState(topic.description);
  const [newProblem, setNewProblem] = useState('');
  const [newVideo, setNewVideo] = useState('');
  const [notes, setNotes] = useState('');
  const [savedNotes, setSavedNotes] = useState([]);
  const [showNotesModal, setShowNotesModal] = useState(false);

  // Load saved notes when component mounts
  useEffect(() => {
    const savedNotesFromStorage = localStorage.getItem(`topic_notes_${topic.id}`);
    if (savedNotesFromStorage) {
      setSavedNotes(JSON.parse(savedNotesFromStorage));
    }
  }, [topic.id]);

  // Delete topic handler
  const handleDeleteTopic = () => {
    if (window.confirm('Are you sure you want to delete this topic?')) {
      setTopics(allTopics.filter(t => t.id !== topic.id));
    }
  };

  // Save edited topic info
  const handleSaveEdit = () => {
    const updatedTopics = allTopics.map(t => {
      if (t.id === topic.id) {
        return { ...t, name: editedName, description: editedDescription };
      }
      return t;
    });
    
    setTopics(updatedTopics);
    setIsEditing(false);
  };

  // Add new problem
  const handleAddProblem = (e) => {
    e.preventDefault();
    if (!newProblem.trim()) return;
    
    const updatedTopics = allTopics.map(t => {
      if (t.id === topic.id) {
        return {
          ...t,
          problems: [...t.problems, {
            id: Date.now(),
            link: newProblem,
            completed: false,
            dateAdded: new Date().toISOString().split('T')[0]
          }]
        };
      }
      return t;
    });
    
    setTopics(updatedTopics);
    setNewProblem('');
  };

  // Add new video
  const handleAddVideo = (e) => {
    e.preventDefault();
    if (!newVideo.trim()) return;
    
    const updatedTopics = allTopics.map(t => {
      if (t.id === topic.id) {
        return {
          ...t,
          videos: [...t.videos, {
            id: Date.now(),
            link: newVideo,
            watched: false,
            dateAdded: new Date().toISOString().split('T')[0]
          }]
        };
      }
      return t;
    });
    
    setTopics(updatedTopics);
    setNewVideo('');
  };

  // Update notes
  const handleUpdateNotes = (newNotes) => {
    setNotes(newNotes);
  };

  // Save current note
  const saveNote = () => {
    if (!notes.trim()) return;
    
    const newNote = {
      id: Date.now(),
      text: notes,
      date: new Date().toISOString()
    };
    
    const updatedNotes = [...savedNotes, newNote];
    setSavedNotes(updatedNotes);
    
    // Save to localStorage
    localStorage.setItem(`topic_notes_${topic.id}`, JSON.stringify(updatedNotes));
    alert('Note saved successfully!');
    setNotes(''); // Clear the current note
  };

  // Delete a saved note
  const deleteNote = (noteId) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      const updatedNotes = savedNotes.filter(note => note.id !== noteId);
      setSavedNotes(updatedNotes);
      
      // Update localStorage
      localStorage.setItem(`topic_notes_${topic.id}`, JSON.stringify(updatedNotes));
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  // Remove problem
  const handleRemoveProblem = (problemId) => {
    const updatedTopics = allTopics.map(t => {
      if (t.id === topic.id) {
        return {
          ...t,
          problems: t.problems.filter(p => p.id !== problemId)
        };
      }
      return t;
    });
    
    setTopics(updatedTopics);
  };

  // Remove video
  const handleRemoveVideo = (videoId) => {
    const updatedTopics = allTopics.map(t => {
      if (t.id === topic.id) {
        return {
          ...t,
          videos: t.videos.filter(v => v.id !== videoId)
        };
      }
      return t;
    });
    
    setTopics(updatedTopics);
  };

  // Toggle problem completion
  const handleToggleProblem = (problemId) => {
    const updatedTopics = allTopics.map(t => {
      if (t.id === topic.id) {
        return {
          ...t,
          problems: t.problems.map(p => 
            p.id === problemId ? { ...p, completed: !p.completed } : p
          )
        };
      }
      return t;
    });
    
    setTopics(updatedTopics);
  };

  // Helper function for YouTube embeds
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return '';
    
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|list=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    
    if (match && match[2].length === 11) {
      // Standard video ID
      return `https://www.youtube.com/embed/${match[2]}`;
    } else if (match && match[1].includes('list=')) {
      // Playlist
      const playlistId = url.match(/list=([^&]*)/);
      if (playlistId && playlistId[1]) {
        return `https://www.youtube.com/embed/videoseries?list=${playlistId[1]}`;
      }
    }
    
    return url;
  };

  // Check if URL is YouTube
  const isYouTubeUrl = (url) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  // Paste functions for problem and video links
  const handlePasteProblem = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setNewProblem(text);
      }
    } catch (err) {
      console.error("Failed to read clipboard: ", err);
    }
  };

  const handlePasteVideo = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setNewVideo(text);
      }
    } catch (err) {
      console.error("Failed to read clipboard: ", err);
    }
  };

  return (
    <div className="bg-[#1e293b] rounded-lg shadow-lg overflow-hidden border border-gray-700">
      {/* Topic Header with Edit/Delete buttons */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex justify-between items-start">
          <h2 className="text-2xl font-semibold text-white">{topic.name}</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 hover:bg-[#2d3748] rounded transition-colors"
              aria-label="Edit"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 hover:text-white" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
            <button
              onClick={handleDeleteTopic}
              className="p-2 hover:bg-[#2d3748] rounded transition-colors"
              aria-label="Delete"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 hover:text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        {topic.description && <p className="mt-1 text-gray-400">{topic.description}</p>}
      </div>

      {/* Tab Navigation - Simpler style that matches the screenshot */}
      <div className="flex bg-[#111827] text-sm font-medium border-b border-gray-700">
        <button
          onClick={() => setActiveTab('problems')}
          className={`flex-1 py-3 px-4 text-center transition-colors ${
            activeTab === 'problems' 
              ? 'border-b-2 border-blue-500 text-blue-400'
              : 'text-gray-400 hover:bg-[#1e293b]'
          }`}
        >
          Problems
        </button>
        <button
          onClick={() => setActiveTab('videos')}
          className={`flex-1 py-3 px-4 text-center transition-colors ${
            activeTab === 'videos' 
              ? 'border-b-2 border-blue-500 text-blue-400'
              : 'text-gray-400 hover:bg-[#1e293b]'
          }`}
        >
          Videos
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex-1 py-3 px-4 text-center transition-colors ${
            activeTab === 'notes' 
              ? 'border-b-2 border-blue-500 text-blue-400'
              : 'text-gray-400 hover:bg-[#1e293b]'
          }`}
        >
          Notes
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* Problems Tab */}
        {activeTab === 'problems' && (
          <div>
            <form onSubmit={handleAddProblem} className="mb-6">
              <div className="flex items-center gap-2">
                <div className="flex flex-grow border border-gray-600 bg-[#1e293b] rounded-full overflow-hidden">
                  <input
                    type="text"
                    className="flex-1 px-4 py-2.5 bg-transparent text-white placeholder-gray-400 border-none outline-none"
                    placeholder="Problem URL..."
                    value={newProblem}
                    onChange={(e) => setNewProblem(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handlePasteProblem}
                    className="px-4 py-2.5 text-blue-400 hover:bg-gray-700 transition-colors"
                    title="Paste from clipboard"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </button>
                </div>
                <button
                  type="submit"
                  className="bg-[#7C3AED] text-white min-w-[80px] px-6 py-2.5 rounded-full hover:bg-purple-600 transition-colors shadow-md font-medium"
                >
                  Add
                </button>
              </div>
            </form>
            
            {/* Problem List - Improved styling */}
            <div className="space-y-3">
              {topic.problems.map(problem => (
                <div 
                  key={problem.id} 
                  className="flex items-center justify-between p-4 bg-[#111827] rounded-lg"
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={problem.completed || false}
                      onChange={() => handleToggleProblem(problem.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-700 rounded mr-3"
                    />
                    <a 
                      href={problem.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`${problem.completed ? 'text-gray-500 line-through' : 'text-blue-400 hover:text-blue-300'} truncate`}
                    >
                      {problem.link}
                    </a>
                  </div>
                  <div className="flex space-x-2">
                    <Link 
                      to="/collab-room" 
                      state={{ problemLink: problem.link }}
                      className="bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-700 transition-colors flex items-center shadow-md"
                      title="Open this problem in Collaboration Room"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                      <span>Collaborate</span>
                    </Link>
                    <button
                      onClick={() => handleRemoveProblem(problem.id)}
                      className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-md"
                      title="Remove problem"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Videos Tab */}
        {activeTab === 'videos' && (
          <div>
            <form onSubmit={handleAddVideo} className="mb-6">
              <div className="flex items-center gap-2">
                <div className="flex flex-grow border border-gray-600 bg-[#1e293b] rounded-full overflow-hidden">
                  <input
                    type="text"
                    className="flex-1 px-4 py-2.5 bg-transparent text-white placeholder-gray-400 border-none outline-none"
                    placeholder="YouTube URL..."
                    value={newVideo}
                    onChange={(e) => setNewVideo(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handlePasteVideo}
                    className="px-4 py-2.5 text-blue-400 hover:bg-gray-700 transition-colors"
                    title="Paste from clipboard"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </button>
                </div>
                <button
                  type="submit"
                  className="bg-[#7C3AED] text-white min-w-[80px] px-6 py-2.5 rounded-full hover:bg-purple-600 transition-colors shadow-md font-medium"
                >
                  Add
                </button>
              </div>
            </form>
            
            {/* Video List - Improved styling */}
            <div className="space-y-6">
              {topic.videos.map(video => (
                <div key={video.id} className="bg-[#111827] rounded-lg overflow-hidden">
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex-1 truncate text-blue-400 hover:text-blue-300">
                      <a href={video.link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {video.link}
                      </a>
                    </div>
                    <div className="flex space-x-2 ml-3">
                      <Link 
                        to="/watch-video" 
                        state={{ videoLink: video.link }}
                        className="bg-purple-600 text-white px-4 py-2 rounded-full hover:bg-purple-700 transition-colors flex items-center shadow-md"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        </svg>
                        <span>Watch Together</span>
                      </Link>
                      <button
                        onClick={() => handleRemoveVideo(video.id)}
                        className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-md"
                        title="Remove video"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {isYouTubeUrl(video.link) && (
                    <div className="w-full h-64 mt-2">
                      <iframe 
                        src={getYouTubeEmbedUrl(video.link)} 
                        title="YouTube video player" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                        className="w-full h-full"
                        loading="lazy"
                      ></iframe>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium text-white">Take Notes</h3>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setShowNotesModal(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 text-sm flex items-center transition-colors shadow-md"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View Saved
                  {savedNotes.length > 0 && <span className="ml-1 bg-white text-indigo-700 rounded-full w-5 h-5 text-xs flex items-center justify-center">{savedNotes.length}</span>}
                </button>
                <button 
                  onClick={saveNote}
                  className="px-4 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 text-sm flex items-center transition-colors shadow-md"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Save Note
                </button>
              </div>
            </div>
            <textarea
              className="w-full h-60 px-4 py-3 bg-[#2d3748] border border-[#4a5568] rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
              placeholder="Write notes here..."
              value={notes}
              onChange={(e) => handleUpdateNotes(e.target.value)}
            ></textarea>
          </div>
        )}
      </div>

      {/* Modal for viewing saved notes */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1e293b] rounded-lg shadow-lg w-full max-w-3xl max-h-[80vh] overflow-hidden border border-gray-700">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">Saved Notes for {topic.name}</h2>
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
                  <p className="text-sm mt-1">Your saved notes for this topic will appear here.</p>
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

export default DailyPlan;
