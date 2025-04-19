import { HiPencil, HiUpload, HiCog, HiOutlineCalendar, HiOutlineMail } from "react-icons/hi";
import Navbar from "../components/Navbar";

const UserProfile = () => {
  const user = {
    name: "John Doe",
    email: "john.doe@gmail.com",
    phone: "123-456-7890",
    dob: "2006-08-15",
    address: "Pune, Maharashtra",
    createdAt: "2023-01-01",
    avatarLetter: "J",
    bio: "Passionate about solving problems and building impactful solutions.",
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <Navbar />

      <main className="container mx-auto px-4 py-8 space-y-6 md:flex md:space-y-0 md:space-x-6">
        {/* Side Profile Card */}
        <aside className="bg-[#1e293b] rounded-xl p-6 shadow-lg border border-gray-700 md:w-1/3">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto rounded-full bg-purple-500 flex items-center justify-center text-3xl font-bold text-white">
              {user.avatarLetter}
            </div>
            <h2 className="text-xl font-bold text-white mt-4">{user.name}</h2>
            <p className="text-sm text-gray-300">{user.email}</p>
            <p className="text-sm text-purple-400 mt-2">Problem Solver</p>
          </div>
          <div className="mt-6 space-y-2">
            <div className="flex items-center gap-2 text-gray-300">
              <HiOutlineMail className="w-5 h-5" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <HiOutlineCalendar className="w-5 h-5" />
              <span>Joined on {user.createdAt}</span>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="space-y-6 md:w-2/3">
          {/* About and Account Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* About Section */}
            <div className="bg-[#1e293b] rounded-xl p-6 shadow-lg border border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-purple-400">About</h3>
                <HiPencil className="w-5 h-5 text-gray-400 cursor-pointer hover:text-white" />
              </div>
              <p className="text-gray-300 mt-4">{user.bio}</p>
            </div>

            {/* Account Info Section */}
            <div className="bg-[#1e293b] rounded-xl p-6 shadow-lg border border-gray-700">
              <h3 className="text-lg font-semibold text-purple-400 mb-4">
                Account Information
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Username</span>
                  <span className="text-gray-400">{user.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Email</span>
                  <span className="text-gray-400">{user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Account Created</span>
                  <span className="text-gray-400">{user.createdAt}</span>
                </div>
                <button className="text-sm text-purple-400 hover:underline mt-2">
                  Change Password
                </button>
              </div>
            </div>
          </div>

          {/* Work Experience Section */}
          <div className="bg-[#1e293b] rounded-xl p-6 shadow-lg border border-gray-700">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-purple-400">
                Work Experience
              </h3>
              <HiPencil className="w-5 h-5 text-gray-400 cursor-pointer hover:text-white" />
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <h4 className="text-white font-medium">Software Engineer</h4>
                <p className="text-sm text-gray-400">Tech Company</p>
                <p className="text-sm text-gray-500">Jan 2020 - Present</p>
              </div>
              <div>
                <h4 className="text-white font-medium">Intern</h4>
                <p className="text-sm text-gray-400">Startup Inc.</p>
                <p className="text-sm text-gray-500">Jun 2019 - Dec 2019</p>
              </div>
            </div>
          </div>

          {/* Education Section */}
          <div className="bg-[#1e293b] rounded-xl p-6 shadow-lg border border-gray-700">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-purple-400">
                Education
              </h3>
              <HiPencil className="w-5 h-5 text-gray-400 cursor-pointer hover:text-white" />
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <h4 className="text-white font-medium">Bachelor of Technology</h4>
                <p className="text-sm text-gray-400">Computer Science</p>
                <p className="text-sm text-gray-500">2016 - 2020</p>
              </div>
              <div>
                <h4 className="text-white font-medium">High School</h4>
                <p className="text-sm text-gray-400">Science Stream</p>
                <p className="text-sm text-gray-500">2014 - 2016</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserProfile;
