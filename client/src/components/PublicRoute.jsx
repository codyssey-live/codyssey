import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { fetchCurrentUser } from '../utils/authUtils';

const PublicRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await fetchCurrentUser();
        setIsAuthenticated(!!user);
        
        // If user is authenticated, replace the history stack to prevent going back
        if (user) {
          // Clear any existing room info to prevent automatic room creation after login/signup
          localStorage.removeItem('roomInfo');
          
          // Only redirect to dashboard if not forcing login
          const forceLogin = location?.state?.forceLogin;
          if (!forceLogin && location.pathname !== '/') {
            window.history.replaceState(null, '', '/dashboard');
          }
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
    
    // Add event listener for popstate (browser back/forward buttons)
    const handlePopState = async () => {
      try {
        const user = await fetchCurrentUser();
        if (user) {
          // Check location state for forceLogin flag
          const state = window.history.state || {};
          const forceLogin = state.forceLogin;
          
          if (!forceLogin && location.pathname !== '/') {
            // If user is authenticated, redirect to dashboard when using browser navigation
            window.history.pushState(null, '', '/dashboard');
          }
        }
      } catch (error) {
        console.error('Navigation check failed:', error);
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [location]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#94C3D2]"></div>
      </div>
    );
  }

  // We want to allow all users to access signup/login/forgot-password pages
  // regardless of authentication status, so we'll simply return the children
  return children;
};

export default PublicRoute;