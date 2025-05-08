import { useState } from "react";
import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';
import { format } from "date-fns";
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { motion } from "framer-motion";

// Updated calendar styles for dark theme
const calendarStyles = `
  .react-calendar {
    background-color: rgba(255, 255, 255, 0.1) !important;
    backdrop-filter: blur(8px) !important;
    border-color: rgba(255, 255, 255, 0.2) !important;
    color: white !important;
    border-radius: 0.75rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }
  .react-calendar__tile {
    color: white !important;
    background: none !important;
    padding: 0.75rem 0.5rem;
  }
  .react-calendar__tile:enabled:hover,
  .react-calendar__tile:enabled:focus,
  .react-calendar__tile--active {
    background-color: #94C3D2 !important;
    color: white !important;
  }
  .react-calendar__tile--now {
    background-color: rgba(148, 195, 210, 0.3) !important;
  }
  .react-calendar__navigation button {
    color: white !important;
    background: none !important;
  }
  .react-calendar__navigation button:disabled {
    background-color: rgba(255, 255, 255, 0.05) !important;
  }
  .react-calendar__navigation button:enabled:hover,
  .react-calendar__navigation button:enabled:focus {
    background-color: rgba(255, 255, 255, 0.1) !important;
  }
  .react-calendar__month-view__days__day--weekend {
    color: #ff99a8 !important;
  }
  .react-calendar__month-view__days__day--neighboringMonth {
    color: rgba(255, 255, 255, 0.5) !important;
  }
  .react-calendar__month-view__weekdays__weekday {
    color: rgba(255, 255, 255, 0.8) !important;
  }
  .react-calendar__month-view__weekdays__weekday abbr {
    text-decoration: none !important;
    font-weight: 500;
  }
`;

// Initial study days
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

// Difficulty badge color mapping - updated for new theme
const difficultyColors = {
  Easy: "bg-green-900/50 text-green-200 border border-green-600/30",
  Medium: "bg-yellow-900/50 text-yellow-200 border border-yellow-600/30",
  Hard: "bg-red-900/50 text-red-200 border border-red-600/30"
};

