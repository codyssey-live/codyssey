import React, { createContext, useState, useContext, useEffect } from 'react';
import apiClient from '../utils/apiClient';

const RoomContext = createContext();

export const useRoom = () => useContext(RoomContext);

export const RoomProvider = ({ children }) => {
  const [roomData, setRoomData] = useState({
    inRoom: false,
    roomId: null,
    inviterId: null,
    isRoomCreator: false
  });

  // Check for active room when component mounts
  useEffect(() => {
    const checkForActiveRoom = async () => {
      const roomInfo = localStorage.getItem('roomInfo');
      
      if (roomInfo) {
        try {
          const parsedInfo = JSON.parse(roomInfo);
          
          if (parsedInfo.roomId) {
            // Fetch room details to get inviterId if not present
            if (!parsedInfo.inviterId) {
              try {
                const response = await apiClient.get(`/rooms/validate/${parsedInfo.roomId}`);
                if (response.data.success) {
                  // Add inviterId to room info and update localStorage
                  parsedInfo.inviterId = response.data.data.inviterId;
                  localStorage.setItem('roomInfo', JSON.stringify(parsedInfo));
                }
              } catch (error) {
                console.error('Error fetching room details:', error);
              }
            }
              // Check creator history as another source of truth
            const creatorHistory = JSON.parse(localStorage.getItem('roomCreatorHistory') || '{}');
            const wasCreator = creatorHistory[parsedInfo.roomId] === true;
            
            // Determine final creator status
            const isCreator = !!parsedInfo.isCreator || wasCreator;
            
            // If creator status is only in history but not in roomInfo, update roomInfo
            if (wasCreator && !parsedInfo.isCreator) {
              console.log("Restoring creator status from history to roomInfo in context");
              parsedInfo.isCreator = true;
              localStorage.setItem('roomInfo', JSON.stringify(parsedInfo));
            }
            
            setRoomData({
              inRoom: true,
              roomId: parsedInfo.roomId,
              inviterId: parsedInfo.inviterId || null,
              isRoomCreator: isCreator
            });
          }
        } catch (error) {
          console.error('Error parsing room info:', error);
        }
      }
    };
    
    checkForActiveRoom();
    
    // Listen for custom room events
    window.addEventListener('roomCreated', checkForActiveRoom);
    window.addEventListener('roomJoined', checkForActiveRoom);
    window.addEventListener('roomLeft', () => {
      setRoomData({
        inRoom: false,
        roomId: null,
        inviterId: null,
        isRoomCreator: false
      });
    });
    
    return () => {
      window.removeEventListener('roomCreated', checkForActiveRoom);
      window.removeEventListener('roomJoined', checkForActiveRoom);
      window.removeEventListener('roomLeft', () => {});
    };
  }, []);

  return (
    <RoomContext.Provider value={{ roomData, setRoomData }}>
      {children}
    </RoomContext.Provider>
  );
};
