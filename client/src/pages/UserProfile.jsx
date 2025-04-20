import { HiPencil, HiUpload, HiOutlineCalendar, HiOutlineMail, HiX } from "react-icons/hi";
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";

// Separate component for personal info modal to prevent focus issues
function PersonalInfoModal({ user, onClose }) {
  // Local state within the component
  const [name, setName] = useState(user.name || "");
  const [bio, setBio] = useState(user.bio || "");
  const [github, setGithub] = useState(user.socials?.github || "");
  const [linkedin, setLinkedin] = useState(user.socials?.linkedin || "");
  
  // Add maximum bio length constant
  const maxBioLength = 250;

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would normally save the data
    console.log({ name, bio, github, linkedin });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-gray-800">
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
              className="px-4 py-2 bg-blue-500 rounded-md text-sm font-medium text-white hover:bg-blue-600"
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
  
  const user = {
    name: "John Doe",
    email: "john.doe@gmail.com",
    phone: "123-456-7890",
    dob: "2006-08-15",
    address: "Pune, Maharashtra",
    createdAt: "2023-01-01",
    avatarLetter: "J",
    bio: "Passionate about solving problems and building impactful solutions.",
    socials: {
      github: "",
      linkedin: ""
    }
  };

  // Function to open modal
  const openModal = (modalType) => {
    setActiveModal(modalType);
  };

  // Function to close modal
  const closeModal = () => {
    setActiveModal(null);
  };

  // Modal component
  const Modal = ({ title, children, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-gray-800">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <HiX className="w-5 h-5" />
          </button>
        </div>
        {children}
        <div className="mt-6 flex justify-end gap-2">
          <button 
            onClick={onClose} 
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button 
            className="px-4 py-2 bg-blue-500 rounded-md text-sm font-medium text-white hover:bg-blue-600"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );

  // Helper component for section buttons
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
    <div className="min-h-screen bg-[#f5f7fa] text-gray-800">
      <Navbar />

      <main className="container mx-auto px-4 py-8 md:flex md:space-x-6">
        {/* Side Profile Card */}
        <aside className="mb-6 md:mb-0 md:w-1/3 flex-shrink-0">
          {/* Profile Card */}
          <div className="bg-white rounded-lg overflow-hidden shadow-sm">
            {/* Gradient Header */}
            <div className="h-32 bg-gradient-to-r from-yellow-100 via-orange-100 to-red-200 relative">
              {/* Avatar */}
              <div className="w-24 h-24 bg-gray-200 rounded-full absolute left-1/2 transform -translate-x-1/2 -bottom-12 border-4 border-white flex items-center justify-center">
                <span className="text-4xl font-medium text-blue-600">{user.avatarLetter}</span>
              </div>
            </div>
            
            {/* Profile Info */}
            <div className="pt-16 pb-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
              <p className="text-gray-500 mt-1">{user.email}</p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="md:w-2/3 flex-grow">
          {/* Tabs Navigation */}
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="flex w-full">
              <button 
                className={`flex-1 py-4 text-center text-sm font-medium ${activeTab === "About" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-blue-400"}`}
                onClick={() => setActiveTab("About")}
              >
                About
              </button>
              <button 
                className={`flex-1 py-4 text-center text-sm font-medium ${activeTab === "Account" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-blue-400"}`}
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
              <div className="bg-white rounded-lg shadow-sm p-6">
                <p className="text-sm text-gray-600 mb-2">Complete your profile (20% Complete)</p>
                <div className="flex h-2 gap-1 mt-1 mb-4">
                  <div className="h-full bg-blue-500 rounded-full flex-1"></div>
                  <div className="h-full bg-gray-200 rounded-full flex-1"></div>
                  <div className="h-full bg-gray-200 rounded-full flex-1"></div>
                  <div className="h-full bg-gray-200 rounded-full flex-1"></div>
                  <div className="h-full bg-gray-200 rounded-full flex-1"></div>
                </div>
                
                <div className="mt-2">
                  <p className="text-sm text-gray-600">Add a photo to complete your profile. 
                    <button onClick={() => openModal('photo')} className="text-blue-600 ml-1 hover:underline">
                      Upload Profile Photo
                    </button>
                  </p>
                </div>
              </div>

              {/* Personal Information Card */}
              <div className="bg-white rounded-lg shadow-sm p-6">
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
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium text-gray-900">Work Experience</h3>
                  <button 
                    onClick={() => openModal('workExperience')}
                    className="text-xs bg-white px-3 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
                  >
                    Add
                  </button>
                </div>
                <p className="text-sm text-gray-500">No work experience added yet.</p>
              </div>

              {/* Education Card */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium text-gray-900">Education</h3>
                  <button 
                    onClick={() => openModal('education')} 
                    className="text-xs bg-white px-3 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
                  >
                    Add
                  </button>
                </div>
                <p className="text-sm text-gray-500">No qualification added yet.</p>
              </div>
            </div>
          )}

          {activeTab === "Account" && (
            <div className="space-y-6">
              {/* Change Password */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Change Password</h3>
                <p className="text-sm text-gray-600 mb-4">Update your account security by changing your password.</p>
                <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700">
                  Change My Password
                </button>
              </div>

              {/* Account Disable */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Account Disable</h3>
                <p className="text-sm text-gray-600 mb-4">All your profile and learning data will be temporarily disabled. It can be activated again by signing in.</p>
                <button className="bg-red-500 text-white px-4 py-2 rounded text-sm font-medium hover:bg-red-600">
                  Disable My Account
                </button>
              </div>

              {/* Account Deletion */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Account Deletion</h3>
                <p className="text-sm text-gray-600 mb-4">All your profile and learning data will be permanently deleted.</p>
                <button className="bg-red-500 text-white px-4 py-2 rounded text-sm font-medium hover:bg-red-600">
                  Delete My Account
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {activeModal === 'photo' && (
        <Modal title="Upload Profile Photo" onClose={closeModal}>
          <div className="text-center">
            <div className="w-32 h-32 mx-auto bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <HiUpload className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-sm text-gray-600 mb-4">Upload a photo to represent your profile</p>
            <input type="file" className="hidden" id="profilePhotoUpload" />
            <label 
              htmlFor="profilePhotoUpload"
              className="px-4 py-2 bg-blue-500 text-white rounded-md cursor-pointer hover:bg-blue-600 text-sm font-medium inline-block"
            >
              Choose a file
            </label>
          </div>
        </Modal>
      )}

      {activeModal === 'personalInfo' && (
        <PersonalInfoModal user={user} onClose={closeModal} />
      )}

      {activeModal === 'workExperience' && (
        <Modal title="Add Work Experience" onClose={closeModal}>
          <div className="space-y-4">
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <input 
                type="text" 
                id="company" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. Google"
              />
            </div>
            <div>
              <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">Position</label>
              <input 
                type="text" 
                id="position" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. Software Engineer"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input 
                  type="date" 
                  id="startDate" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input 
                  type="date" 
                  id="endDate" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </Modal>
      )}

      {activeModal === 'education' && (
        <Modal title="Add Education" onClose={closeModal}>
          <div className="space-y-4">
            <div>
              <label htmlFor="school" className="block text-sm font-medium text-gray-700 mb-1">School/University</label>
              <input 
                type="text" 
                id="school" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. Stanford University"
              />
            </div>
            <div>
              <label htmlFor="degree" className="block text-sm font-medium text-gray-700 mb-1">Degree</label>
              <input 
                type="text" 
                id="degree" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. Bachelor of Science"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="eduStartDate" className="block text-sm font-medium text-gray-700 mb-1">Start Year</label>
                <input 
                  type="number" 
                  id="eduStartDate" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. 2018"
                />
              </div>
              <div>
                <label htmlFor="eduEndDate" className="block text-sm font-medium text-gray-700 mb-1">End Year</label>
                <input 
                  type="number" 
                  id="eduEndDate" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. 2022"
                />
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default UserProfile;
