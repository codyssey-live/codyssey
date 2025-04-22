import { useState } from "react";
import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';
import { format } from "date-fns";
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

// Update the calendarStyles constant at the top of the file
const calendarStyles = `
  .react-calendar {
    background-color: #ffffff !important;
    border-color: #d1d5db !important;
    color: #1f2937 !important;
  }
  .react-calendar__tile {
    color: #1f2937 !important;
    background: none !important;
  }
  .react-calendar__tile:enabled:hover,
  .react-calendar__tile:enabled:focus,
  .react-calendar__tile--active {
    background-color: #3b82f6 !important;
    color: white !important;
  }
  .react-calendar__tile--now {
    background-color: #e5e7eb !important;
  }
  .react-calendar__navigation button {
    color: #1f2937 !important;
    background: none !important;
  }
  .react-calendar__navigation button:disabled {
    background-color: #e5e7eb !important;
  }
  .react-calendar__navigation button:enabled:hover,
  .react-calendar__navigation button:enabled:focus {
    background-color: #e5e7eb !important;
  }
  .react-calendar__month-view__days__day--weekend {
    color: #ef4444 !important;
  }
  .react-calendar__month-view__days__day--neighboringMonth {
    color: #6b7280 !important;
  }
  .react-calendar__month-view__weekdays__weekday {
    color: #1f2937 !important;
  }
  .react-calendar__month-view__weekdays__weekday abbr {
    text-decoration: none !important;
  }
`;

// Add this at the top of the file, after the imports
const initialSyllabusDays = [
  {
    id: 1,
    date: new Date(),
    title: "Getting Started",
    description: "Introduction to DSA",
    problems: [],
    resources: []
  }
];

const difficultyColors = {
  Easy: "bg-green-100 text-green-800",
  Medium: "bg-yellow-100 text-yellow-800",
  Hard: "bg-red-100 text-red-800"
};

