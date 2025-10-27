import { useState, useEffect, useRef } from "react";
import Navbar from '../components/Navbar';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { format } from "date-fns";
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { motion, AnimatePresence } from "framer-motion";
import apiClient from '../utils/apiClient';
import { fetchSyllabus, saveSyllabus, deleteStudyDay } from '../utils/syllabusApiUtils';
import { useRoom } from '../context/RoomContext';

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

// Difficulty badge color mapping - updated for new theme
const difficultyColors = {
  Easy: "bg-green-900/50 text-white/90 border border-green-600/30",
  Medium: "bg-yellow-900/50 text-yellow-200 border border-yellow-600/30",
  Hard: "bg-red-900/50 text-red-200 border border-red-600/30"
};

// Custom Notification Component
const Notification = ({ id, message, type, onDismiss }) => {
  // Auto-dismiss after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(id);
    }, 3000);
    return () => clearTimeout(timer);
  }, [id, onDismiss]);
  
  // Set colors based on notification type
  const getBgColor = () => {
    switch (type) {
      case 'success': return 'bg-green-900/60 border-green-500/60';
      case 'error': return 'bg-red-900/70 border-red-500/50';
      case 'warning': return 'bg-yellow-900/70 border-yellow-500/50';
      default: return 'bg-gray-900/70 border-gray-500/50';
    }
  };
  
  const getIconColor = () => {
    switch (type) {
      case 'success': return 'text-white/90';
      case 'error': return 'text-white/90';
      case 'warning': return 'text-white/90';
      case 'info': return 'text-white/90';
      default: return 'text-white/90';
    }
  };
  
  // Icon based on notification type
  const renderIcon = () => {
    const iconClass = `h-5 w-5 ${getIconColor()} mr-2`;
    switch (type) {
      case 'success':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };
  
  return (
    <motion.div 
      className={`flex items-center px-4 py-3 rounded-lg shadow-lg border ${getBgColor()} backdrop-blur-lg`}
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
    >
      {renderIcon()}
      <p className="text-white/90 font-medium">{message}</p>
      <button 
        onClick={() => onDismiss(id)} 
        className="ml-4 text-white/70 hover:text-white transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  );
};

// Main component
const Syllabus = () => {
  const { userId: paramUserId } = useParams();
  const { roomData } = useRoom();
  const [syllabusDays, setSyllabusDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [isViewingOtherUserSyllabus, setIsViewingOtherUserSyllabus] = useState(false);
  const [syllabusOwnerId, setSyllabusOwnerId] = useState(null);
  
  // Notification system state
  const [notifications, setNotifications] = useState([]);
  const notificationIdCounter = useRef(0);
  
  // Add notification function
  const addNotification = (message, type = 'success') => {
    const newId = notificationIdCounter.current++;
    setNotifications(prevNotifications => [
      ...prevNotifications, 
      { id: newId, message, type }
    ]);
  };
  
  // Dismiss notification function
  const dismissNotification = (id) => {
    setNotifications(prevNotifications => 
      prevNotifications.filter(notification => notification.id !== id)
    );
  };

  // Pagination states
  const [problemsPage, setProblemsPage] = useState(1);
  const [resourcesPage, setResourcesPage] = useState(1);
  const itemsPerPage = 5;
  
  // Modal states
  const [showAddDayModal, setShowAddDayModal] = useState(false);
  const [showAddProblemModal, setShowAddProblemModal] = useState(false);
  const [showAddResourceModal, setShowAddResourceModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showEditDayModal, setShowEditDayModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [dayToDelete, setDayToDelete] = useState(null);
  
  // New day form state
  const [newDayTitle, setNewDayTitle] = useState("");
  const [newDayDescription, setNewDayDescription] = useState("");
  const [newDayDate, setNewDayDate] = useState(new Date());
  
  // Edit day form state
  const [editDayId, setEditDayId] = useState(null);
  const [editDayTitle, setEditDayTitle] = useState("");
  const [editDayDescription, setEditDayDescription] = useState("");
  const [editDayDate, setEditDayDate] = useState(new Date());
  
  // New problem form state
  const [newProblemTitle, setNewProblemTitle] = useState("");
  const [newProblemDifficulty, setNewProblemDifficulty] = useState("Easy");
  const [newProblemPlatform, setNewProblemPlatform] = useState("LeetCode");
  const [newProblemUrl, setNewProblemUrl] = useState("");
  
  // New resource form state
  const [newResourceTitle, setNewResourceTitle] = useState("");
  const [newResourceType, setNewResourceType] = useState("video");
  const [newResourceUrl, setNewResourceUrl] = useState("");
    const navigate = useNavigate();

  // Check if a string is a valid MongoDB ObjectID
  const isValidObjectId = (id) => {
    // MongoDB ObjectIDs are 24-character hex strings
    return /^[0-9a-fA-F]{24}$/.test(id);
  };

  // Determine whose syllabus to show and get the correct user ID
  useEffect(() => {
    const determineUserToShow = async () => {
      try {
        let syllabusOwner = null;
        let isOtherUserSyllabus = false;
        const currentUserId = localStorage.getItem('userId');
        
        // Case 1: URL param specified - show that user's syllabus
        if (paramUserId) {
         
          
          // Check if the provided ID is a valid MongoDB ObjectID
          if (paramUserId !== 'syllabus' && !isValidObjectId(paramUserId)) {
           
            navigate('/dashboard', { replace: true });
            return;
          }
          
          syllabusOwner = paramUserId;
          isOtherUserSyllabus = paramUserId !== currentUserId;
        }
        // Case 2: In room context - show host's syllabus
        else if (roomData.inRoom && roomData.inviterId) {
          syllabusOwner = roomData.inviterId;
          isOtherUserSyllabus = roomData.inviterId !== currentUserId;
        }
        // Case 3: Default - show current user's syllabus
        else {
          if (currentUserId) {
            syllabusOwner = currentUserId;
            isOtherUserSyllabus = false;
          } else {
            // If no ID in localStorage, fetch from API
            const response = await apiClient.get('/users/me');
            if (response.data && response.data._id) {
              syllabusOwner = response.data._id;
              localStorage.setItem('userId', syllabusOwner); // Cache for future use
              isOtherUserSyllabus = false;
            } else {

            }
          }
        }
        
        setSyllabusOwnerId(syllabusOwner);
        setUserId(syllabusOwner); // Set this for backwards compatibility
        setIsViewingOtherUserSyllabus(isOtherUserSyllabus);
        
      } catch (error) {
        
        navigate('/dashboard', { replace: true });
      }
    };
    
    determineUserToShow();
  }, [paramUserId, roomData]);
  
  // Load syllabus data when syllabusOwnerId is available
  useEffect(() => {
    const loadSyllabus = async () => {
      if (!syllabusOwnerId) {
        return; // Wait until we have a valid user ID
      }
      
      try {
        setIsLoading(true);
        
        const response = await fetchSyllabus(syllabusOwnerId);

        if (response.success && response.data?.data) {
          const serverSyllabus = response.data.data;

          // Map the returned data to the format expected by the UI
          if (serverSyllabus.studyDays && serverSyllabus.studyDays.length > 0) {
            // Transform server data to UI format
            const formattedDays = serverSyllabus.studyDays.map(day => ({
              id: day._id || Date.now() + Math.random(),
              _id: day._id, // Keep the MongoDB ID for later updates
              title: day.title,
              date: new Date(day.date),
              description: day.description,
              problems: day.problems || [],
              resources: day.videos || [] // Map videos to resources
            }));
            
            setSyllabusDays(formattedDays);
            setSelectedDay(formattedDays[0]);
            setActiveTabIndex(0); // Set the first tab as active
          } else {
            // Set default data if no study days found
            const defaultDay = {
              id: Date.now(),
              date: new Date(),
              title: "Getting Started",
              description: "Introduction to DSA",
              problems: [],
              resources: []
            };
            setSyllabusDays([defaultDay]);
            setSelectedDay(defaultDay);
          }
        } else {
          // If loading fails, set default day
          const defaultDay = {
            id: Date.now(),
            date: new Date(),
            title: "Getting Started",
            description: "Introduction to DSA",
            problems: [],
            resources: []
          };
          setSyllabusDays([defaultDay]);
          setSelectedDay(defaultDay);
        }
      } catch (error) {
        
        // Set default data on error
        const defaultDay = {
          id: Date.now(),
          date: new Date(),
          title: "Getting Started",
          description: "Introduction to DSA",
          problems: [],
          resources: []
        };
        setSyllabusDays([defaultDay]);
        setSelectedDay(defaultDay);
      } finally {
        setIsLoading(false);
      }
    };

    loadSyllabus();
  }, [syllabusOwnerId]);

  const handleAddDay = () => {
    if (!newDayTitle || !newDayDate) {
      addNotification("Please provide a title and date for the study day", "error");
      return;
    }
    
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
    
    addNotification("Study day added successfully!");
  };

  const handleEditDay = () => {
    if (!editDayTitle || !editDayDate) {
      addNotification("Please provide a title and date", "error");
      return;
    }
    
    const updatedDays = syllabusDays.map(day => 
      day.id === editDayId 
        ? { ...day, title: editDayTitle, description: editDayDescription, date: editDayDate }
        : day
    );
    
    setSyllabusDays(updatedDays);
    
    // Update the selected day if it was the edited one
    if (selectedDay && selectedDay.id === editDayId) {
      setSelectedDay(updatedDays.find(day => day.id === editDayId));
    }
    
    setShowEditDayModal(false);
    addNotification("Study day updated successfully!");
  };

  const openEditDayModal = (day) => {
    setEditDayId(day.id);
    setEditDayTitle(day.title);
    setEditDayDescription(day.description);
    setEditDayDate(new Date(day.date));
    setShowEditDayModal(true);
  };  const handleDeleteDay = async (dayId) => {
    // First check if we can delete
    if (syllabusDays.length <= 1) {
      setShowDeleteConfirmModal(false);
      setDayToDelete(null);
      addNotification("Cannot delete the only study day. Please add a new day before deleting this one.", "warning");
      return;
    }
    
    try {
      // Try to delete from the database if it has a MongoDB ID
      const mongoId = syllabusDays.find(d => d.id === dayId)?._id;
      
      if (mongoId) {
        const response = await deleteStudyDay(mongoId);
        
        if (!response.success) {
          throw new Error(response.message || 'Failed to delete from database');
        }
      } 
      
      // Update the UI state after successful database operation or if no database record exists
      const updatedDays = syllabusDays.filter(day => day.id !== dayId);
      setSyllabusDays(updatedDays);
      
      // If the deleted day was selected, select the first available day
      if (selectedDay && selectedDay.id === dayId) {
        setSelectedDay(updatedDays[0]);
        setActiveTabIndex(0);
      } else {
        // Adjust activeTabIndex if needed
        const newIndex = Math.max(0, activeTabIndex - (activeTabIndex >= syllabusDays.findIndex(d => d.id === dayId) ? 1 : 0));
        setActiveTabIndex(newIndex);
      }
      
      // Only after all state updates are done, close the modal and show success message
      setShowDeleteConfirmModal(false);
      setDayToDelete(null);
      addNotification("Study day deleted successfully!");
    } catch (error) {

      // Show error notification and keep modal open on error
      addNotification(`Failed to delete study day: ${error.message}`, "error");
    }
  };

  // Show confirmation before deleting
  const confirmDeleteDay = (day) => {
    setDayToDelete(day);
    setShowDeleteConfirmModal(true);
  };
  const handleAddProblem = () => {
    if (!selectedDay) {
      addNotification("No study day selected", "error");
      return;
    }
    
    if (!newProblemTitle || !newProblemUrl) {
      addNotification("Please provide a title and URL for the problem", "error");
      return;
    }
    
    const newProblem = {
      id: Date.now(),
      title: newProblemTitle,
      difficulty: newProblemDifficulty,
      platform: newProblemPlatform,
      url: newProblemUrl,
      dateAdded: new Date(),
      status: 'unsolved',
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
    
    addNotification("Problem added successfully!");
  };

  const handleAddResource = () => {
    if (!selectedDay) {
      addNotification("No study day selected", "error");
      return;
    }
    
    if (!newResourceTitle || !newResourceUrl) {
      addNotification("Please provide a title and URL for the video", "error");
      return;
    }
    
    const newResource = {
      id: Date.now(),
      title: newResourceTitle,
      type: 'single',
      displayType: 'video',
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
    
    addNotification("Video added successfully!");
  };

  const handleDeleteProblem = (problemId) => {
    if (!selectedDay) return;
    
    const updatedDays = syllabusDays.map(day => {
      if (day.id === selectedDay.id) {
        const filteredProblems = day.problems.filter(p => 
          String(p.id) !== String(problemId) && String(p._id) !== String(problemId)
        );
        return { ...day, problems: filteredProblems };
      }
      return day;
    });
    
    setSyllabusDays(updatedDays);
    
    // Update the selected day to reflect the deletion
    const updatedProblems = selectedDay.problems.filter(p => 
      String(p.id) !== String(problemId) && String(p._id) !== String(problemId)
    );
    
    setSelectedDay({ 
      ...selectedDay, 
      problems: updatedProblems
    });
    
    addNotification("Problem deleted successfully!");
  };

  const handleDeleteResource = (resourceId) => {
    if (!selectedDay) return;
    
    const updatedDays = syllabusDays.map(day => {
      if (day.id === selectedDay.id) {
        const filteredResources = day.resources.filter(r => 
          String(r.id) !== String(resourceId) && String(r._id) !== String(resourceId)
        );
        return { ...day, resources: filteredResources };
      }
      return day;
    });
    
    setSyllabusDays(updatedDays);
    
    // Update the selected day to reflect the deletion
    const updatedResources = selectedDay.resources.filter(r => 
      String(r.id) !== String(resourceId) && String(r._id) !== String(resourceId)
    );
    
    setSelectedDay({ 
      ...selectedDay, 
      resources: updatedResources
    });
    
    addNotification("Video deleted successfully!");
  };

  const handleSaveSyllabus = async () => {
    try {
      if (!userId) {
        addNotification("User ID not available. Please log in again.", "error");
        return;
      }
      
      // Show immediate feedback that saving is in progress
      
      
      // Add userId to each day to ensure proper ownership
      const daysWithUserId = syllabusDays.map(day => ({
        ...day,
        userId
      }));
      
      const response = await saveSyllabus(daysWithUserId);
      
      if (response.success) {
        
        
        // Update local state with server-returned data to get proper MongoDB IDs
        const serverSyllabus = response.data.data;
        if (serverSyllabus?.studyDays) {
          const updatedDays = serverSyllabus.studyDays.map(day => ({
            ...day,
            id: day._id, // Keep id for client-side reference
            resources: day.videos || [] // Map videos back to resources for frontend
          }));
          
          setSyllabusDays(updatedDays);
          
          // Update selected day if needed
          if (selectedDay) {
            const updatedSelectedDay = updatedDays.find(
              d => d._id === selectedDay.id || d._id === selectedDay._id
            );
            if (updatedSelectedDay) {
              setSelectedDay(updatedSelectedDay);
            }
          }
        }
        
        addNotification("Syllabus saved successfully!");
      } else {
        throw new Error(response.message || "Unknown error saving syllabus");
      }
    } catch (error) {
      addNotification(`Failed to save syllabus: ${error.message}`, "error");
    }
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

  // Conditionally render edit controls based on whether viewing own syllabus
  const renderControlsBasedOnOwnership = () => {
    if (isViewingOtherUserSyllabus) {
      return (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4" role="alert">
          <p className="font-bold">Viewing Room Host's Syllabus</p>
          <p>You're viewing the syllabus of the room host. You cannot make changes to this syllabus.</p>
        </div>
      );
    }
    return null; // Don't show any special notice when viewing your own syllabus
  };
  
  // Reset pagination when selected day changes
  useEffect(() => {
    setProblemsPage(1);
    setResourcesPage(1);
  }, [selectedDay]);

  // Pagination helper functions
  const getPaginatedItems = (items, page, perPage) => {
    const startIndex = (page - 1) * perPage;
    return items?.slice(startIndex, startIndex + perPage) || [];
  };
  
  const getTotalPages = (items, perPage) => {
    return Math.ceil((items?.length || 0) / perPage);
  };
  
  // Handle page changes
  const handleProblemPageChange = (newPage) => {
    setProblemsPage(newPage);
  };
  
  const handleResourcePageChange = (newPage) => {
    setResourcesPage(newPage);
  };

  // Pagination UI component
  const PaginationControls = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex justify-center mt-4 gap-1">
        <button 
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`px-2 py-1 rounded-md ${
            currentPage === 1 
              ? 'bg-white/5 text-white/40 cursor-not-allowed' 
              : 'bg-white/10 text-white/80 hover:bg-white/20'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        
        <span className="px-3 py-1 bg-white/10 rounded-md text-white/80 text-sm">
          {currentPage} / {totalPages}
        </span>
        
        <button 
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={`px-2 py-1 rounded-md ${
            currentPage === totalPages 
              ? 'bg-white/5 text-white/40 cursor-not-allowed' 
              : 'bg-white/10 text-white/80 hover:bg-white/20'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    );
  };

  return (
    <>
      <style>{calendarStyles}</style>
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#334155] to-[#0f172a] text-white">
        <Navbar />
        
        {/* Notification container with AnimatePresence for smooth transitions */}
        <div className="fixed top-20 right-4 z-50 w-72 space-y-2 pointer-events-none">
          <AnimatePresence>
            {notifications.map(notification => (
              <div key={notification.id} className="pointer-events-auto">
                <Notification 
                  id={notification.id} 
                  message={notification.message} 
                  type={notification.type}
                  onDismiss={dismissNotification}
                />
              </div>
            ))}
          </AnimatePresence>
        </div>
        
        <div className="container mx-auto px-4 py-8 relative z-10">
          {/* Header Section */}          <motion.div 
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6 sm:mb-8"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-4 sm:mb-0">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-[#94C3D2] bg-clip-text text-transparent">
                {isViewingOtherUserSyllabus ? "Host's Learning Syllabus" : "DSA Learning Syllabus"}
              </h1>
              <p className="text-[#94C3D2]/80 mt-1">Plan and organize your DSA learning journey</p>
            </div>
            <div className="flex flex-wrap gap-3 w-full sm:w-auto">
              {!isViewingOtherUserSyllabus && (
                <>
                  <button 
                    onClick={handleSaveSyllabus}
                    className="bg-white/10 text-white/90 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg flex items-center shadow-sm hover:bg-white/20 transition-colors flex-1 sm:flex-auto justify-center sm:justify-start"
                    style={{ textShadow: "0 0 10px rgba(255, 255, 255, 0.3)" }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 sm:h-5 w-4 sm:w-5 mr-1.5 sm:mr-2 text-white/90" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Save Syllabus
                  </button>
                  <button 
                    onClick={() => setShowAddDayModal(true)}
                    className="bg-[#94C3D2] text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg flex items-center shadow-sm hover:bg-[#7EB5C3] transition-colors flex-1 sm:flex-auto justify-center sm:justify-start"
                    style={{ textShadow: "0 0 10px rgba(255, 255, 255, 0.3)" }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 sm:h-5 w-4 sm:w-5 mr-1.5 sm:mr-2 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add Study Day
                  </button>
                </>
              )}              {isViewingOtherUserSyllabus && (
                <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-3 sm:p-4 mb-4 rounded-md w-full" role="alert">
                  <p className="font-bold text-sm sm:text-base">Viewing Room Host's Syllabus</p>
                  <p className="text-xs sm:text-sm">You're viewing the syllabus of the room host. You cannot make changes to this syllabus.</p>
                </div>
              )}
            </div>
          </motion.div>
          
          {/* Add Save Reminder Banner */}
          {!isViewingOtherUserSyllabus && !isLoading && (
            <motion.div 
              className="bg-yellow-900/40 border border-yellow-500/30 text-yellow-200 p-4 mb-6 rounded-lg flex items-center"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              role="alert"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 flex-shrink-0 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-medium">Remember to save your syllabus!</p>
                <p className="text-sm">After adding new study days, editing days, problems, or videos, click the "Save Syllabus" button at the top to permanently save your changes.</p>
              </div>
            </motion.div>
          )}
          
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#94C3D2]"></div>
              <span className="ml-3 text-lg text-[#94C3D2]">Loading syllabus...</span>
            </div>
          ) : (
            <>
              {/* Tab Navigation */}
              {syllabusDays.length > 0 && (                <motion.div 
                  className="mb-6 border-b border-white/20 relative"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  <div className="flex space-x-1 overflow-x-auto py-1 px-0.5 -mx-2 px-2" 
                      style={{ 
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'rgba(255, 255, 255, 0.3) transparent',
                        msOverflowStyle: 'none',
                        WebkitOverflowScrolling: 'touch'
                      }}>
                    {syllabusDays.map((day, index) => (
                      <div key={day.id || day._id} className="flex-shrink-0 relative">
                        <button
                          onClick={() => {
                            setSelectedDay(day);
                            setActiveTabIndex(index);
                          }}
                          className={`
                            px-2 sm:px-4 py-1.5 sm:py-2.5 text-xs sm:text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap flex-shrink-0
                            ${activeTabIndex === index 
                              ? 'border-b-2 border-[#94C3D2] text-white/95 bg-white/10 backdrop-blur-sm' 
                              : 'text-white/95 hover:text-white hover:bg-white/5'}
                          `}
                        >
                          <div className="flex items-center">
                            <span>{day.title}</span>
                            <span className="ml-2 bg-white/10 text-white/95 text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full border border-white/20 hidden sm:inline-flex">
                              {format(new Date(day.date), "MMM d")}
                            </span>
                          </div>
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
              
              {/* Main Content Area */}
              <motion.div 
                className="bg-white/10 rounded-2xl shadow-lg border border-white/20 p-6 backdrop-blur-md"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                {selectedDay ? (
                  <div>
                    {/* Day Header */}                    <div className="flex flex-col sm:flex-row justify-between items-start mb-6 sm:mb-8 gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white to-[#94C3D2] bg-clip-text text-transparent">{selectedDay.title}</h2>
                          <span className="bg-[#94C3D2]/20 text-[#94C3D2] text-xs sm:text-sm px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-[#94C3D2]/30">
                            {format(new Date(selectedDay.date), "MMM d, yyyy")}
                          </span>
                        </div>
                        <p className="text-white/95 mt-1 text-sm sm:text-base">{selectedDay.description}</p>
                      </div>
                      {!isViewingOtherUserSyllabus && (
                        <div className="flex gap-2 w-full sm:w-auto">
                          <button 
                            className="text-white bg-[#94C3D2] hover:bg-[#7EB5C3] font-medium rounded-lg text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 transition-colors shadow-sm flex-1 sm:flex-auto"
                            onClick={() => openEditDayModal(selectedDay)}
                          >
                            Edit Day
                          </button>
                          <button 
                            className="bg-red-500/80 hover:bg-red-600/80 font-medium rounded-lg text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 transition-colors shadow-sm flex-1 sm:flex-auto"
                            onClick={() => confirmDeleteDay(selectedDay)}
                            style={{color: "white"}}
                          >
                            Delete Day
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Problems Section */}
                    <div className="mb-8">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-[#94C3D2]">Problems</h3>
                        {!isViewingOtherUserSyllabus && (
                          <button 
                            onClick={() => setShowAddProblemModal(true)}
                            className="bg-white/10 text-white/95 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg border border-white/20 hover:bg-white/20 transition-colors shadow-sm backdrop-blur-sm flex items-center"
                            style={{ textShadow: "0 0 10px rgba(255, 255, 255, 0.3)" }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5 text-[#94C3D2]" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Add Problem
                          </button>
                        )}
                      </div>
                      
                      <div className="bg-white/5 rounded-xl p-1 backdrop-blur-sm">
                        {selectedDay.problems.length > 0 ? (
                          <>
                            <div className="space-y-2">
                              {getPaginatedItems(selectedDay.problems, problemsPage, itemsPerPage).map((problem) => (
                                <div 
                                  key={problem.id || problem._id}
                                  className="flex items-center justify-between p-3 sm:p-4 bg-white/10 rounded-lg border border-white/20 hover:bg-white/15 transition-all"
                                >
                                  <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                                      <h4 className="font-medium text-white/95 text-sm sm:text-base">{problem.title}</h4>
                                      <span className={`text-xs px-1.5 sm:px-2 py-0.5 rounded-full ${difficultyColors[problem.difficulty]}`}>
                                        {problem.difficulty}
                                      </span>
                                      <span className="text-xs bg-white/10 text-white/75 px-1.5 sm:px-2 py-0.5 rounded-full border border-white/20">
                                        {problem.platform}
                                      </span>
                                    </div>
                                    <div className="mt-2 flex flex-wrap items-center gap-2 sm:gap-3">                                      
                                      <Link 
                                        to="/collab-room" 
                                        state={{ 
                                          problemLink: problem.url,
                                          problemId: problem.id || problem._id,
                                          dayId: selectedDay.id || selectedDay._id,
                                          status: problem.status || 'unsolved',
                                          updateTimestamp: true,
                                          isCreator: true,
                                          problemTitle: problem.title,
                                          difficulty: problem.difficulty,
                                          platform: problem.platform,
                                          url: problem.url
                                        }}
                                        className="text-xs sm:text-sm text-white bg-[#94C3D2] hover:bg-[#7EB5C3] px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg flex items-center transition-colors shadow-sm"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                      </svg>
                                        Collaborate
                                      </Link>
                                      <a 
                                        href={problem.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-xs sm:text-sm text-white/80 hover:text-white flex items-center gap-1"
                                      >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                        View Problem
                                      </a>
                                    </div>
                                  </div>
                                  {!isViewingOtherUserSyllabus && (
                                    <button 
                                      onClick={() => handleDeleteProblem(problem.id || problem._id)}
                                      className="p-1 sm:p-1.5 text-red-600 hover:text-red-700 transition-colors"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                            
                            {/* Problem Pagination Controls */}
                            {selectedDay.problems.length > itemsPerPage && (
                              <PaginationControls 
                                currentPage={problemsPage}
                                totalPages={getTotalPages(selectedDay.problems, itemsPerPage)}
                                onPageChange={handleProblemPageChange}
                              />
                            )}
                          </>
                        ) : (
                          <div className="text-center py-6 sm:py-8 text-white/70 bg-white/5 rounded-lg text-sm sm:text-base">
                            <p>No problems added yet. Click "Add Problem" to get started.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Learning Videos Section */}
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-[#94C3D2]">Learning Videos</h3>
                        {!isViewingOtherUserSyllabus && (
                          <button 
                            onClick={() => setShowAddResourceModal(true)}
                            className="bg-white/10 text-white/95 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg border border-white/20 hover:bg-white/20 transition-colors shadow-sm backdrop-blur-sm flex items-center"
                            style={{ textShadow: "0 0 10px rgba(255, 255, 255, 0.3)" }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5 text-[#94C3D2]" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Add Video
                          </button>
                        )}
                      </div>
                      
                      <div className="bg-white/5 rounded-xl p-1 backdrop-blur-sm">
                        {selectedDay.resources && selectedDay.resources.length > 0 ? (
                          <>
                            <div className="space-y-2">
                              {getPaginatedItems(
                                selectedDay.resources.filter(resource => 
                                  resource.type === 'video' || resource.type === 'single' || 
                                  resource.type === 'playlist' || resource.displayType === 'video'
                                ),
                                resourcesPage, 
                                itemsPerPage
                              ).map((video) => (
                                <div 
                                  key={video.id || video._id}
                                  className="flex items-center justify-between p-4 bg-white/10 rounded-lg border border-white/20 hover:bg-white/15 transition-all"
                                >
                                  <div className="flex-1 flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-md flex items-center justify-center bg-red-900/50 text-red-300 border border-red-500/30">
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
                                  {!isViewingOtherUserSyllabus && (
                                    <button 
                                      onClick={() => handleDeleteResource(video.id || video._id)}
                                      className="p-1.5 text-red-600 hover:text-red-700 transition-colors"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                            
                            {/* Videos Pagination Controls */}
                            {selectedDay.resources.filter(resource => 
                              resource.type === 'video' || resource.type === 'single' || 
                              resource.type === 'playlist' || resource.displayType === 'video'
                            ).length > itemsPerPage && (
                              <PaginationControls 
                                currentPage={resourcesPage}
                                totalPages={getTotalPages(
                                  selectedDay.resources.filter(resource => 
                                    resource.type === 'video' || resource.type === 'single' || 
                                    resource.type === 'playlist' || resource.displayType === 'video'
                                  ),
                                  itemsPerPage
                                )}
                                onPageChange={handleResourcePageChange}
                              />
                            )}
                          </>
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
            </>
          )}
        </div>        {/* Add Day Modal */}
        {showAddDayModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
            <motion.div 
              className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl w-full max-w-md p-4 sm:p-6 border border-white/20 overflow-hidden relative"
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
                      className="w-full pl-10 pr-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none text-gray-100 placeholder-gray-400"
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
                      className="w-full pl-10 pr-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none text-gray-100 placeholder-gray-400"
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      type="date"
                      id="day-date"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none text-gray-100 appearance-none"
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

        {/* Add Problem Modal */}
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
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 100-2 1 1 0 000 2zm0 1a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      id="problem-title"
                      type="text"
                      placeholder="e.g., Two Sum"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none text-gray-100 placeholder-gray-400"
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <select
                      id="problem-difficulty"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none text-gray-100 appearance-none"
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <select
                      id="problem-platform"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none text-gray-100 appearance-none"
                      value={newProblemPlatform}
                      onChange={(e) => setNewProblemPlatform(e.target.value)}
                    >
                      <option value="LeetCode">LeetCode</option>
                      <option value="HackerRank">HackerRank</option>
                      <option value="CodeForces">CodeForces</option>
                      <option value="GeeksforGeeks">GeeksforGeeks</option>
                      <option value="Others">Others</option>
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <input
                      id="problem-url"
                      type="text"
                      placeholder="https://leetcode.com/problems/..."
                      className="w-full pl-10 pr-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none text-gray-100 placeholder-gray-400"
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

        {/* Add Video Modal */}
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                      </svg>
                    </div>
                    <input
                      id="video-title"
                      type="text"
                      placeholder="e.g., Array Data Structure Tutorial"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none text-gray-100 placeholder-gray-400"
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                      </svg>
                    </div>
                    <select
                      id="video-type"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none text-gray-100 appearance-none"
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <input
                      id="video-url"
                      type="text"
                      placeholder="https://youtube.com/watch?v=..."
                      className="w-full pl-10 pr-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none text-gray-100 placeholder-gray-400"
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
        
        {/* Edit Day Modal */}
        {showEditDayModal && (
          <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl w-full max-w-md p-6 border border-white/20 overflow-hidden relative"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-[#94C3D2] bg-clip-text text-transparent">Edit Study Day</h3>
                <button
                  onClick={() => setShowEditDayModal(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-5">
                <div>
                  <label htmlFor="edit-day-title" className="block text-sm font-medium text-[#94C3D2] mb-1.5">
                    Title
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      id="edit-day-title"
                      type="text"
                      placeholder="e.g., Array Fundamentals"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none text-gray-100 placeholder-gray-400"
                      value={editDayTitle}
                      onChange={(e) => setEditDayTitle(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="edit-day-description" className="block text-sm font-medium text-[#94C3D2] mb-1.5">
                    Description
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V7a2 2 0 012-2z" />
                      </svg>
                    </div>
                    <input
                      id="edit-day-description"
                      type="text"
                      placeholder="A short description of the topic"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none text-gray-100 placeholder-gray-400"
                      value={editDayDescription}
                      onChange={(e) => setEditDayDescription(e.target.value)}
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      type="date"
                      id="edit-day-date"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none text-gray-100 appearance-none"
                      value={editDayDate.toISOString().split('T')[0]}
                      onChange={(e) => setEditDayDate(new Date(e.target.value))}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowEditDayModal(false)}
                    className="px-4 py-2.5 bg-white/10 border border-white/20 text-white/95 rounded-lg hover:bg-white/20 transition-colors backdrop-blur-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleEditDay}
                    className="w-full bg-[#94C3D2] hover:bg-[#7EB5C3] transition-all py-2.5 rounded-lg text-white font-medium shadow-lg"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirmModal && dayToDelete && (
          <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl w-full max-w-md p-6 border border-white/20 overflow-hidden relative"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center mb-4 text-red-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <h3 className="text-lg font-medium">Confirm Deletion</h3>
              </div>
              <p className="text-white/90 mb-6">
                Are you sure you want to delete the study day <span className="font-semibold">"{dayToDelete.title}"</span>? 
                This will permanently remove all problems and resources associated with this day.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirmModal(false);
                    setDayToDelete(null);
                  }}
                  className="px-4 py-2.5 bg-white/10 border border-white/20 text-white/95 rounded-lg hover:bg-white/20 transition-colors backdrop-blur-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteDay(dayToDelete.id)}
                  className="px-4 py-2.5 bg-red-500/80 border border-red-500/30 rounded-lg hover:bg-red-600/80 transition-colors"
                 style={{color: "white", textShadow: "0 0 10px rgba(255, 255, 255, 0.3)" }}>
                  Delete Day
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </>
  );
};

export default Syllabus;
