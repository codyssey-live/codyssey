import { HiPencil, HiUpload, HiOutlineCalendar, HiOutlineMail, HiX } from "react-icons/hi";
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { motion } from "framer-motion"; // Add this import for animations
import { fetchCurrentUser, getUserId } from "../utils/authUtils";
import { 
  updateUserProfile, 
  uploadProfilePicture,
  addEducation,
  deleteEducation,
  addWorkExperience,
  deleteWorkExperience,
  changePassword,
  deleteAccount,
  removeProfilePicture
} from "../utils/profileApiUtils";

// Add this helper function near the top of your component
const getIdFromResponse = (response) => {
  // Try to get the id from different possible locations in the response
  if (response && response.data) {
    if (response.data.id) return response.data.id;
    if (response.data._id) return response.data._id;
    // For responses with nested data structure
    if (response.data.data && (response.data.data.id || response.data.data._id)) {
      return response.data.data.id || response.data.data._id;
    }
  }
  
  console.error('Could not find ID in response:', response);
  // Return a fallback if we can't find an ID
  return getUserId(); // Return the ID from localStorage as fallback
};

// Separate component for personal info modal to prevent focus issues
function PersonalInfoModal({ user, onClose, onUpdate }) {
  // Local state within the component - name is now editable
  const [name, setName] = useState(user.name || "");
  const [bio, setBio] = useState(user.bio || "");
  const [github, setGithub] = useState(user.socials?.github || "");
  const [linkedin, setLinkedin] = useState(user.socials?.linkedin || "");
  
  // Add maximum bio length constant
  const maxBioLength = 250;

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    // Save the data and pass it to parent component - name is now editable
    onUpdate({ name, bio, github, linkedin });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div 
        className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl w-full max-w-md p-6 border border-white/20 overflow-hidden relative"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-[#94C3D2] bg-clip-text text-transparent">Edit Personal Information</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <HiX className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[#94C3D2] mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <input 
                type="text" 
                id="name" 
                className="w-full px-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none text-gray-100 placeholder-gray-400"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-[#94C3D2] mb-1.5">
              Bio
            </label>
            <div className="relative">
              <textarea 
                id="bio" 
                rows={3}
                maxLength={maxBioLength}
                className="w-full px-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none text-gray-100 placeholder-gray-400 resize-none"
                value={bio}
                placeholder="Tell us a bit about yourself"
                onChange={(e) => setBio(e.target.value)}
              ></textarea>
              <div className="text-xs text-white/60 text-right mt-1">
                {bio.length}/{maxBioLength} characters
              </div>
            </div>
          </div>
          
          {/* Social Links */}
          <div className="border-t border-white/20 pt-4 mt-4">
            <h4 className="text-sm font-medium text-[#94C3D2] mb-3">Social Links</h4>
            
            <div className="space-y-3">
              <div>
                <label htmlFor="github" className="block text-sm font-medium text-[#94C3D2] mb-1.5">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    GitHub
                  </div>
                </label>
                <input 
                  type="url" 
                  id="github" 
                  className="w-full px-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none text-gray-100 placeholder-gray-400"
                  placeholder="https://github.com/username"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="linkedin" className="block text-sm font-medium text-[#94C3D2] mb-1.5">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                    LinkedIn
                  </div>
                </label>
                <input 
                  type="url" 
                  id="linkedin" 
                  className="w-full px-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none text-gray-100 placeholder-gray-400"
                  placeholder="https://linkedin.com/in/username"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button 
              type="button"
              onClick={onClose} 
              className="px-4 py-2.5 bg-white/10 border border-white/20 text-white/95 rounded-lg hover:bg-white/20 transition-colors backdrop-blur-sm"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-4 py-2.5 bg-[#94C3D2] hover:bg-[#7EB5C3] transition-all rounded-lg text-white font-medium shadow-lg"
            >
              Save
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

const UserProfile = () => {
  const [activeTab, setActiveTab] = useState("About");
  const [activeModal, setActiveModal] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profileProgress, setProfileProgress] = useState(10); // Start with 10% for having an account
  const [loading, setLoading] = useState(true);
  
  // Function to handle toast notifications - optimized for immediate display
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  
  const showNotification = (message, type = 'success') => {
    // Immediately clear any existing notification
    setNotification({ show: false, message: '', type: '' });
    
    // Set the new notification without delay
    setNotification({ show: true, message, type });
    
    // Auto-hide after 5 seconds
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 5000);
  };

  // User data state with minimal initial values and ID from localStorage
  const [user, setUser] = useState({
    id: getUserId(), // Add the ID from localStorage right from the start
    _id: getUserId(), // Add the ID as _id too for consistency
    name: "",
    email: "",
    avatarLetter: "",
    bio: "",
    socials: {
      github: "",
      linkedin: ""
    },
    education: [],
    workExperience: []
  });
  
  // Load user data from API
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        // Try to get user ID from localStorage first as a starting point
        const savedUserId = getUserId();
        if (savedUserId) {
          console.log("Found user ID in localStorage:", savedUserId);
          setUser(prevUser => ({
            ...prevUser,
            id: savedUserId,
            _id: savedUserId
          }));
        }
        
        const userData = await fetchCurrentUser();
        if (userData) {
          // Ensure both ID properties exist and save to localStorage
          const userId = userData.id || userData._id || savedUserId;
          if (userId) {
            localStorage.setItem('userId', userId);
            console.log("Setting userId in localStorage:", userId);
          }
          
          // Set all user data including consistent IDs
          setUser({
            ...userData,
            id: userId,
            _id: userId,
            name: userData.name || "",
            email: userData.email || "",
            avatarLetter: userData.name ? userData.name.charAt(0).toUpperCase() : "",
            bio: userData.bio || "",
            profilePicture: userData.profilePicture || "",
            socials: userData.socials || { github: "", linkedin: "" },
            education: userData.education || [],
            workExperience: userData.workExperience || []
          });
          
          // Set profile photo if available
          if (userData.profilePicture) {
            setProfilePhoto(userData.profilePicture);
          }
        }
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        // Even on error, try to use localStorage as backup
        const savedUserId = getUserId();
        if (savedUserId) {
          setUser(prevState => ({
            ...prevState,
            id: savedUserId,
            _id: savedUserId
          }));
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  // Calculate profile completion progress
  useEffect(() => {
    let progress = 10; // Base 10% for having an account
    
    // Check each section and add percentage only for completed sections
    if (profilePhoto) progress += 20; // Photo: 20%
    if (user.education && user.education.length > 0) progress += 20; // Education: 20%
    if (user.workExperience && user.workExperience.length > 0) progress += 20; // Work: 20%
    if (user.bio && user.bio.trim().length > 0) progress += 10; // Bio: 10%
    
    // Social links (GitHub and LinkedIn): 20% total
    // If both are present, add 20%. If only one is present, add 10%
    if (user.socials?.github && user.socials?.linkedin) {
      progress += 20;
    } else if (user.socials?.github || user.socials?.linkedin) {
      progress += 10;
    }
    
    // Cap at 100%
    setProfileProgress(Math.min(progress, 100));
  }, [profilePhoto, user]);

  // Helper function to update progress when a section is completed
  const updateProgress = (section, isCompleted) => {
    // This function is called when a section is completed or emptied
    // The actual calculation is handled by the useEffect above
  };

  // Function to open modal
  const openModal = (modalType) => {
    setActiveModal(modalType);
  };

  // Function to close modal
  const closeModal = () => {
    setActiveModal(null);
  };
  
  // Handle photo upload
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // For API upload using FormData
    const formData = new FormData();
    formData.append('profilePicture', file);
    
    try {
      // Show temporary local preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const photoData = reader.result;
        setProfilePhoto(photoData); // Set temporary preview
      };
      reader.readAsDataURL(file);
      
      // Show notification that upload is in progress
      showNotification('Uploading profile photo...', 'info');
      
      // Upload to server
      const response = await uploadProfilePicture(user.id, formData);
      console.log("Profile picture upload response:", response);
      
      if (response && response.data && response.data.profilePicture) {
        // Update with the server URL
        setProfilePhoto(response.data.profilePicture);
        
        // Also update the user object to ensure consistency
        setUser(prevUser => ({
          ...prevUser,
          profilePicture: response.data.profilePicture
        }));
        
        // Update progress
        updateProgress('photo', true);
        
        // Close modal immediately after successful upload
        closeModal();
        
        // Show success notification
        showNotification('Profile photo uploaded successfully!');
      } else {
        console.error('Invalid response format:', response);
        showNotification('Failed to upload profile picture: Invalid server response', 'error');
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      showNotification(`Failed to upload profile picture: ${error.message || 'Unknown error'}`, 'error');
    }
  };

  // Function to remove profile photo with better error handling
  const handleRemovePhoto = async () => {
    try {
      if (!user.id) {
        showNotification('User ID not found', 'error');
        return;
      }
      
      // Show notification that removal is in progress
      showNotification('Removing profile photo...', 'info');
      
      // Use the profileApiUtils helper
      const response = await removeProfilePicture(user.id);
      
      if (response && response.success) {
        // Clear the profile photo
        setProfilePhoto(null);
        
        // Update user state
        setUser(prevUser => ({
          ...prevUser,
          profilePicture: ''
        }));
        
        // Close modal immediately after successful removal
        closeModal();
        
        // Show success notification
        showNotification('Profile photo removed successfully!');
        
        // Update progress if needed
        updateProgress('photo', false);
      } else {
        throw new Error(response?.message || 'Failed to remove profile photo');
      }
    } catch (error) {
      console.error('Error removing profile photo:', error);
      showNotification(`Failed to remove profile photo: ${error.message || 'Unknown error'}`, 'error');
    }
  };

  // Handle personal info update
  const handlePersonalInfoUpdate = async (updatedInfo) => {
    const { name, bio, github, linkedin } = updatedInfo;
    
    try {
      // Update user state first for responsive UI
      const updatedUser = {
        ...user,
        name: name || user.name,
        bio: bio || "",
        socials: {
          github: github || "",
          linkedin: linkedin || ""
        }
      };
      
      // Update state first for responsive UI
      setUser(updatedUser);
      
      // Save to API
      await updateUserProfile(user.id, {
        name,
        bio,
        socials: {
          github,
          linkedin
        }
      });
      
      // Update progress based on whether fields have content
      updateProgress('bio', bio && bio.trim().length > 0);
      updateProgress('socials', github || linkedin);
      
      closeModal();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile information');
    }
  };

  // Handle deleting education item
  const handleDeleteEducation = async (id) => {
    try {
      // Call the API to delete the education entry
      await deleteEducation(user.id, id);
      
      // Update UI after successful deletion
      const updatedEducation = user.education.filter((edu) => edu.id !== id);
      setUser((prevUser) => ({
        ...prevUser,
        education: updatedEducation,
      }));

      // Update progress if there are no more education entries
      if (updatedEducation.length === 0) {
        updateProgress('education', false);
      }
    } catch (error) {
      console.error('Error deleting education:', error);
      alert('Failed to delete education entry');
    }
  };

  // Handle deleting work experience item
  const handleDeleteWorkExperience = async (id) => {
    try {
      // Call the API to delete the work experience entry
      await deleteWorkExperience(user.id, id);
      
      // Update UI after successful deletion
      const updatedWorkExperience = user.workExperience.filter((work) => work.id !== id);
      setUser((prevUser) => ({
        ...prevUser,
        workExperience: updatedWorkExperience,
      }));

      // Update progress if there are no more work experience entries
      if (updatedWorkExperience.length === 0) {
        updateProgress('workExperience', false);
      }
    } catch (error) {
      console.error('Error deleting work experience:', error);
      alert('Failed to delete work experience entry');
    }
  };

  // Function to handle changing password
  const handleChangePassword = async (passwordData) => {
    try {
      const response = await changePassword(user.id, passwordData);
      
      if (response && response.success) {
        alert('Password changed successfully!');
        closeModal();
      } else {
        // Show the specific error message from the server
        throw new Error(response?.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      alert(`Failed to change password: ${error.message || 'Unknown error'}`);
    }
  };

  // Function to handle account deletion
  const handleDeleteAccount = async (passwordData) => {
    try {
      const response = await deleteAccount(user.id, passwordData);
      
      if (response && response.success) {
        alert('Your account has been successfully deleted. You will be redirected to the home page.');
        // Clear any user data from local storage
        localStorage.removeItem('userId');
        localStorage.removeItem('token');
        // Redirect to home or login page after a brief delay
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } else {
        // Show the specific error message from the server
        throw new Error(response?.message || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert(`Failed to delete account: ${error.message || 'Unknown error'}`);
    }
  };

  // Photo Upload Modal Component
  function PhotoUploadModal({ onClose }) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div 
          className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl w-full max-w-md p-6 border border-white/20 overflow-hidden relative"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-[#94C3D2] bg-clip-text text-transparent">Upload Profile Photo</h3>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
              <HiX className="w-5 h-5" />
            </button>
          </div>
            
          <div className="space-y-4">
            <p className="text-sm text-white/80">Upload a profile photo to personalize your account.</p>
              
            <div className="flex items-center justify-center">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-[#2d3748] hover:bg-[#3d4a5e] transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <HiUpload className="w-10 h-10 mb-3 text-gray-400" />
                  <p className="mb-2 text-sm text-white/80"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                  <p className="text-xs text-white/60">PNG, JPG or GIF (MAX. 2MB)</p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handlePhotoUpload}
                />
              </label>
            </div>
              
            {/* Add remove photo button if user has a profile photo */}
            {profilePhoto && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={handleRemovePhoto}
                  className="px-4 py-2 text-red-300 border border-red-600/30 bg-red-900/30 rounded-lg text-sm font-medium hover:bg-red-900/50 transition-colors"
                >
                  Remove Current Photo
                </button>
              </div>
            )}
          </div>
            
          <div className="flex justify-end gap-3 mt-6">
            <button 
              onClick={onClose} 
              className="px-4 py-2.5 bg-white/10 border border-white/20 text-white/95 rounded-lg hover:bg-white/20 transition-colors backdrop-blur-sm"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
    );
  }
  
  // Education Modal Component
  function EducationModal({ onClose }) {
    const [school, setSchool] = useState('');
    const [degree, setDegree] = useState('');
    const [startYear, setStartYear] = useState('');
    const [endYear, setEndYear] = useState('');
      
    const handleSubmit = async (e) => {
      e.preventDefault();
        
      if (!school || !degree || !startYear) {
        alert('Please fill in all required fields');
        return;
      }
        
      const newEducation = {
        school,
        degree,
        startYear,
        endYear: endYear || 'Present'
      };
        
      try {
        // Save to API
        console.log('Sending education data to API:', newEducation);
        const response = await addEducation(user.id || user._id, newEducation);
          
        // Check if we got a valid response with data
        if (!response || !response.data) {
          throw new Error('Invalid response from server');
        }
          
        console.log('Education added successfully:', response);
          
        // Update user state with the response that includes the generated ID from the server
        const updatedEducation = [...user.education, response.data];
          
        // Update user state
        setUser(prevUser => ({
          ...prevUser,
          education: updatedEducation
        }));
          
        // Update progress
        updateProgress('education', true);
          
        onClose();
      } catch (error) {
        console.error('Error adding education:', error);
        alert(`Failed to add education information: ${error.message || 'Unknown error'}`);
      }
    };
      
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div 
          className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl w-full max-w-md p-6 border border-white/20 overflow-hidden relative"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-[#94C3D2] bg-clip-text text-transparent">Add Education</h3>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
              <HiX className="w-5 h-5" />
            </button>
          </div>
            
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="school" className="block text-sm font-medium text-[#94C3D2] mb-1.5">School/University</label>
              <input 
                type="text" 
                id="school" 
                className="w-full px-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none text-gray-100 placeholder-gray-400"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder="Enter school or university name"
                required
              />
            </div>
              
            <div>
              <label htmlFor="degree" className="block text-sm font-medium text-[#94C3D2] mb-1.5">Degree</label>
              <input 
                type="text" 
                id="degree" 
                className="w-full px-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none text-gray-100 placeholder-gray-400"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                placeholder="Enter degree or field of study"
                required
              />
            </div>
              
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startYear" className="block text-sm font-medium text-[#94C3D2] mb-1.5">Start Date</label>
                <input 
                  type="month" 
                  id="startYear" 
                  className="w-full px-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none text-gray-100 placeholder-gray-400"
                  value={startYear}
                  onChange={(e) => setStartYear(e.target.value)}
                  required
                />
              </div>
                
              <div>
                <label htmlFor="endYear" className="block text-sm font-medium text-[#94C3D2] mb-1.5">End Date</label>
                <input 
                  type="month" 
                  id="endYear" 
                  className="w-full px-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none text-gray-100 placeholder-gray-400"
                  value={endYear}
                  onChange={(e) => setEndYear(e.target.value)}
                  placeholder="Present if current"
                />
              </div>
            </div>
              
            <div className="flex justify-end gap-3 mt-6">
              <button 
                type="button"
                onClick={onClose} 
                className="px-4 py-2.5 bg-white/10 border border-white/20 text-white/95 rounded-lg hover:bg-white/20 transition-colors backdrop-blur-sm"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2.5 bg-[#94C3D2] hover:bg-[#7EB5C3] transition-all rounded-lg text-white font-medium shadow-lg"
              >
                Save
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  }
  
  // Work Experience Modal Component
  function WorkExperienceModal({ onClose }) {
    const [company, setCompany] = useState('');
    const [position, setPosition] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
      
    const handleSubmit = async (e) => {
      e.preventDefault();
        
      if (!company || !position || !startDate) {
        alert('Please fill in all required fields');
        return;
      }
        
      // Create a new work experience object
      const newWorkExperience = {
        company,
        position,
        startDate,
        endDate: endDate || 'Present'
      };
        
      try {
        // Check if user ID is available
        const userId = user.id || user._id;
          
        if (!userId) {
          console.error('User ID is missing:', user);
          alert('User ID is missing. Please try refreshing the page or logging in again.');
          return;
        }
          
        console.log('Adding work experience for user:', userId);
          
        // Save to API using the user ID
        const response = await addWorkExperience(userId, newWorkExperience);
          
        if (!response || !response.data) {
          throw new Error('Invalid response from server');
        }
          
        // Update user state with the new work experience
        const updatedWorkExperience = [...user.workExperience, response.data];
          
        setUser({
          ...user,
          workExperience: updatedWorkExperience
        });
          
        // Update progress
        updateProgress('workExperience', true);
          
        onClose();
      } catch (error) {
        console.error('Error adding work experience:', error);
        alert(`Failed to add work experience: ${error.message}`);
      }
    };
      
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div 
          className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl w-full max-w-md p-6 border border-white/20 overflow-hidden relative"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-[#94C3D2] bg-clip-text text-transparent">Add Work Experience</h3>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
              <HiX className="w-5 h-5" />
            </button>
          </div>
            
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-[#94C3D2] mb-1.5">Company</label>
              <input 
                type="text" 
                id="company" 
                className="w-full px-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none text-gray-100 placeholder-gray-400"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Enter company name"
                required
              />
            </div>
              
            <div>
              <label htmlFor="position" className="block text-sm font-medium text-[#94C3D2] mb-1.5">Position</label>
              <input 
                type="text" 
                id="position" 
                className="w-full px-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none text-gray-100 placeholder-gray-400"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="Enter job title"
                required
              />
            </div>
              
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-[#94C3D2] mb-1.5">Start Date</label>
                <input 
                  type="month" 
                  id="startDate" 
                  className="w-full px-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none text-gray-100 placeholder-gray-400"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
                
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-[#94C3D2] mb-1.5">End Date</label>
                <input 
                  type="month" 
                  id="endDate" 
                  className="w-full px-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none text-gray-100 placeholder-gray-400"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="Leave empty if current"
                />
              </div>
            </div>
              
            <div className="flex justify-end gap-3 mt-6">
              <button 
                type="button"
                onClick={onClose} 
                className="px-4 py-2.5 bg-white/10 border border-white/20 text-white/95 rounded-lg hover:bg-white/20 transition-colors backdrop-blur-sm"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2.5 bg-[#94C3D2] hover:bg-[#7EB5C3] transition-all rounded-lg text-white font-medium shadow-lg"
              >
                Save
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  }

  // Password Change Modal Component
  function PasswordChangeModal({ onClose }) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
      
    const handleSubmit = async (e) => {
      e.preventDefault();
        
      // Reset any previous errors
      setError('');
        
      // Validate form
      if (!currentPassword || !newPassword || !confirmPassword) {
        setError('All fields are required');
        return;
      }
        
      if (newPassword !== confirmPassword) {
        setError('New passwords do not match');
        return;
      }
        
      if (newPassword.length < 8) {
        setError('New password must be at least 8 characters long');
        return;
      }
        
      // Call the parent handler to change password
      handleChangePassword({
        currentPassword,
        newPassword
      });
    };
      
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div 
          className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl w-full max-w-md p-6 border border-white/20 overflow-hidden relative"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-[#94C3D2] bg-clip-text text-transparent">Change Password</h3>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
              <HiX className="w-5 h-5" />
            </button>
          </div>
            
          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg relative mb-4">
              <span className="block">{error}</span>
            </div>
          )}
            
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-[#94C3D2] mb-1.5">Old Password</label>
              <input 
                type="password" 
                id="currentPassword" 
                className="w-full px-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none text-gray-100 placeholder-gray-400"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                required
              />
            </div>
              
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-[#94C3D2] mb-1.5">New Password</label>
              <input 
                type="password" 
                id="newPassword" 
                className="w-full px-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none text-gray-100 placeholder-gray-400"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                minLength="8"
                required
              />
            </div>
              
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#94C3D2] mb-1.5">Confirm Password</label>
              <input 
                type="password" 
                id="confirmPassword" 
                className="w-full px-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none text-gray-100 placeholder-gray-400"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                minLength="8"
                required
              />
            </div>
              
            <div className="flex justify-end gap-3 mt-6">
              <button 
                type="button"
                onClick={onClose} 
                className="px-4 py-2.5 bg-white/10 border border-white/20 text-white/95 rounded-lg hover:bg-white/20 transition-colors backdrop-blur-sm"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2.5 bg-[#94C3D2] hover:bg-[#7EB5C3] transition-all rounded-lg text-white font-medium shadow-lg"
              >
                Change Password
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  }
  
  // Account Delete Confirmation Modal
  function DeleteAccountModal({ onClose }) {
    const [password, setPassword] = useState('');
    const [confirmText, setConfirmText] = useState('');
    const [error, setError] = useState('');
      
    const handleSubmit = async (e) => {
      e.preventDefault();
        
      // Reset any previous errors
      setError('');
        
      // Validate form
      if (!password) {
        setError('Password is required to confirm deletion');
        return;
      }
        
      if (confirmText !== 'DELETE') {
        setError('Please type DELETE to confirm');
        return;
      }
        
      // Call the parent handler to delete account
      handleDeleteAccount({ password });
    };
      
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div 
          className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl w-full max-w-md p-6 border border-white/20 overflow-hidden relative"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold text-red-300">Delete Account</h3>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
              <HiX className="w-5 h-5" />
            </button>
          </div>
            
          <div className="bg-red-900/30 border-l-4 border-red-500 p-4 mb-4 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-200">
                  This action <span className="font-bold">cannot be undone</span>. This will permanently delete your account and all associated data.
                </p>
              </div>
            </div>
          </div>
            
          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg relative mb-4">
              <span className="block">{error}</span>
            </div>
          )}
            
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#94C3D2] mb-1.5">Enter your password to confirm</label>
              <input 
                type="password" 
                id="password" 
                className="w-full px-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none text-gray-100 placeholder-gray-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Your password"
              />
            </div>
              
            <div>
              <label htmlFor="confirmText" className="block text-sm font-medium text-[#94C3D2] mb-1.5">
                Type <span className="font-bold text-red-300">DELETE</span> to confirm
              </label>
              <input 
                type="text" 
                id="confirmText" 
                className="w-full px-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none text-gray-100 placeholder-gray-400"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                required
                placeholder="DELETE"
              />
            </div>
              
            <div className="flex justify-end gap-3 mt-6">
              <button 
                type="button"
                onClick={onClose} 
                className="px-4 py-2.5 bg-white/10 border border-white/20 text-white/95 rounded-lg hover:bg-white/20 transition-colors backdrop-blur-sm"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 transition-all rounded-lg text-white/90 font-medium shadow-lg"
              >
                Delete My Account
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  }

  const SectionButton = ({ id, title, activeSection, setActiveSection }) => (
    <button
      onClick={() => setActiveSection(id)}
      className={`px-4 py-2 text-sm font-medium rounded-md ${
        activeSection === id
          ? "bg-blue-600 text-white"
          : "bg-[#253349] text-gray-300 hover:bg-[#2c3b57]"
      }`}
    >
      {title}
    </button>
  );

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#334155] to-[#0f172a] text-white">
      <Navbar />
      
      {/* Notification toast */}
      {notification.show && (
        <div className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'
        } text-white`}>
          {notification.message}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-[70vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#94c3d2]"></div>
        </div>
      ) : (
        <main className="container mx-auto px-4 py-8 md:flex md:space-x-6">
          {/* Side Profile Card */}
          <aside className="mb-6 md:mb-0 md:w-1/3 flex-shrink-0">
            {/* Profile Card */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg overflow-hidden shadow-sm">
              {/* Gradient Header */}
              <div className="h-32 bg-gradient-to-r from-[#1e293b]/80 via-[#334155]/80 to-[#1e293b]/80 relative flex justify-center">
                {/* Avatar with Hover Effect */}
                <div 
                  className="w-24 h-24 bg-white/10 rounded-full absolute transform -translate-y-1/2 top-[100%] border-4 border-[#0f172a] flex items-center justify-center overflow-hidden group relative cursor-pointer"
                  onClick={() => openModal('photo')}
                >
                  {profilePhoto ? (
                    <img 
                      src={profilePhoto}  
                      className="w-full h-full object-cover"
                      alt="Profile"
                      onError={(e) => {
                        console.error("Image failed to load:", e);
                        e.target.onerror = null; 
                        e.target.src = ""; // Clear the source to prevent continuous errors
                        setProfilePhoto(null); // Reset to default display
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-[#94c3d2] flex items-center justify-center">
                      <span className="text-white text-2xl font-bold">
                        {user.avatarLetter || user.name?.charAt(0).toUpperCase() || "?"}
                      </span>
                    </div>
                  )}
                  
                  {/* Overlay that appears on hover */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <HiUpload className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
              
              {/* Profile Info */}
              <div className="pt-16 pb-8 px-6 text-center">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-[#94C3D2] bg-clip-text text-transparent">{user.name}</h2>
                <p className="text-white/70 mt-1">{user.email}</p>
                
                {/* Bio */}
                <p className="text-sm text-white/80 mt-4 mb-4">{user.bio || "No bio added yet."}</p>
                
                {/* Social Links */}
                <div className="mt-4 border-t border-white/20 pt-4">
                  <h4 className="text-sm font-medium text-[#94c3d2] mb-2">My Socials</h4>
                  {user.socials.github || user.socials.linkedin ? (
                    <div className="flex flex-wrap justify-center gap-2">
                      {user.socials.github && (
                        <a 
                          href={user.socials.github} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1 bg-white/10 rounded-full text-xs text-white/80 hover:bg-white/20 border border-white/20"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                          </svg>
                          GitHub
                        </a>
                      )}
                      
                      {user.socials.linkedin && (
                        <a 
                          href={user.socials.linkedin} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1 bg-white/10 rounded-full text-xs text-white/80 hover:bg-white/20 border border-white/20"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                          </svg>
                          LinkedIn
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-white/60">No social links added yet.</p>
                  )}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="md:w-2/3 flex-grow">
            {/* Tabs Navigation */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-sm mb-6 overflow-hidden">
              <div className="flex w-full">
                <button 
                  className={`flex-1 py-4 text-center text-sm font-medium ${activeTab === "About" ? "text-[#94c3d2] border-b-2 border-[#94c3d2]" : "text-white/80 hover:text-[#94c3d2]"}`}
                  onClick={() => setActiveTab("About")}
                >
                  About
                </button>
                <button 
                  className={`flex-1 py-4 text-center text-sm font-medium ${activeTab === "Account" ? "text-[#94c3d2] border-b-2 border-[#94c3d2]" : "text-white/80 hover:text-[#94c3d2]"}`}
                  onClick={() => setActiveTab("Account")}
                >
                  Account
                </button>
              </div>
            </div>
            
            {/* Content based on selected tab */}
            {activeTab === "About" && (
              <div className="space-y-6">
                {/* Progress Card */}
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-sm p-6">
                  <p className="text-sm text-white/80 mb-2">Complete your profile ({profileProgress}% Complete)</p>
                  <div className="flex h-2 gap-1 mt-1 mb-4">
                    {[...Array(5)].map((_, index) => {
                      // Calculate if this segment should be filled
                      const segmentFilled = profileProgress >= (index + 1) * 20;
                      return (
                        <div 
                          key={index}
                          className={`h-full ${segmentFilled ? 'bg-[#94c3d2]' : 'bg-gray-800/70'} rounded-full flex-1`}
                        ></div>
                      );
                    })}
                  </div>
                </div>

                {/* Personal Information Card */}
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium text-[#94C3D2]">My Personal Information</h3>
                    <button 
                      onClick={() => openModal('personalInfo')}
                      className="text-xs bg-white/10 px-3 py-1 border border-white/20 rounded text-white/80 hover:bg-white/20"
                    >
                      Edit
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-base bg-gradient-to-r from-white to-[#94C3D2] bg-clip-text text-transparent">{user.name}</p>
                      <p className="text-sm text-white/70 mt-1">{user.bio || "Add a Bio to your profile"}</p>
                    </div>
                    
                    {/* Social Links */}
                    <div className="border-t border-white/20 pt-4">
                      <h4 className="text-sm font-medium text-[#94C3D2] mb-2">My Socials</h4>
                      {user.socials.github || user.socials.linkedin ? (
                        <div className="flex flex-wrap gap-2">
                          {user.socials.github && (
                            <a 
                              href={user.socials.github} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-3 py-1 bg-white/10 rounded-full text-xs text-white/80 hover:bg-white/20 border border-white/20"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                              </svg>
                              GitHub
                            </a>
                          )}
                          
                          {user.socials.linkedin && (
                            <a 
                              href={user.socials.linkedin} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-3 py-1 bg-white/10 rounded-full text-xs text-white/80 hover:bg-white/20 border border-white/20"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                              </svg>
                              LinkedIn
                            </a>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-white/60">No social links added yet.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Work Experience Card */}
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium text-[#94c3d2]">Work Experience</h3>
                    <button 
                      onClick={() => openModal('workExperience')}
                      className="text-xs bg-white/10 px-3 py-1 border border-white/20 rounded text-white/80 hover:bg-white/20"
                    >
                      Add
                    </button>
                  </div>
                  
                  {user.workExperience && user.workExperience.length > 0 ? (
                    <div className="space-y-4">
                      {user.workExperience.map((experience) => (
                        <div key={experience.id} className="border-b border-white/10 pb-4 last:border-0 last:pb-0">
                          <div className="flex justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-white/90">{experience.position}</h4>
                              <p className="text-xs text-white/80">{experience.company}</p>
                              <p className="text-xs text-white/60 mt-1">{experience.startDate} - {experience.endDate}</p>
                            </div>
                            <button 
                              onClick={() => handleDeleteWorkExperience(experience.id)}
                              className="text-red-400 hover:text-red-300"
                              title="Delete"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-white/60">No work experience added yet.</p>
                  )}
                </div>

                {/* Education Card */}
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium text-[#94c3d2]">Education</h3>
                    <button 
                      onClick={() => openModal('education')} 
                      className="text-xs bg-white/10 px-3 py-1 border border-white/20 rounded text-white/80 hover:bg-white/20"
                    >
                      Add
                    </button>
                  </div>
                  
                  {user.education && user.education.length > 0 ? (
                    <div className="space-y-4">
                      {user.education.map((edu) => (
                        <div key={edu.id} className="border-b border-white/10 pb-4 last:border-0 last:pb-0">
                          <div className="flex justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-white/90">{edu.degree}</h4>
                              <p className="text-xs text-white/80">{edu.school}</p>
                              <p className="text-xs text-white/60 mt-1">{edu.startYear} - {edu.endYear}</p>
                            </div>
                            <button 
                              onClick={() => handleDeleteEducation(edu.id)}
                              className="text-red-400 hover:text-red-300"
                              title="Delete"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-white/60">No qualification added yet.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "Account" && (
              <div className="space-y-6">
                {/* Change Password */}
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-medium text-white/95 mb-2">Change Password</h3>
                  <p className="text-sm text-white/70 mb-4">Update your account security by changing your password.</p>
                  <button 
                    onClick={() => openModal('password')} 
                    className="bg-[#94c3d2] px-4 py-2 rounded text-sm font-medium hover:bg-[#7ba9b8] text-white" 
                  >
                    Change My Password
                  </button>
                </div>

                {/* Account Deletion */}
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-medium text-white/95 mb-2">Account Deletion</h3>
                  <p className="text-sm text-white/70 mb-4">All your profile and learning data will be permanently deleted.</p>
                  <button 
                    onClick={() => openModal('deleteAccount')} 
                    className="bg-red-600 px-4 py-2 rounded text-sm font-medium hover:bg-red-700 text-white/90" 
                  >
                    Delete My Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      )}

      {/* Modals */}
      {activeModal === 'personalInfo' && (
        <PersonalInfoModal user={user} onClose={closeModal} onUpdate={handlePersonalInfoUpdate} />
      )}
      
      {activeModal === 'photo' && (
        <PhotoUploadModal onClose={closeModal} />
      )}
      
      {activeModal === 'education' && (
        <EducationModal onClose={closeModal} />
      )}
      
      {activeModal === 'workExperience' && (
        <WorkExperienceModal onClose={closeModal} />
      )}
      
      {activeModal === 'password' && (
        <PasswordChangeModal onClose={closeModal} />
      )}
      
      {activeModal === 'deleteAccount' && (
        <DeleteAccountModal onClose={closeModal} />
      )}
    </div>
  );
}

export default UserProfile;