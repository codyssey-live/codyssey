import { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Create the context
const NavigationContext = createContext({
  currentPath: '/',
  previousPath: '/',
  validPaths: [],
  isValidPath: () => false
});

// Define valid app paths to distinguish between real and non-existent routes
const APP_PATHS = [
  '/',
  '/dashboard',
  '/syllabus',
  '/lecture-room',
  '/collab-room',
  '/profile',
  '/login',
  '/signup',
  '/forgot-password'
];

// Provider component
export const NavigationProvider = ({ children }) => {
  const [currentPath, setCurrentPath] = useState('/');
  const [previousPath, setPreviousPath] = useState('/');
  const location = useLocation();

  // Check if a path is valid (either in our defined paths or a parameterized route)
  const isValidPath = (path) => {
    // Check direct matches first
    if (APP_PATHS.includes(path)) return true;
    
    // Check room route pattern
    if (/^\/room\/[a-zA-Z0-9-]+$/.test(path)) return true;
    
    // Check user profile view pattern
    if (/^\/user\/[a-zA-Z0-9-]+$/.test(path)) return true;
    
    // Check user ID pattern (for syllabus viewing)
    // The path should be exactly in the format /userId and userId should be alphanumeric
    return /^\/[a-zA-Z0-9-]+$/.test(path) && path.split('/').length === 2 && path.split('/')[1].length > 5;
  };

  // Update paths when location changes
  useEffect(() => {
    setPreviousPath(currentPath);
    setCurrentPath(location.pathname);
  }, [location.pathname, currentPath]);

  return (
    <NavigationContext.Provider value={{ 
      currentPath, 
      previousPath,
      validPaths: APP_PATHS,
      isValidPath
    }}>
      {children}
    </NavigationContext.Provider>
  );
};

// Custom hook to use the navigation context
export const useNavigation = () => useContext(NavigationContext);