const Syllabus = () => {
  const [syllabusDays, setSyllabusDays] = useState(initialSyllabusDays);
  const [selectedDay, setSelectedDay] = useState(initialSyllabusDays[0]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  
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
  const [newResourceType, setNewResourceType] = useState("video");
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
      type: 'video',
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
      default:
        return null;
    }
  };

  return (
    <>
      <style>{calendarStyles}</style>
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#334155] to-[#0f172a] text-white">
        <Navbar />
        
        {/* Animated background elements removed for better visibility */}
        
        <div className="container mx-auto px-4 py-8 relative z-10">
          {/* Header Section */}
          <motion.div 
            className="flex justify-between items-center mb-8"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-[#94C3D2] bg-clip-text text-transparent">DSA Learning Syllabus</h1>
              <p className="text-[#94C3D2]/80 mt-1">Plan and organize your DSA learning journey</p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowAddDayModal(true)}
                className="bg-white/10 border border-white/20 text-white/95 hover:bg-white/20 px-4 py-2.5 rounded-lg flex items-center shadow-sm backdrop-blur-sm transition-colors"
                style={{ textShadow: "0 0 10px rgba(255, 255, 255, 0.3)" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#94C3D2]" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add Study Day
              </button>
              <button 
                onClick={handleSaveSyllabus}
                className="bg-[#94C3D2] text-white px-5 py-2.5 rounded-lg flex items-center shadow-sm hover:bg-[#7EB5C3] transition-colors"
                style={{ textShadow: "0 0 10px rgba(255, 255, 255, 0.3)" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293z" />
                </svg>
                Save Syllabus
              </button>
            </div>
          </motion.div>
          
          {/* Tab Navigation */}
          <motion.div 
            className="mb-6 border-b border-white/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
              {syllabusDays.map((day, index) => (
                <button
                  key={day.id}
                  onClick={() => {
                    setSelectedDay(day);
                    setActiveTabIndex(index);
                  }}
                  className={`
                    px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap
                    ${activeTabIndex === index 
                      ? 'border-b-2 border-[#94C3D2] text-white/95 bg-white/10 backdrop-blur-sm' 
                      : 'text-white/95 hover:text-white hover:bg-white/5'}
                  `}
                >
                  <div className="flex items-center">
                    <span>{day.title}</span>
                    <span className="ml-2 bg-white/10 text-white/95 text-xs px-2 py-0.5 rounded-full border border-white/20">
                      {format(new Date(day.date), "MMM d")}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
          
          {/* Main Content Area */}
          <motion.div 
            className="bg-white/10 rounded-2xl shadow-lg border border-white/20 p-6 backdrop-blur-md"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            {selectedDay ? (
              <div>
                {/* Day Header */}
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-[#94C3D2] bg-clip-text text-transparent">{selectedDay.title}</h2>
                      <span className="bg-[#94C3D2]/20 text-[#94C3D2] text-sm px-2.5 py-1 rounded-full border border-[#94C3D2]/30">
                        {format(new Date(selectedDay.date), "MMM d, yyyy")}
                      </span>
                    </div>
                    <p className="text-white/95 mt-1">{selectedDay.description}</p>
                  </div>
                  <button 
                    className="text-white/80 border border-white/20 hover:bg-white/10 font-medium rounded-lg text-sm px-4 py-2 bg-white/5 backdrop-blur-sm"
                  >
                    Edit Day
                  </button>
                </div>

                {/* Problems Section */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-[#94C3D2]">Problems</h3>
                    <button 
                      onClick={() => setShowAddProblemModal(true)}
                      className="bg-white/10 text-white/95 px-3 py-2 text-sm rounded-lg border border-white/20 hover:bg-white/20 transition-colors shadow-sm backdrop-blur-sm flex items-center"
                      style={{ textShadow: "0 0 10px rgba(255, 255, 255, 0.3)" }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-[#94C3D2]" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Add Problem
                    </button>
                  </div>
                  
                  <div className="bg-white/5 rounded-xl p-1 backdrop-blur-sm">
                    {selectedDay.problems.length > 0 ? (
                      <div className="space-y-2">
                        {selectedDay.problems.map((problem) => (
                          <div 
                            key={problem.id}
                            className="flex items-center justify-between p-4 bg-white/10 rounded-lg border border-white/20 hover:bg-white/15 transition-all"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-medium text-white/95">{problem.title}</h4>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${difficultyColors[problem.difficulty]}`}>
                                  {problem.difficulty}
                                </span>
                                <span className="text-xs bg-white/10 text-white/75 px-2 py-0.5 rounded-full border border-white/20">
                                  {problem.platform}
                                </span>
                              </div>
                              <div className="mt-2 flex items-center gap-3">
                                <Link 
                                  to="/collab-room" 
                                  state={{ problemLink: problem.url }}
                                  className="text-sm text-white bg-[#94C3D2] hover:bg-[#7EB5C3] px-3 py-1.5 rounded-lg flex items-center transition-colors shadow-sm"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 01-2-2v8a2 2 0 002 2z" />
                                  </svg>
                                  Collaborate
                                </Link>
                                <a 
                                  href={problem.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-sm text-white/80 hover:text-white flex items-center gap-1"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                  View Problem
                                </a>
                              </div>
                            </div>
                            <button 
                              onClick={() => handleDeleteProblem(problem.id)}
                              className="p-1.5 text-red-400 hover:text-red-600 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"/>
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-white/70 bg-white/5 rounded-lg">
                        <p>No problems added yet. Click "Add Problem" to get started.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Learning Videos Section */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-[#94C3D2]">Learning Videos</h3>
                    <button 
                      onClick={() => setShowAddResourceModal(true)}
                      className="bg-white/10 text-white/95 px-3 py-2 text-sm rounded-lg border border-white/20 hover:bg-white/20 transition-colors shadow-sm backdrop-blur-sm flex items-center"
                      style={{ textShadow: "0 0 10px rgba(255, 255, 255, 0.3)" }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-[#94C3D2]" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Add Video
                    </button>
                  </div>
                  
                  <div className="bg-white/5 rounded-xl p-1 backdrop-blur-sm">
                    {selectedDay.resources.filter(r => r.type === 'video').length > 0 ? (
                      <div className="space-y-2">
                        {selectedDay.resources
                          .filter(resource => resource.type === 'video')
                          .map((video) => (
                            <div 
                              key={video.id}
                              className="flex items-center justify-between p-4 bg-white/10 rounded-lg border border-white/20 hover:bg-white/15 transition-all"
                            >
                              <div className="flex-1 flex items-center gap-3">
                                <div className="h-9 w-9 rounded-md flex items-center justify-center bg-red-900/30 text-red-300 border border-red-500/30">
                                  {getResourceIcon('video')}
                                </div>
                                <div>
                                  <h4 className="font-medium text-white/95">{video.title}</h4>
                                  <div className="mt-1 flex items-center gap-3">
                                    <Link 
                                      to="/lecture-room" 
                                      state={{ videoLink: video.url }}
                                      className="text-sm text-white bg-[#94C3D2] hover:bg-[#7EB5C3] px-3 py-1.5 rounded-lg flex items-center transition-colors shadow-sm"
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
                                      className="text-sm text-white/80 hover:text-white flex items-center gap-1"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                      </svg>
                                      Open video
                                    </a>
                                  </div>
                                </div>
                              </div>
                              <button 
                                onClick={() => handleDeleteResource(video.id)}
                                className="p-1.5 text-red-400 hover:text-red-600 transition-colors"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-white/75 bg-white/5 rounded-lg">
                        <p>No videos added yet. Click "Add Video" to get started.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <svg className="h-12 w-12 text-[#94C3D2]/60 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <h3 className="text-lg font-medium text-white mb-1">No study day selected</h3>
                  <p className="text-gray-300">Create your first study day to get started with your syllabus</p>
                  <button 
                    onClick={() => setShowAddDayModal(true)}
                    className="mt-4 bg-[#94C3D2] text-white px-4 py-2 rounded-lg text-sm shadow-sm hover:bg-[#7EB5C3] transition-colors"
                    style={{ textShadow: "0 0 10px rgba(255, 255, 255, 0.3)" }}
                  >
                    Create Study Day
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Add Day Modal - Updated with signup/login card styling */}
        {showAddDayModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl w-full max-w-md p-6 border border-white/20 overflow-hidden relative"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-[#94C3D2] bg-clip-text text-transparent">Add New Study Day</h3>
                <button
                  onClick={() => setShowAddDayModal(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-5">
                <div>
                  <label htmlFor="day-title" className="block text-sm font-medium text-[#94C3D2] mb-1.5">
                    Title
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      id="day-title"
                      type="text"
                      placeholder="e.g., Array Fundamentals"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#94C3D2]/50 focus:border-[#94C3D2] text-gray-100 placeholder-gray-400"
                      value={newDayTitle}
                      onChange={(e) => setNewDayTitle(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="day-description" className="block text-sm font-medium text-[#94C3D2] mb-1.5">
                    Description
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V7a2 2 0 012-2z" />
                      </svg>
                    </div>
                    <input
                      id="day-description"
                      type="text"
                      placeholder="A short description of the topic"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#94C3D2]/50 focus:border-[#94C3D2] text-gray-100 placeholder-gray-400"
                      value={newDayDescription}
                      onChange={(e) => setNewDayDescription(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#94C3D2] mb-1.5">
                    Date
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      type="date"
                      id="day-date"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#94C3D2]/50 focus:border-[#94C3D2] text-gray-100 appearance-none"
                      value={newDayDate.toISOString().split('T')[0]}
                      onChange={(e) => setNewDayDate(new Date(e.target.value))}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddDayModal(false)}
                    className="px-4 py-2.5 bg-white/10 border border-white/20 text-white/95 rounded-lg hover:bg-white/20 transition-colors backdrop-blur-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddDay}
                    className="w-full bg-[#94C3D2] hover:bg-[#7EB5C3] transition-all py-2.5 rounded-lg text-white font-medium shadow-lg"
                  >
                    Add Day
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Add Problem Modal - Updated with signup/login card styling */}
        {showAddProblemModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl w-full max-w-md p-6 border border-white/20 overflow-hidden relative"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-[#94C3D2] bg-clip-text text-transparent">Add New Problem</h3>
                <button
                  onClick={() => setShowAddProblemModal(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-5">
                <div>
                  <label htmlFor="problem-title" className="block text-sm font-medium text-[#94C3D2] mb-1.5">
                    Title
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      id="problem-title"
                      type="text"
                      placeholder="e.g., Two Sum"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#94C3D2]/50 focus:border-[#94C3D2] text-gray-100 placeholder-gray-400"
                      value={newProblemTitle}
                      onChange={(e) => setNewProblemTitle(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="problem-difficulty" className="block text-sm font-medium text-[#94C3D2] mb-1.5">
                    Difficulty
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <select
                      id="problem-difficulty"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#94C3D2]/50 focus:border-[#94C3D2] text-gray-100 appearance-none"
                      value={newProblemDifficulty}
                      onChange={(e) => setNewProblemDifficulty(e.target.value)}
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="problem-platform" className="block text-sm font-medium text-[#94C3D2] mb-1.5">
                    Platform
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <select
                      id="problem-platform"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#94C3D2]/50 focus:border-[#94C3D2] text-gray-100 appearance-none"
                      value={newProblemPlatform}
                      onChange={(e) => setNewProblemPlatform(e.target.value)}
                    >
                      <option value="LeetCode">LeetCode</option>
                      <option value="HackerRank">HackerRank</option>
                      <option value="CodeForces">CodeForces</option>
                      <option value="GeeksforGeeks">GeeksforGeeks</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="problem-url" className="block text-sm font-medium text-[#94C3D2] mb-1.5">
                    URL
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <input
                      id="problem-url"
                      type="text"
                      placeholder="https://leetcode.com/problems/..."
                      className="w-full pl-10 pr-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#94C3D2]/50 focus:border-[#94C3D2] text-gray-100 placeholder-gray-400"
                      value={newProblemUrl}
                      onChange={(e) => setNewProblemUrl(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddProblemModal(false)}
                    className="px-4 py-2.5 bg-white/10 border border-white/20 text-white/95 rounded-lg hover:bg-white/20 transition-colors backdrop-blur-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddProblem}
                    className="w-full bg-[#94C3D2] hover:bg-[#7EB5C3] transition-all py-2.5 rounded-lg text-white font-medium shadow-lg"
                  >
                    Add Problem
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Add Video Modal - Updated with signup/login card styling */}
        {showAddResourceModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl w-full max-w-md p-6 border border-white/20 overflow-hidden relative"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-[#94C3D2] bg-clip-text text-transparent">Add New Video</h3>
                <button
                  onClick={() => setShowAddResourceModal(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-5">
                <div>
                  <label htmlFor="video-title" className="block text-sm font-medium text-[#94C3D2] mb-1.5">
                    Title
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      id="video-title"
                      type="text"
                      placeholder="e.g., Array Data Structure Tutorial"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#94C3D2]/50 focus:border-[#94C3D2] text-gray-100 placeholder-gray-400"
                      value={newResourceTitle}
                      onChange={(e) => setNewResourceTitle(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="video-type" className="block text-sm font-medium text-[#94C3D2] mb-1.5">
                    Video Type
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                      </svg>
                    </div>
                    <select
                      id="video-type"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#94C3D2]/50 focus:border-[#94C3D2] text-gray-100 appearance-none"
                      value={newResourceType}
                      onChange={(e) => setNewResourceType(e.target.value)}
                    >
                      <option value="video">Single Video</option>
                      <option value="playlist">Video Playlist</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="video-url" className="block text-sm font-medium text-[#94C3D2] mb-1.5">
                    URL
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <input
                      id="video-url"
                      type="text"
                      placeholder="https://youtube.com/watch?v=..."
                      className="w-full pl-10 pr-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#94C3D2]/50 focus:border-[#94C3D2] text-gray-100 placeholder-gray-400"
                      value={newResourceUrl}
                      onChange={(e) => setNewResourceUrl(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddResourceModal(false)}
                    className="px-4 py-2.5 bg-white/10 border border-white/20 text-white/95 rounded-lg hover:bg-white/20 transition-colors backdrop-blur-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddResource}
                    className="w-full bg-[#94C3D2] hover:bg-[#7EB5C3] transition-all py-2.5 rounded-lg text-white font-medium shadow-lg"
                  >
                    Add Video
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </>
  );
};

export default Syllabus;
