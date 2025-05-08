import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { fetchCurrentUser } from '../utils/authUtils';

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await fetchCurrentUser();
        setIsAuthenticated(!!user);
      } catch (error) {
        console.error('Authentication check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Add a function to validate room access for URLs with room parameter
  const validateRoomAccess = (pathname) => {
    // Check if trying to access a room directly
    if (pathname.startsWith('/room/')) {
      const roomInfo = localStorage.getItem('roomInfo');
      
      // No room info means no access - user must join through modal
      if (!roomInfo) {
        return false;
      }
      
      try {
        const parsedInfo = JSON.parse(roomInfo);
        
        // Get room ID from pathname
        const roomIdFromPath = pathname.split('/')[2];
        
        // Check if the IDs match
        if (parsedInfo.roomId !== roomIdFromPath) {
          return false;
        }
        
        // Check for session expiration (24 hours)
        const createdOrJoinedAt = new Date(parsedInfo.createdAt || parsedInfo.joinedAt).getTime();
        const currentTime = new Date().getTime();
        const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        
        if (currentTime - createdOrJoinedAt > SESSION_DURATION) {
          // Session expired, clean up
          localStorage.removeItem('roomInfo');
          window.dispatchEvent(new CustomEvent('roomLeft'));
          return false;
        }
        
        // Check if room was ended
        const endedRooms = JSON.parse(localStorage.getItem('endedRooms') || '[]');
        if (endedRooms.includes(roomIdFromPath)) {
          return false;
        }
        
        // All checks passed, allow access
        return true;
      } catch (error) {
        console.error('Error validating room access:', error);
        return false;
      }
    }
    
    // Not a room URL, proceed normally
    return true;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#94C3D2]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Only redirect to login if not on the home page
    if (location.pathname !== '/') {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
  }

  // Check for room access if accessing a room URL
  if (location.pathname.startsWith('/room/') && !validateRoomAccess(location.pathname)) {
    console.error("Direct room access blocked - user must join through dashboard");
    toast.error("Direct room access is not allowed. Please join a room from the dashboard.");
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;