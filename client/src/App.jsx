import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Syllabus from './pages/Syllabus';
import LectureRoom from './pages/LectureRoom';
import CollabRoom from './pages/CollabRoom';
import UserProfile from './pages/UserProfile';
import Signup from './pages/Signup';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Home from './pages/Home';
import Footer from './components/Footer';
import './App.css';

// Placeholder components for routes that don't exist yet
const Profile = () => <div className="p-10">Profile Page (Coming Soon)</div>;
const Settings = () => <div className="p-10">Settings Page (Coming Soon)</div>;

function App() {
  return (
    <Router>
      <div className="app min-h-screen flex flex-col">
        <div className="flex-grow">
          </Routes>
        </div>
        <Routes>
          <Route path="/" element={null} />
          <Route path="*" element={<Footer />} />
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/syllabus" element={<Syllabus />} />
          <Route path="/lecture-room" element={<LectureRoom />} />
          <Route path="/collab-room" element={<CollabRoom />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
