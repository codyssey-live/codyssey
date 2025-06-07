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
import Room from "./pages/Room";
import Footer from "./components/Footer";
import NotFoundPage from "./components/NotFoundPage";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import { RoomProvider } from "./context/RoomContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import axios from 'axios';

// Configure axios defaults
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';
axios.defaults.withCredentials = true;

function App() {
  return (
    <Router>
      <RoomProvider>
        <NotificationProvider>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
          <div className="app min-h-screen flex flex-col">
            <div className="flex-grow">
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Home />} />
                
                {/* Auth routes */}
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
                  {/* Protected routes with exact paths */}
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
                <Route path="/room/:roomId" element={
                  <ProtectedRoute>
                    <Room />
                  </ProtectedRoute>
                } />
                <Route path="/user/:userId" element={
                  <ProtectedRoute>
                    <UserProfile />
                  </ProtectedRoute>
                } />
                
                {/* Route for viewing another user's syllabus by ID */}
                <Route path="/:userId" element={
                  <ProtectedRoute>
                    <Syllabus />
                  </ProtectedRoute>
                } />
                
                {/* CRITICAL: Catch-all route for any undefined path - THIS MUST BE LAST */}
                <Route path="*" element={
                  <NotFoundPage />
                } />
              </Routes>
            </div>
            <Footer />
          </div>
        </NotificationProvider>
      </RoomProvider>
    </Router>
  );
}

export default App;
