import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { fetchCurrentUser } from '../utils/authUtils';

const PublicRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Set a hard timeout - don't wait forever
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth check timeout')), 2000)
        );
        
        const authPromise = fetchCurrentUser();
        
        // Race between auth check and timeout
        const user = await Promise.race([authPromise, timeoutPromise]);
        setIsAuthenticated(!!user);
      } catch (error) {
        // If auth check fails or times out, assume NOT authenticated
        // This allows the login page to show
        setIsAuthenticated(false);
      } finally {
        // ALWAYS set loading to false, no matter what
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Show a loading spinner instead of blank screen
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f0f0f0'
      }}>
        <div style={{
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3498db',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // If already authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Show the login/signup page
  return children;
};

export default PublicRoute;