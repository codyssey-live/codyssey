import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Syllabus from "./pages/Syllabus";
import LectureRoom from "./pages/LectureRoom";
import CollabRoom from "./pages/CollabRoom";
import UserProfile from "./pages/UserProfile";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Home from "./pages/Home";
import Room from "./pages/Room"; // Add this import
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import "./App.css";
import axios from 'axios';

// Configure axios defaults
axios.defaults.baseURL = 'http://localhost:8080'; // Match your server port
axios.defaults.withCredentials = true; // Important for sending cookies

// Placeholder components for routes that don't exist yet
const Profile = () => <div className="p-10">Profile Page (Coming Soon)</div>;
const Settings = () => <div className="p-10">Settings Page (Coming Soon)</div>;
const NotFound = () => <div className="p-10">Page Not Found</div>;

function App() {
  return (
    <Router>
      <div className="app min-h-screen flex flex-col">
        <div className="flex-grow">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            
            {/* Auth routes - redirect to dashboard if already logged in */}
            <Route path="/signup" element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            } />
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/forgot-password" element={
              <PublicRoute>
                <ForgotPassword />
              </PublicRoute>
            } />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/syllabus" element={
              <ProtectedRoute>
                <Syllabus />
              </ProtectedRoute>
            } />
            <Route path="/lecture-room" element={
              <ProtectedRoute>
                <LectureRoom />
              </ProtectedRoute>
            } />
            <Route path="/collab-room" element={
              <ProtectedRoute>
                <CollabRoom />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/room/:roomId" element={
              <ProtectedRoute>
                <Room />
              </ProtectedRoute>
            } />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
