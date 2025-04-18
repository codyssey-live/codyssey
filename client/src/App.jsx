import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Syllabus from './pages/Syllabus';
import WatchVideo from './pages/WatchVideo';
import CollabRoom from './pages/CollabRoom';
import './App.css';

// Placeholder components for routes that don't exist yet
const Profile = () => <div className="p-10">Profile Page (Coming Soon)</div>;
const Settings = () => <div className="p-10">Settings Page (Coming Soon)</div>;

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/syllabus" element={<Syllabus />} />
          <Route path="/watch-video" element={<WatchVideo />} />
          <Route path="/collab-room" element={<CollabRoom />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
