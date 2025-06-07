import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { updateCurrentPath } from '../store/navigationStore';

const RouteTracker = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  
  useEffect(() => {
    dispatch(updateCurrentPath(location.pathname));
  }, [location, dispatch]);
  
  return null; // This component doesn't render anything
};

export default RouteTracker;