const Syllabus = () => {
  const [syllabusDays, setSyllabusDays] = useState(initialSyllabusDays);
  const [selectedDay, setSelectedDay] = useState(initialSyllabusDays[0]);
  
  // Modal states
  const [showAddDayModal, setShowAddDayModal] = useState(false);
  const [showAddProblemModal, setShowAddProblemModal] = useState(false);
  const [showAddResourceModal, setShowAddResourceModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  
  // New day form state
  const [newDayTitle, setNewDayTitle] = useState("");
  const [newDayDescription, setNewDayDescription] = useState("");
  const [newDayDate, setNewDayDate] = useState(new Date());
  
  // New problem form state
  const [newProblemTitle, setNewProblemTitle] = useState("");
  const [newProblemDifficulty, setNewProblemDifficulty] = useState("Easy");
  const [newProblemPlatform, setNewProblemPlatform] = useState("LeetCode");
  const [newProblemUrl, setNewProblemUrl] = useState("");
  
  // New resource form state
  const [newResourceTitle, setNewResourceTitle] = useState("");
  const [newResourceType, setNewResourceType] = useState("video"); // Default to single video
  const [newResourceUrl, setNewResourceUrl] = useState("");

  const handleAddDay = () => {
    if (!newDayTitle || !newDayDate) return;
    
    const newDay = {
      id: syllabusDays.length + 1,
      date: newDayDate,
      title: newDayTitle,
      description: newDayDescription,
      problems: [],
      resources: [],
    };
    
    setSyllabusDays([...syllabusDays, newDay]);
    setNewDayTitle("");
    setNewDayDescription("");
    setNewDayDate(new Date());
    setShowAddDayModal(false);
  };

  const handleAddProblem = () => {
    if (!selectedDay || !newProblemTitle || !newProblemUrl) return;
    
    const newProblem = {
      id: Date.now(),
      title: newProblemTitle,
      difficulty: newProblemDifficulty,
      platform: newProblemPlatform,
      url: newProblemUrl,
    };
    
    const updatedDays = syllabusDays.map(day => 
      day.id === selectedDay.id 
        ? { ...day, problems: [...day.problems, newProblem] }
        : day
    );
    
    setSyllabusDays(updatedDays);
    setSelectedDay({ ...selectedDay, problems: [...selectedDay.problems, newProblem] });
    setNewProblemTitle("");
    setNewProblemUrl("");
    setShowAddProblemModal(false);
  };

  const handleAddResource = () => {
    if (!selectedDay || !newResourceTitle || !newResourceUrl) return;
    
    const newResource = {
      id: Date.now(),
      title: newResourceTitle,
      type: 'video', // Set type explicitly to 'video'
      url: newResourceUrl,
    };
    
    const updatedDays = syllabusDays.map(day => 
      day.id === selectedDay.id 
        ? { ...day, resources: [...day.resources, newResource] }
        : day
    );
    
    setSyllabusDays(updatedDays);
    setSelectedDay({ ...selectedDay, resources: [...selectedDay.resources, newResource] });
    setNewResourceTitle("");
    setNewResourceUrl("");
    setNewResourceType("video"); // Reset the type
    setShowAddResourceModal(false);
  };

  const handleDeleteProblem = (problemId) => {
    if (!selectedDay) return;
    
    const updatedDays = syllabusDays.map(day => 
      day.id === selectedDay.id 
        ? { ...day, problems: day.problems.filter(p => p.id !== problemId) }
        : day
    );
    
    setSyllabusDays(updatedDays);
    setSelectedDay({ 
      ...selectedDay, 
      problems: selectedDay.problems.filter(p => p.id !== problemId) 
    });
  };

  const handleDeleteResource = (resourceId) => {
    if (!selectedDay) return;
    
    const updatedDays = syllabusDays.map(day => 
      day.id === selectedDay.id 
        ? { ...day, resources: day.resources.filter(r => r.id !== resourceId) }
        : day
    );
    
    setSyllabusDays(updatedDays);
    setSelectedDay({ 
      ...selectedDay, 
      resources: selectedDay.resources.filter(r => r.id !== resourceId) 
    });
  };

  const handleSaveSyllabus = () => {
    // In a real app, this would save to backend
    console.log("Saving syllabus:", syllabusDays);
    alert("Syllabus saved successfully!");
  };

  const getResourceIcon = (type) => {
    switch (type) {
      case 'video':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
        );
      case 'article':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        );
      case 'code':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <style>{calendarStyles}</style>
      <div className="min-h-screen bg-blue-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">DSA Learning Syllabus</h1>
            <p className="text-gray-600">Plan and organize your DSA learning journey</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setShowAddDayModal(true)}
              className="bg-[#7C3AED] text-white px-5 py-2.5 rounded-lg flex items-center hover:bg-purple-600 transition-colors shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Study Day
            </button>
            <button 
              onClick={handleSaveSyllabus}
              className="border border-gray-300 bg-white text-gray-700 px-5 py-2.5 rounded-lg flex items-center hover:bg-gray-100 transition-colors shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
              </svg>
              Save Syllabus
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar with Study Days */}
          <div className="bg-[#1e293b] rounded-lg shadow overflow-hidden border border-gray-700">
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">Study Days</h2>
              <p className="text-sm text-gray-400">Your planned learning schedule</p>
            </div>
            <div className="p-0">
              <div className="space-y-1">
                {syllabusDays.map((day) => (
                  <div
                    key={day.id}
                    onClick={() => setSelectedDay(day)}
                    className={`px-4 py-3 cursor-pointer hover:bg-[#2d3748] transition-colors ${
                      selectedDay?.id === day.id ? "bg-[#2d3748]" : ""
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">{day.title}</h3>
                      <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                        {format(new Date(day.date), "MMM d")}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                      <span>{day.problems.length} problems</span>
                      <span>•</span>
                      <span>{day.resources.length} resources</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="md:col-span-3 space-y-6">
            {selectedDay ? (
              <div className="bg-[#1e293b] rounded-lg shadow-lg border border-gray-700 p-6">
                {/* Day Header */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-white">{selectedDay.title}</h2>
                      <span className="bg-purple-900 text-purple-300 text-sm px-2.5 py-1 rounded-full">
                        {format(new Date(selectedDay.date), "MMM d, yyyy")}
                      </span>
                    </div>
                    <button className="mt-2 text-gray-300 border border-gray-600 hover:bg-[#2d3748] font-medium rounded-lg text-sm px-3.5 py-2 bg-[#1e293b]">
                      Edit Day
                    </button>
                  </div>
                </div>

                {/* Problems Card */}
                <div className="bg-[#1e293b] rounded-lg shadow overflow-hidden border border-gray-700 mb-6">
                  <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="font-semibold text-lg text-white">Problems</h3>
                    <button 
                      onClick={() => setShowAddProblemModal(true)}
                      className="bg-[#7C3AED] text-white px-3 py-1.5 text-sm rounded-lg hover:bg-[#6D28D9] transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 inline" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Add Problem
                    </button>
                  </div>
                  <div className="p-4">
                    {selectedDay.problems.length > 0 ? (
                      <div className="space-y-3">
                        {selectedDay.problems.map((problem) => (
                          <div 
                            key={problem.id}
                            className="flex items-center justify-between p-3 border border-gray-700 rounded-md hover:bg-[#2d3748] bg-[#1e293b]"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-medium">{problem.title}</h4>
                                <span className={`text-xs ${difficultyColors[problem.difficulty]} px-2 py-0.5 rounded-full`}>
                                  {problem.difficulty}
                                </span>
                                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                                  {problem.platform}
                                </span>
                              </div>
                              <div className="mt-2 flex items-center gap-3">
                                <Link 
                                  to="/collab-room" 
                                  state={{ problemLink: problem.url }}
                                  className="text-sm text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg flex items-center transition-colors shadow-sm"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                  Collaborate
                                </Link>
                                <a 
                                  href={problem.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-sm text-purple-700 hover:text-purple-900 flex items-center gap-1"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                  View Problem
                                </a>
                              </div>
                            </div>
                            <button 
                              onClick={() => handleDeleteProblem(problem.id)}
                              className="p-1.5 text-gray-500 hover:text-red-600 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>No problems added yet. Click "Add Problem" to get started.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Videos Section (replacing Resources Card) */}
                <div className="bg-[#1e293b] rounded-lg shadow overflow-hidden border border-gray-700">
                  <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="font-semibold text-lg text-white">Learning Videos</h3>
                    <button 
                      onClick={() => setShowAddResourceModal(true)}
                      className="bg-[#7C3AED] text-white px-3 py-1.5 text-sm rounded-lg hover:bg-[#6D28D9] transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 inline" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Add Video
                    </button>
                  </div>
                  <div className="p-4">
                    {selectedDay.resources.filter(r => r.type === 'video').length > 0 ? (
                      <div className="space-y-3">
                        {selectedDay.resources
                          .filter(resource => resource.type === 'video')
                          .map((video) => (
                            <div 
                              key={video.id}
                              className="flex items-center justify-between p-3 border border-gray-700 rounded-md hover:bg-[#2d3748] bg-[#1e293b]"
                            >
                              <div className="flex-1 flex items-center gap-3">
                                <div className="h-9 w-9 rounded-md flex items-center justify-center bg-red-900 text-red-300">
                                  {getResourceIcon('video')}
                                </div>
                                <div>
                                  <h4 className="font-medium text-white">{video.title}</h4>
                                  <div className="mt-1 flex items-center gap-3">
                                    <Link 
                                      to="/watch-video" 
                                      state={{ videoLink: video.url }}
                                      className="text-sm text-white bg-purple-600 hover:bg-purple-700 px-3 py-1.5 rounded-lg flex items-center transition-colors shadow-sm"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                      </svg>
                                      Watch Together
                                    </Link>
                                    <a 
                                      href={video.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-sm text-purple-300 hover:text-purple-200 flex items-center gap-1"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                      </svg>
                                      Open video
                                    </a>
                                  </div>
                                </div>
                              </div>
                              <button 
                                onClick={() => handleDeleteResource(video.id)}
                                className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <p>No videos added yet. Click "Add Video" to get started.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center p-12 border rounded-lg bg-[#1e293b] shadow border-gray-700">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-white">No study day selected</h3>
                  <p className="text-gray-400">Choose a day from the list or create a new one</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Day Modal */}
      {showAddDayModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Add New Study Day</h3>
              <button
                onClick={() => setShowAddDayModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="day-title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  id="day-title"
                  type="text"
                  placeholder="e.g., Array Fundamentals"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  value={newDayTitle}
                  onChange={(e) => setNewDayTitle(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="day-description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  id="day-description"
                  type="text"
                  placeholder="A short description of the topic"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  value={newDayDescription}
                  onChange={(e) => setNewDayDescription(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 bg-white"
                  >
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {format(newDayDate, "MMMM d, yyyy")}
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {showCalendar && (
                    <div className="absolute left-0 z-10 mt-1">
                      <div className="bg-white rounded-lg shadow-lg p-1 border border-gray-200">
                        <Calendar
                          value={newDayDate}
                          onChange={(date) => {
                            setNewDayDate(date);
                            setShowCalendar(false);
                          }}
                          className="rounded-lg"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddDayModal(false)}
                  className="mr-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-600 hover:text-white hover:border-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddDay}
                  className="px-4 py-2 bg-[#7C3AED] text-white rounded-lg hover:bg-purple-600"
                >
                  Add Day
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Problem Modal */}
      {showAddProblemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Add New Problem</h3>
              <button
                onClick={() => setShowAddProblemModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="problem-title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  id="problem-title"
                  type="text"
                  placeholder="e.g., Two Sum"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  value={newProblemTitle}
                  onChange={(e) => setNewProblemTitle(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="problem-difficulty" className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty
                </label>
                <select
                  id="problem-difficulty"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 bg-white"
                  value={newProblemDifficulty}
                  onChange={(e) => setNewProblemDifficulty(e.target.value)}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              <div>
                <label htmlFor="problem-platform" className="block text-sm font-medium text-gray-700 mb-1">
                  Platform
                </label>
                <select
                  id="problem-platform"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 bg-white"
                  value={newProblemPlatform}
                  onChange={(e) => setNewProblemPlatform(e.target.value)}
                >
                  <option value="LeetCode">LeetCode</option>
                  <option value="HackerRank">HackerRank</option>
                  <option value="CodeForces">CodeForces</option>
                  <option value="GeeksforGeeks">GeeksforGeeks</option>
                </select>
              </div>
              <div>
                <label htmlFor="problem-url" className="block text-sm font-medium text-gray-700 mb-1">
                  URL
                </label>
                <input
                  id="problem-url"
                  type="text"
                  placeholder="https://leetcode.com/problems/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  value={newProblemUrl}
                  onChange={(e) => setNewProblemUrl(e.target.value)}
                />
              </div>
              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddProblemModal(false)}
                  className="mr-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-600 hover:text-white hover:border-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddProblem}
                  className="px-4 py-2 bg-[#7C3AED] text-white rounded-lg hover:bg-purple-600"
                >
                  Add Problem
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Video Modal */}
      {showAddResourceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Add New Video</h3>
              <button
                onClick={() => setShowAddResourceModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="video-title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  id="video-title"
                  type="text"
                  placeholder="e.g., Array Data Structure Tutorial"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  value={newResourceTitle}
                  onChange={(e) => setNewResourceTitle(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="video-type" className="block text-sm font-medium text-gray-700 mb-1">
                  Video Type
                </label>
                <select
                  id="video-type"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 bg-white"
                  value={newResourceType}
                  onChange={(e) => setNewResourceType(e.target.value)}
                >
                  <option value="video">Single Video</option>
                  <option value="playlist">Video Playlist</option>
                </select>
              </div>
              <div>
                <label htmlFor="video-url" className="block text-sm font-medium text-gray-700 mb-1">
                  URL
                </label>
                <input
                  id="video-url"
                  type="text"
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  value={newResourceUrl}
                  onChange={(e) => setNewResourceUrl(e.target.value)}
                />
              </div>
              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddResourceModal(false)}
                  className="mr-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-600 hover:text-white hover:border-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddResource}
                  className="px-4 py-2 bg-[#7C3AED] text-white rounded-lg hover:bg-purple-600"
                >
                  Add Video
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default Syllabus;
