import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const TopicCard = ({
  topic,
  onUpdateTopic,
  onDeleteTopic,
  onAddProblem,
  onAddVideo,
  onUpdateNotes,
  onRemoveProblem,
  onRemoveVideo,
  onToggleProblemCompletion,
  onToggleVideoWatched
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(topic.name);
  const [editedDescription, setEditedDescription] = useState(topic.description);
  const [newProblem, setNewProblem] = useState('');
  const [newVideo, setNewVideo] = useState('');
  const [activeTab, setActiveTab] = useState('problems');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Calculate progress based on completed problems and watched videos
    const totalItems = topic.problems.length + topic.videos.length;
    if (totalItems === 0) {
      setProgress(0);
      return;
    }
    
    const completedItems = 
      topic.problems.filter(p => p.completed).length + 
      topic.videos.filter(v => v.watched).length;
    
    setProgress(Math.round((completedItems / totalItems) * 100));
  }, [topic.problems, topic.videos]);

  const handleSaveEdit = () => {
    onUpdateTopic(topic.id, {
      name: editedName,
      description: editedDescription
    });
    setIsEditing(false);
  };

  const handleAddProblem = (e) => {
    e.preventDefault();
    if (newProblem.trim()) {
      onAddProblem(topic.id, newProblem);
      setNewProblem('');
    }
  };

  const handleAddVideo = (e) => {
    e.preventDefault();
    if (newVideo.trim()) {
      onAddVideo(topic.id, newVideo);
      setNewVideo('');
    }
  };

  // Extract YouTube video ID from URL to create embed URL
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    
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
    
    // Return original URL if no match
    return url;
  };

  const isYouTubeUrl = (url) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  // Check if URL is a playlist
  const isPlaylist = (url) => {
    return url.includes('list=');
  };

  // Extract video or playlist title from URL
  const getVideoTitle = (url) => {
    const parts = url.split('/');
    const lastPart = parts[parts.length - 1];
    
    if (lastPart.includes('watch?v=')) {
      return 'YouTube Video';
    } else if (lastPart.includes('playlist')) {
      return 'YouTube Playlist';
    }
    
    return 'Video Resource';
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Topic Header */}
      <div className="p-6 border-b border-gray-200">
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label htmlFor="editTopicName" className="block text-sm font-medium text-gray-700">Topic Name</label>
              <input
                type="text"
                id="editTopicName"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="editDescription" className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                id="editDescription"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows="3"
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
              ></textarea>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center">
                  <h3 className="text-xl font-semibold text-gray-800">{topic.name}</h3>
                  {topic.dateAdded && (
                    <span className="ml-2 text-xs text-gray-500">Added on {topic.dateAdded}</span>
                  )}
                </div>
                {topic.description && <p className="mt-1 text-gray-600">{topic.description}</p>}
                
                {/* Progress bar */}
                {(topic.problems.length > 0 || topic.videos.length > 0) && (
                  <div className="mt-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-gray-700">Progress</span>
                      <span className="text-xs font-medium text-gray-700">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-gray-500 hover:text-blue-500"
                  aria-label="Edit"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
                <button
                  onClick={() => onDeleteTopic(topic.id)}
                  className="p-2 text-gray-500 hover:text-red-500"
                  aria-label="Delete"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex">
          <button
            onClick={() => setActiveTab('problems')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'problems'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Problems
            {topic.problems.length > 0 && (
              <span className="ml-2 bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                {topic.problems.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'videos'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Videos
            {topic.videos.length > 0 && (
              <span className="ml-2 bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                {topic.videos.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'notes'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Notes
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'problems' && (
          <div>
            {/* Add Problem Form */}
            <form onSubmit={handleAddProblem} className="mb-4">
              <div className="flex">
                <input
                  type="text"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add problem link (e.g. https://leetcode.com/problems/...)"
                  value={newProblem}
                  onChange={(e) => setNewProblem(e.target.value)}
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
            </form>

            {/* Problem List */}
            <div className="space-y-3">
              {topic.problems.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">No problems added yet</p>
                  <p className="text-xs text-gray-400">Add problem links to get started</p>
                </div>
              ) : (
                topic.problems.map(problem => (
                  <div 
                    key={problem.id} 
                    className={`flex items-center justify-between p-3 rounded-md ${problem.completed ? 'bg-green-50 border border-green-100' : 'bg-gray-50'}`}
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={problem.completed || false}
                        onChange={() => onToggleProblemCompletion(topic.id, problem.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                      />
                      <a 
                        href={problem.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`${problem.completed ? 'text-gray-500 line-through' : 'text-blue-600 hover:text-blue-800'} truncate`}
                      >
                        {problem.link}
                      </a>
                    </div>
                    <div className="flex space-x-2">
                      <Link 
                        to="/collab-room" 
                        state={{ problemLink: problem.link }}
                        className="p-1.5 text-white bg-green-600 rounded-md hover:bg-green-700 flex items-center"
                        title="Join Collab Room"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                        <span className="text-xs">Collab</span>
                      </Link>
                      <button
                        onClick={() => onRemoveProblem(topic.id, problem.id)}
                        className="p-1.5 text-white bg-red-600 rounded-md hover:bg-red-700"
                        title="Remove"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'videos' && (
          <div>
            {/* Add Video Form */}
            <form onSubmit={handleAddVideo} className="mb-4">
              <div className="flex">
                <input
                  type="text"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add YouTube video or playlist URL"
                  value={newVideo}
                  onChange={(e) => setNewVideo(e.target.value)}
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
            </form>

            {/* Video List */}
            <div className="space-y-6">
              {topic.videos.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">No videos added yet</p>
                  <p className="text-xs text-gray-400">Add YouTube videos or playlists</p>
                </div>
              ) : (
                topic.videos.map(video => (
                  <div key={video.id} className={`space-y-3 p-3 rounded-md ${video.watched ? 'bg-green-50 border border-green-100' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1">
                        <input
                          type="checkbox"
                          checked={video.watched || false}
                          onChange={() => onToggleVideoWatched(topic.id, video.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                        />
                        <div className="flex-1">
                          <div className="truncate text-blue-600">
                            {getVideoTitle(video.link)}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {video.link}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-3">
                        <Link 
                          to="/watch-video" 
                          state={{ videoLink: video.link }}
                          className="p-1.5 text-white bg-purple-600 rounded-md hover:bg-purple-700 flex items-center"
                          title="Watch Video Together"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          </svg>
                          <span className="text-xs">Watch</span>
                        </Link>
                        <button
                          onClick={() => onRemoveVideo(topic.id, video.id)}
                          className="p-1.5 text-white bg-red-600 rounded-md hover:bg-red-700"
                          title="Remove"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    {isYouTubeUrl(video.link) && (
                      <div className="aspect-w-16 aspect-h-9 rounded-md overflow-hidden">
                        <iframe 
                          src={getYouTubeEmbedUrl(video.link)} 
                          title="YouTube video player" 
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                          allowFullScreen
                          className="w-full h-48 md:h-60 lg:h-72"
                        ></iframe>
                      </div>
                    )}
                    
                    {isPlaylist(video.link) && (
                      <div className="mt-2">
                        <div className="text-sm font-medium text-purple-700">YouTube Playlist</div>
                        <div className="text-xs text-gray-500">
                          Click "Watch" to open this playlist in the Watch Together room
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows="6"
              placeholder="Add your notes here..."
              value={topic.notes}
              onChange={(e) => onUpdateNotes(topic.id, e.target.value)}
            ></textarea>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopicCard;
