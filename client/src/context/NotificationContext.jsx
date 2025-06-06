import React, { createContext, useContext, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// Create the notification context
const NotificationContext = createContext();

// Custom Notification Component
const Notification = ({ id, message, type, onDismiss }) => {
  // Auto-dismiss after 3 seconds
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(id);
    }, 3000);
    return () => clearTimeout(timer);
  }, [id, onDismiss]);
  
  // Set colors based on notification type
  const getBgColor = () => {
    switch (type) {
      case 'success': return 'bg-green-900/60 border-green-500/60';
      case 'error': return 'bg-red-900/70 border-red-500/50';
      case 'warning': return 'bg-yellow-900/70 border-yellow-500/50';
      case 'info': return 'bg-blue-900/70 border-blue-500/50';
      default: return 'bg-gray-900/70 border-gray-500/50';
    }
  };
  
  const getIconColor = () => {
    switch (type) {
      case 'success': return 'text-white/90';
      case 'error': return 'text-white/90';
      case 'warning': return 'text-white/90';
      case 'info': return 'text-white/90';
      default: return 'text-white/90';
    }
  };
  
  // Icon based on notification type
  const renderIcon = () => {
    const iconClass = `h-5 w-5 ${getIconColor()} mr-2`;
    switch (type) {
      case 'success':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'info':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };
  
  return (
    <motion.div 
      className={`flex items-center px-4 py-3 rounded-lg shadow-lg border ${getBgColor()} backdrop-blur-lg`}
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
    >
      {renderIcon()}
      <p className="text-white/90 font-medium">{message}</p>
      <button 
        onClick={() => onDismiss(id)} 
        className="ml-4 text-white/70 hover:text-white transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  );
};

// Provider component
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const notificationIdCounter = useRef(0);
  
  // Add notification function
  const addNotification = (message, type = 'success') => {
    const newId = notificationIdCounter.current++;
    setNotifications(prevNotifications => [
      ...prevNotifications, 
      { id: newId, message, type }
    ]);
  };
  
  // Dismiss notification function
  const dismissNotification = (id) => {
    setNotifications(prevNotifications => 
      prevNotifications.filter(notification => notification.id !== id)
    );
  };
  
  return (
    <NotificationContext.Provider value={{ addNotification, dismissNotification }}>
      {children}
      
      {/* Notification container with AnimatePresence for smooth transitions */}
      <div className="fixed top-20 right-4 z-50 w-72 space-y-2 pointer-events-none">
        <AnimatePresence>
          {notifications.map(notification => (
            <div key={notification.id} className="pointer-events-auto">
              <Notification 
                id={notification.id} 
                message={notification.message} 
                type={notification.type}
                onDismiss={dismissNotification}
              />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};

// Custom hook to use the notification context
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
