import { HiPencil, HiUpload, HiOutlineCalendar, HiOutlineMail, HiX } from "react-icons/hi";
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { fetchCurrentUser } from "../utils/authUtils";

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#dbeafe] rounded-lg shadow-xl max-w-md w-full p-6 text-gray-800">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Edit Personal Information</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <HiX className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input 
              type="text" 
              id="name" 
              style={{backgroundColor: "white"}}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <div className="relative">
              <textarea 
                id="bio" 
                rows={3}
                maxLength={maxBioLength}
                style={{backgroundColor: "white"}}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-none"
                value={bio}
                placeholder="Tell us a bit about yourself"
                onChange={(e) => setBio(e.target.value)}
              ></textarea>
              <div className="text-xs text-gray-500 text-right mt-1">
                {bio.length}/{maxBioLength} characters
              </div>
            </div>
          </div>
          
          {/* Social Links */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Social Links</h4>
            
            <div className="space-y-3">
              <div>
                <label htmlFor="github" className="block text-sm font-medium text-gray-700 mb-1">
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
                  style={{backgroundColor: "white"}}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://github.com/username"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700 mb-1">
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
                  style={{backgroundColor: "white"}}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://linkedin.com/in/username"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end gap-2">
            <button 
              type="button"
              onClick={onClose} 
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-4 py-2 bg-[#94c3d2] rounded-md text-sm font-medium text-white hover:bg-[#7ba9b8]"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const UserProfile = () => {
  const [activeTab, setActiveTab] = useState("About");
  const [activeModal, setActiveModal] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profileProgress, setProfileProgress] = useState(10); // Start with 10% for having an account
  const [loading, setLoading] = useState(true);
  
  // User data state with minimal initial values
  const [user, setUser] = useState({
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
        const userData = await fetchCurrentUser();
        if (userData) {
          // Only set what we get from the API, no defaults
          setUser({
            name: userData.name || "",
            email: userData.email || "",
            avatarLetter: userData.name ? userData.name.charAt(0) : "",
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
      
      // Upload to server - replace with your actual API endpoint
      // const response = await fetch(`/api/users/${user._id}/profile-picture`, {
      //   method: 'POST',
      //   body: formData,
      //   credentials: 'include'
      // });
      
      // if (!response.ok) throw new Error('Failed to upload profile picture');
      // const data = await response.json();
      // setProfilePhoto(data.data.profilePicture); // Update with the server URL
      
      updateProgress('photo', true);
      closeModal();
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('Failed to upload profile picture');
    }
  };
  
  // Handle personal info update
  const handlePersonalInfoUpdate = async (updatedInfo) => {
    const { name, bio, github, linkedin } = updatedInfo;
    
    try {
      // Update user state
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
      
      // Save to API - replace with your actual API endpoint
      // const response = await fetch(`/api/users/${user._id}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     name,
      //     bio,
      //     socials: {
      //       github,
      //       linkedin
      //     }
      //   }),
      //   credentials: 'include'
      // });
      
      // if (!response.ok) throw new Error('Failed to update profile');
      // const data = await response.json();
      
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
  const handleDeleteEducation = (id) => {
    const updatedEducation = user.education.filter(edu => edu.id !== id);
    setUser({
      ...user,
      education: updatedEducation
    });
    localStorage.setItem('userEducation', JSON.stringify(updatedEducation));
  };

  // Handle deleting work experience item
  const handleDeleteWorkExperience = (id) => {
    const updatedWorkExperience = user.workExperience.filter(exp => exp.id !== id);
    setUser({
      ...user,
      workExperience: updatedWorkExperience
    });
    localStorage.setItem('userWorkExperience', JSON.stringify(updatedWorkExperience));
  };

  // Photo Upload Modal Component
  function PhotoUploadModal({ onClose }) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-[#dbeafe] rounded-lg shadow-xl max-w-md w-full p-6 text-gray-800">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Upload Profile Photo</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <HiX className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Upload a profile photo to personalize your account.</p>
            
            <div className="flex items-center justify-center">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <HiUpload className="w-10 h-10 mb-3 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                  <p className="text-xs text-gray-500">PNG, JPG or GIF (MAX. 2MB)</p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handlePhotoUpload}
                />
              </label>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end gap-2">
            <button 
              onClick={onClose} 
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Education Modal Component
  function EducationModal({ onClose }) {
    const [school, setSchool] = useState('');
    const [degree, setDegree] = useState('');
    const [startYear, setStartYear] = useState('');
    const [endYear, setEndYear] = useState('');
    
    const handleSubmit = (e) => {
      e.preventDefault();
      
      if (!school || !degree || !startYear) {
        alert('Please fill in all required fields');
        return;
      }
      
      const newEducation = {
        id: Date.now(),
        school,
        degree,
        startYear,
        endYear: endYear || 'Present'
      };
      
      const updatedEducation = [...user.education, newEducation];
      
      // Update user state
      setUser({
        ...user,
        education: updatedEducation
      });
      
      // Save to localStorage
      localStorage.setItem('userEducation', JSON.stringify(updatedEducation));
      
      // Update progress
      updateProgress('education', true);
      
      onClose();
    };
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-[#dbeafe] rounded-lg shadow-xl max-w-md w-full p-6 text-gray-800">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Add Education</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <HiX className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="school" className="block text-sm font-medium text-gray-700 mb-1">School/University</label>
              <input 
                type="text" 
                id="school" 
                style={{backgroundColor: "white"}}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label htmlFor="degree" className="block text-sm font-medium text-gray-700 mb-1">Degree</label>
              <input 
                type="text" 
                id="degree" 
                style={{backgroundColor: "white"}} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startYear" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input 
                  type="month" 
                  id="startYear" 
                  style={{backgroundColor: "white"}}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={startYear}
                  onChange={(e) => setStartYear(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="endYear" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input 
                  type="month" 
                  id="endYear" 
                  style={{backgroundColor: "white"}}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={endYear}
                  onChange={(e) => setEndYear(e.target.value)}
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-2">
              <button 
                type="button"
                onClick={onClose} 
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-[#94c3d2] rounded-md text-sm font-medium text-white hover:bg-[#7ba9b8]"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
  
  // Work Experience Modal Component
  function WorkExperienceModal({ onClose }) {
    const [company, setCompany] = useState('');
    const [position, setPosition] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    const handleSubmit = (e) => {
      e.preventDefault();
      
      if (!company || !position || !startDate) {
        alert('Please fill in all required fields');
        return;
      }
      
      const newExperience = {
        id: Date.now(),
        company,
        position,
        startDate,
        endDate: endDate || 'Present'
      };
      
      const updatedExperience = [...user.workExperience, newExperience];
      
      // Update user state
      setUser({
        ...user,
        workExperience: updatedExperience
      });
      
      // Save to localStorage
      localStorage.setItem('userWorkExperience', JSON.stringify(updatedExperience));
      
      // Update progress
      updateProgress('workExperience', true);
      
      onClose();
    };
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-[#dbeafe] rounded-lg shadow-xl max-w-md w-full p-6 text-gray-800">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Add Work Experience</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <HiX className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <input 
                type="text" 
                id="company" 
                style={{backgroundColor: "white"}}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">Position</label>
              <input 
                type="text" 
                id="position" 
                style={{backgroundColor: "white"}}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input 
                  type="month" 
                  id="startDate" 
                  style={{backgroundColor: "white"}}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input 
                  type="month" 
                  id="endDate" 
                  style={{backgroundColor: "white"}}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-2">
              <button 
                type="button"
                onClick={onClose} 
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-[#94c3d2] rounded-md text-sm font-medium text-white hover:bg-[#7ba9b8]"
              >
                Save
              </button>
            </div>
          </form>
        </div>
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
    <div className="min-h-screen bg-[#E8F1F7] text-gray-800">
      <Navbar />

      {loading ? (
        <div className="flex justify-center items-center h-[70vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#94c3d2]"></div>
        </div>
      ) : (
        <main className="container mx-auto px-4 py-8 md:flex md:space-x-6">
          {/* Side Profile Card */}
          <aside className="mb-6 md:mb-0 md:w-1/3 flex-shrink-0">
            {/* Profile Card */}
            <div className="bg-[#dbeafe] rounded-lg overflow-hidden shadow-sm">
              {/* Gradient Header */}
              <div className="h-32 bg-gradient-to-r from-[#c2d9f0] via-[#a7c7e7] to-[#8fb6de] relative flex justify-center">
                {/* Avatar with Hover Effect */}
                <div 
                  className="w-24 h-24 bg-white rounded-full absolute transform -translate-y-1/2 top-[100%] border-4 border-white flex items-center justify-center overflow-hidden group relative cursor-pointer"
                  onClick={() => openModal('photo')}
                >
                  {profilePhoto ? (
                    <img 
                      src={profilePhoto}  
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#94c3d2]"></div>
                  )}
                  
                  {/* Overlay that appears on hover */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <HiUpload className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
              
              {/* Profile Info */}
              <div className="pt-16 pb-8 px-6 text-center">
                <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
                <p className="text-gray-500 mt-1">{user.email}</p>
                
                {/* Bio */}
                <p className="text-sm text-gray-600 mt-4 mb-4">{user.bio || "No bio added yet."}</p>
                
                {/* Social Links */}
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Social Links</h4>
                  {user.socials.github || user.socials.linkedin ? (
                    <div className="flex flex-wrap justify-center gap-2">
                      {user.socials.github && (
                        <a 
                          href={user.socials.github} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-700 hover:bg-gray-200"
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
                          className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-700 hover:bg-gray-200"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                          </svg>
                          LinkedIn
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No social links added yet.</p>
                  )}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="md:w-2/3 flex-grow">
            {/* Tabs Navigation */}
            <div className="bg-[#dbeafe] rounded-lg shadow-sm mb-6 overflow-hidden">
              <div className="flex w-full">
                <button 
                  className={`flex-1 py-4 text-center text-sm font-medium ${activeTab === "About" ? "text-[#94c3d2] border-b-2 border-[#94c3d2]" : "text-gray-500 hover:text-[#94c3d2]"}`}
                  onClick={() => setActiveTab("About")}
                >
                  About
                </button>
                <button 
                  className={`flex-1 py-4 text-center text-sm font-medium ${activeTab === "Account" ? "text-[#94c3d2] border-b-2 border-[#94c3d2]" : "text-gray-500 hover:text-[#94c3d2]"}`}
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
                <div className="bg-[#dbeafe] rounded-lg shadow-sm p-6">
                  <p className="text-sm text-gray-600 mb-2">Complete your profile ({profileProgress}% Complete)</p>
                  <div className="flex h-2 gap-1 mt-1 mb-4">
                    {[...Array(5)].map((_, index) => {
                      // Calculate if this segment should be filled
                      const segmentFilled = profileProgress >= (index + 1) * 20;
                      return (
                        <div 
                          key={index}
                          className={`h-full ${segmentFilled ? 'bg-[#94c3d2]' : 'bg-gray-300'} rounded-full flex-1`}
                        ></div>
                      );
                    })}
                  </div>
                  
                  {/* Removed text about completing profile */}
                </div>

                {/* Personal Information Card */}
                <div className="bg-[#dbeafe] rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium text-gray-900">My Personal Information</h3>
                    <button 
                      onClick={() => openModal('personalInfo')}
                      className="text-xs bg-white px-3 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
                    >
                      Edit
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-base text-gray-700">{user.name}</p>
                      <p className="text-sm text-gray-500 mt-1">{user.bio || "Add a Bio to your profile"}</p>
                    </div>
                    
                    {/* Social Links */}
                    <div className="border-t border-gray-100 pt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">My Socials</h4>
                      {user.socials.github || user.socials.linkedin ? (
                        <div className="flex flex-wrap gap-2">
                          {user.socials.github && (
                            <a 
                              href={user.socials.github} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-700 hover:bg-gray-200"
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
                              className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-700 hover:bg-gray-200"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                              </svg>
                              LinkedIn
                            </a>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No social links added yet.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Work Experience Card */}
                <div className="bg-[#dbeafe] rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium text-gray-900">Work Experience</h3>
                    <button 
                      onClick={() => openModal('workExperience')}
                      className="text-xs bg-white px-3 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
                    >
                      Add
                    </button>
                  </div>
                  
                  {user.workExperience && user.workExperience.length > 0 ? (
                    <div className="space-y-4">
                      {user.workExperience.map((experience) => (
                        <div key={experience.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                          <div className="flex justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-gray-800">{experience.position}</h4>
                              <p className="text-xs text-gray-600">{experience.company}</p>
                              <p className="text-xs text-gray-500 mt-1">{experience.startDate} - {experience.endDate}</p>
                            </div>
                            <button 
                              onClick={() => handleDeleteWorkExperience(experience.id)}
                              className="text-red-500 hover:text-red-700"
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
                    <p className="text-sm text-gray-500">No work experience added yet.</p>
                  )}
                </div>

                {/* Education Card */}
                <div className="bg-[#dbeafe] rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium text-gray-900">Education</h3>
                    <button 
                      onClick={() => openModal('education')} 
                      className="text-xs bg-white px-3 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
                    >
                      Add
                    </button>
                  </div>
                  
                  {user.education && user.education.length > 0 ? (
                    <div className="space-y-4">
                      {user.education.map((edu) => (
                        <div key={edu.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                          <div className="flex justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-gray-800">{edu.degree}</h4>
                              <p className="text-xs text-gray-600">{edu.school}</p>
                              <p className="text-xs text-gray-500 mt-1">{edu.startYear} - {edu.endYear}</p>
                            </div>
                            <button 
                              onClick={() => handleDeleteEducation(edu.id)}
                              className="text-red-500 hover:text-red-700"
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
                    <p className="text-sm text-gray-500">No qualification added yet.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "Account" && (
              <div className="space-y-6">
                {/* Change Password */}
                <div className="bg-[#dbeafe] rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Change Password</h3>
                  <p className="text-sm text-gray-600 mb-4">Update your account security by changing your password.</p>
                  <button className="bg-[#94c3d2] px-4 py-2 rounded text-sm font-medium hover:bg-[#7ba9b8]" style={{
                    color: "white"
                  }}>
                    Change My Password
                  </button>
                </div>

                {/* Account Deletion - Keeping this section but removing Account Disable */}
                <div className="bg-[#dbeafe] rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Account Deletion</h3>
                  <p className="text-sm text-gray-600 mb-4">All your profile and learning data will be permanently deleted.</p>
                  <button className="bg-red-500 px-4 py-2 rounded text-sm font-medium hover:bg-red-600" style={{
                    color: "white"
                  }}>
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
    </div>
  );
};

export default UserProfile;